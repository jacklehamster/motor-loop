import { FixedFramerateLoop } from 'fixed-framerate-loop';
import { Motor } from './Motor';
import { UpdatePayload } from './update/UpdatePayload';

describe('Motor', () => {
  let motor: Motor;
  let requestAnimationFrame: jest.Mock;
  let cancelAnimationFrame: jest.Mock<any, any, any>;
  let loop: FrameRequestCallback;

  beforeEach(() => {
    requestAnimationFrame = jest.fn();
    cancelAnimationFrame = jest.fn();
    motor = new Motor({ loopExecutor: new FixedFramerateLoop({ requestAnimationFrame, cancelAnimationFrame }) });
    requestAnimationFrame.mockImplementation((l) => loop = l)
  });

  afterEach(() => {
    // Clear any scheduled updates and stop the loop after each test
    motor.stopLoop?.();
  });

  it('should schedule and execute a single update', () => {
    const mockUpdate = { refresh: jest.fn() };
    const updateData = 'testData';

    motor.loop(mockUpdate, updateData, 60);

    // Manually trigger the loop
    motor.startLoop();
    loop(100);

    // You can add assertions here based on your expectations
    // For example:
    expect(mockUpdate.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      motor: motor,
      refresher: mockUpdate,
    }));
  });

  it('should stop the scheduled update when stopUpdate is called', () => {
    const mockUpdate = { refresh: jest.fn() };
    const updateData = 42;

    motor.loop(mockUpdate, updateData, 60);
    motor.stopUpdate(mockUpdate);

    // Manually trigger the loop
    motor.startLoop();
    loop(100);

    expect(mockUpdate.refresh).not.toHaveBeenCalled();
  });

  it('should stop the scheduled update when stopUpdate is called from refresh', () => {
    const mockUpdate = {
      refresh: jest.fn().mockImplementation((payload: UpdatePayload) => {
        payload.stopUpdate();
      })
    };
    const updateData = 42;

    //  dummy
    motor.loop({ refresh: () => { } }, updateData, 60);

    motor.loop(mockUpdate, updateData, 60);

    // Manually trigger the loop
    motor.startLoop();
    loop(100);
    loop(200);

    expect(mockUpdate.refresh).toHaveBeenCalledTimes(1);
  });
});
