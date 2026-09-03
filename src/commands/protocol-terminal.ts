import type {
  CommandInvocation,
  CommandResult,
  ProtocolInputStream,
  ProtocolOutputStream,
  ProtocolWebSocket,
  ProtocolWebSocketEvent,
  RuntimePorts,
} from './types.js'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { onExit } from 'signal-exit'
import WebSocket from 'ws'
import { CliCommandError } from './errors.js'
import { authorizeProtocolTicket } from './protocol-ticket.js'

const WEB_SOCKET_CONNECTING = 0
const WEB_SOCKET_OPEN = 1
const WEB_SOCKET_CLOSED = 3
const WEB_SOCKET_NORMAL_CLOSE = 1000
const TERMINAL_SUBPROTOCOL = 'luna.devops.terminal.v1'
const MAX_TERMINAL_DIMENSION = 65_535
const TERMINAL_FORCE_CLOSE_MS = 250

export async function executeWebSocketTerminal(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  assertInteractiveTty(invocation, ports)
  const operationId = authorizationOperation(invocation)
  const authorization = await authorizeProtocolTicket(invocation, ports, operationId)
  const stdin = ports.protocol?.stdin ?? asInputStream(process.stdin)
  const stdout = ports.protocol?.stdout ?? asOutputStream(process.stdout)
  const webSocket = createWebSocket(terminalUrl(
    authorization.server,
    invocation,
    authorization.ticket,
  ), ports)

  return runTerminalSession(invocation, webSocket, stdin, stdout, ports)
}

async function runTerminalSession(
  invocation: CommandInvocation,
  socket: ProtocolWebSocket,
  stdin: ProtocolInputStream,
  stdout: ProtocolOutputStream,
  ports: RuntimePorts,
): Promise<CommandResult> {
  socket.binaryType = 'arraybuffer'
  const previousRawMode = Boolean(stdin.isRaw)
  let bytesSent = 0
  let bytesReceived = 0
  let remoteExitCode: number | undefined
  let opened = false
  let settled = false
  let rawModeActive = false
  let inputAttached = false
  let resizeAttached = false
  let pendingOutputFrames = 0
  let outputQueue = Promise.resolve()
  let removeExitGuard = () => {}

  return new Promise<CommandResult>((resolve, reject) => {
    const handshakeTimeout = setTimeout(() => {
      if (opened || settled)
        return
      settleError(new CliCommandError(
        'terminal_connection_timeout',
        'The terminal WebSocket connection timed out.',
        {
          status: 504,
          retryable: true,
          details: { timeoutMs: invocation.globals.timeoutMs },
        },
      ), WEB_SOCKET_NORMAL_CLOSE, 'handshake timeout')
    }, invocation.globals.timeoutMs)

    const onOpen = () => {
      opened = true
      clearTimeout(handshakeTimeout)
      try {
        stdin.setRawMode!(true)
        rawModeActive = true
        stdin.on('data', onInput)
        inputAttached = true
        stdout.on?.('resize', onResize)
        resizeAttached = true
        stdin.resume?.()
        sendResize(socket, stdout)
        removeExitGuard = subscribeTerminalExit(ports, (signal) => {
          restoreTerminal()
          if (ports.protocol?.onInterrupt) {
            settleError(new CliCommandError(
              'terminal_interrupted',
              'The terminal session was interrupted.',
              { status: 499, exitCode: signalExitCode(signal) },
            ), WEB_SOCKET_NORMAL_CLOSE, 'interrupted')
            return
          }
          if (socket.readyState === WEB_SOCKET_OPEN)
            socket.close(WEB_SOCKET_NORMAL_CLOSE, 'local process exit')
        })
      }
      catch (error) {
        settleError(new CliCommandError(
          'terminal_initialization_failed',
          'The local terminal could not enter interactive mode.',
          { status: 500, cause: error },
        ), 1011, 'terminal initialization failed')
      }
    }
    const onMessage = (event: ProtocolWebSocketEvent) => {
      pendingOutputFrames += 1
      if (pendingOutputFrames === 1)
        socket.pause?.()
      outputQueue = outputQueue.then(async () => {
        if (settled) {
          finishOutputFrame()
          return
        }
        const result = await writeTerminalMessage(event.data, stdout)
        bytesReceived += result.bytes
        if (result.exitCode !== undefined)
          remoteExitCode = result.exitCode
        finishOutputFrame()
      }).catch((error: unknown) => {
        finishOutputFrame()
        const terminalError = error instanceof CliCommandError
          ? error
          : new CliCommandError(
              'terminal_output_failed',
              'The terminal output could not be written.',
              { status: 500, cause: error },
            )
        settleError(
          terminalError,
          terminalError.code === 'terminal_protocol_error' ? 1002 : 1011,
          terminalError.code === 'terminal_protocol_error'
            ? 'invalid terminal control message'
            : 'terminal output failed',
        )
      })
    }
    function finishOutputFrame(): void {
      pendingOutputFrames = Math.max(0, pendingOutputFrames - 1)
      if (pendingOutputFrames === 0 && !settled)
        socket.resume?.()
    }
    const onError = () => {
      settleError(new CliCommandError(
        opened ? 'terminal_connection_error' : 'terminal_connection_failed',
        opened
          ? 'The terminal WebSocket connection failed.'
          : 'The terminal WebSocket could not be established.',
        { status: 502, retryable: true },
      ), 1011, 'terminal connection failed')
    }
    const onClose = (event: ProtocolWebSocketEvent) => {
      if (settled)
        return
      void outputQueue.then(() => {
        if (settled)
          return
        const closeCode = event.code ?? 1006
        if (closeCode !== WEB_SOCKET_NORMAL_CLOSE) {
          settleError(new CliCommandError(
            'terminal_connection_closed',
            'The terminal WebSocket closed unexpectedly.',
            {
              status: 502,
              retryable: true,
              details: { closeCode, reason: event.reason ?? '' },
            },
          ))
          return
        }
        if (remoteExitCode === undefined) {
          settleError(new CliCommandError(
            'terminal_exit_status_missing',
            'The terminal closed without a remote exit status.',
            {
              status: 502,
              retryable: true,
              details: { closeCode, reason: event.reason ?? '' },
            },
          ))
          return
        }
        settleSuccess(closeCode, event.reason ?? '', remoteExitCode)
      })
    }
    function onInput(chunk: unknown): void {
      if (socket.readyState !== WEB_SOCKET_OPEN)
        return
      const payload = terminalInput(chunk)
      if (!payload)
        return
      bytesSent += byteLength(payload)
      try {
        socket.send(payload, (error) => {
          if (!error || settled)
            return
          settleError(new CliCommandError(
            'terminal_input_failed',
            'Terminal input could not be sent.',
            { status: 502, retryable: true, cause: error },
          ))
        })
      }
      catch (error) {
        settleError(new CliCommandError(
          'terminal_input_failed',
          'Terminal input could not be sent.',
          { status: 502, retryable: true, cause: error },
        ))
      }
    }
    function onResize(): void {
      if (socket.readyState !== WEB_SOCKET_OPEN)
        return
      try {
        sendResize(socket, stdout)
      }
      catch (error) {
        settleError(new CliCommandError(
          'terminal_resize_failed',
          'The terminal size could not be sent.',
          { status: 502, retryable: true, cause: error },
        ))
      }
    }

    function cleanup(): void {
      clearTimeout(handshakeTimeout)
      removeExitGuard()
      removeExitGuard = () => {}
      socket.removeEventListener?.('open', onOpen)
      socket.removeEventListener?.('message', onMessage)
      socket.removeEventListener?.('error', onError)
      socket.removeEventListener?.('close', onClose)
      if (inputAttached)
        stdin.off?.('data', onInput)
      if (resizeAttached)
        stdout.off?.('resize', onResize)
      restoreTerminal()
      try {
        if (!previousRawMode)
          stdin.pause?.()
      }
      catch {
        // The process may already be shutting down.
      }
    }
    function restoreTerminal(): void {
      if (!rawModeActive)
        return
      rawModeActive = false
      try {
        stdin.setRawMode!(previousRawMode)
      }
      catch {
        // The process may already be shutting down.
      }
    }
    function settleError(
      error: CliCommandError,
      closeCode = 1011,
      closeReason = 'terminal session failed',
    ): void {
      if (settled)
        return
      settled = true
      closeTerminalSocket(socket, closeCode, closeReason)
      cleanup()
      reject(error)
    }
    function settleSuccess(closeCode: number, reason: string, exitCode: number): void {
      if (settled)
        return
      if (exitCode !== 0) {
        settleError(new CliCommandError(
          'terminal_remote_exit',
          `The remote terminal exited with code ${exitCode}.`,
          {
            status: 500,
            exitCode: processExitCode(exitCode),
            details: {
              remoteExitCode: exitCode,
              closeCode,
              reason,
            },
          },
        ))
        return
      }
      settled = true
      cleanup()
      resolve({
        schemaVersion: 'cli.luna.devops/terminal/v1',
        data: {
          exitCode,
          closeCode,
          reason,
          bytesSent,
          bytesReceived,
        },
        meta: { transport: 'websocket' },
      })
    }

    socket.addEventListener('open', onOpen)
    socket.addEventListener('message', onMessage)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
  })
}

function assertInteractiveTty(invocation: CommandInvocation, ports: RuntimePorts): void {
  if (invocation.globals.agent) {
    throw new CliCommandError(
      'terminal_agent_unsupported',
      'Interactive terminal commands are not available in agent mode.',
      {
        status: 422,
        details: {
          command: invocation.metadata.canonicalPath,
          remediation: 'Use a non-interactive exec command in agent mode.',
        },
      },
    )
  }
  const stdin = ports.protocol?.stdin ?? asInputStream(process.stdin)
  const stdout = ports.protocol?.stdout ?? asOutputStream(process.stdout)
  if (!invocation.globals.interactive || !ports.isTTY || !stdin.isTTY || !stdout.isTTY) {
    throw new CliCommandError(
      'terminal_tty_required',
      'This command requires an interactive TTY.',
      {
        status: 422,
        details: {
          command: invocation.metadata.canonicalPath,
          remediation: 'Run the command in an interactive terminal without --no-interactive.',
        },
      },
    )
  }
  if (typeof stdin.setRawMode !== 'function') {
    throw new CliCommandError(
      'terminal_raw_mode_unsupported',
      'The local terminal does not support raw mode.',
      { status: 422, details: { command: invocation.metadata.canonicalPath } },
    )
  }
}

function authorizationOperation(invocation: CommandInvocation): string {
  const operation = invocation.metadata.consumedOperations?.find(candidate =>
    candidate.toLocaleLowerCase().includes('authorize'))
  if (!operation) {
    throw new CliCommandError(
      'terminal_authorization_operation_missing',
      'The terminal command has no authorization operation.',
      { status: 500, details: { command: invocation.metadata.canonicalPath } },
    )
  }
  return operation
}

function createWebSocket(url: string, ports: RuntimePorts): ProtocolWebSocket {
  if (ports.protocol?.createWebSocket)
    return ports.protocol.createWebSocket(url, TERMINAL_SUBPROTOCOL)
  return new WebSocket(url, TERMINAL_SUBPROTOCOL) as unknown as ProtocolWebSocket
}

function terminalUrl(
  server: string,
  invocation: CommandInvocation,
  ticket: string,
): string {
  const url = new URL(interpolatePath(invocation.metadata.path ?? '', invocation.params), server)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  for (const parameter of invocation.metadata.parameters) {
    if (parameter.location !== 'query' || parameter.name === 'ticket')
      continue
    appendQueryValue(url, parameter.name, invocation.params[parameter.name])
  }
  url.searchParams.set('ticket', ticket)
  return url.toString()
}

function interpolatePath(
  template: string,
  params: Readonly<Record<string, unknown>>,
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = params[name]
    if (value === undefined || value === null || value === '') {
      throw new CliCommandError('invalid_arguments', `Missing path parameter "${name}".`, {
        status: 400,
        exitCode: 2,
      })
    }
    return encodeURIComponent(String(value))
  })
}

function appendQueryValue(url: URL, name: string, value: unknown): void {
  if (value === undefined || value === null || value === '')
    return
  if (Array.isArray(value)) {
    for (const item of value)
      appendQueryValue(url, name, item)
    return
  }
  url.searchParams.append(name, String(value))
}

function sendResize(socket: ProtocolWebSocket, stdout: ProtocolOutputStream): void {
  const cols = terminalDimension(stdout.columns)
  const rows = terminalDimension(stdout.rows)
  if (!cols || !rows)
    return
  socket.send(JSON.stringify({ type: 'resize', cols, rows }))
}

async function writeTerminalMessage(
  data: unknown,
  stdout: ProtocolOutputStream,
): Promise<{ bytes: number, exitCode?: number }> {
  const exitCode = remoteExitMessage(data)
  if (typeof data === 'string') {
    if (exitCode !== undefined)
      return { bytes: 0, exitCode }
    throw new CliCommandError(
      'terminal_protocol_error',
      'The terminal server sent an invalid control message.',
      { status: 502, retryable: false },
    )
  }
  if (data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(data)
    await writeTerminalBytes(stdout, bytes)
    return { bytes: bytes.byteLength }
  }
  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    await writeTerminalBytes(stdout, bytes)
    return { bytes: bytes.byteLength }
  }
  if (data instanceof Blob) {
    const bytes = new Uint8Array(await data.arrayBuffer())
    await writeTerminalBytes(stdout, bytes)
    return { bytes: bytes.byteLength }
  }
  throw new CliCommandError(
    'terminal_protocol_error',
    'The terminal server sent an unsupported frame.',
    { status: 502, retryable: false },
  )
}

function remoteExitMessage(data: unknown): number | undefined {
  if (typeof data !== 'string' || data.length > 256)
    return undefined
  try {
    const value = JSON.parse(data) as unknown
    if (
      typeof value === 'object'
      && value !== null
      && (value as { type?: unknown }).type === 'exit'
    ) {
      const code = (value as { code?: unknown }).code
      return typeof code === 'number'
        && Number.isSafeInteger(code)
        && code >= 0
        && code <= 255
        ? code
        : undefined
    }
  }
  catch {
    // Ordinary terminal text is not structured protocol data.
  }
  return undefined
}

function terminalInput(value: unknown): Uint8Array | undefined {
  if (typeof value === 'string')
    return Buffer.from(value, 'utf8')
  if (value instanceof ArrayBuffer)
    return Buffer.from(value)
  if (ArrayBuffer.isView(value))
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength)
  return undefined
}

function byteLength(value: ArrayBuffer | ArrayBufferView): number {
  return value.byteLength
}

function terminalDimension(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? Math.min(value, MAX_TERMINAL_DIMENSION)
    : undefined
}

function processExitCode(value: number): number {
  return Number.isSafeInteger(value) && value > 0 && value <= 255 ? value : 1
}

function subscribeTerminalExit(
  ports: RuntimePorts,
  listener: (signal?: NodeJS.Signals) => void,
): () => void {
  if (ports.protocol?.onInterrupt)
    return ports.protocol.onInterrupt(listener)
  return onExit((_code, signal) => listener(signal ?? undefined), { alwaysLast: true })
}

function signalExitCode(signal: NodeJS.Signals | undefined): number {
  switch (signal) {
    case 'SIGHUP': return 129
    case 'SIGQUIT': return 131
    case 'SIGTERM': return 143
    default: return 130
  }
}

function closeTerminalSocket(
  socket: ProtocolWebSocket,
  code: number,
  reason: string,
): void {
  // ws emits an asynchronous error when a CONNECTING socket is closed. Keep a
  // sink installed after the session listeners are removed so that shutdown
  // cannot escape as an uncaught EventEmitter error in Node.js.
  socket.addEventListener('error', ignoreTerminalSocketError)
  if (socket.readyState === WEB_SOCKET_CLOSED)
    return
  try {
    socket.close(code, reason)
  }
  catch {
    try {
      socket.terminate?.()
    }
    catch {
      // The transport is already unusable; terminal cleanup must still finish.
    }
    return
  }
  if (socket.readyState === WEB_SOCKET_CLOSED || !socket.terminate)
    return
  const timer = setTimeout(() => {
    if (socket.readyState === WEB_SOCKET_CLOSED)
      return
    try {
      socket.terminate?.()
    }
    catch {
      // The close path is best-effort after the command has already failed.
    }
  }, socket.readyState === WEB_SOCKET_CONNECTING ? 0 : TERMINAL_FORCE_CLOSE_MS)
  timer.unref?.()
}

function ignoreTerminalSocketError(): void {
  // The command has already produced a stable terminal error.
}

async function writeTerminalBytes(
  stdout: ProtocolOutputStream,
  bytes: Uint8Array,
): Promise<void> {
  if (stdout.write(bytes))
    return
  if (!stdout.once) {
    throw new CliCommandError(
      'terminal_output_backpressure_unsupported',
      'The local output stream cannot signal when it is ready for more terminal data.',
      { status: 500 },
    )
  }
  await new Promise<void>((resolve, reject) => {
    function onDrain(): void {
      stdout.off?.('error', onError)
      resolve()
    }
    function onError(error: unknown): void {
      stdout.off?.('drain', onDrain)
      reject(error)
    }
    stdout.once!('drain', onDrain)
    stdout.once!('error', onError)
  })
}

function asInputStream(value: unknown): ProtocolInputStream {
  return value as ProtocolInputStream
}

function asOutputStream(value: unknown): ProtocolOutputStream {
  return value as ProtocolOutputStream
}
