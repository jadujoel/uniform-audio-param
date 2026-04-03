import { describe, test, expect, beforeAll, afterAll, setDefaultTimeout } from "bun:test";
import { chromium, firefox, webkit, type Browser, type BrowserType, type Page } from "playwright";

setDefaultTimeout(30_000);

const polyfillCode = await Bun.file("dist/audio-param-polyfill.js").text();

/**
 * Injects the polyfill, forcing it to apply even in browsers that already
 * have cancelAndHoldAtTime natively by deleting the native method first.
 */
const forcePolyfillCode = `
  delete AudioParam.prototype.cancelAndHoldAtTime;
  ${polyfillCode}
`;

// Launch browsers sequentially upfront to avoid concurrency issues in bun test
const browsers: { name: string; browser: Browser; page: Page }[] = [];
for (const [name, type] of [["Chromium", chromium], ["Firefox", firefox], ["WebKit", webkit]] as [string, BrowserType][]) {
  const browser = await type.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent("<html><body></body></html>");
  await page.evaluate(forcePolyfillCode);
  browsers.push({ name, browser, page });
}

afterAll(async () => {
  for (const { browser } of browsers) {
    await browser.close();
  }
});

function tests(getPage: () => Page) {
  let page: Page;

  beforeAll(() => {
    page = getPage();
  });

  // ── Polyfill presence ────────────────────────────────────────────────

  test("cancelAndHoldAtTime exists after polyfill", async () => {
    const exists = await page.evaluate(() =>
      typeof new OfflineAudioContext(1, 128, 48000).createGain().gain.cancelAndHoldAtTime === "function"
    );
    expect(exists).toBe(true);
  });

  test("getScheduledValueAtTime exists after polyfill", async () => {
    const exists = await page.evaluate(() =>
      typeof (new OfflineAudioContext(1, 128, 48000).createGain().gain as any).getScheduledValueAtTime === "function"
    );
    expect(exists).toBe(true);
  });

  // ── Wrapped methods still work correctly ─────────────────────────────

  test("setValueAtTime produces correct output", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.73, 0);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[Math.floor(sr / 2)]!;
    });
    expect(val).toBeCloseTo(0.73, 2);
  });

  test("linearRampToValueAtTime produces correct output", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at025: d[Math.floor(0.25 * sr)]!,
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
        at100: d[sr - 1]!,
      };
    });
    expect(result.at025).toBeCloseTo(0.25, 1);
    expect(result.at050).toBeCloseTo(0.50, 1);
    expect(result.at075).toBeCloseTo(0.75, 1);
    expect(result.at100).toBeCloseTo(1.0, 1);
  });

  test("exponentialRampToValueAtTime produces correct output", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.01, 0);
      cs.offset.exponentialRampToValueAtTime(1.0, 1.0);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[sr - 1]!;
    });
    expect(val).toBeCloseTo(1.0, 1);
  });

  test("setTargetAtTime produces correct output", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.setTargetAtTime(1.0, 0, 0.1);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[Math.floor(0.5 * sr)]!;
    });
    // After 5 time constants (0.5s / 0.1), should be ~1 - e^(-5) ≈ 0.9933
    expect(val).toBeCloseTo(0.9933, 2);
  });

  test("setValueCurveAtTime produces correct output", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr / 2, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueCurveAtTime(new Float32Array([0, 0.5, 1.0]), 0, 0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return { mid: d[Math.floor(d.length / 2)]!, end: d[d.length - 1]! };
    });
    expect(result.mid).toBeCloseTo(0.5, 1);
    expect(result.end).toBeCloseTo(1.0, 1);
  });

  test("cancelScheduledValues clears automation", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      cs.offset.cancelScheduledValues(0);
      cs.offset.setValueAtTime(0.42, 0);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[Math.floor(0.5 * sr)]!;
    });
    expect(val).toBeCloseTo(0.42, 2);
  });

  // ── cancelAndHoldAtTime core behavior ────────────────────────────────

  test("holds value mid linear ramp", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      cs.offset.cancelAndHoldAtTime(0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at025: d[Math.floor(0.25 * sr)]!,
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    // Ramp from 0→1 over 1s, held at 0.5s → value should be 0.5
    expect(result.at025).toBeCloseTo(0.25, 1);
    expect(result.at050).toBeCloseTo(0.50, 1);
    // After hold, value stays at 0.5
    expect(result.at075).toBeCloseTo(0.50, 1);
  });

  test("holds value mid exponential ramp", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.01, 0);
      cs.offset.exponentialRampToValueAtTime(1.0, 1.0);
      cs.offset.cancelAndHoldAtTime(0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    // Exponential ramp from 0.01→1.0: at 0.5s = 0.01 * (100)^0.5 = 0.1
    expect(result.at050).toBeCloseTo(0.1, 1);
    expect(result.at075).toBeCloseTo(result.at050, 1);
  });

  test("holds value mid setTargetAtTime", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.setTargetAtTime(1.0, 0, 0.1);
      cs.offset.cancelAndHoldAtTime(0.3);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at030: d[Math.floor(0.30 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    // setTarget with timeConstant=0.1 at 0.3s: 1 - e^(-3) ≈ 0.9502
    expect(result.at030).toBeCloseTo(0.95, 1);
    expect(result.at075).toBeCloseTo(result.at030, 1);
  });

  test("holds value mid setValueCurveAtTime", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueCurveAtTime(new Float32Array([0, 0.25, 0.5, 0.75, 1.0]), 0, 1.0);
      cs.offset.cancelAndHoldAtTime(0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    expect(result.at050).toBeCloseTo(0.50, 1);
    expect(result.at075).toBeCloseTo(result.at050, 1);
  });

  // ── Scheduling after hold ────────────────────────────────────────────

  test("new automation works after cancelAndHoldAtTime", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      // Hold at 0.25 → value = 0.25
      cs.offset.cancelAndHoldAtTime(0.25);
      // Then ramp back down to 0 by 0.75
      cs.offset.linearRampToValueAtTime(0, 0.75);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at025: d[Math.floor(0.25 * sr)]!,
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    expect(result.at025).toBeCloseTo(0.25, 1);
    // Midpoint of ramp from 0.25→0 over 0.25→0.75: at 0.5 should be 0.125
    expect(result.at050).toBeCloseTo(0.125, 1);
    expect(result.at075).toBeCloseTo(0.0, 1);
  });

  test("double cancelAndHoldAtTime works", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      cs.offset.cancelAndHoldAtTime(0.25);
      // Schedule another ramp, then cancel again
      cs.offset.linearRampToValueAtTime(0.8, 0.75);
      cs.offset.cancelAndHoldAtTime(0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      return {
        at050: d[Math.floor(0.50 * sr)]!,
        at075: d[Math.floor(0.75 * sr)]!,
      };
    });
    // After second hold, value should be constant from 0.5 onward
    expect(result.at075).toBeCloseTo(result.at050, 2);
  });

  // ── getScheduledValueAtTime ──────────────────────────────────────────

  test("getScheduledValueAtTime matches linear ramp trajectory", async () => {
    const result = await page.evaluate(() => {
      const ctx = new OfflineAudioContext(1, 128, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      return {
        at000: (gain.gain as any).getScheduledValueAtTime(0),
        at025: (gain.gain as any).getScheduledValueAtTime(0.25),
        at050: (gain.gain as any).getScheduledValueAtTime(0.5),
        at075: (gain.gain as any).getScheduledValueAtTime(0.75),
        at100: (gain.gain as any).getScheduledValueAtTime(1.0),
      };
    });
    expect(result.at000).toBeCloseTo(0.0, 4);
    expect(result.at025).toBeCloseTo(0.25, 4);
    expect(result.at050).toBeCloseTo(0.5, 4);
    expect(result.at075).toBeCloseTo(0.75, 4);
    expect(result.at100).toBeCloseTo(1.0, 4);
  });

  test("getScheduledValueAtTime matches exponential ramp trajectory", async () => {
    const result = await page.evaluate(() => {
      const ctx = new OfflineAudioContext(1, 128, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, 0);
      gain.gain.exponentialRampToValueAtTime(1.0, 1.0);
      return {
        at050: (gain.gain as any).getScheduledValueAtTime(0.5),
        at100: (gain.gain as any).getScheduledValueAtTime(1.0),
      };
    });
    // 0.01 * (100)^0.5 = 0.1
    expect(result.at050).toBeCloseTo(0.1, 4);
    expect(result.at100).toBeCloseTo(1.0, 4);
  });

  test("getScheduledValueAtTime matches setTargetAtTime trajectory", async () => {
    const result = await page.evaluate(() => {
      const ctx = new OfflineAudioContext(1, 128, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.setTargetAtTime(1.0, 0, 0.1);
      return {
        at050: (gain.gain as any).getScheduledValueAtTime(0.5),
      };
    });
    expect(result.at050).toBeCloseTo(0.9933, 3);
  });

  test("getScheduledValueAtTime matches setValueCurveAtTime trajectory", async () => {
    const result = await page.evaluate(() => {
      const ctx = new OfflineAudioContext(1, 128, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueCurveAtTime(new Float32Array([0, 0.5, 1.0]), 0, 1.0);
      return {
        at050: (gain.gain as any).getScheduledValueAtTime(0.5),
        at100: (gain.gain as any).getScheduledValueAtTime(1.0),
      };
    });
    expect(result.at050).toBeCloseTo(0.5, 2);
    expect(result.at100).toBeCloseTo(1.0, 2);
  });

  // ── Polyfill matches native (only in browsers that have native) ──────

  test("polyfill output matches native cancelAndHoldAtTime output", async () => {
    const result = await page.evaluate(async () => {
      const sr = 48000;

      // Render with polyfill (already applied)
      const ctx1 = new OfflineAudioContext(1, sr, sr);
      const cs1 = ctx1.createConstantSource();
      cs1.offset.setValueAtTime(0, 0);
      cs1.offset.linearRampToValueAtTime(1.0, 1.0);
      cs1.offset.cancelAndHoldAtTime(0.5);
      cs1.connect(ctx1.destination);
      cs1.start();
      const buf1 = await ctx1.startRendering();
      const d1 = buf1.getChannelData(0);

      // Sample at key points
      return {
        before: d1[Math.floor(0.25 * sr)]!,
        atHold: d1[Math.floor(0.50 * sr)]!,
        after1: d1[Math.floor(0.75 * sr)]!,
        after2: d1[sr - 1]!,
      };
    });

    // Before hold: ramp should be at 0.25
    expect(result.before).toBeCloseTo(0.25, 1);
    // At hold point: ramp should be at 0.5
    expect(result.atHold).toBeCloseTo(0.5, 1);
    // After hold: value should stay at 0.5
    expect(result.after1).toBeCloseTo(0.5, 1);
    expect(result.after2).toBeCloseTo(0.5, 1);
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  test("cancelAndHoldAtTime at time 0 holds default value", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      cs.offset.cancelAndHoldAtTime(0);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[Math.floor(0.5 * sr)]!;
    });
    expect(val).toBeCloseTo(0, 1);
  });

  test("cancelAndHoldAtTime after ramp ends holds final value", async () => {
    const val = await page.evaluate(async () => {
      const sr = 48000;
      const ctx = new OfflineAudioContext(1, sr, sr);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 0.25);
      cs.offset.cancelAndHoldAtTime(0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buf = await ctx.startRendering();
      return buf.getChannelData(0)[Math.floor(0.75 * sr)]!;
    });
    expect(val).toBeCloseTo(1.0, 1);
  });

  test("cancelAndHoldAtTime returns the AudioParam for chaining", async () => {
    const isParam = await page.evaluate(() => {
      const ctx = new OfflineAudioContext(1, 128, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      const ret = gain.gain.cancelAndHoldAtTime(0);
      return ret === gain.gain;
    });
    expect(isParam).toBe(true);
  });
}

for (const entry of browsers) {
  describe(`${entry.name} (forced polyfill)`, () => tests(() => entry.page));
}
