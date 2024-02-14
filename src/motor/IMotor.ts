import { Cycle } from "./update/Cycle";
import { ITimeProvider } from "./Time";

export interface IMotor extends ITimeProvider {
  loop<T>(update: Cycle<T>, data: T, frameRate?: number): void;
  scheduleUpdate<T>(update: Cycle<T>, data?: T, refreshRate?: number, future?: boolean): void;
  stopUpdate<T>(update: Cycle<T>): void;
}
