import type { AddressInfo, Socket } from 'node:net'
import type {
  CommandExecutionGlobals,
  CommandInvocation,
  ProtocolInputStream,
  ProtocolOutputStream,
  ProtocolWebSocket,
  ProtocolWebSocketEvent,
  RuntimePorts,
} from '../../src/commands/types.js'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommandRegistry } from '../../src/commands/registry.js'
import { emptyConfigDocument } from '../../src/config/schema.js'

describe('webSocket terminal protocol adapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('authorizes and runs a pod terminal with TTY input, output, and resize', async () => {
    const command = new CommandRegistry().require('cluster.pod-terminal')
    const stdin = new FakeInput()
    const stdout = new FakeOutput()
    const socket = new FakeWebSocket()
    const requests: Array<{ url: string, method: string }> = []
    let socketUrl = ''
    let socketProtocols: string | readonly string[] | undefined
    const ports = createPorts({
      stdin,
      stdout,
      fetch: async (input, init) => {
        requests.push({ url: String(input), method: String(init?.method) })
        return Response.json({
          ticket: 'pod-ticket',
          expiresAt: '2026-07-27T10:00:00Z',
        })
      },
      createWebSocket(url, protocols) {
        socketUrl = url
        socketProtocols = protocols
        return socket
      },
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      clusterId: 'cluster-a',
      namespace: 'default',
      name: 'pod-a',
      container: 'app',
    }), ports)

    await vi.waitFor(() => expect(socketUrl).not.toBe(''))
    socket.open()
    stdin.emit('data', Buffer.from('echo ok\n'))
    socket.message(Buffer.from('terminal output\n'))
    stdout.columns = 132
    stdout.rows = 48
    stdout.emit('resize')
    socket.message(JSON.stringify({ type: 'exit', code: 0 }))
    socket.closeFromServer(1000, 'complete')

    await expect(resultPromise).resolves.toMatchObject({
      schemaVersion: 'cli.luna.devops/terminal/v1',
      data: {
        exitCode: 0,
        closeCode: 1000,
        bytesSent: 8,
        bytesReceived: 16,
      },
    })
    expect(requests).toEqual([{
      url: 'https://luna.example.test/api/v1/runtime/clusters/cluster-a/pods/terminal/authorize?namespace=default&name=pod-a&container=app',
      method: 'POST',
    }])
    expect(socketUrl).toBe(
      'wss://luna.example.test/api/v1/runtime/clusters/cluster-a/pods/terminal?namespace=default&name=pod-a&container=app&ticket=pod-ticket',
    )
    expect(socketProtocols).toBe('luna.devops.terminal.v1')
    expect(socket.sent).toEqual([
      JSON.stringify({ type: 'resize', cols: 120, rows: 40 }),
      Buffer.from('echo ok\n'),
      JSON.stringify({ type: 'resize', cols: 132, rows: 48 }),
    ])
    expect(stdout.text).toBe('terminal output\n')
    expect(stdin.rawModes).toEqual([true, false])
    expect(stdin.resumed).toBe(true)
    expect(stdin.paused).toBe(true)
  })

  it('authorizes and connects a release terminal', async () => {
    const registry = new CommandRegistry()
    const command = registry.require('release.exec')
    expect(registry.require('release.terminal', true)).toBe(command)
    const socket = new FakeWebSocket()
    let authorizeUrl = ''
    let socketUrl = ''
    const ports = createPorts({
      fetch: async (input) => {
        authorizeUrl = String(input)
        return Response.json({ data: { ticket: 'release-ticket' } })
      },
      createWebSocket(url) {
        socketUrl = url
        return socket
      },
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
      container: 'api',
    }), ports)

    await vi.waitFor(() => expect(socketUrl).not.toBe(''))
    socket.open()
    socket.message(JSON.stringify({ type: 'exit', code: 7 }))
    socket.closeFromServer(1000, 'complete')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_remote_exit',
      exitCode: 7,
      details: {
        remoteExitCode: 7,
        closeCode: 1000,
      },
    })
    expect(authorizeUrl).toBe(
      'https://luna.example.test/api/v1/projects/project-a/releases/release-a/terminal/authorize?container=api',
    )
    expect(socketUrl).toBe(
      'wss://luna.example.test/api/v1/projects/project-a/releases/release-a/terminal?container=api&ticket=release-ticket',
    )
  })

  it('keeps UTF-8, ANSI, and control bytes binary and byte-exact', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdin = new FakeInput()
    const stdout = new FakeOutput()
    const socket = new FakeWebSocket()
    const ports = createPorts({
      stdin,
      stdout,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    stdin.emit('data', 'discarded-before-open')
    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    const unicodeInput = '中文🙂'
    const controlInput = Buffer.from([0x1B, 0x5B, 0x41, 0x03, 0x7F])
    stdin.emit('data', unicodeInput)
    stdin.emit('data', controlInput)

    const unicodeOutput = Buffer.from('输出🙂')
    socket.message(unicodeOutput.subarray(0, 4))
    socket.message(unicodeOutput.subarray(4))
    const payloadLookingLikeControl = Buffer.from('{"type":"exit","code":99}')
    socket.message(payloadLookingLikeControl)
    socket.message(JSON.stringify({ type: 'exit', code: 0 }))
    socket.closeFromServer(1000, 'complete')

    await expect(resultPromise).resolves.toMatchObject({
      data: {
        exitCode: 0,
        bytesSent: Buffer.byteLength(unicodeInput) + controlInput.byteLength,
        bytesReceived: unicodeOutput.byteLength + payloadLookingLikeControl.byteLength,
      },
    })
    expect(socket.sent.slice(1)).toEqual([
      Buffer.from(unicodeInput),
      controlInput,
    ])
    expect(Buffer.concat(stdout.chunks)).toEqual(Buffer.concat([
      unicodeOutput,
      payloadLookingLikeControl,
    ]))
  })

  it('waits for stdout drain before completing the session', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdout = new FakeOutput()
    stdout.writeResults.push(false)
    const socket = new FakeWebSocket()
    const ports = createPorts({
      stdout,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message(Buffer.from('large output'))
    socket.message(JSON.stringify({ type: 'exit', code: 0 }))
    socket.closeFromServer(1000, 'complete')

    let completed = false
    void resultPromise.finally(() => completed = true)
    await Promise.resolve()
    expect(completed).toBe(false)
    expect(socket.paused).toBe(true)
    stdout.emit('drain')
    await expect(resultPromise).resolves.toMatchObject({ data: { exitCode: 0 } })
    expect(socket.resumed).toBe(true)
  })

  it('clamps terminal resize frames to the uint16 protocol range', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdout = new FakeOutput()
    stdout.columns = 70_000
    stdout.rows = 80_000
    const socket = new FakeWebSocket()
    const ports = createPorts({
      stdout,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message(JSON.stringify({ type: 'exit', code: 0 }))
    socket.closeFromServer(1000, 'complete')

    await expect(resultPromise).resolves.toMatchObject({ data: { exitCode: 0 } })
    expect(socket.sent[0]).toBe(JSON.stringify({
      type: 'resize',
      cols: 65_535,
      rows: 65_535,
    }))
  })

  it('rejects unknown text control frames instead of writing them as terminal data', async () => {
    const command = new CommandRegistry().require('release.exec')
    const socket = new FakeWebSocket()
    const ports = createPorts({
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message('{"type":"unknown"}')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_protocol_error',
      status: 502,
    })
    expect(socket.closed).toEqual({ code: 1002, reason: 'invalid terminal control message' })
  })

  it('closes the remote session when terminal input cannot be sent', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdin = new FakeInput()
    const socket = new FakeWebSocket()
    socket.sendCallbackError = new Error('write failed')
    const ports = createPorts({
      stdin,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    stdin.emit('data', Buffer.from('input'))

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_input_failed',
      status: 502,
    })
    expect(socket.closed).toEqual({ code: 1011, reason: 'terminal session failed' })
    expect(stdin.rawModes).toEqual([true, false])
  })

  it('closes the remote session when a resize frame cannot be sent', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdout = new FakeOutput()
    const socket = new FakeWebSocket()
    socket.throwOnSendCall = 2
    const ports = createPorts({
      stdout,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    stdout.columns = 132
    stdout.emit('resize')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_resize_failed',
      status: 502,
    })
    expect(socket.closed).toEqual({ code: 1011, reason: 'terminal session failed' })
  })

  it('does not write queued frames after the first output frame fails', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdout = new FakeOutput()
    stdout.writeResults.push(false)
    const socket = new FakeWebSocket()
    const ports = createPorts({
      stdout,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)
    const rejection = expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_output_failed',
    })

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message(Buffer.from('first'))
    socket.message(Buffer.from('must-not-be-written'))
    await vi.waitFor(() => expect(stdout.chunks).toHaveLength(1))
    stdout.emit('error', new Error('stdout failed'))

    await rejection
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(Buffer.concat(stdout.chunks)).toEqual(Buffer.from('first'))
    expect(socket.closed).toEqual({ code: 1011, reason: 'terminal output failed' })
  })

  it('rejects a normal close without an explicit remote exit status', async () => {
    const command = new CommandRegistry().require('release.exec')
    const socket = new FakeWebSocket()
    const ports = createPorts({
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message(Buffer.from('complete\n'))
    socket.closeFromServer(1000, '')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_exit_status_missing',
      status: 502,
    })
  })

  it('propagates an explicit remote exit status after output is drained', async () => {
    const command = new CommandRegistry().require('release.exec')
    const socket = new FakeWebSocket()
    const ports = createPorts({
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.message(JSON.stringify({ type: 'exit', code: 23 }))
    socket.closeFromServer(1000, 'complete')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_remote_exit',
      exitCode: 23,
      details: {
        remoteExitCode: 23,
        closeCode: 1000,
      },
    })
  })

  it('treats an abnormal WebSocket close as a connection failure', async () => {
    const command = new CommandRegistry().require('release.exec')
    const socket = new FakeWebSocket()
    const ports = createPorts({
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    socket.closeFromServer(1006, '')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_connection_closed',
      status: 502,
      retryable: true,
    })
  })

  it('rejects agent and non-TTY terminal sessions before authorization', async () => {
    const command = new CommandRegistry().require('cluster.pod-terminal')
    const fetch = vi.fn()
    const baseParams = {
      clusterId: 'cluster-a',
      namespace: 'default',
      name: 'pod-a',
    }

    await expect(command.handler(
      invocation(command.metadata, baseParams, { agent: true }),
      createPorts({ fetch }),
    )).rejects.toMatchObject({
      code: 'terminal_agent_unsupported',
      status: 422,
    })
    await expect(command.handler(
      invocation(command.metadata, baseParams, { interactive: false }),
      createPorts({ fetch }),
    )).rejects.toMatchObject({
      code: 'terminal_tty_required',
      status: 422,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects TTY-like streams that cannot enter raw mode', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdin: ProtocolInputStream = {
      isTTY: true,
      on: () => undefined,
    }
    const fetch = vi.fn()

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), createPorts({ stdin, fetch }))).rejects.toMatchObject({
      code: 'terminal_raw_mode_unsupported',
      status: 422,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('propagates MFA authorization errors without opening a socket', async () => {
    const command = new CommandRegistry().require('cluster.pod-terminal')
    const createWebSocket = vi.fn()
    const ports = createPorts({
      fetch: async () => Response.json({
        error: {
          code: 'mfa_required',
          message: 'Complete step-up authentication.',
          purpose: 'runtime_terminal',
        },
      }, { status: 403 }),
      createWebSocket,
    })

    await expect(command.handler(invocation(command.metadata, {
      clusterId: 'cluster-a',
      namespace: 'default',
      name: 'pod-a',
    }), ports)).rejects.toMatchObject({
      code: 'mfa_required',
      status: 403,
    })
    expect(createWebSocket).not.toHaveBeenCalled()
  })

  it('restores the terminal and returns exit code 130 when interrupted', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdin = new FakeInput()
    const socket = new FakeWebSocket()
    let interrupt: (() => void) | undefined
    const ports = createPorts({
      stdin,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
      onInterrupt(listener) {
        interrupt = listener
        return () => {
          interrupt = undefined
        }
      },
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    await vi.waitFor(() => expect(interrupt).toBeTypeOf('function'))
    interrupt?.()

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_interrupted',
      exitCode: 130,
    })
    expect(socket.closed).toEqual({ code: 1000, reason: 'interrupted' })
    expect(stdin.rawModes).toEqual([true, false])
    expect(interrupt).toBeUndefined()
  })

  it('preserves the conventional SIGTERM exit code when interrupted', async () => {
    const command = new CommandRegistry().require('release.exec')
    const socket = new FakeWebSocket()
    let interrupt: ((signal?: NodeJS.Signals) => void) | undefined
    const ports = createPorts({
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
      onInterrupt(listener) {
        interrupt = listener
        return () => {
          interrupt = undefined
        }
      },
    })
    const resultPromise = command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }), ports)

    await vi.waitFor(() => expect(socket.listenerCount('open')).toBe(1))
    socket.open()
    await vi.waitFor(() => expect(interrupt).toBeTypeOf('function'))
    interrupt?.('SIGTERM')

    await expect(resultPromise).rejects.toMatchObject({
      code: 'terminal_interrupted',
      exitCode: 143,
    })
  })

  it('times out an unopened WebSocket and cleans up local listeners', async () => {
    const command = new CommandRegistry().require('release.exec')
    const stdin = new FakeInput()
    const socket = new FakeWebSocket()
    const ports = createPorts({
      stdin,
      fetch: async () => Response.json({ ticket: 'ticket' }),
      createWebSocket: () => socket,
    })

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      releaseId: 'release-a',
    }, { timeoutMs: 5 }), ports)).rejects.toMatchObject({
      code: 'terminal_connection_timeout',
      status: 504,
      retryable: true,
    })
    expect(socket.closed).toEqual({ code: 1000, reason: 'handshake timeout' })
    expect(stdin.rawModes).toEqual([])
  })

  it('handles the real ws asynchronous error emitted after a handshake timeout', async () => {
    const sockets = new Set<Socket>()
    const server = createServer((socket) => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
      socket.on('data', () => undefined)
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address() as AddressInfo
    const command = new CommandRegistry().require('release.exec')

    try {
      await expect(command.handler(invocation(command.metadata, {
        projectId: 'project-a',
        releaseId: 'release-a',
      }, {
        timeoutMs: 20,
      }), createPorts({
        fetch: async () => Response.json({ ticket: 'ticket' }),
        server: `http://127.0.0.1:${address.port}`,
      }))).rejects.toMatchObject({
        code: 'terminal_connection_timeout',
        status: 504,
      })
      await new Promise(resolve => setImmediate(resolve))
    }
    finally {
      for (const socket of sockets)
        socket.destroy()
      await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
      })
    }
  })
})

const DEFAULT_GLOBALS: CommandExecutionGlobals = {
  output: 'json',
  color: false,
  interactive: true,
  yes: true,
  quiet: false,
  agent: false,
  timeoutMs: 1_000,
  debug: false,
  insecureSkipTlsVerify: false,
}

function invocation(
  metadata: CommandInvocation['metadata'],
  params: Readonly<Record<string, unknown>>,
  globals: Partial<CommandExecutionGlobals> = {},
): CommandInvocation {
  return {
    metadata,
    params,
    globals: { ...DEFAULT_GLOBALS, ...globals },
    explicitGlobalKeys: new Set(),
    canonicalGlobalValues: {},
  }
}

function createPorts(overrides: {
  fetch?: typeof globalThis.fetch
  createWebSocket?: (
    url: string,
    protocols?: string | readonly string[],
  ) => ProtocolWebSocket
  stdin?: ProtocolInputStream
  stdout?: ProtocolOutputStream
  onInterrupt?: (listener: (signal?: NodeJS.Signals) => void) => () => void
  server?: string
} = {}): RuntimePorts {
  const stdin = overrides.stdin ?? new FakeInput()
  const stdout = overrides.stdout ?? new FakeOutput()
  return {
    config: {
      read: async () => ({
        ...emptyConfigDocument(),
        server: overrides.server ?? 'https://luna.example.test',
        credential: { type: 'access_token', token: 'secret' },
      }),
      write: async () => undefined,
    },
    input: {
      parse: async () => ({}),
    },
    output: {
      writeSuccess: () => undefined,
      writeError: () => undefined,
    },
    api: {
      execute: async () => ({}),
      request: async () => ({}),
    },
    protocol: {
      fetch: overrides.fetch,
      createWebSocket: overrides.createWebSocket,
      stdin,
      stdout,
      onInterrupt: overrides.onInterrupt ?? (() => () => undefined),
    },
    env: {},
    isTTY: true,
  }
}

class FakeInput implements ProtocolInputStream {
  readonly isTTY = true
  isRaw = false
  readonly rawModes: boolean[] = []
  resumed = false
  paused = false
  readonly #listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  setRawMode(enabled: boolean): void {
    this.isRaw = enabled
    this.rawModes.push(enabled)
  }

  resume(): void {
    this.resumed = true
  }

  pause(): void {
    this.paused = true
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.#listeners.get(event) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(event, listeners)
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    this.#listeners.get(event)?.delete(listener)
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.#listeners.get(event) ?? [])
      listener(...args)
  }
}

class FakeOutput implements ProtocolOutputStream {
  readonly isTTY = true
  columns = 120
  rows = 40
  writeResults: boolean[] = []
  readonly chunks: Buffer[] = []
  readonly #listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  get text(): string {
    return Buffer.concat(this.chunks).toString('utf8')
  }

  write(chunk: string | Uint8Array): boolean {
    this.chunks.push(Buffer.from(chunk))
    return this.writeResults.shift() ?? true
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.#listeners.get(event) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(event, listeners)
  }

  once(event: string, listener: (...args: unknown[]) => void): void {
    const onceListener = (...args: unknown[]) => {
      this.off(event, onceListener)
      listener(...args)
    }
    this.on(event, onceListener)
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    this.#listeners.get(event)?.delete(listener)
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.#listeners.get(event) ?? [])
      listener(...args)
  }
}

class FakeWebSocket implements ProtocolWebSocket {
  readyState = 0
  binaryType = ''
  paused = false
  resumed = false
  readonly sent: Array<string | ArrayBuffer | ArrayBufferView> = []
  closed?: { code?: number, reason?: string }
  sendCallbackError?: Error
  throwOnSendCall?: number
  sendCalls = 0
  readonly #listeners = new Map<string, Set<(event: ProtocolWebSocketEvent) => void>>()

  send(
    data: string | ArrayBuffer | ArrayBufferView,
    callback?: (error?: Error) => void,
  ): void {
    this.sendCalls += 1
    if (this.sendCalls === this.throwOnSendCall)
      throw new Error('send failed')
    this.sent.push(data)
    callback?.(this.sendCallbackError)
  }

  close(code?: number, reason?: string): void {
    this.closed = { code, reason }
    this.readyState = 3
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.resumed = true
    this.paused = false
  }

  addEventListener(
    event: string,
    listener: (event: ProtocolWebSocketEvent) => void,
  ): void {
    const listeners = this.#listeners.get(event) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(event, listeners)
  }

  removeEventListener(
    event: string,
    listener: (event: ProtocolWebSocketEvent) => void,
  ): void {
    this.#listeners.get(event)?.delete(listener)
  }

  open(): void {
    this.readyState = 1
    this.emit('open', {})
  }

  message(data: unknown): void {
    this.emit('message', { data })
  }

  closeFromServer(code: number, reason: string): void {
    this.readyState = 3
    this.emit('close', { code, reason })
  }

  listenerCount(event: string): number {
    return this.#listeners.get(event)?.size ?? 0
  }

  private emit(event: string, payload: ProtocolWebSocketEvent): void {
    for (const listener of this.#listeners.get(event) ?? [])
      listener(payload)
  }
}
