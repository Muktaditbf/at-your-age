/**
 * Draws the shareable front page (1080×1350, the portrait size Instagram and WhatsApp like).
 * Roast photos get a real halftone screen; hype photos stay in colour, cut as arches.
 * Wikimedia images allow cross-origin use, so the canvas stays exportable.
 */
import type { Mode } from './sparql.ts';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export interface CardStory {
  name: string;
  headline: string;
  /** "Nov 30, 1982. Age 24." */
  dateline: string;
  /** The Wikipedia one-liner, shown for the lead story. */
  deck?: string;
  /** Short label on the photo in the hype edition: "At 50". */
  badge?: string;
  photoUrl?: string;
}

export interface CardInput {
  mode: Mode;
  age: number;
  paperName: string;
  line: string;
  stories: CardStory[];
  /** Shown at the bottom, without https://. */
  site: string;
}

const PALETTES = {
  roast: {
    paper: '#f6f5f1',
    paper2: '#e9e7e1',
    ink: '#000000',
    muted: '#45423d',
    accent: '#d6000f',
    onAccent: '#ffffff',
  },
  hype: {
    paper: '#fff3c4',
    paper2: '#ffe598',
    ink: '#0f3d2e',
    muted: '#35574a',
    accent: '#f2a900',
    onAccent: '#0f3d2e',
  },
} as const;

const FONTS = {
  roast: {
    display: 'Anton',
    displayWeight: '400',
    nameplate: 'UnifrakturCook',
    nameplateWeight: '700',
  },
  hype: {
    display: '"Fraunces Variable"',
    displayWeight: '750',
    nameplate: '"Fraunces Variable"',
    nameplateWeight: '800',
  },
} as const;
const BODY = '"Newsreader Variable"';

type Ctx = CanvasRenderingContext2D;

async function loadFonts(mode: Mode) {
  const f = FONTS[mode];
  await Promise.allSettled([
    document.fonts.load(`${f.displayWeight} 100px ${f.display}`),
    document.fonts.load(`${f.nameplateWeight} 100px ${f.nameplate}`),
    document.fonts.load(`400 32px ${BODY}`),
    document.fonts.load(`650 32px ${BODY}`),
  ]);
}

async function loadImage(url: string | undefined): Promise<HTMLImageElement | undefined> {
  if (!url) return undefined;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  try {
    await img.decode();
    return img;
  } catch {
    return undefined;
  }
}

/** Splits text into lines that fit, adding "…" if it runs past maxLines. */
export function wrapText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? '';
  while (last && measure(`${last}…`) > maxWidth) last = last.split(' ').slice(0, -1).join(' ');
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

/**
 * Fits the largest font size (down to `min`) that keeps the text within `maxLines` lines and,
 * when given, within `maxHeight` pixels at `leading` × size per line.
 */
function fitText(
  ctx: Ctx,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  maxLines: number,
  max: number,
  min: number,
  maxHeight = Number.POSITIVE_INFINITY,
  leading = 1,
) {
  for (let size = max; size >= min; size -= 2) {
    ctx.font = font(size);
    const lines = wrapText(
      (t) => ctx.measureText(t).width,
      text,
      maxWidth,
      Number.POSITIVE_INFINITY,
    );
    if (lines.length <= maxLines && lines.length * size * leading <= maxHeight)
      return { size, lines };
  }
  ctx.font = font(min);
  const lines = Math.max(1, Math.min(maxLines, Math.floor(maxHeight / (min * leading))));
  return { size: min, lines: wrapText((t) => ctx.measureText(t).width, text, maxWidth, lines) };
}

/** Source rectangle that covers w×h, keeping faces (usually high in portraits) in frame. */
function coverRect(img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * 0.22));
  return { sx, sy, sw, sh };
}

function drawHalftone(
  ctx: Ctx,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  paper: string,
) {
  const cell = Math.max(3.5, w / 60);
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const small = document.createElement('canvas');
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  if (!sctx) return;
  const { sx, sy, sw, sh } = coverRect(img, w, h);
  sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const { data } = sctx.getImageData(0, 0, cols, rows);
  const lums = new Float32Array(cols * rows);
  for (let i = 0; i < lums.length; i++) {
    const o = i * 4;
    lums[i] =
      (0.299 * (data[o] ?? 0) + 0.587 * (data[o + 1] ?? 0) + 0.114 * (data[o + 2] ?? 0)) / 255;
  }
  // Stretch the tones so dark old portraits still read as faces.
  const sorted = Float32Array.from(lums).sort();
  const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.98)] ?? 1;
  const range = Math.max(0.15, hi - lo);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = paper;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ink;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const level = Math.min(1, Math.max(0, ((lums[row * cols + col] ?? 0) - lo) / range));
      const radius = cell * 0.68 * Math.sqrt(1 - level ** 0.85);
      if (radius < 0.3) continue;
      ctx.beginPath();
      ctx.arc(x + col * cell + cell / 2, y + row * cell + cell / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function archPath(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawPhoto(
  ctx: Ctx,
  mode: Mode,
  img: HTMLImageElement | undefined,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const p = PALETTES[mode];
  if (mode === 'hype') {
    ctx.save();
    archPath(ctx, x - 9, y - 9, w + 18, h + 18);
    ctx.fillStyle = p.accent;
    ctx.fill();
    archPath(ctx, x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = p.paper;
    ctx.fill();
    archPath(ctx, x, y, w, h);
    ctx.clip();
    ctx.fillStyle = p.paper2;
    ctx.fillRect(x, y, w, h);
    if (img) {
      const { sx, sy, sw, sh } = coverRect(img, w, h);
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
    ctx.restore();
  } else {
    if (img) drawHalftone(ctx, img, x, y, w, h, p.ink, p.paper);
    else {
      ctx.fillStyle = p.paper2;
      ctx.fillRect(x, y, w, h);
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle = p.ink;
    ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  }
  if (!img) {
    const initials = name
      .split(/\s+/)
      .filter((part) => /^\p{Lu}/u.test(part))
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
    ctx.fillStyle = p.muted;
    ctx.font = `${FONTS[mode].displayWeight} ${Math.round(w * 0.32)}px ${FONTS[mode].display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, x + w / 2, y + h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

function drawBadge(ctx: Ctx, mode: Mode, text: string, x: number, y: number, size: number) {
  const p = PALETTES[mode];
  ctx.font = `800 ${size}px ${FONTS.hype.display}`;
  const w = ctx.measureText(text).width + size * 0.9;
  const h = size * 1.45;
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = p.onAccent;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + size * 0.45, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

/** The rubber stamp ("ROASTED") or ribbon ("Still time") on the lead photo. */
function drawStamp(ctx: Ctx, mode: Mode, x: number, y: number) {
  const p = PALETTES[mode];
  const text = mode === 'roast' ? 'ROASTED' : 'Still time';
  const size = mode === 'roast' ? 46 : 38;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((mode === 'roast' ? -11 : -6) * Math.PI) / 180);
  ctx.font = mode === 'roast' ? `400 ${size}px Anton` : `800 ${size}px ${FONTS.hype.display}`;
  const w = ctx.measureText(text).width + size * 0.8;
  const h = size * 1.35;
  if (mode === 'roast') {
    ctx.fillStyle = 'rgba(246, 245, 241, 0.82)';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = p.accent;
  } else {
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = p.onAccent;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 3);
  ctx.restore();
}

function drawLines(ctx: Ctx, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });
  return y + (lines.length - 1) * lineHeight;
}

export async function renderCard(input: CardInput): Promise<HTMLCanvasElement> {
  const { mode } = input;
  const p = PALETTES[mode];
  const f = FONTS[mode];
  const display = (size: number) => `${f.displayWeight} ${size}px ${f.display}`;
  const caps = (text: string) => (mode === 'roast' ? text.toUpperCase() : text);

  await loadFonts(mode);
  const images = await Promise.all(input.stories.slice(0, 3).map((s) => loadImage(s.photoUrl)));

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  const M = 56;
  const inner = CARD_WIDTH - M * 2;

  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Nameplate.
  const band = 150;
  if (mode === 'roast') {
    ctx.fillStyle = p.accent;
    ctx.fillRect(0, 0, CARD_WIDTH, band);
  } else {
    ctx.fillStyle = p.ink;
    ctx.fillRect(M, 28, inner, 5);
    ctx.fillRect(M, 40, inner, 2);
    ctx.fillRect(M, band - 16, inner, 2);
    ctx.fillRect(M, band - 9, inner, 5);
  }
  const plate = fitText(
    ctx,
    input.paperName,
    (s) => `${f.nameplateWeight} ${s}px ${f.nameplate}`,
    inner,
    1,
    92,
    52,
  );
  ctx.font = `${f.nameplateWeight} ${plate.size}px ${f.nameplate}`;
  ctx.fillStyle = mode === 'roast' ? p.onAccent : p.ink;
  ctx.fillText(plate.lines[0] ?? '', M, band / 2 + plate.size * 0.34);

  // "AT 24…"
  ctx.fillStyle = p.ink;
  const hero = fitText(ctx, caps(`At ${input.age}…`), display, inner, 1, 210, 110);
  ctx.font = display(hero.size);
  const heroBase = band + 28 + hero.size * 0.84;
  ctx.fillText(hero.lines[0] ?? '', M - 4, heroBase);
  let y = heroBase + 26;
  ctx.fillRect(M, y, inner, 8);
  y += 8 + 32;

  // Lead story.
  const [lead, ...more] = input.stories;
  if (lead) {
    const pw = 340;
    const ph = 425;
    drawPhoto(ctx, mode, images[0], lead.name, M, y, pw, ph);
    // Bottom corner: faces are usually higher up.
    if (lead.badge) drawBadge(ctx, mode, lead.badge, M + 14, y + ph - 64, 34);
    else drawStamp(ctx, mode, M + pw - 112, y + ph - 64);
    const tx = M + pw + 40;
    const tw = CARD_WIDTH - M - tx;
    const leading = mode === 'roast' ? 1.0 : 1.08;
    ctx.fillStyle = p.ink;
    // Leave room under the headline for the dateline.
    const head = fitText(ctx, caps(lead.headline), display, tw, 6, 96, 36, ph - 110, leading);
    ctx.font = display(head.size);
    const end = drawLines(ctx, head.lines, tx, y + head.size * 0.86, head.size * leading);
    ctx.font = `650 30px ${BODY}`;
    ctx.fillStyle = p.ink;
    const date = wrapText((t) => ctx.measureText(t).width, lead.dateline, tw, 2);
    const dateEnd = drawLines(ctx, date, tx, end + 58, 38);
    if (lead.deck) {
      ctx.font = `400 29px ${BODY}`;
      ctx.fillStyle = p.muted;
      const room = Math.floor((y + ph - (dateEnd + 20)) / 38);
      const deck = wrapText((t) => ctx.measureText(t).width, lead.deck, tw, Math.min(3, room));
      if (room > 0) drawLines(ctx, deck, tx, dateEnd + 48, 38);
    }
    y += ph + 30;
  }

  // Two more stories, side by side.
  if (more.length) {
    ctx.fillStyle = p.ink;
    ctx.fillRect(M, y, inner, 3);
    y += 3 + 28;
    const colW = (inner - 40) / 2;
    more.slice(0, 2).forEach((story, i) => {
      const x = M + i * (colW + 40);
      const pw = 140;
      const ph = 175;
      drawPhoto(ctx, mode, images[i + 1], story.name, x, y, pw, ph);
      if (story.badge) drawBadge(ctx, mode, story.badge, x + 8, y + ph - 42, 22);
      const tx = x + pw + 22;
      const tw = colW - pw - 22;
      ctx.fillStyle = p.ink;
      const leading = mode === 'roast' ? 1.02 : 1.1;
      const head = fitText(ctx, caps(story.headline), display, tw, 5, 44, 22, ph, leading);
      ctx.font = display(head.size);
      drawLines(ctx, head.lines, tx, y + head.size * 0.86, head.size * leading);
    });
    y += 175 + 26;
  }

  // The line for you.
  const boxY = Math.max(y, CARD_HEIGHT - 246);
  const boxH = CARD_HEIGHT - 60 - boxY;
  ctx.fillStyle = p.paper2;
  ctx.fillRect(M, boxY, inner, boxH);
  ctx.fillStyle = p.accent;
  ctx.fillRect(M, boxY, 10, boxH);
  ctx.fillStyle = p.ink;
  let textTop = boxY + 26;
  if (mode === 'roast') {
    ctx.font = `750 27px ${BODY}`;
    ctx.fillText('Meanwhile, you:', M + 34, textTop + 22);
    textTop += 36;
  }
  const said = fitText(ctx, input.line, (s) => `450 ${s}px ${BODY}`, inner - 70, 2, 40, 26);
  ctx.font = `450 ${said.size}px ${BODY}`;
  const lineHeight = said.size * 1.22;
  const room = boxY + boxH - textTop;
  const block = said.lines.length * lineHeight;
  drawLines(ctx, said.lines, M + 34, textTop + (room - block) / 2 + said.size * 0.9, lineHeight);

  // Footer.
  ctx.font = `650 26px ${BODY}`;
  ctx.fillStyle = p.ink;
  ctx.fillText(input.site, M, CARD_HEIGHT - 22);
  ctx.font = `400 21px ${BODY}`;
  ctx.fillStyle = p.muted;
  const credit = 'Facts: Wikidata. Photos: Wikimedia Commons.';
  ctx.fillText(credit, CARD_WIDTH - M - ctx.measureText(credit).width, CARD_HEIGHT - 23);

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the image'))),
      'image/png',
    );
  });
}
