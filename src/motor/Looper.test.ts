import { Looper } from './Looper';
import { IMotor } from './IMotor';
import { Refresh } from './update/Refresh';
import { UpdatePayload } from './update/UpdatePayload';
import { Priority } from './Priority';

describe('Looper', () => {
  let motor: jest.Mocked<IMotor>;
  let refresher: jest.Mocked<Refresh<any>>;

  beforeEach(() => {
    motor = {
      loop: jest.fn(),
      stopUpdate: jest.fn(),
      scheduleUpdate: jest.fn(),
      time: 0,
    };
    refresher = {
      refresh: jest.fn(),
      priority: Priority.DEFAULT,
    };
  });

  it('should start the loop when autoStart is true', () => {
    const looper = new Looper({ motor, data: { value: 123 }, refresher }, { autoStart: true });
    looper.activate();
    expect(motor.loop).toHaveBeenCalledTimes(1);
  });

  it('should not start the loop when autoStart is false', () => {
    const looper = new Looper({ motor, data: { value: 123 }, refresher }, { autoStart: false });
    looper.activate();
    expect(motor.loop).not.toHaveBeenCalled();
  });

  it('should stop update when deactivated', () => {
    const looper = new Looper({ motor, data: { value: 123 }, refresher }, { autoStart: true });
    looper.activate();
    looper.deactivate();
    expect(motor.stopUpdate).toHaveBeenCalledTimes(1);
  });

  it('should refresh', () => {
    const looper = new Looper({ motor, data: { value: 123 }, refresher }, { autoStart: true });
    looper.activate();
    const updatePayload = {} as UpdatePayload<any>;
    looper.refresh(updatePayload);
    expect(refresher.refresh).toHaveBeenCalledTimes(1);
  });
});
