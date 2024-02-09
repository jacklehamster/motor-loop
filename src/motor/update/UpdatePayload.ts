import { Duration, Time } from "../Time";
import { IMotor } from "../IMotor";
import { Refresh } from "./Refresh";


export interface UpdatePayload<T = undefined> {
  time: Time;
  deltaTime: Duration;
  data: T;
  renderFrame: boolean;
  motor: IMotor;
  refresher: Refresh;
  stopped: boolean;
  stopUpdate(): void;
}
