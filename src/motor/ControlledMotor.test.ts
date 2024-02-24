import { FixedFramerateLoop } from 'fixed-framerate-loop';
import { Motor } from './Motor';
import { ControlledMotor, Policy } from "./ControlledMotor";

describe('ControlledMotor', () => {
  let motor: Motor;
  let controlledMotor: ControlledMotor;
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

  it('should perform cycle with incoming priority', () => {
    controlledMotor = new ControlledMotor(motor, {
      policy: Policy.INCOMING_CYCLE_PRIORITY,
    });

    const mockCycle = { refresh: jest.fn() };
    const updateData = 'testData';

    controlledMotor.loop(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycle, updateData, 60);

    motor.startLoop();
    loop(100);

    expect(mockCycle.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      cycle: mockCycle,
    }));
  });

  it('should perform cycle with active priority', () => {
    controlledMotor = new ControlledMotor(motor, {
      policy: Policy.ACTIVE_CYCLE_PRIORITY,
    });

    const mockCycle = { refresh: jest.fn() };
    const updateData = 'testData';

    controlledMotor.loop(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycle, updateData, 60);

    motor.startLoop();
    loop(100);

    expect(mockCycle.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      cycle: mockCycle,
    }));
  });

  it('should stop active cycle if new cycle comes in', () => {
    controlledMotor = new ControlledMotor(motor, {
      policy: Policy.INCOMING_CYCLE_PRIORITY,
    });

    const mockCycle = { refresh: jest.fn() };
    const mockCycleIncoming = { refresh: jest.fn() };
    const updateData = 'testData';

    controlledMotor.loop(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycleIncoming, updateData, 60);

    motor.startLoop();
    loop(100);

    expect(mockCycleIncoming.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      cycle: mockCycle,
    }));
    expect(mockCycle.refresh).not.toHaveBeenCalled();
  });


  it('should block incoming cycle', () => {
    controlledMotor = new ControlledMotor(motor, {
      policy: Policy.ACTIVE_CYCLE_PRIORITY,
    });

    const mockCycle = { refresh: jest.fn() };
    const mockCycleIncoming = { refresh: jest.fn() };
    const updateData = 'testData';

    controlledMotor.loop(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycle, updateData, 60);
    controlledMotor.scheduleUpdate(mockCycleIncoming, updateData, 60);

    motor.startLoop();
    loop(100);

    expect(mockCycle.refresh).toHaveBeenCalledWith(expect.objectContaining({
      deltaTime: expect.any(Number),
      data: updateData,
      renderFrame: true,
      cycle: mockCycle,
    }));
    expect(mockCycleIncoming.refresh).not.toHaveBeenCalled();
  });
});
