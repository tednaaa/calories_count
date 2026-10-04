import { blockPinchZoom } from './zoom';

describe('blockPinchZoom', () => {
  it('cancels the WebKit pinch gesture', () => {
    blockPinchZoom();

    const gesture = new Event('gesturestart', { cancelable: true });
    document.dispatchEvent(gesture);

    expect(gesture.defaultPrevented).toBe(true);
  });

  it('leaves a regular tap alone', () => {
    blockPinchZoom();

    const click = new Event('click', { cancelable: true });
    document.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
  });
});
