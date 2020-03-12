class StringHelper {
  static capitalizeFirst(string) {
    if (typeof string === 'string') {
      return string.charAt(0).toUpperCase() + string.slice(1);
    } else {
      throw new Error('expected type for argument string is string.');
    }
  }

  static getFirstLetterCapitalized(string) {
    if (typeof string === 'string') {
      return `${string.charAt(0).toUpperCase()}.`;
    } else {
      throw new Error('expected type for argument string is string.');
    }
  }
}

export default StringHelper;
