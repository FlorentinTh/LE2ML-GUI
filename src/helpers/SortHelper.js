class SortHelper {
  static sortArrayAlpha(array, prop, order) {
    if (typeof array === 'object') {
      if (typeof prop === 'string') {
        if (
          typeof order === 'string' &&
          (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')
        ) {
          const asc = order.toUpperCase() === 'ASC';
          if (asc) {
            return array.sort((a, b) => a[prop].localeCompare(b[prop]));
          }
          return array.sort((a, b) => a[prop].localeCompare(b[prop])).reverse();
        } else {
          throw new Error('Expected type for argument order is "ASC" or "DESC".');
        }
      } else {
        throw new Error('Expected type for argument prop is String.');
      }
    } else {
      throw new Error('Expected type for argument array is Object.');
    }
  }

  static sortArrayByDate(array, prop, order) {
    if (typeof array === 'object') {
      if (typeof prop === 'string') {
        if (
          typeof order === 'string' &&
          (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')
        ) {
          const asc = order.toUpperCase() === 'ASC';
          if (asc) {
            return array.sort((a, b) => new Date(a[prop]) - new Date(b[prop]));
          }
          return array.sort((a, b) => new Date(a[prop]) - new Date(b[prop])).reverse();
        } else {
          throw new Error('Expected type for argument order is "ASC" or "DESC".');
        }
      } else {
        throw new Error('Expected type for argument prop is String.');
      }
    } else {
      throw new Error('Expected type for argument array is Object.');
    }
  }
}

export default SortHelper;