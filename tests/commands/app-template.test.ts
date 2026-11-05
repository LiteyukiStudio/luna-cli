import type { ApiExecutionRequest, RuntimePorts } from '../../src/commands/index.js'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as apiContract from '@luna-devops/api-contract'
import { afterEach, describe, expect, it } from 'vitest'
import {
  commandHelpResult,
  CommandOutput,
  createCliProgram,
  createRegistryFromContract,
  DefaultInputPort,
  memoryOutputStreams,
  runCli,
} from '../../src/commands/index.js'

const PROJECT_ID = 'prj_111111111111111111111111'
const registry = createRegistryFromContract(apiContract)
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory =>
    rm(directory, { recursive: true, force: true })))
})

describe('multi-component app template contract', () => {
  it('exposes component project volumes and examples on install help', () => {
    const help = commandHelpResult(registry, { path: 'app-template.install' }).data as {
      command: {
        examples: string[]
        inputSchema: { properties: { body: { properties: Record<string, unknown> } } }
      }
    }
    const body = help.command.inputSchema.properties.body.properties

    expect(body.componentProjectVolumeIds).toMatchObject({
      type: 'object',
      additionalProperties: { type: 'string' },
    })
    for (const field of ['imageRef', 'replicas', 'cpuRequest', 'memoryRequest', 'projectVolumeId'])
      expect(body[field]).toMatchObject({ description: expect.stringContaining('multi-component') })
    expect(help.command.examples).toEqual(expect.arrayContaining([
      expect.stringContaining('templateId=neo-blog'),
      expect.stringContaining('componentProjectVolumeIds'),
    ]))
  })

  it('describes template components in the detail output schema', () => {
    const help = commandHelpResult(registry, {
      path: 'app-templates.get-app-templates-by-template-id',
    }).data as {
      command: { outputSchema: { required: string[], properties: Record<string, unknown> } }
    }

    expect(help.command.outputSchema.required).toContain('components')
    expect(help.command.outputSchema.properties.components).toMatchObject({
      type: 'array',
      items: {
        required: expect.arrayContaining(['key', 'name', 'image', 'dataVolumes']),
      },
    })
  })
})

describe('multi-component app template install', () => {
  it('sends component volumes unchanged and prints every installed component', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'luna-app-template-'))
    temporaryDirectories.push(directory)
    const bodyFile = join(directory, 'neo-blog-install.json')
    const body = {
      applicationName: 'Neo Blog',
      applicationIdentifier: 'neo-blog',
      deploymentName: 'production',
      stage: 'prod',
      clusterId: 'cls_1',
      installNow: true,
      componentProjectVolumeIds: {
        api: 'pvol_api',
        postgres: 'pvol_postgres',
      },
    }
    await writeFile(bodyFile, JSON.stringify(body))
    const components = ['web', 'api', 'postgres', 'redis'].map(key => ({
      key,
      application: { id: `app_${key}`, identifier: `neo-blog-${key}` },
      deploymentTarget: { id: `dplt_${key}` },
      release: { id: `rel_${key}`, status: 'pending' },
    }))
    const requests: ApiExecutionRequest[] = []
    const streams = memoryOutputStreams()
    const output = new CommandOutput({ streams: streams.streams, version: 'test' })
    const ports = installPorts(output, async (request) => {
      requests.push(request)
      return {
        data: { application: components[0]!.application, components },
        meta: { status: 201 },
      }
    })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'app-template',
      'install',
      `projectId=${PROJECT_ID}`,
      'templateId=neo-blog',
      `body=@${bodyFile}`,
      'output=json',
      'interactive=false',
      'yes=true',
    ], output)

    expect(streams.stderr()).toBe('')
    expect(result.exitCode).toBe(0)
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      operationId: 'installAppTemplate',
      params: { projectId: PROJECT_ID, templateId: 'neo-blog', body },
    })
    const sent = requests[0]!.params.body as Record<string, unknown>
    for (const field of ['imageRef', 'replicas', 'cpuRequest', 'memoryRequest', 'projectVolumeId'])
      expect(sent).not.toHaveProperty(field)

    const printed = JSON.parse(streams.stdout()) as { data: { components: unknown[] } }
    expect(printed.data.components).toEqual(components)
  })
})

function installPorts(
  output: CommandOutput,
  execute: (request: ApiExecutionRequest) => Promise<unknown>,
): RuntimePorts {
  return {
    config: {
      read: async () => ({
        version: 2,
        server: 'https://luna.example.test',
        credential: null,
        project: null,
        language: '',
        output: '',
      }),
      write: async () => {},
    },
    input: new DefaultInputPort(),
    output,
    api: {
      execute: execute as RuntimePorts['api']['execute'],
      request: async () => ({}),
    },
    env: {},
    isTTY: false,
    version: 'test',
  }
}
