# @jadujoel/uniform-audio-param

Cross-browser polyfill that normalizes `AudioParam` behavior across Chromium, Firefox, and WebKit.

## What it does

- **`cancelAndHoldAtTime`** — Polyfills the missing method in Firefox by tracking scheduled automation events and computing the held value mathematically.
- **`getScheduledValueAtTime`** — Utility to read the computed value of an AudioParam at any point in time, even before rendering.

Two flavors are provided:

- **Auto-patching** (default import) — patches `AudioParam.prototype` on import. Zero config.
- **Manual** (`/manual` import) — polyfill individual `AudioParam` instances explicitly, avoiding prototype monkey-patching.

## Install

### npm / bun / yarn / pnpm

```bash
npm install @jadujoel/uniform-audio-param
```

Then import it at the top of your app (side-effect import):

```js
import "@jadujoel/uniform-audio-param";
```

### CDN (script tag)

Load it directly from [unpkg](https://unpkg.com) or [jsDelivr](https://www.jsdelivr.com):

```html
<!-- unpkg -->
<script src="https://unpkg.com/@jadujoel/uniform-audio-param"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@jadujoel/uniform-audio-param"></script>
```

Or as an ES module:

```html
<script type="module">
  import "https://unpkg.com/@jadujoel/uniform-audio-param?module";
</script>
```

### Usage (auto-patching)

Once loaded (via import or script tag), the polyfill patches `AudioParam.prototype` automatically. Use the Web Audio API as normal:

```js
const ctx = new AudioContext();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain).connect(ctx.destination);

gain.gain.setValueAtTime(1, ctx.currentTime);
gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

// cancelAndHoldAtTime now works in Firefox too
gain.gain.cancelAndHoldAtTime(ctx.currentTime + 0.5);
```

### Usage (manual)

If you prefer not to patch `AudioParam.prototype`, import from `@jadujoel/uniform-audio-param/manual` and polyfill individual params:

```js
import { polyfillAudioParam, polyfillAudioNode } from "@jadujoel/uniform-audio-param/manual";

const ctx = new AudioContext();
const gain = ctx.createGain();

// Polyfill a single AudioParam
polyfillAudioParam(gain.gain);

// Or polyfill all AudioParams on a node at once
const biquad = ctx.createBiquadFilter();
polyfillAudioNode(biquad); // patches frequency, detune, Q, gain

gain.gain.setValueAtTime(1, ctx.currentTime);
gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
gain.gain.cancelAndHoldAtTime(ctx.currentTime + 0.5);
```

## Known limitations

- **`automationRate "k-rate"`** — No polyfill possible (engine-internal behavior).
- **`.value` getter before rendering** — Cannot be polyfilled without breaking Firefox's spec-correct behavior. Use `getScheduledValueAtTime()` instead.

## Development

```bash
bun install
bun run build     # build to dist/
bun test          # run polyfill tests
```
