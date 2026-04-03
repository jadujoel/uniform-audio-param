import { test, expect, beforeAll, afterAll } from "bun:test";
import { firefox, type Browser, type Page } from "playwright";

let browser: Browser;
let page: Page;
let polyfillCode: string;

beforeAll(async () => {
  polyfillCode = await Bun.file("dist/audio-param-polyfill.js").text();
  browser = await firefox.launch({ headless: true });
  const context = await browser.newContext();
  page = await context.newPage();
  await page.setContent("<html><body></body></html>");
  await page.evaluate(polyfillCode);
});

afterAll(async () => {
  await browser?.close();
});

// ─── cancelAndHoldAtTime existence ─────────────────────────────────────────

test("cancelAndHoldAtTime is available after polyfill", async () => {
  const available = await page.evaluate(() => {
    const ctx = new OfflineAudioContext(1, 128, 48000);
    const gain = ctx.createGain();
    return typeof gain.gain.cancelAndHoldAtTime === "function";
  });
  expect(available).toBe(true);
});

// ─── cancelAndHoldAtTime during linear ramp ────────────────────────────────

test("cancelAndHoldAtTime holds value mid linear ramp", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.linearRampToValueAtTime(1.0, 1.0);
    cs.offset.cancelAndHoldAtTime(0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    // Value at 0.25s should be ~0.25 (still ramping)
    const at025 = data[Math.floor(0.25 * sampleRate)]!;
    // Value at 0.5s should be ~0.5 (held)
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    // Value at 0.75s should still be ~0.5 (held, not continuing ramp)
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    return { at025, at050, at075 };
  });
  expect(result.at025).toBeCloseTo(0.25, 1);
  expect(result.at050).toBeCloseTo(0.5, 1);
  expect(result.at075).toBeCloseTo(0.5, 1);
});

// ─── cancelAndHoldAtTime during exponential ramp ───────────────────────────

test("cancelAndHoldAtTime holds value mid exponential ramp", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.01, 0);
    cs.offset.exponentialRampToValueAtTime(1.0, 1.0);
    cs.offset.cancelAndHoldAtTime(0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    // Expected hold value: 0.01 * (1.0/0.01)^0.5 = 0.01 * 100^0.5 = 0.1
    return { at050, at075 };
  });
  expect(result.at050).toBeCloseTo(0.1, 1);
  // After hold, value should stay at the held value
  expect(result.at075).toBeCloseTo(result.at050, 1);
});

// ─── cancelAndHoldAtTime during setTargetAtTime ────────────────────────────

test("cancelAndHoldAtTime holds value mid setTargetAtTime", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.setTargetAtTime(1.0, 0.0, 0.1);
    cs.offset.cancelAndHoldAtTime(0.3);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    // At 0.3s with target=1, start=0, tc=0.1: value ≈ 1 - e^(-0.3/0.1) ≈ 0.9502
    const at030 = data[Math.floor(0.3 * sampleRate)]!;
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    return { at030, at075 };
  });
  expect(result.at030).toBeCloseTo(0.95, 1);
  // Value should be held constant after cancelAndHoldAtTime
  expect(result.at075).toBeCloseTo(result.at030, 1);
});

// ─── cancelAndHoldAtTime during setValueCurveAtTime ────────────────────────

test("cancelAndHoldAtTime holds value mid setValueCurveAtTime", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    const curve = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
    cs.offset.setValueCurveAtTime(curve, 0, 1.0);
    cs.offset.cancelAndHoldAtTime(0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    return { at050, at075 };
  });
  expect(result.at050).toBeCloseTo(0.5, 1);
  // Should hold at ~0.5 after cancel
  expect(result.at075).toBeCloseTo(result.at050, 1);
});

// ─── cancelAndHoldAtTime then schedule new ramp ────────────────────────────

test("cancelAndHoldAtTime allows scheduling new automation after hold", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.linearRampToValueAtTime(1.0, 1.0);
    cs.offset.cancelAndHoldAtTime(0.25);
    // Schedule new ramp back down to 0
    cs.offset.linearRampToValueAtTime(0.0, 0.75);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at025 = data[Math.floor(0.25 * sampleRate)]!;
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    return { at025, at075 };
  });
  // At 0.25s should be ~0.25 (held from linear ramp)
  expect(result.at025).toBeCloseTo(0.25, 1);
  // At 0.75s should be ~0.0 (new ramp completed)
  expect(result.at075).toBeCloseTo(0.0, 1);
});

// ─── Double cancelAndHoldAtTime ────────────────────────────────────────────

test("double cancelAndHoldAtTime works correctly", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.linearRampToValueAtTime(1.0, 1.0);
    cs.offset.cancelAndHoldAtTime(0.25);
    cs.offset.linearRampToValueAtTime(0.8, 0.75);
    cs.offset.cancelAndHoldAtTime(0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    const at075 = data[Math.floor(0.75 * sampleRate)]!;
    return { at050, at075 };
  });
  // Value at 0.5 should be held
  // Value at 0.75 should equal value at 0.5 (held constant)
  expect(result.at075).toBeCloseTo(result.at050, 2);
});

// ─── Basic scheduling still works ──────────────────────────────────────────

test("linearRampToValueAtTime still works with polyfill", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.linearRampToValueAtTime(1.0, 0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at025 = data[Math.floor(0.25 * sampleRate)]!;
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    return { at025, at050 };
  });
  expect(result.at025).toBeCloseTo(0.5, 1);
  expect(result.at050).toBeCloseTo(1.0, 1);
});

test("exponentialRampToValueAtTime still works with polyfill", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.01, 0);
    cs.offset.exponentialRampToValueAtTime(1.0, 1.0);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const atEnd = data[sampleRate - 1]!;
    return { atEnd };
  });
  expect(result.atEnd).toBeCloseTo(1.0, 1);
});

test("setTargetAtTime still works with polyfill", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.setTargetAtTime(1.0, 0.0, 0.1);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    // At 0.5s: value ≈ 1 - e^(-5) ≈ 0.9933
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    return { at050 };
  });
  expect(result.at050).toBeCloseTo(0.9933, 2);
});

test("setValueCurveAtTime still works with polyfill", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate / 2, sampleRate);
    const cs = ctx.createConstantSource();
    const curve = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
    cs.offset.setValueCurveAtTime(curve, 0, 0.5);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const mid = data[Math.floor(data.length / 2)]!;
    const end = data[data.length - 1]!;
    return { mid, end };
  });
  expect(result.mid).toBeCloseTo(0.5, 1);
  expect(result.end).toBeCloseTo(1.0, 1);
});

test("cancelScheduledValues still works with polyfill", async () => {
  const result = await page.evaluate(async () => {
    const sampleRate = 48000;
    const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
    const cs = ctx.createConstantSource();
    cs.offset.setValueAtTime(0.0, 0);
    cs.offset.linearRampToValueAtTime(1.0, 1.0);
    cs.offset.cancelScheduledValues(0.0);
    // After cancelling everything, value should stay at default
    cs.offset.setValueAtTime(0.42, 0);
    cs.connect(ctx.destination);
    cs.start();
    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    const at050 = data[Math.floor(0.5 * sampleRate)]!;
    return { at050 };
  });
  expect(result.at050).toBeCloseTo(0.42, 2);
});

// ─── getScheduledValueAtTime helper ────────────────────────────────────────

test("getScheduledValueAtTime computes correct values for linear ramp", async () => {
  const result = await page.evaluate(() => {
    const ctx = new OfflineAudioContext(1, 128, 48000);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0, 0);
    gain.gain.linearRampToValueAtTime(1.0, 1.0);
    return {
      at000: gain.gain.getScheduledValueAtTime(0.0),
      at025: gain.gain.getScheduledValueAtTime(0.25),
      at050: gain.gain.getScheduledValueAtTime(0.5),
      at075: gain.gain.getScheduledValueAtTime(0.75),
      at100: gain.gain.getScheduledValueAtTime(1.0),
    };
  });
  expect(result.at000).toBeCloseTo(0.0, 4);
  expect(result.at025).toBeCloseTo(0.25, 4);
  expect(result.at050).toBeCloseTo(0.5, 4);
  expect(result.at075).toBeCloseTo(0.75, 4);
  expect(result.at100).toBeCloseTo(1.0, 4);
});
