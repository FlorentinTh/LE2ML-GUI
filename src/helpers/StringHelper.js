class StringHelper {
  static capitalizeFirst(string) {
    if (typeof string === 'string') {
      return string.charAt(0).toUpperCase() + string.slice(1);
    } else {
      throw new Error('Expected type for argument string is String.');
    }
  }

  static getFirstLetterCapitalized(string) {
    if (typeof string === 'string') {
      return `${string.charAt(0).toUpperCase()}.`;
    } else {
      throw new Error('Expected type for argument string is String.');
    }
  }
}

export default StringHelper;
