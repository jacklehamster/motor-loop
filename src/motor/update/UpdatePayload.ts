import { Duration, Time } from "../Time";
import { Cycle } from "./Cycle";


export interface UpdatePayload<T = undefined> {
  time: Time;
  deltaTime: Duration;
  data: T;
  renderFrame: boolean;
  cycle: Cycle<T>;
  stopped: boolean;
  stopUpdate(): void;
}
