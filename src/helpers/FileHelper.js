class FileHelper {
  static downloadAsJson(link, data, filename) {
    if (!(link instanceof HTMLElement)) {
      throw new Error('Expected type for argument link is HTMLElement.');
    }

    if (!(typeof data === 'object')) {
      throw new Error('Expected type for argument data is Object.');
    }

    if (!(typeof filename === 'string')) {
      throw new Error('Expected type for argument filename is String.');
    }

    const dataEncoded =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    link.setAttribute('href', dataEncoded);
    link.setAttribute('download', filename + '.json');
    link.addEventListener('click', () => {}, false);
  }
}

export default FileHelper;
