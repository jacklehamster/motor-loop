import { Cycle } from "./update/Cycle";
import { ITimeProvider } from "./Time";

export interface IMotor extends ITimeProvider {
  loop<T>(cycle: Cycle<T>, data: T, frameRate?: number): void;
  scheduleUpdate<T>(cycle: Cycle<T>, data?: T, refreshRate?: number, future?: boolean): void;
  stopUpdate<T>(cycle: Cycle<T>): void;
}
