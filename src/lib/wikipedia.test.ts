import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPeople, photoFrom, photoSrcSet, photoUrl, titleFromUrl } from './wikipedia.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

const THUMB =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head.jpg/330px-Albert_Einstein_Head.jpg?utm_source=en.wikipedia.org';

describe('titleFromUrl', () => {
  it('turns article URLs into titles', () => {
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Fyodor_Dostoevsky')).toBe(
      'Fyodor Dostoevsky',
    );
    expect(titleFromUrl('https://en.wikipedia.org/wiki/Ren%C3%A9_Descartes')).toBe(
      'René Descartes',
    );
    expect(titleFromUrl('https://example.com/')).toBeUndefined();
  });
});

describe('photos', () => {
  it('serves standard thumbnail widths up to the original size', () => {
    const photo = photoFrom({ source: THUMB, width: 330, height: 440 }, { width: 600 });
    expect(photo?.widths).toEqual([250, 330, 500]);
    expect(photo?.ratio).toBeCloseTo(0.75);
    if (!photo) return;
    expect(photoUrl(photo, 400)).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Albert_Einstein_Head.jpg/500px-Albert_Einstein_Head.jpg',
    );
    expect(photoSrcSet(photo)).toContain('250px-Albert_Einstein_Head.jpg 250w');
  });

  it('uses tiny originals as they are', () => {
    const photo = photoFrom({ source: THUMB, width: 200, height: 200 }, { width: 200 });
    expect(photo?.widths).toEqual([200]);
  });

  it('ignores URLs that are not Wikimedia thumbnails', () => {
    expect(photoFrom({ source: 'https://example.com/a.jpg', width: 1, height: 1 })).toBeUndefined();
  });
});

describe('fetchPeople', () => {
  it('follows renames and redirects back to the titles asked for', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        query: {
          normalized: [{ from: 'Fyodor_Dostoevsky', to: 'Fyodor Dostoevsky' }],
          redirects: [{ from: 'Fyodor Dostoevsky', to: 'Fyodor Dostoyevsky' }],
          pages: [
            {
              title: 'Fyodor Dostoyevsky',
              description: 'Russian novelist',
              thumbnail: { source: THUMB, width: 330, height: 440 },
              original: { source: 'x', width: 3000, height: 4000 },
            },
            { title: 'Nobody', missing: true },
          ],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const people = await fetchPeople(['Fyodor_Dostoevsky', 'Nobody']);
    expect(people.get('Fyodor_Dostoevsky')?.description).toBe('Russian novelist');
    expect(people.get('Fyodor_Dostoevsky')?.photo?.widths).toEqual([250, 330, 500, 960]);
    expect(people.has('Nobody')).toBe(false);
    const url = new URL(String(fetchMock.mock.calls[0]?.[0 as never]));
    expect(url.searchParams.get('origin')).toBe('*');
    expect(url.searchParams.get('titles')).toBe('Fyodor_Dostoevsky|Nobody');
  });

  it('asks in batches of 50', async () => {
    const fetchMock = vi.fn(async () => Response.json({ query: { pages: [] } }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchPeople(Array.from({ length: 120 }, (_, i) => `Person ${i}`));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
