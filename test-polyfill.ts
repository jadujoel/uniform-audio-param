import { chromium, firefox, webkit, type BrowserType } from "playwright";

/**
 * Test the polyfill by injecting it into each browser and re-running
 * the cancelAndHoldAtTime tests plus other behavioral normalization checks.
 */

const polyfillCode = await Bun.file("dist/audio-param-polyfill.js").text();

interface TestResult {
  testName: string;
  values: number[];
  logs: string[];
  errors: string[];
}

interface BrowserResults {
  browser: string;
  version: string;
  results: TestResult[];
}

const tests: { name: string; code: string }[] = [
  // ── cancelAndHoldAtTime tests (the main polyfill target) ──
  {
    name: "1. cancelAndHoldAtTime - linear ramp hold at 0.5",
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
        logs.push("cancelAndHoldAtTime: ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "2. cancelAndHoldAtTime - exponential ramp",
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
        logs.push("cancelAndHoldAtTime: ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "3. cancelAndHoldAtTime - setTargetAtTime",
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
        logs.push("cancelAndHoldAtTime: ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "4. cancelAndHoldAtTime - setValueCurveAtTime",
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
        logs.push("cancelAndHoldAtTime: ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "5. cancelAndHoldAtTime then new linearRamp",
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
        gain.gain.linearRampToValueAtTime(0.0, 0.75);
        logs.push("cancelAndHold + new ramp: ok");
      } catch(e) {
        logs.push("Error: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "6. Double cancelAndHoldAtTime",
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
        logs.push("Double cancelAndHold: ok");
      } catch(e) {
        logs.push("Double cancelAndHold error: " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "7. cancelAndHoldAtTime at time 0",
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
        logs.push("cancelAndHoldAtTime(0): ok");
      } catch(e) {
        logs.push("cancelAndHoldAtTime(0): " + e.message);
      }
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "8. cancelAndHoldAtTime sample-accurate (ConstantSource)",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 1.0);
      try {
        cs.offset.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHold at 0.5s: ok");
      } catch(e) {
        logs.push("cancelAndHold error: " + e.message);
      }
      cs.connect(ctx.destination);
      cs.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const checkPoints = [0.25, 0.5, 0.75, 1.0];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s sample[" + i + "] = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`,
  },
  {
    name: "9. cancelAndHoldAtTime after events finished",
    code: `(async () => {
      const sampleRate = 48000;
      const logs = [];
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.0, 0);
      cs.offset.linearRampToValueAtTime(1.0, 0.25);
      try {
        cs.offset.cancelAndHoldAtTime(0.5);
        logs.push("cancelAndHold after ramp ends: ok");
      } catch(e) {
        logs.push("Error: " + e.message);
      }
      cs.connect(ctx.destination);
      cs.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const checkPoints = [0.1, 0.25, 0.5, 0.75];
      for (const t of checkPoints) {
        const i = Math.min(Math.floor(t * sampleRate), data.length - 1);
        logs.push("t=" + t + "s = " + data[i].toFixed(6));
      }
      return { values: checkPoints.map(t => data[Math.min(Math.floor(t * sampleRate), data.length - 1)]), logs };
    })()`,
  },
  // ── Other normalization tests ──
  {
    name: "10. Basic scheduling still works with polyfill",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 0.5);
      logs.push("Scheduled ramp 0->1 over 0.5s");
      osc.start();
      await ctx.startRendering();
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "11. cancelScheduledValues still works with polyfill",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      const logs = [];
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      gain.gain.cancelScheduledValues(0.5);
      osc.start();
      await ctx.startRendering();
      logs.push("Final value after cancel at 0.5: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "12. setTargetAtTime still works with polyfill",
    code: `(async () => {
      const sampleRate = 48000;
      const ctx = new OfflineAudioContext(1, sampleRate, sampleRate);
      const cs = ctx.createConstantSource();
      cs.offset.setValueAtTime(0.0, 0);
      cs.offset.setTargetAtTime(1.0, 0.0, 0.1);
      cs.connect(ctx.destination);
      cs.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const logs = [];
      const i = Math.floor(0.5 * sampleRate);
      logs.push("t=0.5s value: " + data[i].toFixed(6) + " (expected ~0.993262)");
      return { values: [data[i]], logs };
    })()`,
  },
  {
    name: "13. setValueCurveAtTime still works with polyfill",
    code: `(async () => {
      const sampleRate = 48000;
      const ctx = new OfflineAudioContext(1, sampleRate / 2, sampleRate);
      const cs = ctx.createConstantSource();
      const curve = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
      cs.offset.setValueCurveAtTime(curve, 0, 0.5);
      cs.connect(ctx.destination);
      cs.start();
      const buffer = await ctx.startRendering();
      const data = buffer.getChannelData(0);
      const logs = [];
      const midIdx = Math.floor(data.length / 2);
      logs.push("Mid curve value: " + data[midIdx].toFixed(6) + " (expected ~0.5)");
      logs.push("End curve value: " + data[data.length - 1].toFixed(6) + " (expected ~1.0)");
      return { values: [data[midIdx], data[data.length - 1]], logs };
    })()`,
  },
  {
    name: "14. exponentialRamp still works with polyfill",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.01, 0);
      gain.gain.exponentialRampToValueAtTime(1.0, 0.5);
      osc.start();
      await ctx.startRendering();
      const logs = [];
      logs.push("Final value: " + gain.gain.value);
      return { values: [gain.gain.value], logs };
    })()`,
  },
  {
    name: "15. getScheduledValueAtTime (bonus helper)",
    code: `(async () => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0, 0);
      gain.gain.linearRampToValueAtTime(1.0, 1.0);
      const logs = [];
      if (typeof gain.gain.getScheduledValueAtTime === 'function') {
        const v25 = gain.gain.getScheduledValueAtTime(0.25);
        const v50 = gain.gain.getScheduledValueAtTime(0.5);
        const v75 = gain.gain.getScheduledValueAtTime(0.75);
        logs.push("t=0.25: " + v25.toFixed(4));
        logs.push("t=0.50: " + v50.toFixed(4));
        logs.push("t=0.75: " + v75.toFixed(4));
        return { values: [v25, v50, v75], logs };
      } else {
        logs.push("getScheduledValueAtTime not available");
        return { values: [], logs };
      }
    })()`,
  },
];

// ─── Runner ──────────────────────────────────────────────────────────────────

async function runTestsInBrowser(
  browserType: BrowserType,
  browserName: string,
  injectPolyfill: boolean
): Promise<BrowserResults> {
  const mode = injectPolyfill ? "WITH polyfill" : "WITHOUT polyfill";
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${browserName} — ${mode}`);
  console.log("=".repeat(60));

  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("pageerror", (err) => console.log(`  [pageerror] ${err.message}`));

  await page.setContent("<html><body></body></html>");

  if (injectPolyfill) {
    await page.evaluate(polyfillCode);
  }

  const version = browser.version();
  const results: TestResult[] = [];

  for (const test of tests) {
    const testErrors: string[] = [];
    const errHandler = (msg: any) => {
      if (msg.type() === "error") testErrors.push(msg.text());
    };
    page.on("console", errHandler);

    try {
      const result = (await page.evaluate(test.code)) as {
        values: number[];
        logs: string[];
      };
      results.push({
        testName: test.name,
        values: result.values,
        logs: result.logs,
        errors: testErrors,
      });
      console.log(`  ✓ ${test.name}`);
      for (const log of result.logs) {
        console.log(`    ${log}`);
      }
    } catch (err: any) {
      results.push({
        testName: test.name,
        values: [],
        logs: [`EXCEPTION: ${err.message}`],
        errors: [...testErrors, err.message],
      });
      console.log(`  ✗ ${test.name}: ${err.message}`);
    }

    page.removeListener("console", errHandler);
  }

  await browser.close();
  return { browser: `${browserName} (${mode})`, version, results };
}

// ─── Report ──────────────────────────────────────────────────────────────────

function generateReport(
  withoutPolyfill: BrowserResults[],
  withPolyfill: BrowserResults[]
): string {
  const lines: string[] = [];
  lines.push("# AudioParam Polyfill Validation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Test Setup");
  lines.push("");
  lines.push(
    "Each test is run in Chromium, Firefox, and WebKit — first **without** the polyfill, then **with** the polyfill injected."
  );
  lines.push("");

  // Per-test comparison
  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i]!.name;
    lines.push(`## ${testName}`);
    lines.push("");

    // Table header
    lines.push("| Browser | Without Polyfill | With Polyfill | Match? |");
    lines.push("| --- | --- | --- | --- |");

    const polyfillValues: string[] = [];

    for (let b = 0; b < 3; b++) {
      const wo = withoutPolyfill[b]!.results[i]!;
      const wi = withPolyfill[b]!.results[i]!;
      const browserName = withoutPolyfill[b]!.browser.split(" (")[0];

      const woVal =
        wo.values.length > 0
          ? wo.values.map((v) => v?.toFixed(6)).join(", ")
          : wo.logs.join("; ");
      const wiVal =
        wi.values.length > 0
          ? wi.values.map((v) => v?.toFixed(6)).join(", ")
          : wi.logs.join("; ");

      polyfillValues.push(wiVal);

      const match = woVal === wiVal ? "—" : wiVal === polyfillValues[0] ? "✅ Fixed" : "⚠️";
      lines.push(`| ${browserName} | ${woVal} | ${wiVal} | ${match} |`);
    }

    // Check if all polyfill values match
    const allMatch = polyfillValues.every((v) => v === polyfillValues[0]);
    lines.push("");
    if (allMatch) {
      lines.push("**Result: ✅ All browsers produce identical output with polyfill.**");
    } else {
      lines.push("**Result: ⚠️ Browsers still differ (see values above).**");
      lines.push("");
      for (let b = 0; b < 3; b++) {
        const wi = withPolyfill[b]!.results[i]!;
        const browserName = withoutPolyfill[b]!.browser.split(" (")[0];
        if (wi.logs.length > 0) {
          lines.push(`**${browserName} logs:** ${wi.logs.join(" | ")}`);
        }
      }
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Summary
  lines.push("## Summary");
  lines.push("");
  let fixed = 0;
  let alreadyOk = 0;
  let stillDiff = 0;

  for (let i = 0; i < tests.length; i++) {
    const woVals = withoutPolyfill.map((br) => {
      const r = br.results[i]!;
      return r.values.length > 0
        ? r.values.map((v) => v?.toFixed(6)).join(",")
        : r.logs.join(";");
    });
    const wiVals = withPolyfill.map((br) => {
      const r = br.results[i]!;
      return r.values.length > 0
        ? r.values.map((v) => v?.toFixed(6)).join(",")
        : r.logs.join(";");
    });

    const woMatch = woVals.every((v) => v === woVals[0]);
    const wiMatch = wiVals.every((v) => v === wiVals[0]);

    if (woMatch && wiMatch) alreadyOk++;
    else if (!woMatch && wiMatch) fixed++;
    else stillDiff++;
  }

  lines.push(`| Metric | Count |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Already consistent (no polyfill needed) | ${alreadyOk} |`);
  lines.push(`| **Fixed by polyfill** | **${fixed}** |`);
  lines.push(`| Still differs (cannot polyfill) | ${stillDiff} |`);
  lines.push(`| Total tests | ${tests.length} |`);
  lines.push("");

  if (stillDiff > 0) {
    lines.push("### Remaining Differences");
    lines.push("");
    lines.push("Some differences cannot be polyfilled at the JavaScript level:");
    lines.push("");
    lines.push("- **`automationRate` k-rate**: Firefox ignores it — this is an engine-internal optimization");
    lines.push("- **`.value` getter timing**: Firefox returns actual current value; Chromium/WebKit preview scheduled values");
    lines.push("- **Floating-point precision**: Minor numerical differences in `setTargetAtTime` across engines");
    lines.push("- **`minValue`/`maxValue`**: Read-only properties reflecting engine internals");
  }

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const browserTypes: [BrowserType, string][] = [
    [chromium, "Chromium"],
    [firefox, "Firefox"],
    [webkit, "WebKit"],
  ];

  const withoutPolyfill: BrowserResults[] = [];
  const withPolyfill: BrowserResults[] = [];

  for (const [bt, name] of browserTypes) {
    try {
      const wo = await runTestsInBrowser(bt, name, false);
      withoutPolyfill.push(wo);
    } catch (err: any) {
      console.error(`Failed (no polyfill) ${name}: ${err.message}`);
    }
  }

  for (const [bt, name] of browserTypes) {
    try {
      const wi = await runTestsInBrowser(bt, name, true);
      withPolyfill.push(wi);
    } catch (err: any) {
      console.error(`Failed (polyfill) ${name}: ${err.message}`);
    }
  }

  const report = generateReport(withoutPolyfill, withPolyfill);
  await Bun.write("reports/polyfill-validation.md", report);
  await Bun.write(
    "reports/polyfill-raw.json",
    JSON.stringify({ withoutPolyfill, withPolyfill }, null, 2)
  );

  console.log("\n\nReports written:");
  console.log("  reports/polyfill-validation.md");
  console.log("  reports/polyfill-raw.json");
}

main().catch(console.error);
