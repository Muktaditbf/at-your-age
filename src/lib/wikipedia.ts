/**
 * Photos, one-line bios and popularity (page views over the last 30 days) from English
 * Wikipedia, up to 50 people per request.
 * The API and the image server both allow cross-origin use, so photos can also be drawn on the
 * share card's canvas.
 */
import * as z from 'zod/mini';

export const API = 'https://en.wikipedia.org/w/api.php';
const BATCH = 50;

export interface Photo {
  /** Thumbnail URL with the width left as {w}. */
  template: string;
  /** Widths this photo can be served at (never wider than the original). */
  widths: number[];
  /** Aspect ratio, width / height. */
  ratio: number;
}

export interface PersonInfo {
  description?: string;
  photo?: Photo;
  /** English Wikipedia page views over the last 30 days: how much people care right now. */
  views?: number;
}

/** Days of page views to add up. */
export const VIEW_DAYS = 30;

const image = z.object({ source: z.string(), width: z.number(), height: z.number() });
const rename = z.object({ from: z.string(), to: z.string() });

const page = z.object({
  title: z.string(),
  missing: z.optional(z.boolean()),
  description: z.optional(z.string()),
  thumbnail: z.optional(image),
  original: z.optional(image),
  pageviews: z.optional(z.record(z.string(), z.nullable(z.number()))),
});

const response = z.object({
  query: z.optional(
    z.object({
      normalized: z.optional(z.array(rename)),
      redirects: z.optional(z.array(rename)),
      pages: z.optional(z.array(page)),
    }),
  ),
});

/** Wikimedia only serves thumbnails at these widths. */
export const WIDTHS = [250, 330, 500, 960];

/** "https://en.wikipedia.org/wiki/Fyodor_Dostoevsky" → "Fyodor Dostoevsky" */
export function titleFromUrl(url: string): string | undefined {
  const marker = '/wiki/';
  const at = url.indexOf(marker);
  if (at < 0) return undefined;
  try {
    return decodeURIComponent(url.slice(at + marker.length)).replaceAll('_', ' ');
  } catch {
    return undefined;
  }
}

/** Turns ".../thumb/a/ab/File.jpg/330px-File.jpg?utm=..." into a width template. */
export function photoFrom(
  thumbnail: { source: string; width: number; height: number },
  original?: { width: number },
): Photo | undefined {
  const clean = thumbnail.source.split('?')[0] ?? '';
  const match = /\/(\d+)px-[^/]+$/.exec(clean);
  if (!match || !clean.includes('/thumb/')) return undefined;
  const template = clean.replace(/\/\d+px-([^/]+)$/, '/{w}px-$1');
  const ratio = thumbnail.width / thumbnail.height;
  const max = original?.width ?? thumbnail.width;
  const widths = WIDTHS.filter((w) => w <= max);
  // Tiny originals: use the thumbnail we were given as-is.
  if (!widths.length) return { template: clean, widths: [thumbnail.width], ratio };
  return { template, widths, ratio };
}

export function photoUrl(photo: Photo, width: number): string {
  const best = photo.widths.find((w) => w >= width) ?? photo.widths[photo.widths.length - 1];
  return photo.template.replace('{w}', String(best));
}

export function photoSrcSet(photo: Photo): string {
  return photo.widths.map((w) => `${photo.template.replace('{w}', String(w))} ${w}w`).join(', ');
}

/** Looks up people by article title. Returns a map keyed by the titles that were asked for. */
export async function fetchPeople(
  titles: readonly string[],
  signal?: AbortSignal,
): Promise<Map<string, PersonInfo>> {
  const unique = [...new Set(titles)];
  const result = new Map<string, PersonInfo>();
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      redirects: '1',
      prop: 'pageimages|description|pageviews',
      piprop: 'thumbnail|original',
      pithumbsize: '330',
      pilimit: String(BATCH),
      pvipdays: String(VIEW_DAYS),
      titles: batch.join('|'),
    });
    const res = await fetch(`${API}?${params}`, { signal });
    if (!res.ok) throw new Error(`Wikipedia answered ${res.status}`);
    const parsed = response.safeParse(await res.json());
    if (!parsed.success) throw new Error('Unexpected answer from Wikipedia');
    const query = parsed.data.query;
    // Follow "Fyodor_Dostoevsky" → "Fyodor Dostoevsky" → redirect target, back to what we asked.
    const renamed = new Map<string, string>();
    for (const step of [...(query?.normalized ?? []), ...(query?.redirects ?? [])]) {
      renamed.set(step.from, step.to);
    }
    const pages = new Map((query?.pages ?? []).map((p) => [p.title, p]));
    for (const title of batch) {
      let final = title;
      for (let hops = 0; hops < 3 && renamed.has(final); hops++)
        final = renamed.get(final) ?? final;
      const found = pages.get(final);
      if (!found || found.missing) continue;
      result.set(title, {
        description: found.description,
        photo: found.thumbnail ? photoFrom(found.thumbnail, found.original) : undefined,
        views: found.pageviews ? totalViews(found.pageviews) : undefined,
      });
    }
  }
  return result;
}

/** Adds up daily views; days Wikipedia hasn't counted yet come back as null. */
export function totalViews(days: Record<string, number | null>): number {
  return Object.values(days).reduce<number>((sum, views) => sum + (views ?? 0), 0);
}
