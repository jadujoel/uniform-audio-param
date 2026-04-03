# Web Audio AudioParam: Key Browser Differences

Generated: 2026-04-03T14:09:34.427Z

This report highlights **only the tests where browsers differ** in behavior.

## 2. setValueAtTime basic

### Chromium

```
Value immediately after scheduling: 1
Value after full render: 1
```
**Values:** 1.000000

### Firefox

```
Value immediately after scheduling: 0
Value after full render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Value immediately after scheduling: 1
Value after full render: 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Value immediately after scheduling: 1 | Value after full render: 1
- Firefox: Value immediately after scheduling: 0 | Value after full render: 1
- WebKit (Safari): Value immediately after scheduling: 1 | Value after full render: 1

---

## 3. linearRampToValueAtTime

### Chromium

```
Value immediately: 1
Value after render (should be ~1.0 at end): 1
```
**Values:** 1.000000

### Firefox

```
Value immediately: 0
Value after render (should be ~1.0 at end): 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Value immediately: 1
Value after render (should be ~1.0 at end): 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Value immediately: 1 | Value after render (should be ~1.0 at end): 1
- Firefox: Value immediately: 0 | Value after render (should be ~1.0 at end): 1
- WebKit (Safari): Value immediately: 1 | Value after render (should be ~1.0 at end): 1

---

## 4. exponentialRampToValueAtTime

### Chromium

```
Value immediately: 1
Value after render: 1
```
**Values:** 1.000000

### Firefox

```
Value immediately: 0.009999999776482582
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Value immediately: 1
Value after render: 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Value immediately: 1 | Value after render: 1
- Firefox: Value immediately: 0.009999999776482582 | Value after render: 1
- WebKit (Safari): Value immediately: 1 | Value after render: 1

---

## 5. setTargetAtTime

### Chromium

```
Value immediately: 1
Value after 1s render (target=1.0, tau=0.1): 0.9998569488525391
```
**Values:** 0.999857

### Firefox

```
Value immediately: 0
Value after 1s render (target=1.0, tau=0.1): 0.9999545812606812
```
**Values:** 0.999955

### WebKit (Safari)

```
Value immediately: 1
Value after 1s render (target=1.0, tau=0.1): 0.9999553561210632
```
**Values:** 0.999955

### Analysis

**Value difference:**
- Chromium: 0.999857
- Firefox: 0.999955
- WebKit (Safari): 0.999955

**Behavioral difference (logs):**
- Chromium: Value immediately: 1 | Value after 1s render (target=1.0, tau=0.1): 0.9998569488525391
- Firefox: Value immediately: 0 | Value after 1s render (target=1.0, tau=0.1): 0.9999545812606812
- WebKit (Safari): Value immediately: 1 | Value after 1s render (target=1.0, tau=0.1): 0.9999553561210632

---

## 6. setValueCurveAtTime

### Chromium

```
Value immediately: 1
Value after render: 1
```
**Values:** 1.000000

### Firefox

```
Value immediately: 0
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Value immediately: 1
Value after render: 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Value immediately: 1 | Value after render: 1
- Firefox: Value immediately: 0 | Value after render: 1
- WebKit (Safari): Value immediately: 1 | Value after render: 1

---

## 7. cancelScheduledValues - cancel ramp mid-way

### Chromium

```
Value immediately after cancel: 1
Value after render: 0
```
**Values:** 0.000000

### Firefox

```
Value immediately after cancel: 0
Value after render: 0
```
**Values:** 0.000000

### WebKit (Safari)

```
Value immediately after cancel: 1
Value after render: 0
```
**Values:** 0.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Value immediately after cancel: 1 | Value after render: 0
- Firefox: Value immediately after cancel: 0 | Value after render: 0
- WebKit (Safari): Value immediately after cancel: 1 | Value after render: 0

---

## 8. cancelAndHoldAtTime - basic linear ramp

### Chromium

```
cancelAndHoldAtTime succeeded
Value immediately: 1
Value after render (should hold at ~0.5): 0.5
```
**Values:** 0.500000

### Firefox

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value immediately: 0
Value after render (should hold at ~0.5): 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime succeeded
Value immediately: 1
Value after render (should hold at ~0.5): 0.5
```
**Values:** 0.500000

### Analysis

**Value difference:**
- Chromium: 0.500000
- Firefox: 1.000000
- WebKit (Safari): 0.500000

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime succeeded | Value immediately: 1 | Value after render (should hold at ~0.5): 0.5
- Firefox: cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function | Value immediately: 0 | Value after render (should hold at ~0.5): 1
- WebKit (Safari): cancelAndHoldAtTime succeeded | Value immediately: 1 | Value after render (should hold at ~0.5): 0.5

---

## 9. cancelAndHoldAtTime - exponential ramp

### Chromium

```
cancelAndHoldAtTime succeeded
Value after render: 0.09999999403953552
```
**Values:** 0.100000

### Firefox

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime succeeded
Value after render: 0.09999999403953552
```
**Values:** 0.100000

### Analysis

**Value difference:**
- Chromium: 0.100000
- Firefox: 1.000000
- WebKit (Safari): 0.100000

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime succeeded | Value after render: 0.09999999403953552
- Firefox: cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): cancelAndHoldAtTime succeeded | Value after render: 0.09999999403953552

---

## 10. cancelAndHoldAtTime - setTargetAtTime

### Chromium

```
cancelAndHoldAtTime succeeded
Value after render: 0.9502127766609192
```
**Values:** 0.950213

### Firefox

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime succeeded
Value after render: 0.9502124786376953
```
**Values:** 0.950212

### Analysis

**Value difference:**
- Chromium: 0.950213
- Firefox: 1.000000
- WebKit (Safari): 0.950212

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime succeeded | Value after render: 0.9502127766609192
- Firefox: cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): cancelAndHoldAtTime succeeded | Value after render: 0.9502124786376953

---

## 11. cancelAndHoldAtTime - setValueCurveAtTime

### Chromium

```
cancelAndHoldAtTime succeeded
Value after render: 0.5
```
**Values:** 0.500000

### Firefox

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime succeeded
Value after render: 0.5
```
**Values:** 0.500000

### Analysis

**Value difference:**
- Chromium: 0.500000
- Firefox: 1.000000
- WebKit (Safari): 0.500000

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime succeeded | Value after render: 0.5
- Firefox: cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): cancelAndHoldAtTime succeeded | Value after render: 0.5

---

## 16. cancelAndHoldAtTime then new linearRamp

### Chromium

```
cancelAndHold + new ramp succeeded
Value after render: 0
```
**Values:** 0.000000

### Firefox

```
Error: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHold + new ramp succeeded
Value after render: 0
```
**Values:** 0.000000

### Analysis

**Value difference:**
- Chromium: 0.000000
- Firefox: 1.000000
- WebKit (Safari): 0.000000

**Behavioral difference (logs):**
- Chromium: cancelAndHold + new ramp succeeded | Value after render: 0
- Firefox: Error: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): cancelAndHold + new ramp succeeded | Value after render: 0

---

## 17. value setter during active automation

### Chromium

```
Value after direct set: 0.75
Value after render: 0.9999947547912598
```
**Values:** 0.999995

### Firefox

```
Value after direct set: 0.75
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Value after direct set: 0.75
Value after render: 0.9999957084655762
```
**Values:** 0.999996

### Analysis

**Value difference:**
- Chromium: 0.999995
- Firefox: 1.000000
- WebKit (Safari): 0.999996

**Behavioral difference (logs):**
- Chromium: Value after direct set: 0.75 | Value after render: 0.9999947547912598
- Firefox: Value after direct set: 0.75 | Value after render: 1
- WebKit (Safari): Value after direct set: 0.75 | Value after render: 0.9999957084655762

---

## 18. exponentialRamp with zero values

### Chromium

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: Failed to execute 'exponentialRampToValueAtTime' on 'AudioParam': The float target value provided (0) should not be in the range (-1.40130e-45, 1.40130e-45).
Value after render: 1
```
**Values:** 1.000000

### Firefox

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: AudioParam.exponentialRampToValueAtTime: The value passed to exponentialRampToValueAtTime must be non-zero.
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: value cannot be 0
Value after render: 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: exponentialRamp from 0: no error thrown | exponentialRamp to 0 threw: Failed to execute 'exponentialRampToValueAtTime' on 'AudioParam': The float target value provided (0) should not be in the range (-1.40130e-45, 1.40130e-45). | Value after render: 1
- Firefox: exponentialRamp from 0: no error thrown | exponentialRamp to 0 threw: AudioParam.exponentialRampToValueAtTime: The value passed to exponentialRampToValueAtTime must be non-zero. | Value after render: 1
- WebKit (Safari): exponentialRamp from 0: no error thrown | exponentialRamp to 0 threw: value cannot be 0 | Value after render: 1

---

## 19. setValueCurveAtTime overlap with setValueAtTime

### Chromium

```
setValueAtTime during curve threw: Failed to execute 'setValueAtTime' on 'AudioParam': setValueAtTime(0.75, 0.25) overlaps setValueCurveAtTime(..., 0, 0.5)
Value after render: 1
```
**Values:** 1.000000

### Firefox

```
setValueAtTime during curve threw: AudioParam.setValueAtTime: Can't add events during a curve event
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
setValueAtTime during curve threw: Events are overlapping
Value after render: 1
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: setValueAtTime during curve threw: Failed to execute 'setValueAtTime' on 'AudioParam': setValueAtTime(0.75, 0.25) overlaps setValueCurveAtTime(..., 0, 0.5) | Value after render: 1
- Firefox: setValueAtTime during curve threw: AudioParam.setValueAtTime: Can't add events during a curve event | Value after render: 1
- WebKit (Safari): setValueAtTime during curve threw: Events are overlapping | Value after render: 1

---

## 20. Multiple cancelAndHoldAtTime calls

### Chromium

```
Double cancelAndHold succeeded
Value after render: 0.5249999761581421
```
**Values:** 0.525000

### Firefox

```
Double cancelAndHold error: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
Double cancelAndHold succeeded
Value after render: 0.5249999761581421
```
**Values:** 0.525000

### Analysis

**Value difference:**
- Chromium: 0.525000
- Firefox: 1.000000
- WebKit (Safari): 0.525000

**Behavioral difference (logs):**
- Chromium: Double cancelAndHold succeeded | Value after render: 0.5249999761581421
- Firefox: Double cancelAndHold error: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): Double cancelAndHold succeeded | Value after render: 0.5249999761581421

---

## 22. cancelAndHoldAtTime sample-accurate capture

### Chromium

```
cancelAndHold at 0.5s
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.500000
t=1s sample[47999] = 0.500000
```
**Values:** 0.250000, 0.500000, 0.500000, 0.500000

### Firefox

```
cancelAndHold error: constantSrc.offset.cancelAndHoldAtTime is not a function
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.750000
t=1s sample[47999] = 0.999979
```
**Values:** 0.250000, 0.500000, 0.750000, 0.999979

### WebKit (Safari)

```
cancelAndHold at 0.5s
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.500000
t=1s sample[47999] = 0.500000
```
**Values:** 0.250000, 0.500000, 0.500000, 0.500000

### Analysis

**Value difference:**
- Chromium: 0.250000,0.500000,0.500000,0.500000
- Firefox: 0.250000,0.500000,0.750000,0.999979
- WebKit (Safari): 0.250000,0.500000,0.500000,0.500000

**Behavioral difference (logs):**
- Chromium: cancelAndHold at 0.5s | t=0.25s sample[12000] = 0.250000 | t=0.5s sample[24000] = 0.500000 | t=0.75s sample[36000] = 0.500000 | t=1s sample[47999] = 0.500000
- Firefox: cancelAndHold error: constantSrc.offset.cancelAndHoldAtTime is not a function | t=0.25s sample[12000] = 0.250000 | t=0.5s sample[24000] = 0.500000 | t=0.75s sample[36000] = 0.750000 | t=1s sample[47999] = 0.999979
- WebKit (Safari): cancelAndHold at 0.5s | t=0.25s sample[12000] = 0.250000 | t=0.5s sample[24000] = 0.500000 | t=0.75s sample[36000] = 0.500000 | t=1s sample[47999] = 0.500000

---

## 24. setTargetAtTime convergence precision

### Chromium

```
t=0.1s actual=0.632120 expected=0.632121 diff=0.00000084
t=0.2s actual=0.864665 expected=0.864665 diff=0.00000010
t=0.3s actual=0.950213 expected=0.950213 diff=0.00000015
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000036
t=1s actual=0.999857 expected=0.999955 diff=0.00009765
```
**Values:** 0.632120, 0.864665, 0.950213, 0.993262, 0.999857

### Firefox

```
t=0.1s actual=0.632121 expected=0.632121 diff=0.00000001
t=0.2s actual=0.864665 expected=0.864665 diff=0.00000002
t=0.3s actual=0.950213 expected=0.950213 diff=0.00000002
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000000
t=1s actual=0.999955 expected=0.999955 diff=0.00000002
```
**Values:** 0.632121, 0.864665, 0.950213, 0.993262, 0.999955

### WebKit (Safari)

```
t=0.1s actual=0.632120 expected=0.632121 diff=0.00000078
t=0.2s actual=0.864664 expected=0.864665 diff=0.00000046
t=0.3s actual=0.950212 expected=0.950213 diff=0.00000045
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000018
t=1s actual=0.999955 expected=0.999955 diff=0.00000076
```
**Values:** 0.632120, 0.864664, 0.950212, 0.993262, 0.999955

### Analysis

**Value difference:**
- Chromium: 0.632120,0.864665,0.950213,0.993262,0.999857
- Firefox: 0.632121,0.864665,0.950213,0.993262,0.999955
- WebKit (Safari): 0.632120,0.864664,0.950212,0.993262,0.999955

**Behavioral difference (logs):**
- Chromium: t=0.1s actual=0.632120 expected=0.632121 diff=0.00000084 | t=0.2s actual=0.864665 expected=0.864665 diff=0.00000010 | t=0.3s actual=0.950213 expected=0.950213 diff=0.00000015 | t=0.5s actual=0.993262 expected=0.993262 diff=0.00000036 | t=1s actual=0.999857 expected=0.999955 diff=0.00009765
- Firefox: t=0.1s actual=0.632121 expected=0.632121 diff=0.00000001 | t=0.2s actual=0.864665 expected=0.864665 diff=0.00000002 | t=0.3s actual=0.950213 expected=0.950213 diff=0.00000002 | t=0.5s actual=0.993262 expected=0.993262 diff=0.00000000 | t=1s actual=0.999955 expected=0.999955 diff=0.00000002
- WebKit (Safari): t=0.1s actual=0.632120 expected=0.632121 diff=0.00000078 | t=0.2s actual=0.864664 expected=0.864665 diff=0.00000046 | t=0.3s actual=0.950212 expected=0.950213 diff=0.00000045 | t=0.5s actual=0.993262 expected=0.993262 diff=0.00000018 | t=1s actual=0.999955 expected=0.999955 diff=0.00000076

---

## 25. AudioParam defaultValue, minValue, maxValue

### Chromium

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-153600 max=153600
biquad.frequency: default=350 min=0 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625
```
**Values:** 1.000000, 440.000000, 350.000000

### Firefox

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.frequency: default=350 min=-24000 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
```
**Values:** 1.000000, 440.000000, 350.000000

### WebKit (Safari)

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-153600 max=153600
biquad.frequency: default=350 min=0 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625
```
**Values:** 1.000000, 440.000000, 350.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | osc.frequency: default=440 min=-24000 max=24000 | osc.detune: default=0 min=-153600 max=153600 | biquad.frequency: default=350 min=0 max=24000 | biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625
- Firefox: gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | osc.frequency: default=440 min=-24000 max=24000 | osc.detune: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | biquad.frequency: default=350 min=-24000 max=24000 | biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | biquad.gain: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
- WebKit (Safari): gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | osc.frequency: default=440 min=-24000 max=24000 | osc.detune: default=0 min=-153600 max=153600 | biquad.frequency: default=350 min=0 max=24000 | biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38 | biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625

---

## 26. setValueAtTime with negative time

### Chromium

```
setValueAtTime(-1) threw: RangeError: Failed to execute 'setValueAtTime' on 'AudioParam': Time must be a finite non-negative number: -1
```
**Values:** 1.000000

### Firefox

```
setValueAtTime(-1) threw: RangeError: AudioParam.setValueAtTime: The start time for an AudioParam method must be non-negative.
```
**Values:** 1.000000

### WebKit (Safari)

```
setValueAtTime(-1) threw: RangeError: startTime must be a positive value
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: setValueAtTime(-1) threw: RangeError: Failed to execute 'setValueAtTime' on 'AudioParam': Time must be a finite non-negative number: -1
- Firefox: setValueAtTime(-1) threw: RangeError: AudioParam.setValueAtTime: The start time for an AudioParam method must be non-negative.
- WebKit (Safari): setValueAtTime(-1) threw: RangeError: startTime must be a positive value

---

## 27. cancelAndHoldAtTime at time 0

### Chromium

```
cancelAndHoldAtTime(0): succeeded
Value after render: 0
```
**Values:** 0.000000

### Firefox

```
cancelAndHoldAtTime(0): TypeError: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```
**Values:** 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime(0): succeeded
Value after render: 0
```
**Values:** 0.000000

### Analysis

**Value difference:**
- Chromium: 0.000000
- Firefox: 1.000000
- WebKit (Safari): 0.000000

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime(0): succeeded | Value after render: 0
- Firefox: cancelAndHoldAtTime(0): TypeError: gain.gain.cancelAndHoldAtTime is not a function | Value after render: 1
- WebKit (Safari): cancelAndHoldAtTime(0): succeeded | Value after render: 0

---

## 30. cancelAndHoldAtTime after events already finished

### Chromium

```
cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```
**Values:** 0.400000, 1.000000, 1.000000, 1.000000

### Firefox

```
cancelAndHoldAtTime error: constantSrc.offset.cancelAndHoldAtTime is not a function
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```
**Values:** 0.400000, 1.000000, 1.000000, 1.000000

### WebKit (Safari)

```
cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```
**Values:** 0.400000, 1.000000, 1.000000, 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok | t=0.1s = 0.400000 | t=0.25s = 1.000000 | t=0.5s = 1.000000 | t=0.75s = 1.000000
- Firefox: cancelAndHoldAtTime error: constantSrc.offset.cancelAndHoldAtTime is not a function | t=0.1s = 0.400000 | t=0.25s = 1.000000 | t=0.5s = 1.000000 | t=0.75s = 1.000000
- WebKit (Safari): cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok | t=0.1s = 0.400000 | t=0.25s = 1.000000 | t=0.5s = 1.000000 | t=0.75s = 1.000000

---

## 31. automationRate a-rate vs k-rate

### Chromium

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000
k-rate staircase pattern: true
```
**Values:** 0.500000, 0.500000

### Firefox

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate staircase pattern: false
```
**Values:** 0.500000, 0.500000

### WebKit (Safari)

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000
k-rate staircase pattern: true
```
**Values:** 0.500000, 0.500000

### Analysis

**Behavioral difference (logs):**
- Chromium: a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961 | k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000 | k-rate staircase pattern: true
- Firefox: a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961 | k-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961 | k-rate staircase pattern: false
- WebKit (Safari): a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961 | k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000 | k-rate staircase pattern: true

---

## 32. setValueCurveAtTime with single-value curve

### Chromium

```
Single-value curve threw: InvalidStateError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': The curve length provided (1) is less than the minimum bound (2).
```
**Values:** 1.000000

### Firefox

```
Single-value curve threw: InvalidStateError: AudioParam.setValueCurveAtTime: Curve length must be at least 2
```
**Values:** 1.000000

### WebKit (Safari)

```
Single-value curve threw: InvalidStateError: Array must have a length of at least 2
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Single-value curve threw: InvalidStateError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': The curve length provided (1) is less than the minimum bound (2).
- Firefox: Single-value curve threw: InvalidStateError: AudioParam.setValueCurveAtTime: Curve length must be at least 2
- WebKit (Safari): Single-value curve threw: InvalidStateError: Array must have a length of at least 2

---

## 33. setValueCurveAtTime with zero duration

### Chromium

```
Zero duration curve threw: RangeError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': Duration must be a finite positive number: 0
```
**Values:** 1.000000

### Firefox

```
Zero duration curve threw: RangeError: AudioParam.setValueCurveAtTime: The curve duration for setValueCurveAtTime must be strictly positive.
```
**Values:** 1.000000

### WebKit (Safari)

```
Zero duration curve threw: RangeError: duration must be a strictly positive value
```
**Values:** 1.000000

### Analysis

**Behavioral difference (logs):**
- Chromium: Zero duration curve threw: RangeError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': Duration must be a finite positive number: 0
- Firefox: Zero duration curve threw: RangeError: AudioParam.setValueCurveAtTime: The curve duration for setValueCurveAtTime must be strictly positive.
- WebKit (Safari): Zero duration curve threw: RangeError: duration must be a strictly positive value

---

## 34. Many scheduled events performance

### Chromium

```
Scheduling 10000 events took: 3.30ms
Rendering took: 2.10ms
Final value: 0.9998999834060669
```
**Values:** 0.999900

### Firefox

```
Scheduling 10000 events took: 47.00ms
Rendering took: 27.00ms
Final value: 0.9998999834060669
```
**Values:** 0.999900

### WebKit (Safari)

```
Scheduling 10000 events took: 53.00ms
Rendering took: 28.00ms
Final value: 0.9998999834060669
```
**Values:** 0.999900

### Analysis

**Behavioral difference (logs):**
- Chromium: Scheduling 10000 events took: 3.30ms | Rendering took: 2.10ms | Final value: 0.9998999834060669
- Firefox: Scheduling 10000 events took: 47.00ms | Rendering took: 27.00ms | Final value: 0.9998999834060669
- WebKit (Safari): Scheduling 10000 events took: 53.00ms | Rendering took: 28.00ms | Final value: 0.9998999834060669

---

**Total tests with differences: 25 out of 34**