// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { Time } from "./Time";
import { Refresh } from "./update/Refresh";
import { UpdatePayload } from "./update/UpdatePayload";
import { IMotor } from "./IMotor";
import { Duration } from "./Time";
import { Priority } from "./Priority";
import { MapPool } from "bun-pool";
import { ObjectPool } from "bun-pool";

/**
 * Continously runs a loop which feeds a world into the GL Engine.
 */
const MILLIS_IN_SEC = 1000;
const DEFAULT_FRAME_PERIOD = 16.5;  //  base of 60fps
const MAX_LOOP_JUMP = 10;

interface Appointment {
  meetingTime: Time;
  period: Duration;
  frameRate: number;
  data: any;
}

type Schedule = Map<Refresh<any>, Appointment>;

interface Props {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
}

interface Config {
  framePeriod: number;
  frameRate: number;
  maxLoopJump: number;
}

export class Motor implements IMotor {
  private readonly apptPool = new AppointmentPool();
  private readonly schedulePool = new MapPool<Refresh<any>, Appointment>();
  private schedule: Schedule = this.schedulePool.create();
  time: Time = 0;
  private readonly requestAnimationFrame;
  private readonly cancelAnimationFrame;
  private readonly framePeriod;
  private readonly maxLoopJump;

  constructor({
    requestAnimationFrame = globalThis.requestAnimationFrame.bind(globalThis),
    cancelAnimationFrame = globalThis.cancelAnimationFrame.bind(globalThis) }: Partial<Props> = {},
    { framePeriod, frameRate, maxLoopJump = MAX_LOOP_JUMP }: Partial<Config> = {}) {
    this.requestAnimationFrame = requestAnimationFrame;
    this.cancelAnimationFrame = cancelAnimationFrame;
    this.maxLoopJump = maxLoopJump;
    this.framePeriod = framePeriod ?? (frameRate ? 1000 / frameRate : undefined) ?? DEFAULT_FRAME_PERIOD;
  }

  loop<T>(update: Refresh<T>, data: T, frameRate?: number) {
    this.scheduleUpdate<T>(update, data, frameRate ?? 1000);
  }

  scheduleUpdate<T>(update: Refresh<T>, data?: T, refreshRate: number = 0, future?: boolean) {
    let appt = this.schedule.get(update);
    if (!appt) {
      this.schedule.set(update, appt = this.apptPool.create(refreshRate, data));
    } else if (appt.frameRate !== refreshRate) {
      appt.frameRate = refreshRate;
      appt.period = refreshRate ? 1000 / refreshRate : 0;
      appt.data = data;
    }
    if (future) {
      appt.meetingTime = this.time + DEFAULT_FRAME_PERIOD;
    }
  }

  stopUpdate<T>(update: Refresh<T>) {
    const appt = this.schedule.get(update);
    if (appt) {
      this.apptPool.recycle(appt);
    }
    this.schedule.delete(update);
  }

  deactivate(): void {
    this.stopLoop?.();
  }

  activate() {
    this.startLoop();
  }

  startLoop() {
    const updatePayload: UpdatePayload = {
      time: 0,
      deltaTime: this.framePeriod,
      data: undefined,
      renderFrame: true,
      motor: this,
      refresher: { refresh: () => { } },
      stopUpdate() {
        this.motor.stopUpdate(this.refresher);
      },
    };
    updatePayload.stopUpdate = updatePayload.stopUpdate.bind(updatePayload);

    const performUpdate = (time: number, updatePayload: UpdatePayload) => {
      this.time = updatePayload.time = time;

      let agenda: Schedule | undefined = this.schedule;
      const futureSchedule = this.schedulePool.create();
      const finalSchedule = this.schedulePool.create();

      let limit = 100;
      let final = false;
      while (agenda) {
        if (limit-- < 0) {
          throw new Error("We keep scheduling updates within updates.");
        }
        this.schedule = this.schedulePool.create();
        agenda.forEach((appt, update) => {
          if (time < appt.meetingTime) {
            futureSchedule.set(update, appt);
            return;
          }
          if (!final && update.priority === Priority.LAST) {
            finalSchedule.set(update, appt);  //  defer
            return;
          }
          updatePayload.data = appt.data;
          updatePayload.refresher = update;
          update.refresh(updatePayload);
          if (appt.period) {
            appt.meetingTime = Math.max(appt.meetingTime + appt.period, time);
            futureSchedule.set(update, appt);
          } else {
            this.apptPool.recycle(appt);
          }
        });
        this.schedulePool.recycle(agenda);

        //  agenda complete. Check if other updates got scheduled
        if (!final) {
          if (this.schedule.size) {
            agenda = this.schedule;
          } else {
            this.schedulePool.recycle(this.schedule);
            final = true;
            agenda = finalSchedule;
          }
        } else {
          this.schedulePool.recycle(this.schedule);
          agenda = undefined;
          this.schedule = futureSchedule;
        }
      }
    }

    let timeOffset = 0;
    let gameTime = 0;

    const { maxLoopJump, framePeriod, requestAnimationFrame, cancelAnimationFrame } = this;
    const loop: FrameRequestCallback = time => {
      handle = requestAnimationFrame(loop);
      let loopCount = Math.ceil((time + timeOffset - gameTime) / framePeriod);
      if (loopCount > maxLoopJump) {
        timeOffset -= framePeriod * (loopCount - maxLoopJump);
        loopCount = maxLoopJump;
      }
      for (let i = 0; i < loopCount; i++) {
        gameTime += framePeriod;
        updatePayload.renderFrame = i === loopCount - 1;
        performUpdate(gameTime, updatePayload);
      }
    };
    let handle = requestAnimationFrame(loop);

    this.stopLoop = () => {
      cancelAnimationFrame(handle);
      this.stopLoop = undefined;
      this.apptPool.clear();
    };
  }

  stopLoop?(): void;
}

class AppointmentPool extends ObjectPool<Appointment, [number, any]> {
  constructor() {
    super((appt, frameRate, data) => {
      if (!appt) {
        return { meetingTime: 0, frameRate, period: frameRate ? MILLIS_IN_SEC / frameRate : 0, data }
      }
      appt.meetingTime = 0;
      appt.period = frameRate ? MILLIS_IN_SEC / frameRate : 0;
      appt.frameRate = frameRate;
      appt.data = data;
      return appt;
    });
  }
}
