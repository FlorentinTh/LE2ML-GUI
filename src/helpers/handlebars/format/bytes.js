import StringHelper from '@StringHelper';

export default function(bytes) {
  if (!(typeof bytes === 'string')) {
    return '';
  }

  return StringHelper.convertBytesToHuman(bytes);
}
