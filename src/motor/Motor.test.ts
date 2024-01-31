import { FixedFramerateLoop } from 'fixed-framerate-loop';
import { Motor } from './Motor';

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
    const mockRefresh = { refresh: jest.fn() };
    const updateData = 'testData';

    motor.loop(mockRefresh, updateData, 60);

    // Manually trigger the loop
    motor.startLoop();
    loop(100);

    // You can add assertions here based on your expectations
    // For example:
    expect(mockRefresh.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      motor: motor,
      refresher: mockRefresh,
    }));
  });

  it('should stop the scheduled update when stopUpdate is called', () => {
    const mockRefresh = { refresh: jest.fn() };
    const updateData = 42;

    motor.loop(mockRefresh, updateData, 60);
    motor.stopUpdate(mockRefresh);

    // Manually trigger the loop
    motor.startLoop();
    loop(100);

    expect(mockRefresh.refresh).not.toHaveBeenCalled();
  });
});
