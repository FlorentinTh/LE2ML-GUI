import dayjs from 'dayjs';

export default function(date, format) {
  if (!(typeof date === 'string')) {
    return '';
  }

  if (!(typeof date === 'string')) {
    return '';
  }
  return dayjs(date).format(format);
}
