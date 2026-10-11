/**
 * Share the front page: an image made right here in the browser, sent through the phone's share
 * menu where it can take files, otherwise downloaded. Plus a plain link.
 */
import { Check, Download, Link2, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Edition } from '../lib/edition.ts';
import { dateline, headline } from '../lib/headline.ts';
import { runway } from '../lib/lines.ts';
import { type CardInput, canvasToBlob, renderCard } from '../lib/shareCard.ts';
import { shareUrl } from '../lib/url.ts';
import { photoUrl } from '../lib/wikipedia.ts';
import { PAPERS } from './Masthead.tsx';

/** The address printed on the image. A local dev server's address is useless to friends. */
function siteName() {
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const url = local ? new URL(PUBLIC_URL) : location;
  return `${url.host}${url.pathname}`.replace(/\/$/, '');
}

const PUBLIC_URL = 'https://muktaditbf.github.io/at-your-age/';

function cardInput(edition: Edition, line: string): CardInput {
  const { mode, age } = edition;
  return {
    mode,
    age,
    line,
    paperName: PAPERS[mode].name,
    site: siteName(),
    stories: edition.stories.slice(0, 3).map((story) => {
      const deed = story.deeds[0];
      const photo = edition.people[story.id]?.photo;
      return {
        name: story.name,
        headline: deed ? headline(story.name, deed.verb, deed.kind, deed.thing) : story.name,
        dateline: deed ? dateline(deed, mode, age) : '',
        deck: edition.people[story.id]?.description,
        badge:
          deed && mode === 'hype' ? `At ${deed.age.exact ? '' : '~'}${deed.age.years}` : undefined,
        photoUrl: photo ? photoUrl(photo, 500) : undefined,
      };
    }),
  };
}

export function ShareBar({ edition, line }: { edition: Edition; line: string }) {
  const input = useMemo(() => cardInput(edition, line), [edition, line]);
  const key = JSON.stringify(input);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const link = shareUrl({ age: edition.age, mode: edition.mode });
  const fileName = `at-${edition.age}-${edition.mode === 'roast' ? 'roasted' : 'still-time'}.png`;

  // Draw the card once the stories (and, a moment later, their photos) are in. The previous
  // image stays usable until the new one is ready.
  const current = useRef<string | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await canvasToBlob(await renderCard(JSON.parse(key) as CardInput));
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (current.current) URL.revokeObjectURL(current.current);
        current.current = url;
        setFile(new File([blob], fileName, { type: 'image/png' }));
        setPreview(url);
        setNote('');
      } catch {
        if (!cancelled)
          setNote('The image could not be made in this browser. The link still works.');
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, fileName]);
  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  const lead = edition.stories[0]?.deeds[0];
  const text =
    edition.mode === 'roast'
      ? `At ${edition.age}, ${edition.stories[0]?.name ?? 'someone famous'} had already done more than me. My front page:`
      : `At ${edition.age}, I've still got ${lead ? runway(lead.age.years - edition.age) : 'plenty of runway'}. My front page:`;

  const canShareFile =
    typeof navigator !== 'undefined' &&
    !!file &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  const share = async () => {
    setNote('');
    try {
      if (canShareFile && file) {
        await navigator.share({ files: [file], title: 'At Your Age…', text: `${text} ${link}` });
      } else if (navigator.share) {
        await navigator.share({ title: 'At Your Age…', text, url: link });
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        setNote('Sharing did not work here. Download the image instead.');
      }
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setNote(`Copy this link: ${link}`);
    }
  };

  const hasShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const button =
    'inline-flex min-h-12 items-center justify-center gap-2 px-5 text-lg font-semibold in-data-[edition=hype]:rounded-full';

  return (
    <section
      aria-labelledby="share-title"
      className="mt-4 mb-2 grid gap-6 border-[3px] border-rule p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7 in-data-[edition=hype]:rounded-3xl"
    >
      <div className="min-w-0">
        <h2 id="share-title" className="display m-0 text-[clamp(1.9rem,6vw,2.6rem)] leading-none">
          Share your front page
        </h2>
        <p className="m-0 mt-2 max-w-[36rem] text-muted">
          The image is made on your device. It has the top three stories, your line and a link back
          here.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {hasShare && (
            <button type="button" onClick={share} className={`${button} bg-accent text-on-accent`}>
              <Share2 size={19} strokeWidth={2.5} aria-hidden="true" />
              Share
            </button>
          )}
          <a
            href={preview}
            download={fileName}
            aria-disabled={!preview}
            onClick={(event) => {
              if (!preview) event.preventDefault();
            }}
            className={`${button} no-underline ${hasShare ? 'border-2 border-rule text-ink' : 'bg-accent text-on-accent'} aria-disabled:opacity-60`}
          >
            <Download size={19} strokeWidth={2.5} aria-hidden="true" />
            {preview ? 'Download image' : 'Making image…'}
          </a>
          <button
            type="button"
            onClick={copy}
            className={`${button} border-2 border-rule text-ink`}
          >
            {copied ? (
              <Check size={19} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Link2 size={19} strokeWidth={2.5} aria-hidden="true" />
            )}
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
        <p className="m-0 mt-3 min-h-[1.5em] text-sm text-muted" role="status">
          {note}
        </p>
      </div>
      {preview && (
        <img
          src={preview}
          alt="Your front page, ready to share"
          width={216}
          height={270}
          className="w-[min(216px,60vw)] border-2 border-rule"
        />
      )}
    </section>
  );
}
