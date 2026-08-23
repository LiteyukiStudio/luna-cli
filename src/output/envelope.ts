import { randomUUID } from "node:crypto";
import { redactValue } from "../errors/index.js";

export const CLI_API_VERSION = "cli.luna.devops/v1";
export const CLI_STREAM_VERSION = "cli.luna.devops/events/v1";

export interface EnvelopeMeta {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly server?: string;
  readonly projectId?: string;
  readonly actorId?: string;
  readonly authType?: string;
  readonly cliVersion?: string;
  readonly openapiDigest?: string;
}

export interface SuccessEnvelope<T = unknown> {
  readonly apiVersion: typeof CLI_API_VERSION;
  readonly schemaVersion: string;
  readonly operationId: string;
  readonly command: string;
  readonly data: T;
  readonly pagination?: PaginationEnvelope;
  readonly meta: EnvelopeMeta;
}

export interface PaginationEnvelope {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly sortBy?: string;
  readonly sortOrder?: string;
}

export interface ResourceReference {
  readonly kind: string;
  readonly id: string;
}

export interface StreamVersionEvent {
  readonly type: "version";
  readonly streamVersion: typeof CLI_STREAM_VERSION;
  readonly cliVersion: string;
  readonly serverVersion: string;
  readonly schemaDigest: string;
}

export interface StreamDataEvent<T = unknown> {
  readonly type: string;
  readonly sequence: number;
  readonly eventId: string;
  readonly correlationId: string;
  readonly operationId: string;
  readonly resourceRef: ResourceReference;
  readonly occurredAt: string;
  readonly data: T;
  readonly resumeCursor?: string;
}

export interface StreamEventOptions<T> {
  readonly type: string;
  readonly sequence: number;
  readonly correlationId: string;
  readonly operationId: string;
  readonly resourceRef: ResourceReference;
  readonly data: T;
  readonly eventId?: string;
  readonly occurredAt?: string;
  readonly resumeCursor?: string;
}

export function createSuccessEnvelope<T>(
  schemaVersion: string,
  operationId: string,
  command: string,
  data: T,
  meta: EnvelopeMeta = {},
): SuccessEnvelope<T> {
  const safeData = redactValue(data) as T;
  const pagination = paginationFromData(safeData);
  return {
    apiVersion: CLI_API_VERSION,
    schemaVersion,
    operationId,
    command,
    data: safeData,
    ...(pagination ? { pagination } : {}),
    meta: redactValue(meta) as EnvelopeMeta,
  };
}

function paginationFromData(value: unknown): PaginationEnvelope | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (![record.page, record.pageSize, record.total, record.totalPages].every(Number.isFinite)) {
    return undefined;
  }
  return {
    page: Number(record.page),
    pageSize: Number(record.pageSize),
    total: Number(record.total),
    totalPages: Number(record.totalPages),
    ...(typeof record.sortBy === "string" ? { sortBy: record.sortBy } : {}),
    ...(typeof record.sortOrder === "string" ? { sortOrder: record.sortOrder } : {}),
  };
}

export function createStreamVersionEvent(options: {
  readonly cliVersion: string;
  readonly serverVersion: string;
  readonly schemaDigest: string;
}): StreamVersionEvent {
  return {
    type: "version",
    streamVersion: CLI_STREAM_VERSION,
    cliVersion: options.cliVersion,
    serverVersion: options.serverVersion,
    schemaDigest: options.schemaDigest,
  };
}

export function createStreamEvent<T>(options: StreamEventOptions<T>): StreamDataEvent<T> {
  if (!Number.isSafeInteger(options.sequence) || options.sequence < 1) {
    throw new RangeError("Stream sequence must be a positive safe integer.");
  }
  return {
    type: options.type,
    sequence: options.sequence,
    eventId: options.eventId ?? `evt_${randomUUID()}`,
    correlationId: options.correlationId,
    operationId: options.operationId,
    resourceRef: options.resourceRef,
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    data: redactValue(options.data) as T,
    ...(options.resumeCursor ? { resumeCursor: options.resumeCursor } : {}),
  };
}

export function createStreamSummary<T>(
  options: Omit<StreamEventOptions<T>, "type">,
): StreamDataEvent<T> {
  return createStreamEvent({ ...options, type: "summary" });
}
