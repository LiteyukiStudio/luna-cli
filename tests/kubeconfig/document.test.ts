import { describe, expect, it } from 'vitest'
import {
  assertSafeGeneratedKubeconfig,
  findAnticipatedConflicts,
  mergeKubeconfigDocuments,
  parseKubeconfig,
  stringifyKubeconfig,
} from '../../src/kubeconfig/index.js'

describe('kubeconfig documents', () => {
  it('parses and renders a Kubernetes v1 config without losing named entries', () => {
    const document = parseKubeconfig(kubeconfig({ token: 'one-time-secret' }))
    const rendered = stringifyKubeconfig(document)
    const reparsed = parseKubeconfig(rendered)

    expect(reparsed).toMatchObject({
      'apiVersion': 'v1',
      'kind': 'Config',
      'current-context': 'luna/prj_one/clu_one/all',
    })
    expect(reparsed.users[0]).toMatchObject({
      user: { token: 'one-time-secret' },
    })
  })

  it('merges distinct entries and preserves the existing current context', () => {
    const existing = parseKubeconfig(kubeconfig({
      contextName: 'existing',
      clusterName: 'existing',
      userName: 'existing-user',
      server: 'https://luna.example.test/kube/v1/bindings/kbd_existing',
    }))
    const incoming = parseKubeconfig(kubeconfig({ token: 'new-secret' }))

    const result = mergeKubeconfigDocuments(existing, incoming)

    expect(result.document.clusters.map(entry => entry.name)).toEqual([
      'existing',
      'luna/prj_one/clu_one/all',
    ])
    expect(result.document['current-context']).toBe('existing')
    expect(result.replacedEntries).toEqual({ clusters: [], contexts: [], users: [] })
  })

  it('rejects same-name entries with different content by default', () => {
    const existing = parseKubeconfig(kubeconfig({ token: 'old-secret' }))
    const incoming = parseKubeconfig(kubeconfig({
      token: 'new-secret',
      server: 'https://luna.example.test/kube/v1/bindings/kbd_new',
    }))

    expect(() => mergeKubeconfigDocuments(existing, incoming)).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_conflict', status: 409 }),
    )
  })

  it('replaces only conflicting named entries when explicitly requested', () => {
    const existing = parseKubeconfig(kubeconfig({ token: 'old-secret' }))
    const incoming = parseKubeconfig(kubeconfig({
      token: 'new-secret',
      server: 'https://luna.example.test/kube/v1/bindings/kbd_new',
    }))

    const result = mergeKubeconfigDocuments(existing, incoming, {
      replaceConflicts: true,
    })

    expect(result.replacedEntries).toEqual({
      clusters: ['luna/prj_one/clu_one/all'],
      contexts: [],
      users: ['luna/tok_one'],
    })
    expect(result.document.clusters[0]).toMatchObject({
      cluster: {
        server: 'https://luna.example.test/kube/v1/bindings/kbd_new',
      },
    })
    expect(result.document.users[0]).toMatchObject({ user: { token: 'new-secret' } })
  })

  it('detects predictable cluster and context conflicts before credential creation', () => {
    const existing = parseKubeconfig(kubeconfig())
    expect(findAnticipatedConflicts(existing, ['luna/prj_one/clu_one/all'])).toEqual([
      { kind: 'cluster', name: 'luna/prj_one/clu_one/all' },
      { kind: 'context', name: 'luna/prj_one/clu_one/all' },
    ])
  })

  it('rejects generated configs that contain upstream credentials or executable auth plugins', () => {
    const document = parseKubeconfig(kubeconfig())
    const unsafeCluster = parseKubeconfig(stringifyKubeconfig({
      ...document,
      clusters: [{
        ...document.clusters[0]!,
        cluster: {
          'server': 'https://luna.example.test/kube/v1/bindings/kbd_one',
          'certificate-authority-data': 'upstream-ca',
        },
      }],
    }))
    const unsafeUser = parseKubeconfig(stringifyKubeconfig({
      ...document,
      users: [{
        name: 'luna/tok_one',
        user: { exec: { command: 'steal-credentials' } },
      }],
    }))

    expect(() => assertSafeGeneratedKubeconfig(
      unsafeCluster,
      'https://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
    expect(() => assertSafeGeneratedKubeconfig(
      unsafeUser,
      'https://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
  })

  it('rejects a gateway URL on a different origin', () => {
    const document = parseKubeconfig(kubeconfig({
      server: 'https://credential-capture.example/kube/v1/bindings/kbd_one',
    }))

    expect(() => assertSafeGeneratedKubeconfig(
      document,
      'https://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
  })

  it('allows same-origin loopback HTTP for local development only', () => {
    const loopback = parseKubeconfig(kubeconfig({
      server: 'http://localhost:8088/kube/v1/bindings/kbd_one',
    }))
    const remoteHttp = parseKubeconfig(kubeconfig({
      server: 'http://luna.example.test/kube/v1/bindings/kbd_one',
    }))

    expect(() => assertSafeGeneratedKubeconfig(
      loopback,
      'http://localhost:8088',
      'tok_one',
    )).not.toThrow()
    expect(() => assertSafeGeneratedKubeconfig(
      remoteHttp,
      'http://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
  })

  it('rejects unexpected generated user and cluster names', () => {
    const unexpectedUser = parseKubeconfig(kubeconfig({ userName: 'luna/tok_other' }))
    const unexpectedCluster = parseKubeconfig(kubeconfig({ clusterName: 'other-cluster' }))

    expect(() => assertSafeGeneratedKubeconfig(
      unexpectedUser,
      'https://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
    expect(() => assertSafeGeneratedKubeconfig(
      unexpectedCluster,
      'https://luna.example.test',
      'tok_one',
    )).toThrowError(
      expect.objectContaining({ code: 'kubeconfig_response_invalid' }),
    )
  })
})

function kubeconfig(options: {
  contextName?: string
  clusterName?: string
  userName?: string
  server?: string
  token?: string
} = {}): string {
  const contextName = options.contextName ?? 'luna/prj_one/clu_one/all'
  const clusterName = options.clusterName ?? contextName
  const userName = options.userName ?? 'luna/tok_one'
  return `apiVersion: v1
kind: Config
clusters:
  - name: ${clusterName}
    cluster:
      server: ${options.server ?? 'https://luna.example.test/kube/v1/bindings/kbd_one'}
contexts:
  - name: ${contextName}
    context:
      cluster: ${clusterName}
      user: ${userName}
      namespace: project-one
users:
  - name: ${userName}
    user:
      token: ${options.token ?? 'one-time-secret'}
current-context: ${contextName}
`
}
