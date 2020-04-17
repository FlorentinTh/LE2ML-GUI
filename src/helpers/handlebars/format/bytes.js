import StringHelper from '@StringHelper';

export default function(bytes) {
  if (!(typeof bytes === 'number')) {
    return '';
  }

  return StringHelper.convertBytesToHuman(bytes);
}
