export default function(obj) {
  if (!(typeof obj === 'object')) {
    return NaN;
  }
  return Object.keys(obj).length;
}
