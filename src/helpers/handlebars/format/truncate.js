import StringHelper from '@StringHelper';

export default function(str, size, sep) {
  if (!(typeof str === 'string')) {
    return '';
  }

  if (!(typeof size === 'number')) {
    return '';
  }

  if (!(typeof sep === 'string')) {
    return '';
  }

  return StringHelper.truncateLength(str, size, sep);
}
