export function scrollReserve(headerHeight: number, scrollable: number): number {
  return Math.max(0, headerHeight - scrollable);
}
