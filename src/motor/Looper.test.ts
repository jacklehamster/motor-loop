import { Looper } from './Looper';
import { IMotor } from './IMotor';
import { Cycle } from './update/Cycle';
import { UpdatePayload } from './update/UpdatePayload';
import { Priority } from './Priority';

describe('Looper', () => {
  let motor: jest.Mocked<IMotor>;
  let cycle: jest.Mocked<Cycle<any>>;

  beforeEach(() => {
    motor = {
      loop: jest.fn(),
      stopUpdate: jest.fn(),
      scheduleUpdate: jest.fn(),
      time: 0,
    };
    cycle = {
      refresh: jest.fn(),
      priority: Priority.DEFAULT,
    };
  });

  it('should start the loop when autoStart is true', () => {
    const looper = new Looper({ motor, data: { value: 123 }, cycle: cycle }, { autoStart: true });
    looper.activate();
    expect(motor.loop).toHaveBeenCalledTimes(1);
  });

  it('should not start the loop when autoStart is false', () => {
    const looper = new Looper({ motor, data: { value: 123 }, cycle: cycle }, { autoStart: false });
    looper.activate();
    expect(motor.loop).not.toHaveBeenCalled();
  });

  it('should stop update when deactivated', () => {
    const looper = new Looper({ motor, data: { value: 123 }, cycle: cycle }, { autoStart: true });
    looper.activate();
    looper.deactivate();
    expect(motor.stopUpdate).toHaveBeenCalledTimes(1);
  });

  it('should refresh', () => {
    const looper = new Looper({ motor, data: { value: 123 }, cycle: cycle }, { autoStart: true });
    looper.activate();
    const updatePayload = {} as UpdatePayload<any>;
    looper.refresh(updatePayload);
    expect(cycle.refresh).toHaveBeenCalledTimes(1);
  });
});
