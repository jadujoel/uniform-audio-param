# AudioParam Polyfill Validation Report

Generated: 2026-04-03T15:53:52.907Z

## Test Setup

Each test is run in Chromium, Firefox, and WebKit — first **without** the polyfill, then **with** the polyfill injected.

## 1. cancelAndHoldAtTime - linear ramp hold at 0.5

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.500000 | 0.500000 | — |
| Firefox | 1.000000 | 0.500000 | ✅ Fixed |
| WebKit | 0.500000 | 0.500000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 2. cancelAndHoldAtTime - exponential ramp

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.100000 | 0.100000 | — |
| Firefox | 1.000000 | 0.100000 | ✅ Fixed |
| WebKit | 0.100000 | 0.100000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 3. cancelAndHoldAtTime - setTargetAtTime

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.950213 | 0.950213 | — |
| Firefox | 1.000000 | 0.950213 | ✅ Fixed |
| WebKit | 0.950212 | 0.950212 | — |

**Result: ⚠️ Browsers still differ (see values above).**

**Chromium logs:** cancelAndHoldAtTime: ok | Final value: 0.9502127766609192
**Firefox logs:** cancelAndHoldAtTime: ok | Final value: 0.9502129554748535
**WebKit logs:** cancelAndHoldAtTime: ok | Final value: 0.9502124786376953

---

## 4. cancelAndHoldAtTime - setValueCurveAtTime

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.500000 | 0.500000 | — |
| Firefox | 1.000000 | 0.500000 | ✅ Fixed |
| WebKit | 0.500000 | 0.500000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 5. cancelAndHoldAtTime then new linearRamp

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.000000 | 0.000000 | — |
| Firefox | 1.000000 | 0.000000 | ✅ Fixed |
| WebKit | 0.000000 | 0.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 6. Double cancelAndHoldAtTime

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.525000 | 0.525000 | — |
| Firefox | 1.000000 | 0.525000 | ✅ Fixed |
| WebKit | 0.525000 | 0.525000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 7. cancelAndHoldAtTime at time 0

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.000000 | 0.000000 | — |
| Firefox | 1.000000 | 0.000000 | ✅ Fixed |
| WebKit | 0.000000 | 0.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 8. cancelAndHoldAtTime sample-accurate (ConstantSource)

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.250000, 0.500000, 0.500000, 0.500000 | 0.250000, 0.500000, 0.500000, 0.500000 | — |
| Firefox | 0.250000, 0.500000, 0.750000, 0.999979 | 0.250000, 0.500000, 0.500000, 0.500000 | ✅ Fixed |
| WebKit | 0.250000, 0.500000, 0.500000, 0.500000 | 0.250000, 0.500000, 0.500000, 0.500000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 9. cancelAndHoldAtTime after events finished

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.400000, 1.000000, 1.000000, 1.000000 | 0.400000, 1.000000, 1.000000, 1.000000 | — |
| Firefox | 0.400000, 1.000000, 1.000000, 1.000000 | 0.400000, 1.000000, 1.000000, 1.000000 | — |
| WebKit | 0.400000, 1.000000, 1.000000, 1.000000 | 0.400000, 1.000000, 1.000000, 1.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 10. Basic scheduling still works with polyfill

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 1.000000 | 1.000000 | — |
| Firefox | 1.000000 | 1.000000 | — |
| WebKit | 1.000000 | 1.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 11. cancelScheduledValues still works with polyfill

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.000000 | 0.000000 | — |
| Firefox | 0.000000 | 0.000000 | — |
| WebKit | 0.000000 | 0.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 12. setTargetAtTime still works with polyfill

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.993262 | 0.993262 | — |
| Firefox | 0.993262 | 0.993262 | — |
| WebKit | 0.993262 | 0.993262 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 13. setValueCurveAtTime still works with polyfill

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 0.500000, 0.999958 | 0.500000, 0.999958 | — |
| Firefox | 0.500000, 0.999958 | 0.500000, 0.999958 | — |
| WebKit | 0.500000, 0.999958 | 0.500000, 0.999958 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 14. exponentialRamp still works with polyfill

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | 1.000000 | 1.000000 | — |
| Firefox | 1.000000 | 1.000000 | — |
| WebKit | 1.000000 | 1.000000 | — |

**Result: ✅ All browsers produce identical output with polyfill.**

---

## 15. getScheduledValueAtTime (bonus helper)

| Browser | Without Polyfill | With Polyfill | Match? |
| --- | --- | --- | --- |
| Chromium | getScheduledValueAtTime not available | getScheduledValueAtTime not available | — |
| Firefox | getScheduledValueAtTime not available | 0.250000, 0.500000, 0.750000 | ⚠️ |
| WebKit | getScheduledValueAtTime not available | getScheduledValueAtTime not available | — |

**Result: ⚠️ Browsers still differ (see values above).**

**Chromium logs:** getScheduledValueAtTime not available
**Firefox logs:** t=0.25: 0.2500 | t=0.50: 0.5000 | t=0.75: 0.7500
**WebKit logs:** getScheduledValueAtTime not available

---

## Summary

| Metric | Count |
| --- | --- |
| Already consistent (no polyfill needed) | 6 |
| **Fixed by polyfill** | **7** |
| Still differs (cannot polyfill) | 2 |
| Total tests | 15 |

### Remaining Differences

Some differences cannot be polyfilled at the JavaScript level:

- **`automationRate` k-rate**: Firefox ignores it — this is an engine-internal optimization
- **`.value` getter timing**: Firefox returns actual current value; Chromium/WebKit preview scheduled values
- **Floating-point precision**: Minor numerical differences in `setTargetAtTime` across engines
- **`minValue`/`maxValue`**: Read-only properties reflecting engine internals