class ListHelper {
  static insertAt(array, index, data) {
    Array.prototype.splice.apply(array, [index, 0].concat(data));
    return array;
  }
}

export default ListHelper;
