function atIndex(list, index) {
  let at = Math.trunc(index);
  if (Number.isNaN(at)) at = 0;
  if (at < 0) at += list.length;
  if (at < 0 || at >= list.length) return void 0;
  return list[at];
}
function lastIndexWhere(list, predicate) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i], i)) return i;
  }
  return -1;
}
export {
  atIndex,
  lastIndexWhere
};
