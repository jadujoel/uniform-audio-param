# Web Audio API `AudioParam` Cross-Browser Behavior Analysis

**Generated:** 2026-04-03
**Browsers tested:** Chromium (Playwright), Firefox (Playwright), WebKit/Safari (Playwright)
**Method:** OfflineAudioContext-based tests with sample-accurate capture via Playwright across real browser engines.

---

## Executive Summary

Out of 34 tests, **25 showed some level of cross-browser difference**. However, many differences are cosmetic (error message wording, floating-point precision). The truly impactful behavioral differences fall into these categories:

| Category | Severity | Description |
|---|---|---|
| `cancelAndHoldAtTime` not implemented in Firefox | 🔴 Critical | Firefox does not implement this method at all |
| `.value` getter before rendering | 🟡 Medium | Firefox returns pre-schedule value; Chromium/WebKit return last-scheduled value |
| `automationRate` k-rate | 🟡 Medium | Firefox ignores k-rate, treats as a-rate |
| `setTargetAtTime` precision at long durations | 🟢 Low | Chromium diverges slightly at t=1s (diff ~0.0001) |
| `minValue`/`maxValue` ranges | 🟡 Medium | Firefox uses unclamped FLT_MAX for detune, biquad gain, biquad frequency min |
| Performance | 🟢 Info | Chromium is ~14x faster at scheduling/rendering 10k events |

---

## 1. 🔴 `cancelAndHoldAtTime` — Not Implemented in Firefox

This is the single biggest cross-browser incompatibility. Firefox (148.0) throws:

```
TypeError: gain.gain.cancelAndHoldAtTime is not a function
```

**Impact:** Any code using `cancelAndHoldAtTime` will crash in Firefox.

| Test | Chromium | Firefox | WebKit |
|---|---|---|---|
| cancelAndHold + linear ramp | Holds at 0.5 ✅ | ❌ Not a function | Holds at 0.5 ✅ |
| cancelAndHold + exponential ramp | Holds at 0.1 ✅ | ❌ Not a function | Holds at 0.1 ✅ |
| cancelAndHold + setTargetAtTime | Holds at ~0.950 ✅ | ❌ Not a function | Holds at ~0.950 ✅ |
| cancelAndHold + setValueCurve | Holds at 0.5 ✅ | ❌ Not a function | Holds at 0.5 ✅ |
| cancelAndHold then new ramp | Works, ends at 0.0 ✅ | ❌ Not a function | Works, ends at 0.0 ✅ |
| Double cancelAndHold | Holds at 0.525 ✅ | ❌ Not a function | Holds at 0.525 ✅ |
| cancelAndHold at time 0 | Holds at 0.0 ✅ | ❌ Not a function | Holds at 0.0 ✅ |

**Workaround:** For Firefox, use `cancelScheduledValues()` followed by `setValueAtTime()` to approximate the behavior, though you lose the "hold current value" semantics and must calculate the value yourself.

**Note:** Where `cancelAndHoldAtTime` works (Chromium & WebKit), the two browsers agree perfectly on the held values in all tests.

---

## 2. 🟡 `.value` Getter Before Rendering (Introspection Timing)

When reading `AudioParam.value` immediately after scheduling automation (before `startRendering()`), Firefox returns the **current actual value** while Chromium and WebKit return the **last scheduled target value**.

| Scenario | Chromium | Firefox | WebKit |
|---|---|---|---|
| After `setValueAtTime(0, 0); setValueAtTime(0.5, 0.25); setValueAtTime(1.0, 0.5)` | `1` | `0` | `1` |
| After `setValueAtTime(0, 0); linearRampTo(1.0, 0.5)` | `1` | `0` | `1` |
| After `setValueAtTime(0.01, 0); exponentialRampTo(1.0, 0.5)` | `1` | `0.01` | `1` |
| After `setValueAtTime(0, 0); setTargetAtTime(1.0, 0, 0.1)` | `1` | `0` | `1` |
| After `setValueCurveAtTime(curve, 0, 0.5)` | `1` | `0` | `1` |

**After rendering completes**, all three browsers agree on the final values.

**Spec note:** The spec says `.value` should return the "current value" which before rendering has started is the `defaultValue` (or whatever immediate assignments have been made). Chromium/WebKit appear to preview the scheduled value, while Firefox more literally returns what hasn't been processed yet.

---

## 3. 🟡 `automationRate` k-rate Ignored by Firefox

The `automationRate` property controls whether parameters are computed per-sample (a-rate) or per-render-quantum/128-sample-block (k-rate).

| Sample Index | a-rate (all browsers) | k-rate Chromium | k-rate Firefox | k-rate WebKit |
|---|---|---|---|---|
| `[0]` | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| `[64]` | 0.2500 | **0.0000** | 0.2500 | **0.0000** |
| `[128]` | 0.5000 | 0.5000 | 0.5000 | 0.5000 |
| `[255]` | 0.9961 | **0.5000** | 0.9961 | **0.5000** |

**Chromium & WebKit** correctly implement k-rate with a staircase pattern (value stays constant within each 128-sample block). **Firefox** treats k-rate identically to a-rate — the samples are interpolated per-sample regardless.

---

## 4. 🟡 `AudioParam` min/max Value Range Differences

Several parameters report different `minValue`/`maxValue` across browsers:

| Parameter | Property | Chromium | Firefox | WebKit |
|---|---|---|---|---|
| `OscillatorNode.detune` | min | -153600 | -3.403e+38 | -153600 |
| `OscillatorNode.detune` | max | 153600 | 3.403e+38 | 153600 |
| `BiquadFilterNode.frequency` | min | 0 | -24000 | 0 |
| `BiquadFilterNode.gain` | max | 1541.27 | 3.403e+38 | 1541.27 |

Firefox uses unbounded `FLT_MAX` ranges for several params where Chromium/WebKit enforce tighter spec-defined limits.

---

## 5. 🟢 `setTargetAtTime` Precision Divergence at Long Durations

All browsers closely follow the formula `v(t) = target + (initial - target) × e^(-(t-startTime)/timeConstant)`, but Chromium shows slightly more accumulated floating-point error at t=1.0s with τ=0.1:

| Time | Expected | Chromium | Firefox | WebKit |
|---|---|---|---|---|
| 0.1s | 0.632121 | 0.632120 (diff: 8.4e-7) | 0.632121 (diff: 1e-8) | 0.632120 (diff: 7.8e-7) |
| 0.5s | 0.993262 | 0.993262 (diff: 3.6e-7) | 0.993262 (diff: 0) | 0.993262 (diff: 1.8e-7) |
| 1.0s | 0.999955 | **0.999857** (diff: **9.8e-5**) | 0.999955 (diff: 2e-8) | 0.999955 (diff: 7.6e-7) |

Chromium's error at 1.0s (~0.0001) is 1000x larger than Firefox. This suggests Chromium may use a different computation approach (e.g., repeated multiplication vs. direct exponential).

---

## 6. 🟢 `value` Setter During Active Automation

Setting `.value` directly while a `linearRampToValueAtTime` is active:

| | Chromium | Firefox | WebKit |
|---|---|---|---|
| `.value` read back | 0.75 | 0.75 | 0.75 |
| Final rendered value | 0.999995 | 1.000000 | 0.999996 |

All browsers allow the setter but the ramp continues. The slight differences are floating-point noise — effectively identical behavior.

---

## 7. ✅ Consistent Behaviors Across All Browsers

These areas produced **identical results** across all three browsers:

- **Basic value setting** (`gain.value = 0.5`)
- **`linearRampToValueAtTime`** final values and sample accuracy
- **`exponentialRampToValueAtTime`** final values
- **`setValueCurveAtTime`** rendering
- **`cancelScheduledValues`** behavior and sample accuracy
- **Multiple `setValueAtTime` at same time** (last write wins: 0.9)
- **Cancel + reschedule** pattern
- **Value held after ramp completes**
- **`exponentialRamp` to/from zero** error handling (all reject target=0, all silently accept start=0)
- **`setValueCurveAtTime` overlap detection** (all throw)
- **Negative time rejection** (all throw RangeError)
- **Single-value curve rejection** (all throw InvalidStateError)
- **Zero-duration curve rejection** (all throw RangeError)
- **`cancelScheduledValues(0)` behavior** (identical sample output)

---

## 8. Performance Comparison

Scheduling and rendering 10,000 `setValueAtTime` events:

| | Chromium | Firefox | WebKit |
|---|---|---|---|
| Schedule time | **3.3ms** | 47ms | 53ms |
| Render time | **2.1ms** | 27ms | 28ms |
| Total | **5.4ms** | 74ms | 81ms |

Chromium is roughly **14x faster** than Firefox/WebKit for heavy automation scheduling.

---

## Recommendations for Cross-Browser Audio Code

1. **Avoid `cancelAndHoldAtTime` in production** unless you can verify browser support or provide a polyfill. Firefox still does not implement it.

2. **Don't read `.value` for introspection before rendering** — the value you get back differs between Firefox and Chromium/WebKit.

3. **Don't rely on `automationRate = "k-rate"`** for AudioParam behavior — Firefox ignores it.

4. **Don't rely on `minValue`/`maxValue`** for validation — values differ, especially for detune and BiquadFilter parameters.

5. **Always precede ramps with `setValueAtTime`** — while browsers handle orphan ramps similarly today, the spec requires an explicit anchor.

6. **For `cancelAndHold` semantics in Firefox**, calculate the current value manually and use `cancelScheduledValues()` + `setValueAtTime(calculatedValue, time)`.
