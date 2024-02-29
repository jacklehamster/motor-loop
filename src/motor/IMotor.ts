import { Cycle } from "./update/Cycle";
import { ITimeProvider } from "./Time";
import { Active } from "dok-types";

export interface IMotor extends ITimeProvider, Active {
  loop<T>(cycle: Cycle<T>, data: T, frameRate?: number): void;
  scheduleUpdate<T>(cycle: Cycle<T>, data?: T, refreshRate?: number, future?: boolean): void;
  stopUpdate<T>(cycle: Cycle<T>): void;
}
