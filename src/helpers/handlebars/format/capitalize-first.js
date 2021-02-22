import StringHelper from '@StringHelper';

export default str => {
  if (!(typeof str === 'string')) {
    return '';
  }
  return StringHelper.capitalizeFirst(str);
};
