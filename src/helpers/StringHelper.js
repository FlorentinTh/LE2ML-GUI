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
}

export default StringHelper;
