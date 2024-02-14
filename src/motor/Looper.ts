import { Cycle } from "./update/Cycle";
import { UpdatePayload } from "./update/UpdatePayload";
import { IMotor } from "./IMotor";

interface Props<T> {
  motor: IMotor;
  data: T;
  cycle?: Cycle<T>;
}

interface Config {
  autoStart: boolean;
}

export class Looper<T = undefined> implements Cycle<T> {
  #cycle;
  #motor;
  #data;
  #autoStart;
  constructor({ motor, data, cycle }: Props<T>, { autoStart }: Config) {
    this.#cycle = cycle;
    this.#motor = motor;
    this.#data = data;
    this.#autoStart = autoStart;
  }

  refresh(updatePayload: UpdatePayload<T>): void {
    this.#cycle?.refresh(updatePayload);
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
