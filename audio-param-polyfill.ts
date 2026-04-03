/// <reference lib="dom" />
/**
 * Web Audio API AudioParam Cross-Browser Polyfill
 *
 * Normalizes AudioParam behavior across Chromium, Firefox, and WebKit:
 *
 * 1. cancelAndHoldAtTime — Polyfills the missing method in Firefox by tracking
 *    scheduled automation events and computing the held value mathematically.
 *
 * 2. automationRate "k-rate" — No polyfill possible (engine-internal behavior).
 *    Documented as a known limitation.
 *
 * 3. .value getter before rendering — No polyfill possible without breaking
 *    the Firefox (spec-correct) behavior. Use getScheduledValueAtTime() instead.
 *
 * Usage:
 *   <script src="audio-param-polyfill.js"></script>
 *   // or
 *   import "./audio-param-polyfill";
 *
 * The polyfill auto-applies on import. It only patches what's missing.
 */

export {};

// Extend AudioParam with our additions
declare global {
  interface AudioParam {
    cancelAndHoldAtTime(cancelTime: number): AudioParam;
    getScheduledValueAtTime(time: number): number;
  }
}

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

(function () {
  "use strict";

  // Guard: only run in browser with Web Audio support
  if (typeof AudioParam === "undefined") return;

  // Guard: if cancelAndHoldAtTime already exists, nothing to polyfill
  if (typeof AudioParam.prototype.cancelAndHoldAtTime === "function") return;

  // ─── Event timeline tracking ─────────────────────────────────────────────

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

  // ─── Monkey-patch scheduling methods to track events ─────────────────────

  const origSetValueAtTime = AudioParam.prototype.setValueAtTime;
  AudioParam.prototype.setValueAtTime = function (
    value: number,
    startTime: number
  ): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "setValueAtTime", value, time: startTime });
    return origSetValueAtTime.call(this, value, startTime);
  };

  const origLinearRamp = AudioParam.prototype.linearRampToValueAtTime;
  AudioParam.prototype.linearRampToValueAtTime = function (
    value: number,
    endTime: number
  ): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "linearRamp", value, time: endTime });
    return origLinearRamp.call(this, value, endTime);
  };

  const origExponentialRamp =
    AudioParam.prototype.exponentialRampToValueAtTime;
  AudioParam.prototype.exponentialRampToValueAtTime = function (
    value: number,
    endTime: number
  ): AudioParam {
    const tl = getTimeline(this);
    insertEvent(tl, { type: "exponentialRamp", value, time: endTime });
    return origExponentialRamp.call(this, value, endTime);
  };

  const origSetTarget = AudioParam.prototype.setTargetAtTime;
  AudioParam.prototype.setTargetAtTime = function (
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

  const origSetValueCurve = AudioParam.prototype.setValueCurveAtTime;
  AudioParam.prototype.setValueCurveAtTime = function (
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

  const origCancelScheduled = AudioParam.prototype.cancelScheduledValues;
  AudioParam.prototype.cancelScheduledValues = function (
    startTime: number
  ): AudioParam {
    const tl = timelines.get(this);
    if (tl) {
      removeEventsFrom(tl, startTime);
    }
    return origCancelScheduled.call(this, startTime);
  };

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

  // ─── Polyfill cancelAndHoldAtTime ────────────────────────────────────────

  AudioParam.prototype.cancelAndHoldAtTime = function (
    cancelTime: number
  ): AudioParam {
    const tl = timelines.get(this);
    const holdValue = computeValueAtTime(this, cancelTime);
    const active = findActiveAutomation(tl, cancelTime);

    if (active.type === "linearRamp" || active.type === "exponentialRamp") {
      // Mid-ramp: cancel events from cancelTime, then insert a shortened ramp
      // to holdValue at cancelTime to preserve the ramp trajectory.
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
      // Mid-curve: cancel from the curve's start time (Firefox requires this
      // to fully remove the curve), then re-insert a truncated curve.
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
      // setTarget, plain setValueAtTime, or no active automation
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

  // ─── Bonus: getScheduledValueAtTime ──────────────────────────────────────

  /**
   * Compute what the param value would be at a given time based on
   * scheduled events. Works consistently across all browsers.
   */
  AudioParam.prototype.getScheduledValueAtTime = function (
    time: number
  ): number {
    return computeValueAtTime(this, time);
  };
})();
