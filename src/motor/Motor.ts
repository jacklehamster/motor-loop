// To recognize dom types (see https://bun.sh/docs/typescript#dom-types):
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { Time } from "./Time";
import { Cycle } from "./update/Cycle";
import { UpdatePayload } from "./update/UpdatePayload";
import { IMotor } from "./IMotor";
import { Duration } from "./Time";
import { Priority } from "./Priority";
import { MapPool } from "bun-pool";
import { ObjectPool } from "bun-pool";
import { FixedFramerateLoop, ILoopExecutor, DEFAULT_FRAME_DURATION } from "fixed-framerate-loop"

/**
 * Continously runs a loop which feeds a world into the GL Engine.
 */
const MILLIS_IN_SEC = 1000;

interface Appointment {
  meetingTime: Time;
  period: Duration;
  frameRate: number;
  data: any;
}

type Schedule = Map<Cycle<any>, Appointment>;

interface Config {
  frameDuration: number;
  frameRate: number;
}

interface Props {
  loopExecutor: ILoopExecutor;
}

interface Config {
  frameRate: number;
  frameDuration: number;
}

export class Motor implements IMotor {
  time: Time = 0;
  private readonly apptPool = new AppointmentPool();
  private readonly schedulePool = new MapPool<Cycle<any>, Appointment>();
  private schedule: Schedule = this.schedulePool.create();
  private readonly loopExecutor: ILoopExecutor;
  private readonly frameDuration: number;

  constructor({ loopExecutor }: Partial<Props> = {}, config: Partial<Config> = {}) {
    this.loopExecutor = loopExecutor ?? new FixedFramerateLoop();
    this.frameDuration = config.frameDuration ?? (config.frameRate ? (1000 / config.frameRate) : undefined) ?? DEFAULT_FRAME_DURATION;
  }

  loop<T>(cycle: Cycle<T>, data: T, frameRate?: number) {
    this.scheduleUpdate<T>(cycle, data, frameRate ?? 1000);
  }

  scheduleUpdate<T>(cycle: Cycle<T>, data?: T, refreshRate: number = 0, future?: boolean) {
    let appt = this.schedule.get(cycle);
    if (!appt) {
      this.schedule.set(cycle, appt = this.apptPool.create(refreshRate, data));
    } else if (appt.frameRate !== refreshRate) {
      appt.frameRate = refreshRate;
      appt.period = refreshRate ? 1000 / refreshRate : 0;
      appt.data = data;
    }
    if (future) {
      appt.meetingTime = this.time + DEFAULT_FRAME_DURATION;
    }
  }

  stopUpdate<T>(cycle: Cycle<T>) {
    const appt = this.schedule.get(cycle);
    if (appt) {
      this.apptPool.recycle(appt);
    }
    this.schedule.delete(cycle);
  }

  startLoop() {
    const updatePayload: UpdatePayload = {
      time: 0,
      deltaTime: this.frameDuration,
      data: undefined,
      renderFrame: true,
      cycle: { refresh: () => { } },
      stopUpdate() {
        this.stopped = true;
      },
      stopped: false,
    };
    updatePayload.stopUpdate = updatePayload.stopUpdate.bind(updatePayload);

    const performUpdate = (updatePayload: UpdatePayload) => {
      if (!this.schedule.size) {
        return;
      }
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
        for (const entry of agenda) {
          const update = entry[0];
          const appt = entry[1];

          if (updatePayload.time < appt.meetingTime) {
            futureSchedule.set(update, appt);
            continue;
          }
          if (!final && update.priority === Priority.LAST) {
            finalSchedule.set(update, appt);  //  defer
            continue;
          }
          updatePayload.data = appt.data;
          updatePayload.cycle = update;
          updatePayload.stopped = false;
          update.refresh(updatePayload);
          if (appt.period && !updatePayload.stopped) {
            appt.meetingTime = Math.max(appt.meetingTime + appt.period, updatePayload.time);
            futureSchedule.set(update, appt);
          } else {
            this.apptPool.recycle(appt);
          }
        }
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

    const stopLoop = this.loopExecutor.startLoop((time, render) => {
      this.time = updatePayload.time = time;
      updatePayload.renderFrame = render;
      performUpdate(updatePayload);
    }, { frameDuration: this.frameDuration });

    this.stopLoop = () => {
      stopLoop();
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
