/// <reference lib="dom" />
/**
 * Web Audio API AudioParam Manual Polyfill
 *
 * Same functionality as audio-param-polyfill.ts, but instead of auto-patching
 * AudioParam.prototype on import, you explicitly polyfill individual AudioParam
 * instances by calling polyfillAudioParam(param), or patch the prototype
 * globally by calling polyfillAudioParamPrototype().
 *
 * This gives you control over:
 *  - Which AudioParams get polyfilled (per-instance or all via prototype)
 *  - When polyfilling happens (useful if you have other polyfills)
 *  - Choosing between instance-level or prototype-level patching
 *
 * Usage (per-instance):
 *   import { polyfillAudioParam } from "./audio-param-polyfill-manual";
 *
 *   const ctx = new AudioContext();
 *   const gain = ctx.createGain();
 *   polyfillAudioParam(gain.gain);
 *
 * Usage (prototype-level):
 *   import { polyfillAudioParamPrototype } from "./audio-param-polyfill-manual";
 *
 *   polyfillAudioParamPrototype();
 *   // All AudioParam instances now have cancelAndHoldAtTime and getScheduledValueAtTime
 */

type EventType =
  | "setValueAtTime"
  | "linearRamp"
  | "exponentialRamp"
  | "setTarget"
  | "setValueCurve";

interface AutomationEvent {
  type: EventType;
  value: number;
  time: number;
  timeConstant?: number;
  duration?: number;
  curve?: Float32Array;
}

interface ActiveAutomation {
  type: EventType | "none";
  prevValue?: number;
  prevTime?: number;
  event?: AutomationEvent;
}

// Track which params have already been polyfilled to avoid double-patching
const polyfilled = new WeakSet<AudioParam>();

// Event timeline per param
const timelines = new WeakMap<AudioParam, AutomationEvent[]>();

function getTimeline(param: AudioParam): AutomationEvent[] {
  let tl = timelines.get(param);
  if (!tl) {
    tl = [];
    timelines.set(param, tl);
  }
  return tl;
}

function insertEvent(timeline: AutomationEvent[], event: AutomationEvent): void {
  let i = timeline.length;
  while (i > 0 && timeline[i - 1]!.time > event.time) {
    i--;
  }
  timeline.splice(i, 0, event);
}

function removeEventsFrom(timeline: AutomationEvent[], time: number): void {
  let i = 0;
  while (i < timeline.length && timeline[i]!.time < time) {
    const ev = timeline[i]!;
    if (ev.type === "setValueCurve" && ev.time + ev.duration! > time) {
      break;
    }
    i++;
  }
  timeline.length = i;
}

// ─── Value computation at a given time ───────────────────────────────────

function computeValueAtTime(param: AudioParam, time: number): number {
  const timeline = timelines.get(param);
  if (!timeline || timeline.length === 0) {
    return param.value;
  }

  let value = param.defaultValue;
  let prevEventEnd = 0;
  let prevValue = value;

  for (let i = 0; i < timeline.length; i++) {
    const ev = timeline[i]!;

    if (ev.type === "setValueAtTime") {
      if (ev.time <= time) {
        value = ev.value;
        prevValue = value;
        prevEventEnd = ev.time;
      }
    } else if (ev.type === "linearRamp") {
      if (time >= ev.time) {
        value = ev.value;
        prevValue = value;
        prevEventEnd = ev.time;
      } else if (time > prevEventEnd) {
        const duration = ev.time - prevEventEnd;
        if (duration <= 0) {
          value = ev.value;
        } else {
          const fraction = (time - prevEventEnd) / duration;
          value = prevValue + (ev.value - prevValue) * fraction;
        }
        return value;
      }
    } else if (ev.type === "exponentialRamp") {
      if (time >= ev.time) {
        value = ev.value;
        prevValue = value;
        prevEventEnd = ev.time;
      } else if (time > prevEventEnd) {
        const duration = ev.time - prevEventEnd;
        if (duration <= 0 || prevValue === 0) {
          value = ev.value;
        } else {
          const ratio = ev.value / prevValue;
          const fraction = (time - prevEventEnd) / duration;
          value = prevValue * Math.pow(ratio, fraction);
        }
        return value;
      }
    } else if (ev.type === "setTarget") {
      if (ev.time <= time) {
        const elapsed = time - ev.time;
        value =
          ev.value +
          (prevValue - ev.value) * Math.exp(-elapsed / ev.timeConstant!);
        return value;
      }
    } else if (ev.type === "setValueCurve") {
      const curveEnd = ev.time + ev.duration!;
      if (time >= curveEnd) {
        value = ev.curve![ev.curve!.length - 1]!;
        prevValue = value;
        prevEventEnd = curveEnd;
      } else if (time >= ev.time) {
        const fraction = (time - ev.time) / ev.duration!;
        const curveLen = ev.curve!.length;
        const scaledIndex = fraction * (curveLen - 1);
        const lo = Math.floor(scaledIndex);
        const hi = Math.min(lo + 1, curveLen - 1);
        const interp = scaledIndex - lo;
        value = ev.curve![lo]! * (1 - interp) + ev.curve![hi]! * interp;
        return value;
      }
    }
  }

  return value;
}

// ─── Determine active automation type at a given time ──────────────────

function findActiveAutomation(
  tl: AutomationEvent[] | undefined,
  cancelTime: number
): ActiveAutomation {
  if (!tl || tl.length === 0) return { type: "none" };

  let prevValue: number | undefined = undefined;
  let prevTime = 0;
  let lastSetTarget: AutomationEvent | null = null;

  for (let i = 0; i < tl.length; i++) {
    const ev = tl[i]!;

    if (ev.type === "setValueAtTime") {
      if (ev.time <= cancelTime) {
        prevValue = ev.value;
        prevTime = ev.time;
        lastSetTarget = null;
      }
    } else if (ev.type === "linearRamp" || ev.type === "exponentialRamp") {
      if (ev.time > cancelTime) {
        return { type: ev.type, prevValue, prevTime, event: ev };
      }
      prevValue = ev.value;
      prevTime = ev.time;
      lastSetTarget = null;
    } else if (ev.type === "setTarget") {
      if (ev.time <= cancelTime) {
        lastSetTarget = ev;
      }
    } else if (ev.type === "setValueCurve") {
      const curveEnd = ev.time + ev.duration!;
      if (ev.time <= cancelTime && curveEnd > cancelTime) {
        return { type: "setValueCurve", prevValue, prevTime, event: ev };
      }
      if (curveEnd <= cancelTime) {
        prevValue = ev.curve![ev.curve!.length - 1]!;
        prevTime = curveEnd;
        lastSetTarget = null;
      }
    }
  }

  if (lastSetTarget) {
    return {
      type: "setTarget",
      prevValue,
      prevTime,
      event: lastSetTarget,
    };
  }

  return { type: "none", prevValue, prevTime };
}

// ─── The main polyfill function ────────────────────────────────────────

/**
 * Polyfill a single AudioParam instance with:
 *  - cancelAndHoldAtTime (if missing)
 *  - getScheduledValueAtTime
 *
 * Wraps scheduling methods on the instance to track automation events.
 * Safe to call multiple times on the same param (no-ops on subsequent calls).
 *
 * Returns the same AudioParam for chaining.
 */
export function polyfillAudioParam(param: AudioParam): AudioParam {
  if (polyfilled.has(param)) return param;
  polyfilled.add(param);

  // Save original methods from the instance (or prototype)
  const origSetValueAtTime = param.setValueAtTime.bind(param);
  const origLinearRamp = param.linearRampToValueAtTime.bind(param);
  const origExponentialRamp = param.exponentialRampToValueAtTime.bind(param);
  const origSetTarget = param.setTargetAtTime.bind(param);
  const origSetValueCurve = param.setValueCurveAtTime.bind(param);
  const origCancelScheduled = param.cancelScheduledValues.bind(param);

  // ─── Wrap scheduling methods to track events ───────────────────────

  param.setValueAtTime = function (value: number, startTime: number): AudioParam {
    const tl = getTimeline(param);
    insertEvent(tl, { type: "setValueAtTime", value, time: startTime });
    return origSetValueAtTime(value, startTime);
  };

  param.linearRampToValueAtTime = function (value: number, endTime: number): AudioParam {
    const tl = getTimeline(param);
    insertEvent(tl, { type: "linearRamp", value, time: endTime });
    return origLinearRamp(value, endTime);
  };

  param.exponentialRampToValueAtTime = function (value: number, endTime: number): AudioParam {
    const tl = getTimeline(param);
    insertEvent(tl, { type: "exponentialRamp", value, time: endTime });
    return origExponentialRamp(value, endTime);
  };

  param.setTargetAtTime = function (
    target: number,
    startTime: number,
    timeConstant: number
  ): AudioParam {
    const tl = getTimeline(param);
    insertEvent(tl, {
      type: "setTarget",
      value: target,
      time: startTime,
      timeConstant,
    });
    return origSetTarget(target, startTime, timeConstant);
  };

  param.setValueCurveAtTime = function (
    values: Iterable<number>,
    startTime: number,
    duration: number
  ): AudioParam {
    const arr = values instanceof Float32Array ? values : new Float32Array(values as number[]);
    const tl = getTimeline(param);
    insertEvent(tl, {
      type: "setValueCurve",
      value: arr[arr.length - 1]!,
      time: startTime,
      duration,
      curve: new Float32Array(arr),
    });
    return origSetValueCurve(values, startTime, duration);
  };

  param.cancelScheduledValues = function (startTime: number): AudioParam {
    const tl = timelines.get(param);
    if (tl) {
      removeEventsFrom(tl, startTime);
    }
    return origCancelScheduled(startTime);
  };

  // ─── Polyfill cancelAndHoldAtTime (only if missing) ────────────────

  if (typeof param.cancelAndHoldAtTime !== "function") {
    param.cancelAndHoldAtTime = function (cancelTime: number): AudioParam {
      const tl = timelines.get(param);
      const holdValue = computeValueAtTime(param, cancelTime);
      const active = findActiveAutomation(tl, cancelTime);

      if (active.type === "linearRamp" || active.type === "exponentialRamp") {
        origCancelScheduled(cancelTime);
        if (tl) removeEventsFrom(tl, cancelTime);

        if (active.type === "linearRamp") {
          origLinearRamp(holdValue, cancelTime);
          if (tl)
            insertEvent(tl, {
              type: "linearRamp",
              value: holdValue,
              time: cancelTime,
            });
        } else {
          const safeHold = holdValue === 0 ? 1e-30 : holdValue;
          origExponentialRamp(safeHold, cancelTime);
          if (tl)
            insertEvent(tl, {
              type: "exponentialRamp",
              value: safeHold,
              time: cancelTime,
            });
        }
      } else if (active.type === "setValueCurve") {
        const curveEv = active.event!;
        const curveStart = curveEv.time;
        const curveDuration = curveEv.duration!;
        const origCurve = curveEv.curve!;

        origCancelScheduled(curveStart);
        if (tl) removeEventsFrom(tl, curveStart);

        const truncDuration = cancelTime - curveStart;
        if (truncDuration > 0 && origCurve.length >= 2) {
          const fraction = truncDuration / curveDuration;
          const numSamples = Math.max(2, Math.round(origCurve.length * fraction));
          const truncCurve = new Float32Array(numSamples);
          for (let j = 0; j < numSamples; j++) {
            const t = (j / (numSamples - 1)) * fraction;
            const scaledIdx = t * (origCurve.length - 1);
            const lo = Math.floor(scaledIdx);
            const hi = Math.min(lo + 1, origCurve.length - 1);
            const interp = scaledIdx - lo;
            truncCurve[j] = origCurve[lo]! * (1 - interp) + origCurve[hi]! * interp;
          }
          truncCurve[truncCurve.length - 1] = holdValue;

          origSetValueCurve(truncCurve, curveStart, truncDuration);
          if (tl)
            insertEvent(tl, {
              type: "setValueCurve",
              value: holdValue,
              time: curveStart,
              duration: truncDuration,
              curve: truncCurve,
            });
        }

        origSetValueAtTime(holdValue, cancelTime);
        if (tl)
          insertEvent(tl, {
            type: "setValueAtTime",
            value: holdValue,
            time: cancelTime,
          });
      } else {
        origCancelScheduled(cancelTime);
        if (tl) removeEventsFrom(tl, cancelTime);
        origSetValueAtTime(holdValue, cancelTime);
        if (tl)
          insertEvent(tl, {
            type: "setValueAtTime",
            value: holdValue,
            time: cancelTime,
          });
      }

      return this;
    };
  }

  // ─── Always add getScheduledValueAtTime ──────────────────────────────

  (param as any).getScheduledValueAtTime = function (time: number): number {
    return computeValueAtTime(param, time);
  };

  return param;
}

/**
 * Polyfill all AudioParams on an AudioNode.
 *
 * Usage:
 *   const gain = ctx.createGain();
 *   polyfillAudioNode(gain); // polyfills gain.gain
 *
 *   const biquad = ctx.createBiquadFilter();
 *   polyfillAudioNode(biquad); // polyfills frequency, detune, Q, gain
 */
export function polyfillAudioNode(node: AudioNode): AudioNode {
  // AudioNode doesn't have a standard way to enumerate its AudioParams,
  // but we can iterate own properties looking for AudioParam instances.
  for (const key of Object.keys(Object.getPrototypeOf(node))) {
    try {
      const val = (node as any)[key];
      if (val instanceof AudioParam) {
        polyfillAudioParam(val);
      }
    } catch {
      // Some getters may throw; skip them
    }
  }
  return node;
}

// Track whether the prototype has already been polyfilled
let prototypePolyfilled = false;

/**
 * Polyfill AudioParam.prototype so that ALL AudioParam instances get:
 *  - cancelAndHoldAtTime (if missing)
 *  - getScheduledValueAtTime
 *  - Event tracking on all scheduling methods
 *
 * This is equivalent to what the auto-polyfill (audio-param-polyfill.ts) does,
 * but invoked manually so you control when it happens.
 *
 * Safe to call multiple times (no-ops on subsequent calls).
 */
export function polyfillAudioParamPrototype(): void {
  if (prototypePolyfilled) return;
  if (typeof AudioParam === "undefined") return;
  prototypePolyfilled = true;

  const proto = AudioParam.prototype;

  // Save original methods from the prototype
  const origSetValueAtTime = proto.setValueAtTime;
  const origLinearRamp = proto.linearRampToValueAtTime;
  const origExponentialRamp = proto.exponentialRampToValueAtTime;
  const origSetTarget = proto.setTargetAtTime;
  const origSetValueCurve = proto.setValueCurveAtTime;
  const origCancelScheduled = proto.cancelScheduledValues;

  // ─── Wrap scheduling methods to track events ───────────────────────

  proto.setValueAtTime = function (value: number, startTime: number): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "setValueAtTime", value, time: startTime });
    return origSetValueAtTime.call(this, value, startTime);
  };

  proto.linearRampToValueAtTime = function (value: number, endTime: number): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "linearRamp", value, time: endTime });
    return origLinearRamp.call(this, value, endTime);
  };

  proto.exponentialRampToValueAtTime = function (value: number, endTime: number): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "exponentialRamp", value, time: endTime });
    return origExponentialRamp.call(this, value, endTime);
  };

  proto.setTargetAtTime = function (
    target: number,
    startTime: number,
    timeConstant: number
  ): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, {
      type: "setTarget",
      value: target,
      time: startTime,
      timeConstant,
    });
    return origSetTarget.call(this, target, startTime, timeConstant);
  };

  proto.setValueCurveAtTime = function (
    values: Iterable<number>,
    startTime: number,
    duration: number
  ): AudioParam {
    const arr = values instanceof Float32Array ? values : new Float32Array(values as number[]);
    const tl = getTimeline(this);
    insertEvent(tl, {
      type: "setValueCurve",
      value: arr[arr.length - 1]!,
      time: startTime,
      duration,
      curve: new Float32Array(arr),
    });
    return origSetValueCurve.call(this, values, startTime, duration);
  };

  proto.cancelScheduledValues = function (startTime: number): AudioParam {
    const tl = timelines.get(this);
    if (tl) {
      removeEventsFrom(tl, startTime);
    }
    return origCancelScheduled.call(this, startTime);
  };

  // ─── Polyfill cancelAndHoldAtTime (only if missing) ────────────────

  if (typeof proto.cancelAndHoldAtTime !== "function") {
    proto.cancelAndHoldAtTime = function (cancelTime: number): AudioParam {
      const tl = timelines.get(this);
      const holdValue = computeValueAtTime(this, cancelTime);
      const active = findActiveAutomation(tl, cancelTime);

      if (active.type === "linearRamp" || active.type === "exponentialRamp") {
        origCancelScheduled.call(this, cancelTime);
        if (tl) removeEventsFrom(tl, cancelTime);

        if (active.type === "linearRamp") {
          origLinearRamp.call(this, holdValue, cancelTime);
          if (tl)
            insertEvent(tl, {
              type: "linearRamp",
              value: holdValue,
              time: cancelTime,
            });
        } else {
          const safeHold = holdValue === 0 ? 1e-30 : holdValue;
          origExponentialRamp.call(this, safeHold, cancelTime);
          if (tl)
            insertEvent(tl, {
              type: "exponentialRamp",
              value: safeHold,
              time: cancelTime,
            });
        }
      } else if (active.type === "setValueCurve") {
        const curveEv = active.event!;
        const curveStart = curveEv.time;
        const curveDuration = curveEv.duration!;
        const origCurve = curveEv.curve!;

        origCancelScheduled.call(this, curveStart);
        if (tl) removeEventsFrom(tl, curveStart);

        const truncDuration = cancelTime - curveStart;
        if (truncDuration > 0 && origCurve.length >= 2) {
          const fraction = truncDuration / curveDuration;
          const numSamples = Math.max(2, Math.round(origCurve.length * fraction));
          const truncCurve = new Float32Array(numSamples);
          for (let j = 0; j < numSamples; j++) {
            const t = (j / (numSamples - 1)) * fraction;
            const scaledIdx = t * (origCurve.length - 1);
            const lo = Math.floor(scaledIdx);
            const hi = Math.min(lo + 1, origCurve.length - 1);
            const interp = scaledIdx - lo;
            truncCurve[j] = origCurve[lo]! * (1 - interp) + origCurve[hi]! * interp;
          }
          truncCurve[truncCurve.length - 1] = holdValue;

          origSetValueCurve.call(this, truncCurve, curveStart, truncDuration);
          if (tl)
            insertEvent(tl, {
              type: "setValueCurve",
              value: holdValue,
              time: curveStart,
              duration: truncDuration,
              curve: truncCurve,
            });
        }

        origSetValueAtTime.call(this, holdValue, cancelTime);
        if (tl)
          insertEvent(tl, {
            type: "setValueAtTime",
            value: holdValue,
            time: cancelTime,
          });
      } else {
        origCancelScheduled.call(this, cancelTime);
        if (tl) removeEventsFrom(tl, cancelTime);
        origSetValueAtTime.call(this, holdValue, cancelTime);
        if (tl)
          insertEvent(tl, {
            type: "setValueAtTime",
            value: holdValue,
            time: cancelTime,
          });
      }

      return this;
    };
  }

  // ─── Always add getScheduledValueAtTime ──────────────────────────────

  (proto as any).getScheduledValueAtTime = function (time: number): number {
    return computeValueAtTime(this, time);
  };
}
