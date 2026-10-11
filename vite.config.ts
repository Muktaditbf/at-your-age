import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// GitHub Pages serves the app from /<repo>/. Override with BASE_PATH=/ for other hosts.
const base = process.env.BASE_PATH ?? '/at-your-age/';

/**
 * Preloads the fonts the first screen needs, per edition, so headlines don't jump when the
 * fonts arrive. File names are only known after bundling, so the links are added then.
 */
function preloadFonts(): Plugin {
  const wanted = {
    roast: [/^anton-latin-400-normal-.*\.woff2$/, /^unifrakturcook-latin-700-normal-.*\.woff2$/],
    hype: [/^fraunces-latin-soft-normal-.*\.woff2$/],
    both: [/^newsreader-latin-wght-normal-.*\.woff2$/],
  };
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {});
        const find = (patterns: RegExp[]) =>
          patterns
            .map((pattern) => files.find((file) => pattern.test(file.split('/').pop() ?? '')))
            .filter((file): file is string => Boolean(file))
            .map((file) => base + file);
        const fonts = {
          roast: find(wanted.roast),
          hype: find(wanted.hype),
          both: find(wanted.both),
        };
        return [
          {
            tag: 'script',
            injectTo: 'head',
            children: `(() => {
  const fonts = ${JSON.stringify(fonts)};
  const edition = document.documentElement.dataset.edition === 'hype' ? 'hype' : 'roast';
  for (const href of [...fonts[edition], ...fonts.both]) {
    const link = document.createElement('link');
    Object.assign(link, { rel: 'preload', as: 'font', type: 'font/woff2', href, crossOrigin: 'anonymous' });
    document.head.append(link);
  }
})();`,
          },
        ];
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), preloadFonts()],
});
