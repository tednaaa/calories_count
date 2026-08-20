export interface ListScroll {
  scrollTop: number;
  scrollable: number;
  headerHeight: number;
}

export function nextCompact(compact: boolean, list: ListScroll): boolean {
  if (list.scrollTop <= 0) {
    return false;
  }

  return compact || list.scrollable > list.headerHeight;
}
