import { Duration, Time } from "../Time";
import { Refresh } from "./Refresh";


export interface UpdatePayload<T = undefined> {
  time: Time;
  deltaTime: Duration;
  data: T;
  renderFrame: boolean;
  refresher: Refresh<T>;
  stopped: boolean;
  stopUpdate(): void;
}
