import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Home-screen icons get the logo's red all the way to the edge instead of a white frame.
const red = { background: '#d6000f' };

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: red },
    apple: { ...minimal2023Preset.apple, padding: 0.08, resizeOptions: red },
  },
  images: ['public/logo.svg'],
});
