/**
 * Talks to QLever, a fast public SPARQL endpoint for Wikidata run by the University of Freiburg.
 * (The official Wikidata endpoint needs 20-45 s for these questions; QLever needs 3-6 s.)
 *
 * - Every request has a timeout and can be cancelled when a new search starts.
 * - "Too many requests" (429), server errors and network hiccups are retried with a pause.
 * - At most MAX_PARALLEL requests run at once: QLever answers 429 beyond about three.
 */
import * as z from 'zod/mini';

export const ENDPOINT = 'https://qlever.dev/api/wikidata';
export const MAX_PARALLEL = 3;
export const TIMEOUT_MS = 25_000;

const term = z.object({ type: z.string(), value: z.string() });
export type Term = z.infer<typeof term>;
export type Row = Record<string, Term>;

const response = z.object({
  results: z.object({ bindings: z.array(z.record(z.string(), term)) }),
});

export type FailureReason = 'timeout' | 'busy' | 'server' | 'offline' | 'bad-response';

export class QueryFailed extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason, message: string) {
    super(message);
    this.name = 'QueryFailed';
    this.reason = reason;
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

export interface QueryOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Extra attempts after the first one. */
  retries?: number;
  /** Base pause before a retry; grows with each attempt. */
  backoffMs?: number;
}

export async function runQuery(query: string, options: QueryOptions = {}): Promise<Row[]> {
  const { signal, timeoutMs = TIMEOUT_MS, retries = 2, backoffMs = 1200 } = options;
  let last: QueryFailed | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(backoffMs * attempt, signal);
    try {
      return await attemptQuery(query, signal, timeoutMs);
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      if (!(error instanceof QueryFailed)) throw error;
      last = error;
      // A timeout means the server is struggling; asking again right away rarely helps.
      if (error.reason === 'timeout' || error.reason === 'bad-response') break;
    }
  }
  throw last ?? new QueryFailed('server', 'The query failed.');
}

async function attemptQuery(query: string, signal: AbortSignal | undefined, timeoutMs: number) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/sparql-results+json' },
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (timeout.aborted)
      throw new QueryFailed('timeout', `No answer within ${timeoutMs / 1000} s.`);
    throw new QueryFailed('offline', (error as Error).message || 'Network error.');
  }
  if (res.status === 429) throw new QueryFailed('busy', 'The server asked us to slow down.');
  if (!res.ok) throw new QueryFailed('server', `The server answered ${res.status}.`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    if (signal?.aborted) throw signal.reason;
    if (timeout.aborted)
      throw new QueryFailed('timeout', `No answer within ${timeoutMs / 1000} s.`);
    throw new QueryFailed('bad-response', 'The answer was not valid JSON.');
  }
  const parsed = response.safeParse(json);
  if (!parsed.success) throw new QueryFailed('bad-response', 'The answer had an unexpected shape.');
  return parsed.data.results.bindings;
}

/** Runs tasks with at most `limit` in flight. Results arrive through each task's own callbacks. */
export async function runLimited(tasks: (() => Promise<void>)[], limit = MAX_PARALLEL) {
  const queue = [...tasks];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let task = queue.shift(); task; task = queue.shift()) await task();
  });
  await Promise.all(workers);
}
