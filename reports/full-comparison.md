# Web Audio API AudioParam Cross-Browser Comparison Report

Generated: 2026-04-03T14:09:34.425Z

## Browsers Tested

- **Chromium**: 147.0.7727.15
- **Firefox**: 148.0.2
- **WebKit (Safari)**: 26.4

## Summary Table

| Test | Chromium | Firefox | WebKit (Safari) | Match? |
| --- | --- | --- | --- | --- |
| 1. AudioParam.value setter (immediate) | 0.500000 | 0.500000 | 0.500000 | ✅ |
| 2. setValueAtTime basic | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 3. linearRampToValueAtTime | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 4. exponentialRampToValueAtTime | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 5. setTargetAtTime | 0.999857 | 0.999955 | 0.999955 | ❌ |
| 6. setValueCurveAtTime | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 7. cancelScheduledValues - cancel ramp mid-way | 0.000000 | 0.000000 | 0.000000 | ✅ |
| 8. cancelAndHoldAtTime - basic linear ramp | 0.500000 | 1.000000 | 0.500000 | ❌ |
| 9. cancelAndHoldAtTime - exponential ramp | 0.100000 | 1.000000 | 0.100000 | ❌ |
| 10. cancelAndHoldAtTime - setTargetAtTime | 0.950213 | 1.000000 | 0.950212 | ❌ |
| 11. cancelAndHoldAtTime - setValueCurveAtTime | 0.500000 | 1.000000 | 0.500000 | ❌ |
| 12. linearRamp without prior setValueAtTime | 0.500000 | 0.500000 | 0.500000 | ✅ |
| 13. exponentialRamp without prior setValueAtTime | 0.500000 | 0.500000 | 0.500000 | ✅ |
| 14. Multiple setValueAtTime at same time | 0.900000 | 0.900000 | 0.900000 | ✅ |
| 15. cancelScheduledValues then re-schedule | 0.300000 | 0.300000 | 0.300000 | ✅ |
| 16. cancelAndHoldAtTime then new linearRamp | 0.000000 | 1.000000 | 0.000000 | ❌ |
| 17. value setter during active automation | 0.999995 | 1.000000 | 0.999996 | ❌ |
| 18. exponentialRamp with zero values | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 19. setValueCurveAtTime overlap with setValueAtTime | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 20. Multiple cancelAndHoldAtTime calls | 0.525000 | 1.000000 | 0.525000 | ❌ |
| 21. Sample-accurate values mid-ramp via OfflineAudioContext | 0.000000, 0.250000, 0.500000, 0.750000, 0.999958 | 0.000000, 0.250000, 0.500000, 0.750000, 0.999958 | 0.000000, 0.250000, 0.500000, 0.750000, 0.999958 | ✅ |
| 22. cancelAndHoldAtTime sample-accurate capture | 0.250000, 0.500000, 0.500000, 0.500000 | 0.250000, 0.500000, 0.750000, 0.999979 | 0.250000, 0.500000, 0.500000, 0.500000 | ❌ |
| 23. cancelScheduledValues sample-accurate capture | 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000 | 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000 | 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000 | ✅ |
| 24. setTargetAtTime convergence precision | 0.632120, 0.864665, 0.950213, 0.993262, 0.999857 | 0.632121, 0.864665, 0.950213, 0.993262, 0.999955 | 0.632120, 0.864664, 0.950212, 0.993262, 0.999955 | ❌ |
| 25. AudioParam defaultValue, minValue, maxValue | 1.000000, 440.000000, 350.000000 | 1.000000, 440.000000, 350.000000 | 1.000000, 440.000000, 350.000000 | ✅ |
| 26. setValueAtTime with negative time | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 27. cancelAndHoldAtTime at time 0 | 0.000000 | 1.000000 | 0.000000 | ❌ |
| 28. cancelScheduledValues at time 0 (cancel everything) | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 29. Value after ramp completes (no further events) | 0.200000, 0.500000, 0.500000, 0.500000, 0.500000 | 0.200000, 0.500000, 0.500000, 0.500000, 0.500000 | 0.200000, 0.500000, 0.500000, 0.500000, 0.500000 | ✅ |
| 30. cancelAndHoldAtTime after events already finished | 0.400000, 1.000000, 1.000000, 1.000000 | 0.400000, 1.000000, 1.000000, 1.000000 | 0.400000, 1.000000, 1.000000, 1.000000 | ✅ |
| 31. automationRate a-rate vs k-rate | 0.500000, 0.500000 | 0.500000, 0.500000 | 0.500000, 0.500000 | ✅ |
| 32. setValueCurveAtTime with single-value curve | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 33. setValueCurveAtTime with zero duration | 1.000000 | 1.000000 | 1.000000 | ✅ |
| 34. Many scheduled events performance | 0.999900 | 0.999900 | 0.999900 | ✅ |

## Detailed Results

### 1. AudioParam.value setter (immediate)

#### Chromium (147.0.7727.15)

```
Initial value after set: 0.5
Value after render: 0.5
```

**Final values:** 0.500000

#### Firefox (148.0.2)

```
Initial value after set: 0.5
Value after render: 0.5
```

**Final values:** 0.500000

#### WebKit (Safari) (26.4)

```
Initial value after set: 0.5
Value after render: 0.5
```

**Final values:** 0.500000

#### ✅ All browsers agree

---

### 2. setValueAtTime basic

#### Chromium (147.0.7727.15)

```
Value immediately after scheduling: 1
Value after full render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Value immediately after scheduling: 0
Value after full render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value immediately after scheduling: 1
Value after full render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 3. linearRampToValueAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render (should be ~1.0 at end): 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Value immediately: 0
Value after render (should be ~1.0 at end): 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render (should be ~1.0 at end): 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 4. exponentialRampToValueAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Value immediately: 0.009999999776482582
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 5. setTargetAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after 1s render (target=1.0, tau=0.1): 0.9998569488525391
```

**Final values:** 0.999857

#### Firefox (148.0.2)

```
Value immediately: 0
Value after 1s render (target=1.0, tau=0.1): 0.9999545812606812
```

**Final values:** 0.999955

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after 1s render (target=1.0, tau=0.1): 0.9999553561210632
```

**Final values:** 0.999955

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.999857
- **Firefox**: 0.999955
- **WebKit (Safari)**: 0.999955

---

### 6. setValueCurveAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Value immediately: 0
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 7. cancelScheduledValues - cancel ramp mid-way

#### Chromium (147.0.7727.15)

```
Value immediately after cancel: 1
Value after render: 0
```

**Final values:** 0.000000

#### Firefox (148.0.2)

```
Value immediately after cancel: 0
Value after render: 0
```

**Final values:** 0.000000

#### WebKit (Safari) (26.4)

```
Value immediately after cancel: 1
Value after render: 0
```

**Final values:** 0.000000

#### ✅ All browsers agree

---

### 8. cancelAndHoldAtTime - basic linear ramp

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime succeeded
Value immediately: 1
Value after render (should hold at ~0.5): 0.5
```

**Final values:** 0.500000

#### Firefox (148.0.2)

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value immediately: 0
Value after render (should hold at ~0.5): 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime succeeded
Value immediately: 1
Value after render (should hold at ~0.5): 0.5
```

**Final values:** 0.500000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.500000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.500000

---

### 9. cancelAndHoldAtTime - exponential ramp

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime succeeded
Value after render: 0.09999999403953552
```

**Final values:** 0.100000

#### Firefox (148.0.2)

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime succeeded
Value after render: 0.09999999403953552
```

**Final values:** 0.100000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.100000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.100000

---

### 10. cancelAndHoldAtTime - setTargetAtTime

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime succeeded
Value after render: 0.9502127766609192
```

**Final values:** 0.950213

#### Firefox (148.0.2)

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime succeeded
Value after render: 0.9502124786376953
```

**Final values:** 0.950212

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.950213
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.950212

---

### 11. cancelAndHoldAtTime - setValueCurveAtTime

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime succeeded
Value after render: 0.5
```

**Final values:** 0.500000

#### Firefox (148.0.2)

```
cancelAndHoldAtTime threw: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime succeeded
Value after render: 0.5
```

**Final values:** 0.500000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.500000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.500000

---

### 12. linearRamp without prior setValueAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### Firefox (148.0.2)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### ✅ All browsers agree

---

### 13. exponentialRamp without prior setValueAtTime

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### Firefox (148.0.2)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render: 0.5
```

**Final values:** 0.500000

#### ✅ All browsers agree

---

### 14. Multiple setValueAtTime at same time

#### Chromium (147.0.7727.15)

```
Value immediately: 1
Value after render (last write wins?): 0.8999999761581421
```

**Final values:** 0.900000

#### Firefox (148.0.2)

```
Value immediately: 1
Value after render (last write wins?): 0.8999999761581421
```

**Final values:** 0.900000

#### WebKit (Safari) (26.4)

```
Value immediately: 1
Value after render (last write wins?): 0.8999999761581421
```

**Final values:** 0.900000

#### ✅ All browsers agree

---

### 15. cancelScheduledValues then re-schedule

#### Chromium (147.0.7727.15)

```
Value after render: 0.30000001192092896
```

**Final values:** 0.300000

#### Firefox (148.0.2)

```
Value after render: 0.30000001192092896
```

**Final values:** 0.300000

#### WebKit (Safari) (26.4)

```
Value after render: 0.30000001192092896
```

**Final values:** 0.300000

#### ✅ All browsers agree

---

### 16. cancelAndHoldAtTime then new linearRamp

#### Chromium (147.0.7727.15)

```
cancelAndHold + new ramp succeeded
Value after render: 0
```

**Final values:** 0.000000

#### Firefox (148.0.2)

```
Error: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHold + new ramp succeeded
Value after render: 0
```

**Final values:** 0.000000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.000000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.000000

---

### 17. value setter during active automation

#### Chromium (147.0.7727.15)

```
Value after direct set: 0.75
Value after render: 0.9999947547912598
```

**Final values:** 0.999995

#### Firefox (148.0.2)

```
Value after direct set: 0.75
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value after direct set: 0.75
Value after render: 0.9999957084655762
```

**Final values:** 0.999996

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.999995
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.999996

---

### 18. exponentialRamp with zero values

#### Chromium (147.0.7727.15)

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: Failed to execute 'exponentialRampToValueAtTime' on 'AudioParam': The float target value provided (0) should not be in the range (-1.40130e-45, 1.40130e-45).
Value after render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: AudioParam.exponentialRampToValueAtTime: The value passed to exponentialRampToValueAtTime must be non-zero.
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
exponentialRamp from 0: no error thrown
exponentialRamp to 0 threw: value cannot be 0
Value after render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 19. setValueCurveAtTime overlap with setValueAtTime

#### Chromium (147.0.7727.15)

```
setValueAtTime during curve threw: Failed to execute 'setValueAtTime' on 'AudioParam': setValueAtTime(0.75, 0.25) overlaps setValueCurveAtTime(..., 0, 0.5)
Value after render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
setValueAtTime during curve threw: AudioParam.setValueAtTime: Can't add events during a curve event
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
setValueAtTime during curve threw: Events are overlapping
Value after render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 20. Multiple cancelAndHoldAtTime calls

#### Chromium (147.0.7727.15)

```
Double cancelAndHold succeeded
Value after render: 0.5249999761581421
```

**Final values:** 0.525000

#### Firefox (148.0.2)

```
Double cancelAndHold error: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Double cancelAndHold succeeded
Value after render: 0.5249999761581421
```

**Final values:** 0.525000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.525000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.525000

---

### 21. Sample-accurate values mid-ramp via OfflineAudioContext

#### Chromium (147.0.7727.15)

```
Sample[0] = 0.000000
Sample[6000] = 0.250000
Sample[12000] = 0.500000
Sample[18000] = 0.750000
Sample[23999] = 0.999958
```

**Final values:** 0.000000, 0.250000, 0.500000, 0.750000, 0.999958

#### Firefox (148.0.2)

```
Sample[0] = 0.000000
Sample[6000] = 0.250000
Sample[12000] = 0.500000
Sample[18000] = 0.750000
Sample[23999] = 0.999958
```

**Final values:** 0.000000, 0.250000, 0.500000, 0.750000, 0.999958

#### WebKit (Safari) (26.4)

```
Sample[0] = 0.000000
Sample[6000] = 0.250000
Sample[12000] = 0.500000
Sample[18000] = 0.750000
Sample[23999] = 0.999958
```

**Final values:** 0.000000, 0.250000, 0.500000, 0.750000, 0.999958

#### ✅ All browsers agree

---

### 22. cancelAndHoldAtTime sample-accurate capture

#### Chromium (147.0.7727.15)

```
cancelAndHold at 0.5s
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.500000
t=1s sample[47999] = 0.500000
```

**Final values:** 0.250000, 0.500000, 0.500000, 0.500000

#### Firefox (148.0.2)

```
cancelAndHold error: constantSrc.offset.cancelAndHoldAtTime is not a function
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.750000
t=1s sample[47999] = 0.999979
```

**Final values:** 0.250000, 0.500000, 0.750000, 0.999979

#### WebKit (Safari) (26.4)

```
cancelAndHold at 0.5s
t=0.25s sample[12000] = 0.250000
t=0.5s sample[24000] = 0.500000
t=0.75s sample[36000] = 0.500000
t=1s sample[47999] = 0.500000
```

**Final values:** 0.250000, 0.500000, 0.500000, 0.500000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.250000, 0.500000, 0.500000, 0.500000
- **Firefox**: 0.250000, 0.500000, 0.750000, 0.999979
- **WebKit (Safari)**: 0.250000, 0.500000, 0.500000, 0.500000

---

### 23. cancelScheduledValues sample-accurate capture

#### Chromium (147.0.7727.15)

```
t=0.25s sample[12000] = 0.000000
t=0.49s sample[23520] = 0.000000
t=0.5s sample[24000] = 0.000000
t=0.51s sample[24480] = 0.000000
t=0.75s sample[36000] = 0.000000
t=1s sample[47999] = 0.000000
```

**Final values:** 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000

#### Firefox (148.0.2)

```
t=0.25s sample[12000] = 0.000000
t=0.49s sample[23520] = 0.000000
t=0.5s sample[24000] = 0.000000
t=0.51s sample[24480] = 0.000000
t=0.75s sample[36000] = 0.000000
t=1s sample[47999] = 0.000000
```

**Final values:** 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000

#### WebKit (Safari) (26.4)

```
t=0.25s sample[12000] = 0.000000
t=0.49s sample[23520] = 0.000000
t=0.5s sample[24000] = 0.000000
t=0.51s sample[24480] = 0.000000
t=0.75s sample[36000] = 0.000000
t=1s sample[47999] = 0.000000
```

**Final values:** 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000

#### ✅ All browsers agree

---

### 24. setTargetAtTime convergence precision

#### Chromium (147.0.7727.15)

```
t=0.1s actual=0.632120 expected=0.632121 diff=0.00000084
t=0.2s actual=0.864665 expected=0.864665 diff=0.00000010
t=0.3s actual=0.950213 expected=0.950213 diff=0.00000015
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000036
t=1s actual=0.999857 expected=0.999955 diff=0.00009765
```

**Final values:** 0.632120, 0.864665, 0.950213, 0.993262, 0.999857

#### Firefox (148.0.2)

```
t=0.1s actual=0.632121 expected=0.632121 diff=0.00000001
t=0.2s actual=0.864665 expected=0.864665 diff=0.00000002
t=0.3s actual=0.950213 expected=0.950213 diff=0.00000002
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000000
t=1s actual=0.999955 expected=0.999955 diff=0.00000002
```

**Final values:** 0.632121, 0.864665, 0.950213, 0.993262, 0.999955

#### WebKit (Safari) (26.4)

```
t=0.1s actual=0.632120 expected=0.632121 diff=0.00000078
t=0.2s actual=0.864664 expected=0.864665 diff=0.00000046
t=0.3s actual=0.950212 expected=0.950213 diff=0.00000045
t=0.5s actual=0.993262 expected=0.993262 diff=0.00000018
t=1s actual=0.999955 expected=0.999955 diff=0.00000076
```

**Final values:** 0.632120, 0.864664, 0.950212, 0.993262, 0.999955

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.632120, 0.864665, 0.950213, 0.993262, 0.999857
- **Firefox**: 0.632121, 0.864665, 0.950213, 0.993262, 0.999955
- **WebKit (Safari)**: 0.632120, 0.864664, 0.950212, 0.993262, 0.999955

---

### 25. AudioParam defaultValue, minValue, maxValue

#### Chromium (147.0.7727.15)

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-153600 max=153600
biquad.frequency: default=350 min=0 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625
```

**Final values:** 1.000000, 440.000000, 350.000000

#### Firefox (148.0.2)

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.frequency: default=350 min=-24000 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
```

**Final values:** 1.000000, 440.000000, 350.000000

#### WebKit (Safari) (26.4)

```
gain.gain: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
osc.frequency: default=440 min=-24000 max=24000
osc.detune: default=0 min=-153600 max=153600
biquad.frequency: default=350 min=0 max=24000
biquad.Q: default=1 min=-3.4028234663852886e+38 max=3.4028234663852886e+38
biquad.gain: default=0 min=-3.4028234663852886e+38 max=1541.273681640625
```

**Final values:** 1.000000, 440.000000, 350.000000

#### ✅ All browsers agree

---

### 26. setValueAtTime with negative time

#### Chromium (147.0.7727.15)

```
setValueAtTime(-1) threw: RangeError: Failed to execute 'setValueAtTime' on 'AudioParam': Time must be a finite non-negative number: -1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
setValueAtTime(-1) threw: RangeError: AudioParam.setValueAtTime: The start time for an AudioParam method must be non-negative.
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
setValueAtTime(-1) threw: RangeError: startTime must be a positive value
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 27. cancelAndHoldAtTime at time 0

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime(0): succeeded
Value after render: 0
```

**Final values:** 0.000000

#### Firefox (148.0.2)

```
cancelAndHoldAtTime(0): TypeError: gain.gain.cancelAndHoldAtTime is not a function
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime(0): succeeded
Value after render: 0
```

**Final values:** 0.000000

#### ⚠️ Cross-Browser Difference Detected

- **Chromium**: 0.000000
- **Firefox**: 1.000000
- **WebKit (Safari)**: 0.000000

---

### 28. cancelScheduledValues at time 0 (cancel everything)

#### Chromium (147.0.7727.15)

```
Value after render: 1
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Value after render: 1
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Value after render: 1
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 29. Value after ramp completes (no further events)

#### Chromium (147.0.7727.15)

```
t=0.1s = 0.200000
t=0.25s = 0.500000
t=0.5s = 0.500000
t=0.75s = 0.500000
t=1s = 0.500000
```

**Final values:** 0.200000, 0.500000, 0.500000, 0.500000, 0.500000

#### Firefox (148.0.2)

```
t=0.1s = 0.200000
t=0.25s = 0.500000
t=0.5s = 0.500000
t=0.75s = 0.500000
t=1s = 0.500000
```

**Final values:** 0.200000, 0.500000, 0.500000, 0.500000, 0.500000

#### WebKit (Safari) (26.4)

```
t=0.1s = 0.200000
t=0.25s = 0.500000
t=0.5s = 0.500000
t=0.75s = 0.500000
t=1s = 0.500000
```

**Final values:** 0.200000, 0.500000, 0.500000, 0.500000, 0.500000

#### ✅ All browsers agree

---

### 30. cancelAndHoldAtTime after events already finished

#### Chromium (147.0.7727.15)

```
cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```

**Final values:** 0.400000, 1.000000, 1.000000, 1.000000

#### Firefox (148.0.2)

```
cancelAndHoldAtTime error: constantSrc.offset.cancelAndHoldAtTime is not a function
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```

**Final values:** 0.400000, 1.000000, 1.000000, 1.000000

#### WebKit (Safari) (26.4)

```
cancelAndHoldAtTime(0.5) after ramp ends at 0.25: ok
t=0.1s = 0.400000
t=0.25s = 1.000000
t=0.5s = 1.000000
t=0.75s = 1.000000
```

**Final values:** 0.400000, 1.000000, 1.000000, 1.000000

#### ✅ All browsers agree

---

### 31. automationRate a-rate vs k-rate

#### Chromium (147.0.7727.15)

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000
k-rate staircase pattern: true
```

**Final values:** 0.500000, 0.500000

#### Firefox (148.0.2)

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate staircase pattern: false
```

**Final values:** 0.500000, 0.500000

#### WebKit (Safari) (26.4)

```
a-rate samples: [0]=0.0000 [64]=0.2500 [128]=0.5000 [255]=0.9961
k-rate samples: [0]=0.0000 [64]=0.0000 [128]=0.5000 [255]=0.5000
k-rate staircase pattern: true
```

**Final values:** 0.500000, 0.500000

#### ✅ All browsers agree

---

### 32. setValueCurveAtTime with single-value curve

#### Chromium (147.0.7727.15)

```
Single-value curve threw: InvalidStateError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': The curve length provided (1) is less than the minimum bound (2).
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Single-value curve threw: InvalidStateError: AudioParam.setValueCurveAtTime: Curve length must be at least 2
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Single-value curve threw: InvalidStateError: Array must have a length of at least 2
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 33. setValueCurveAtTime with zero duration

#### Chromium (147.0.7727.15)

```
Zero duration curve threw: RangeError: Failed to execute 'setValueCurveAtTime' on 'AudioParam': Duration must be a finite positive number: 0
```

**Final values:** 1.000000

#### Firefox (148.0.2)

```
Zero duration curve threw: RangeError: AudioParam.setValueCurveAtTime: The curve duration for setValueCurveAtTime must be strictly positive.
```

**Final values:** 1.000000

#### WebKit (Safari) (26.4)

```
Zero duration curve threw: RangeError: duration must be a strictly positive value
```

**Final values:** 1.000000

#### ✅ All browsers agree

---

### 34. Many scheduled events performance

#### Chromium (147.0.7727.15)

```
Scheduling 10000 events took: 3.30ms
Rendering took: 2.10ms
Final value: 0.9998999834060669
```

**Final values:** 0.999900

#### Firefox (148.0.2)

```
Scheduling 10000 events took: 47.00ms
Rendering took: 27.00ms
Final value: 0.9998999834060669
```

**Final values:** 0.999900

#### WebKit (Safari) (26.4)

```
Scheduling 10000 events took: 53.00ms
Rendering took: 28.00ms
Final value: 0.9998999834060669
```

**Final values:** 0.999900

#### ✅ All browsers agree

---
