import { Refresh } from "./update/Refresh";
import { ITimeProvider } from "./Time";

export interface IMotor extends ITimeProvider {
  loop<T>(update: Refresh<T>, data: T, frameRate?: number): void;
  scheduleUpdate<T>(update: Refresh<T>, data?: T, refreshRate?: number, future?: boolean): void;
  stopUpdate<T>(update: Refresh<T>): void;
}
