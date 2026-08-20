const pinchGestures = ['gesturestart', 'gesturechange', 'gestureend'];

export function blockPinchZoom(): void {
  for (const gesture of pinchGestures) {
    document.addEventListener(gesture, event => event.preventDefault());
  }
}
