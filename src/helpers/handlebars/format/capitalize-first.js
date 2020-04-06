import StringHelper from '@StringHelper';

export default function(str) {
  if (!(typeof str === 'string')) {
    return '';
  }
  return StringHelper.capitalizeFirst(str);
}
