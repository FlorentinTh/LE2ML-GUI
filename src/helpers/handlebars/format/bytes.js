import StringHelper from '@StringHelper';

export default bytes => {
  if (!(typeof bytes === 'number')) {
    return '';
  }

  return StringHelper.convertBytesToHuman(bytes);
};
