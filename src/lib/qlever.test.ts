import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINT, QueryFailed, runLimited, runQuery } from './qlever.ts';

const ok = (bindings: unknown[] = []) =>
  new Response(JSON.stringify({ head: { vars: [] }, results: { bindings } }), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runQuery', () => {
  it('sends the query to QLever and returns the rows', async () => {
    const fetchMock = vi.fn(async () => ok([{ p: { type: 'uri', value: 'x' } }]));
    vi.stubGlobal('fetch', fetchMock);
    const rows = await runQuery('SELECT 1');
    expect(rows).toEqual([{ p: { type: 'uri', value: 'x' } }]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${ENDPOINT}?query=SELECT%201`);
    expect(new Headers(init.headers).get('Accept')).toBe('application/sparql-results+json');
  });

  it('waits and retries when the server is busy', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal('fetch', fetchMock);
    await expect(runQuery('q', { backoffMs: 1 })).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retries with the reason', async () => {
    const fetchMock = vi.fn(async () => new Response('oops', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const error = await runQuery('q', { backoffMs: 1, retries: 2 }).catch((e) => e);
    expect(error).toBeInstanceOf(QueryFailed);
    expect(error.reason).toBe('server');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('reports a network failure as offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = await runQuery('q', { backoffMs: 1, retries: 0 }).catch((e) => e);
    expect(error.reason).toBe('offline');
  });

  it('times out without retrying', async () => {
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const error = await runQuery('q', { timeoutMs: 20, backoffMs: 1 }).catch((e) => e);
    expect(error.reason).toBe('timeout');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops when the search is cancelled', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
          }),
      ),
    );
    const pending = runQuery('q', { signal: controller.signal });
    controller.abort(new DOMException('new search', 'AbortError'));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects answers with the wrong shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"nope":1}', { status: 200 })),
    );
    const error = await runQuery('q', { backoffMs: 1 }).catch((e) => e);
    expect(error.reason).toBe('bad-response');
  });
});

describe('runLimited', () => {
  it('never runs more tasks at once than allowed', async () => {
    let running = 0;
    let peak = 0;
    const tasks = Array.from({ length: 7 }, () => async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
    });
    await runLimited(tasks, 3);
    expect(peak).toBe(3);
    expect(running).toBe(0);
  });
});
