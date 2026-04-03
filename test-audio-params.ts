import { chromium, firefox, webkit, type Browser, type BrowserType } from "playwright";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestResult {
  testName: string;
  values: number[];
  warnings: string[];
  errors: string[];
  logs: string[];
}

interface BrowserResults {
  browser: string;
  version: string;
  results: TestResult[];
}

// ─── Test definitions ────────────────────────────────────────────────────────
// Each test is a JS function (serialized to string) that runs inside the browser.
// It must return { values: number[], logs: string[] }

const tests: { name: string; code: string }[] = [
  // ── 1. Basic value setting ──
  {
    name: "1. AudioParam.value setter (immediate)",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.value = 0.5;
      const logs = [];
      logs.push("Initial value after set: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 2. setValueAtTime ──
  {
    name: "2. setValueAtTime basic",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.setValueAtTime(0.5, 0.25);
      gain.gain.setValueAtTime(1.0, 0.5);
      const logs = [];
      logs.push("Value immediately after scheduling: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after full render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 3. linearRampToValueAtTime ──
  {
    name: "3. linearRampToValueAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 0.5);
      const logs = [];
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render (should be ~1.0 at end): " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 4. exponentialRampToValueAtTime ──
  {
    name: "4. exponentialRampToValueAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.01, 0);
      gain.gain.exponentialRampToValueAtTime(1.0, 0.5);
      const logs = [];
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 5. setTargetAtTime ──
  {
    name: "5. setTargetAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.setTargetAtTime(1.0, 0.0, 0.1);
      const logs = [];
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after 1s render (target=1.0, tau=0.1): " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 6. setValueCurveAtTime ──
  {
    name: "6. setValueCurveAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const curve = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
      gain.gain.setValueCurveAtTime(curve, 0, 0.5);
      const logs = [];
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 7. cancelScheduledValues ──
  {
    name: "7. cancelScheduledValues - cancel ramp mid-way",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      gain.gain.cancelScheduledValues(0.5);
      const logs = [];
      logs.push("Value immediately after cancel: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 8. cancelAndHoldAtTime ──
  {
    name: "8. cancelAndHoldAtTime - basic linear ramp",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHoldAtTime succeeded");
      } catch(e) {
        logs.push("cancelAndHoldAtTime threw: " + e.message);
      }
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render (should hold at ~0.5): " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 9. cancelAndHoldAtTime with exponential ramp ──
  {
    name: "9. cancelAndHoldAtTime - exponential ramp",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.01, 0);
      gain.gain.exponentialRampToValueAtTime(1.0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHoldAtTime succeeded");
      } catch(e) {
        logs.push("cancelAndHoldAtTime threw: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 10. cancelAndHoldAtTime with setTargetAtTime ──
  {
    name: "10. cancelAndHoldAtTime - setTargetAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.setTargetAtTime(1.0, 0.0, 0.1);
      try {
        gain.gain.cancelAndHoldAtTime(0.3);
        logs.push("cancelAndHoldAtTime succeeded");
      } catch(e) {
        logs.push("cancelAndHoldAtTime threw: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 11. cancelAndHoldAtTime with setValueCurveAtTime ──
  {
    name: "11. cancelAndHoldAtTime - setValueCurveAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      const curve = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
      gain.gain.setValueCurveAtTime(curve, 0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHoldAtTime succeeded");
      } catch(e) {
        logs.push("cancelAndHoldAtTime threw: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 12. Ramp without prior setValueAtTime (implicit anchor) ──
  {
    name: "12. linearRamp without prior setValueAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      // No setValueAtTime before ramp - behavior varies
      gain.gain.linearRampToValueAtTime(0.5, 0.5);
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 13. exponentialRamp without prior setValueAtTime ──
  {
    name: "13. exponentialRamp without prior setValueAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.exponentialRampToValueAtTime(0.5, 0.5);
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 14. Multiple overlapping setValueAtTime ──
  {
    name: "14. Multiple setValueAtTime at same time",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.1, 0.25);
      gain.gain.setValueAtTime(0.5, 0.25);
      gain.gain.setValueAtTime(0.9, 0.25);
      logs.push("Value immediately: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render (last write wins?): " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 15. cancelScheduledValues then re-schedule ──
  {
    name: "15. cancelScheduledValues then re-schedule",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 0.5);
      gain.gain.cancelScheduledValues(0);
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(0.3, 0.5);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 16. cancelAndHoldAtTime then continue with new ramp ──
  {
    name: "16. cancelAndHoldAtTime then new linearRamp",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0.25);
        // Now ramp from held value to 0
        gain.gain.linearRampToValueAtTime(0.0, 0.75);
        logs.push("cancelAndHold + new ramp succeeded");
      } catch(e) {
        logs.push("Error: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 17. value setter during active automation ──
  {
    name: "17. value setter during active automation",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      // Now set value directly - should this cancel automation?
      gain.gain.value = 0.75;
      logs.push("Value after direct set: " + gain.gain.value);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 18. exponentialRamp to/from zero ──
  {
    name: "18. exponentialRamp with zero values",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      try {
        gain.gain.setValueAtTime(0.0, 0);
        gain.gain.exponentialRampToValueAtTime(1.0, 0.5);
        logs.push("exponentialRamp from 0: no error thrown");
      } catch(e) {
        logs.push("exponentialRamp from 0 threw: " + e.message);
      }
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.setValueAtTime(1.0, 0);
        gain.gain.exponentialRampToValueAtTime(0.0, 0.5);
        logs.push("exponentialRamp to 0: no error thrown");
      } catch(e) {
        logs.push("exponentialRamp to 0 threw: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 19. setValueCurveAtTime overlapping with other events ──
  {
    name: "19. setValueCurveAtTime overlap with setValueAtTime",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      const curve = new Float32Array([0, 0.5, 1.0]);
      gain.gain.setValueCurveAtTime(curve, 0, 0.5);
      try {
        gain.gain.setValueAtTime(0.75, 0.25);
        logs.push("setValueAtTime during curve: no error");
      } catch(e) {
        logs.push("setValueAtTime during curve threw: " + e.message);
      }
      osc.start();
      try {
        await ctx.startRendering();
        logs.push("Value after render: " + gain.gain.value);
      } catch(e) {
        logs.push("Render error: " + e.message);
      }
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 20. Rapid successive cancelAndHoldAtTime calls ──
  {
    name: "20. Multiple cancelAndHoldAtTime calls",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0.25);
        gain.gain.linearRampToValueAtTime(0.8, 0.75);
        gain.gain.cancelAndHoldAtTime(0.5);
        logs.push("Double cancelAndHold succeeded");
      } catch(e) {
        logs.push("Double cancelAndHold error: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 21. Sample-accurate scheduling test ──
  {
    name: "21. Sample-accurate values mid-ramp via OfflineAudioContext",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      // Render 0.5s, capture value at specific sample positions
      const ctx = new OfflineAudioContext(1, sampleRate / 2, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.linearRampToValueAtTime(1.0, 0.5);
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      // Check values at 0%, 25%, 50%, 75%, end
      const indices = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1];
      for (const i of indices) {
        logs.push("Sample[" + i + "] = " + data[i].toFixed(6));
      }
      return { values: indices.map(i => data[i]), logs };
    })()`
  },

  // ── 22. cancelAndHoldAtTime sample accuracy ──
  {
    name: "22. cancelAndHoldAtTime sample-accurate capture",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.linearRampToValueAtTime(1.0, 1.0);
      try {
        constantSrc.offset.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHold at 0.5s");
      } catch(e) {
        logs.push("cancelAndHold error: " + e.message);
      }
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      // Check at 0.25s, 0.5s, 0.75s, 1.0s
      const checkPoints = [0.25, 0.5, 0.75, 1.0];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s sample[" + i + "] = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`
  },

  // ── 23. cancelScheduledValues sample accuracy ──
  {
    name: "23. cancelScheduledValues sample-accurate capture",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.linearRampToValueAtTime(1.0, 1.0);
      constantSrc.offset.cancelScheduledValues(0.5);
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const checkPoints = [0.25, 0.49, 0.5, 0.51, 0.75, 1.0];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s sample[" + i + "] = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`
  },

  // ── 24. setTargetAtTime precise convergence ──
  {
    name: "24. setTargetAtTime convergence precision",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.setTargetAtTime(1.0, 0.0, 0.1);
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      // Expected: v(t) = 1 - exp(-t/0.1)
      const checkPoints = [0.1, 0.2, 0.3, 0.5, 1.0];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        const expected = 1 - Math.exp(-t / 0.1);
        logs.push("t=" + t + "s actual=" + data[i].toFixed(6) + " expected=" + expected.toFixed(6) + " diff=" + Math.abs(data[i] - expected).toFixed(8));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`
  },

  // ── 25. defaultValue and minValue/maxValue ──
  {
    name: "25. AudioParam defaultValue, minValue, maxValue",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const gain = ctx.createGain();
      const osc = ctx.createOscillator();
      const biquad = ctx.createBiquadFilter();
      const logs = [];
      logs.push("gain.gain: default=" + gain.gain.defaultValue + " min=" + gain.gain.minValue + " max=" + gain.gain.maxValue);
      logs.push("osc.frequency: default=" + osc.frequency.defaultValue + " min=" + osc.frequency.minValue + " max=" + osc.frequency.maxValue);
      logs.push("osc.detune: default=" + osc.detune.defaultValue + " min=" + osc.detune.minValue + " max=" + osc.detune.maxValue);
      logs.push("biquad.frequency: default=" + biquad.frequency.defaultValue + " min=" + biquad.frequency.minValue + " max=" + biquad.frequency.maxValue);
      logs.push("biquad.Q: default=" + biquad.Q.defaultValue + " min=" + biquad.Q.minValue + " max=" + biquad.Q.maxValue);
      logs.push("biquad.gain: default=" + biquad.gain.defaultValue + " min=" + biquad.gain.minValue + " max=" + biquad.gain.maxValue);
      return { values: [gain.gain.defaultValue, osc.frequency.defaultValue, biquad.frequency.defaultValue], logs };
    })()`
  },

  // ── 26. setValueAtTime in the past ──
  {
    name: "26. setValueAtTime with negative time",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const gain = ctx.createGain();
      const logs = [];
      try {
        gain.gain.setValueAtTime(0.5, -1);
        logs.push("setValueAtTime(-1): no error");
      } catch(e) {
        logs.push("setValueAtTime(-1) threw: " + e.name + ": " + e.message);
      }
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 27. cancelAndHoldAtTime at time 0 ──
  {
    name: "27. cancelAndHoldAtTime at time 0",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      try {
        gain.gain.cancelAndHoldAtTime(0);
        logs.push("cancelAndHoldAtTime(0): succeeded");
      } catch(e) {
        logs.push("cancelAndHoldAtTime(0): " + e.name + ": " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 28. cancelScheduledValues at time 0 ──
  {
    name: "28. cancelScheduledValues at time 0 (cancel everything)",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      gain.gain.cancelScheduledValues(0);
      osc.start();
      await ctx.startRendering();
      logs.push("Value after render: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 29. Ramp then setValueAtTime after ramp end ──
  {
    name: "29. Value after ramp completes (no further events)",
    code: `(async () => {
      const sampleRate = 48000;
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.linearRampToValueAtTime(0.5, 0.25);
      // No events after 0.25 - what value is held?
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const logs = [];
      const checkPoints = [0.1, 0.25, 0.5, 0.75, 1.0];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`
  },

  // ── 30. cancelAndHoldAtTime after all events completed ──
  {
    name: "30. cancelAndHoldAtTime after events already finished",
    code: `(async () => {
      const sampleRate = 48000;
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const constantSrc = ctx.createConstantSource();
      constantSrc.offset.setValueAtTime(0.0, 0);
      constantSrc.offset.linearRampToValueAtTime(1.0, 0.25);
      const logs = [];
      try {
        // Cancel+hold at a time after the ramp is already done
        constantSrc.offset.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime error: " + e.message);
      }
      constantSrc.connect(ctx.destination);
      constantSrc.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const checkPoints = [0.1, 0.25, 0.5, 0.75];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`
  },

  // ── 31. automationRate k-rate vs a-rate ──
  {
    name: "31. automationRate a-rate vs k-rate",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      // a-rate test
      const ctx1 = new OfflineAudioContext(1, 256, sampleRate);
      const cs1 = ctx1.createConstantSource();
      cs1.offset.automationRate = "a-rate";
      cs1.offset.setValueAtTime(0, 0);
      cs1.offset.linearRampToValueAtTime(1.0, 256 / sampleRate);
      cs1.connect(ctx1.destination);
      cs1.start();
      const buf1 = await ctx1.startRendering();
      const d1 = buf1.getChannelData(0);
      logs.push("a-rate samples: [0]=" + d1[0].toFixed(4) + " [64]=" + d1[64].toFixed(4) + " [128]=" + d1[128].toFixed(4) + " [255]=" + d1[255].toFixed(4));

      // k-rate test
      const ctx2 = new OfflineAudioContext(1, 256, sampleRate);
      const cs2 = ctx2.createConstantSource();
      cs2.offset.automationRate = "k-rate";
      cs2.offset.setValueAtTime(0, 0);
      cs2.offset.linearRampToValueAtTime(1.0, 256 / sampleRate);
      cs2.connect(ctx2.destination);
      cs2.start();
      const buf2 = await ctx2.startRendering();
      const d2 = buf2.getChannelData(0);
      logs.push("k-rate samples: [0]=" + d2[0].toFixed(4) + " [64]=" + d2[64].toFixed(4) + " [128]=" + d2[128].toFixed(4) + " [255]=" + d2[255].toFixed(4));

      // Check if k-rate has staircase pattern (same value within 128-sample blocks)
      const kRateStaircase = d2[0] === d2[127] && d2[128] === d2[255];
      logs.push("k-rate staircase pattern: " + kRateStaircase);

      return { values: [d1[128], d2[128]], logs };
    })()`
  },

  // ── 32. setValueCurveAtTime single-value curve ──
  {
    name: "32. setValueCurveAtTime with single-value curve",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      try {
        const curve = new Float32Array([0.5]);
        gain.gain.setValueCurveAtTime(curve, 0, 0.5);
        logs.push("Single-value curve: no error");
        osc.start();
        await ctx.startRendering();
        logs.push("Value after render: " + gain.gain.value);
      } catch(e) {
        logs.push("Single-value curve threw: " + e.name + ": " + e.message);
      }
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 33. setValueCurveAtTime with duration 0 ──
  {
    name: "33. setValueCurveAtTime with zero duration",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const gain = ctx.createGain();
      const logs = [];
      try {
        const curve = new Float32Array([0, 0.5, 1.0]);
        gain.gain.setValueCurveAtTime(curve, 0, 0);
        logs.push("Zero duration curve: no error");
      } catch(e) {
        logs.push("Zero duration curve threw: " + e.name + ": " + e.message);
      }
      return { values: [gain.gain.value], logs };
    })()`
  },

  // ── 34. Very large number of scheduled events ──
  {
    name: "34. Many scheduled events performance",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        gain.gain.setValueAtTime(i / 10000, i / 10000);
      }
      const scheduleTime = performance.now() - start;
      logs.push("Scheduling 10000 events took: " + scheduleTime.toFixed(2) + "ms");
      osc.start();
      const renderStart = performance.now();
      await ctx.startRendering();
      const renderTime = performance.now() - renderStart;
      logs.push("Rendering took: " + renderTime.toFixed(2) + "ms");
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

async function runTestsInBrowser(
  browserType: BrowserType,
  browserName: string
): Promise<BrowserResults> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running tests in ${browserName}...`);
  console.log("=".repeat(60));

  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages and errors
  const allWarnings: string[] = [];
  const allErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "warning") allWarnings.push(msg.text());
    if (msg.type() === "error") allErrors.push(msg.text());
  });
  page.on("pageerror", (err) => allErrors.push(err.message));

  // Navigate to a blank page with minimal HTML
  await page.setContent("<html><body></body></html>");

  // Get browser version
  const version = browser.version();

  const results: TestResult[] = [];

  for (const test of tests) {
    const testWarnings: string[] = [];
    const testErrors: string[] = [];

    // Reset warning/error capture for this test
    const warnHandler = (msg: any) => {
      if (msg.type() === "warning") testWarnings.push(msg.text());
    };
    const errHandler = (msg: any) => {
      if (msg.type() === "error") testErrors.push(msg.text());
    };

    page.on("console", warnHandler);
    page.on("console", errHandler);

    try {
      const result = await page.evaluate(test.code) as { values: number[]; logs: string[] };
      results.push({
        testName: test.name,
        values: result.values,
        warnings: testWarnings,
        errors: testErrors,
        logs: result.logs,
      });
      console.log(`  ✓ ${test.name}`);
      for (const log of result.logs) {
        console.log(`    ${log}`);
      }
    } catch (err: any) {
      results.push({
        testName: test.name,
        values: [],
        warnings: testWarnings,
        errors: [...testErrors, err.message],
        logs: [`EXCEPTION: ${err.message}`],
      });
      console.log(`  ✗ ${test.name}: ${err.message}`);
    }

    page.removeListener("console", warnHandler);
    page.removeListener("console", errHandler);
  }

  await browser.close();
  return { browser: browserName, version, results };
}

// ─── Report generation ───────────────────────────────────────────────────────

function generateMarkdownReport(allResults: BrowserResults[]): string {
  const lines: string[] = [];
  lines.push("# Web Audio API AudioParam Cross-Browser Comparison Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Browsers Tested");
  lines.push("");
  for (const br of allResults) {
    lines.push(`- **${br.browser}**: ${br.version}`);
  }
  lines.push("");

  // Summary table
  lines.push("## Summary Table");
  lines.push("");
  const headers = ["Test", ...allResults.map((r) => r.browser), "Match?"];
  lines.push("| " + headers.join(" | ") + " |");
  lines.push("| " + headers.map(() => "---").join(" | ") + " |");

  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i]!.name;
    const vals = allResults.map((br) => {
      const tr = br.results[i];
      if (!tr || tr.values.length === 0) return "ERROR";
      return tr.values.map((v) => (typeof v === "number" ? v.toFixed(6) : String(v))).join(", ");
    });

    // Check if all browsers match
    const allMatch = vals.every((v) => v === vals[0]);
    const matchStr = allMatch ? "✅" : "❌";

    lines.push(`| ${testName} | ${vals.join(" | ")} | ${matchStr} |`);
  }
  lines.push("");

  // Detailed results per test
  lines.push("## Detailed Results");
  lines.push("");

  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i]!.name;
    lines.push(`### ${testName}`);
    lines.push("");

    for (const br of allResults) {
      const tr = br.results[i];
      lines.push(`#### ${br.browser} (${br.version})`);
      lines.push("");

      if (!tr) {
        lines.push("*Test not found*");
        lines.push("");
        continue;
      }

      if (tr.logs.length > 0) {
        lines.push("```");
        for (const log of tr.logs) {
          lines.push(log);
        }
        lines.push("```");
        lines.push("");
      }

      if (tr.values.length > 0) {
        lines.push(`**Final values:** ${tr.values.map((v) => v?.toFixed(6)).join(", ")}`);
        lines.push("");
      }

      if (tr.warnings.length > 0) {
        lines.push(`**Warnings:** ${tr.warnings.join("; ")}`);
        lines.push("");
      }

      if (tr.errors.length > 0) {
        lines.push(`**Errors:** ${tr.errors.join("; ")}`);
        lines.push("");
      }
    }

    // Cross-browser comparison for this test
    const valueSets = allResults.map((br) => {
      const tr = br.results[i];
      return tr ? tr.values : [];
    });

    const allSame = valueSets.every(
      (vs) => JSON.stringify(vs.map((v) => v?.toFixed(6))) === JSON.stringify(valueSets[0]?.map((v) => v?.toFixed(6)))
    );

    if (!allSame) {
      lines.push("#### ⚠️ Cross-Browser Difference Detected");
      lines.push("");
      for (let j = 0; j < allResults.length; j++) {
        lines.push(
          `- **${allResults[j]!.browser}**: ${valueSets[j]!.map((v) => v?.toFixed(6)).join(", ") || "ERROR"}`
        );
      }
      lines.push("");
    } else {
      lines.push("#### ✅ All browsers agree");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function generateDifferencesReport(allResults: BrowserResults[]): string {
  const lines: string[] = [];
  lines.push("# Web Audio AudioParam: Key Browser Differences");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("This report highlights **only the tests where browsers differ** in behavior.");
  lines.push("");

  let diffCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i]!.name;
    const browserLogs: { name: string; logs: string[]; values: number[]; errors: string[] }[] = [];

    for (const br of allResults) {
      const tr = br.results[i];
      browserLogs.push({
        name: br.browser,
        logs: tr?.logs ?? [],
        values: tr?.values ?? [],
        errors: tr?.errors ?? [],
      });
    }

    // Compare values
    const valueStrs = browserLogs.map((bl) =>
      bl.values.length > 0 ? bl.values.map((v) => v?.toFixed(6)).join(",") : "ERROR"
    );
    const logStrs = browserLogs.map((bl) => bl.logs.join(" | "));

    const valuesMatch = valueStrs.every((v) => v === valueStrs[0]);
    const logsMatch = logStrs.every((l) => l === logStrs[0]);

    if (!valuesMatch || !logsMatch) {
      diffCount++;
      lines.push(`## ${testName}`);
      lines.push("");

      for (const bl of browserLogs) {
        lines.push(`### ${bl.name}`);
        lines.push("");
        if (bl.logs.length > 0) {
          lines.push("```");
          for (const log of bl.logs) lines.push(log);
          lines.push("```");
        }
        if (bl.values.length > 0) {
          lines.push(`**Values:** ${bl.values.map((v) => v?.toFixed(6)).join(", ")}`);
        }
        if (bl.errors.length > 0) {
          lines.push(`**Errors:** ${bl.errors.join("; ")}`);
        }
        lines.push("");
      }

      // Analysis
      lines.push("### Analysis");
      lines.push("");
      if (!valuesMatch) {
        lines.push("**Value difference:**");
        for (let j = 0; j < browserLogs.length; j++) {
          lines.push(`- ${browserLogs[j]!.name}: ${valueStrs[j]}`);
        }
        lines.push("");
      }
      if (!logsMatch) {
        lines.push("**Behavioral difference (logs):**");
        for (let j = 0; j < browserLogs.length; j++) {
          lines.push(`- ${browserLogs[j]!.name}: ${logStrs[j]}`);
        }
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    }
  }

  if (diffCount === 0) {
    lines.push("**No differences detected across all tests!**");
  } else {
    lines.push(`**Total tests with differences: ${diffCount} out of ${tests.length}**`);
  }

  return lines.join("\n");
}

function generateJsonReport(allResults: BrowserResults[]): string {
  return JSON.stringify(allResults, null, 2);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const allResults: BrowserResults[] = [];

  // Run in all three browsers
  const browsers: [BrowserType, string][] = [
    [chromium, "Chromium"],
    [firefox, "Firefox"],
    [webkit, "WebKit (Safari)"],
  ];

  for (const [bt, name] of browsers) {
    try {
      const result = await runTestsInBrowser(bt, name);
      allResults.push(result);
    } catch (err: any) {
      console.error(`Failed to run tests in ${name}: ${err.message}`);
    }
  }

  // Generate reports
  const fullReport = generateMarkdownReport(allResults);
  const diffsReport = generateDifferencesReport(allResults);
  const jsonReport = generateJsonReport(allResults);

  await Bun.write("reports/full-comparison.md", fullReport);
  await Bun.write("reports/differences-only.md", diffsReport);
  await Bun.write("reports/raw-results.json", jsonReport);

  console.log("\n\nReports written to:");
  console.log("  reports/full-comparison.md");
  console.log("  reports/differences-only.md");
  console.log("  reports/raw-results.json");
}

main().catch(console.error);
