import { Refresh } from "./update/Refresh";
import { UpdatePayload } from "./update/UpdatePayload";
import { IMotor } from "./IMotor";

interface Props<T> {
  motor: IMotor;
  data: T;
  refresher?: Refresh<T>;
}

interface Config {
  autoStart: boolean;
}

export class Looper<T = undefined> implements Refresh<T> {
  #refresher;
  #motor;
  #data;
  #autoStart;
  constructor({ motor, data, refresher }: Props<T>, { autoStart }: Config) {
    this.#refresher = refresher;
    this.#motor = motor;
    this.#data = data;
    this.#autoStart = autoStart;
  }

  refresh(updatePayload: UpdatePayload<T>): void {
    this.#refresher?.refresh(updatePayload);
  }

  activate(): void {
    if (this.#autoStart) {
      this.start();
    }
  }

  deactivate(): void {
    this.#motor.stopUpdate(this);
  }

  protected start() {
    this.#motor.loop(this, this.#data);
  }
}
