class SortHelper {
  static sortArrayAlpha(array, prop, order, subprop = false) {
    if (typeof array === 'object') {
      if (typeof prop === 'string') {
        if (
          typeof order === 'string' &&
          (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')
        ) {
          const asc = order.toUpperCase() === 'ASC';
          if (asc) {
            if (subprop) {
              return array.sort((a, b) =>
                a[prop.split('.')[0]][prop.split('.')[1]].localeCompare(
                  b[prop.split('.')[0]][prop.split('.')[1]],
                  undefined,
                  {
                    numeric: true,
                    sensitivity: 'base'
                  }
                )
              );
            }
            return array.sort((a, b) =>
              a[prop].localeCompare(b[prop], undefined, {
                numeric: true,
                sensitivity: 'base'
              })
            );
          }

          if (subprop) {
            return array
              .sort((a, b) =>
                a[prop.split('.')[0]][prop.split('.')[1]].localeCompare(
                  b[prop.split('.')[0]][prop.split('.')[1]],
                  undefined,
                  {
                    numeric: true,
                    sensitivity: 'base'
                  }
                )
              )
              .reverse();
          }

          return array
            .sort((a, b) =>
              a[prop].localeCompare(b[prop], undefined, {
                numeric: true,
                sensitivity: 'base'
              })
            )
            .reverse();
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

  static sortArrayNumber(array, prop, order) {
    if (typeof array === 'object') {
      if (typeof prop === 'string') {
        if (
          typeof order === 'string' &&
          (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')
        ) {
          const asc = order.toUpperCase() === 'ASC';
          if (asc) {
            return array.sort((a, b) => a[prop] - b[prop]);
          }
          return array.sort((a, b) => a[prop] - b[prop]).reverse();
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

  static sortArrayBoolean(array, prop, order) {
    if (typeof array === 'object') {
      if (typeof prop === 'string') {
        if (
          typeof order === 'string' &&
          (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')
        ) {
          const asc = order.toUpperCase() === 'ASC';
          if (asc) {
            return array.sort((a, b) => b[prop] - a[prop]);
          }
          return array.sort((a, b) => b[prop] - a[prop]).reverse();
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
