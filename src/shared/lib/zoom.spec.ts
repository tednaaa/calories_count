import { blockPinchZoom } from './zoom';

describe('blockPinchZoom', () => {
  it('отменяет вебкитовский щипок', () => {
    blockPinchZoom();

    const gesture = new Event('gesturestart', { cancelable: true });
    document.dispatchEvent(gesture);

    expect(gesture.defaultPrevented).toBe(true);
  });

  it('не трогает обычный тап', () => {
    blockPinchZoom();

    const click = new Event('click', { cancelable: true });
    document.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
  });
});
