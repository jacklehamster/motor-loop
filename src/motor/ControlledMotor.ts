import { IMotor } from "./IMotor";
import { Cycle } from "./update/Cycle";

export enum Policy {
  ACTIVE_CYCLE_PRIORITY = 0,
  INCOMING_CYCLE_PRIORITY = 1,
}

export interface Config {
  policy: Policy;
}

export class ControlledMotor implements IMotor {
  private activeCycle?: Cycle<any>;
  readonly #policy;
  constructor(private motor: IMotor, config: Partial<Config> = {}) {
    this.#policy = config.policy ?? Policy.ACTIVE_CYCLE_PRIORITY;
  }

  loop<T>(cycle: Cycle<T>, data: T, frameRate?: number | undefined): void {
    this.scheduleUpdate<T>(cycle, data, frameRate ?? 1000);
  }

  scheduleUpdate<T>(cycle: Cycle<T>, data?: T | undefined, refreshRate?: number | undefined, future?: boolean | undefined): void {
    if (this.activeCycle) {
      if (this.#policy === Policy.ACTIVE_CYCLE_PRIORITY) {
        return;
      }
      this.stopUpdate(this.activeCycle);
    }
    this.activeCycle = cycle;
    this.motor.scheduleUpdate(cycle, data, refreshRate);
  }

  stopUpdate<T>(cycle: Cycle<T>): void {
    this.motor.stopUpdate(cycle);
  }

  get time(): number {
    return this.motor.time;
  }
}
