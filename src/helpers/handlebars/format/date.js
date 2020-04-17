import dayjs from 'dayjs';

export default function(date, format) {
  if (!(typeof date === 'string') || !(typeof format === 'string')) {
    return '';
  }

  return dayjs(date).format(format);
}
