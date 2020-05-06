class StringHelper {
  static capitalizeFirst(string) {
    if (!(typeof string === 'string')) {
      throw new Error('Expected type for argument string is String.');
    }
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static getFirstLetterCapitalized(string) {
    if (!(typeof string === 'string')) {
      throw new Error('Expected type for argument string is String.');
    }
    return string.charAt(0).toUpperCase() + '.';
  }

  static convertBytesToHuman(bytes, i = true) {
    if (!(typeof bytes === 'number')) {
      throw new Error('Expected type for argument bytes is Number.');
    }

    const threshold = i ? 1000 : 1024;

    if (Math.abs(bytes) < threshold) {
      return bytes + ' B';
    }

    let u = -1;
    const units = i
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

    do {
      bytes /= threshold;
      ++u;
    } while (Math.abs(bytes) >= threshold && u < units.length - 1);

    return bytes.toFixed(1) + ' ' + units[u];
  }

  static isAlpha(string) {
    if (!(typeof string === 'string')) {
      throw new Error('Expected type for argument string is String.');
    }
    const regexp = /^[A-Za-z]+$/;
    return string.match(regexp);
  }

  static isAlphaNum(string) {
    if (!(typeof string === 'string')) {
      throw new Error('Expected type for argument string is String.');
    }
    const regexp = /^[A-Za-z0-9]+$/;
    return string.match(regexp);
  }

  static truncateLength(string, size) {
    if (!(typeof string === 'string')) {
      throw new Error('Expected type for argument string is String.');
    }

    const length = string.length;
    let split = size / 2;

    if (!(split % 2 === 0)) {
      split = Math.floor(size / 2);
    }

    if (length > size) {
      return string.slice(0, split) + '-...-' + string.slice(length - split, length);
    }

    return string;
  }
}

export default StringHelper;
