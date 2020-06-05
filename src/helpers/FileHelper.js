class FileHelper {
  static getFileServerURL() {
    return 'http://127.0.0.1:8080/';
  }

  static enableDownload(link, data, filename, callback) {
    if (!(link instanceof HTMLElement)) {
      throw new Error('Expected type for argument link is HTMLElement.');
    }

    if (!(typeof data === 'string')) {
      throw new Error('Expected type for argument data is String.');
    }

    if (!(typeof filename === 'string')) {
      throw new Error('Expected type for argument filename is String.');
    }

    if (!(typeof callback === 'function')) {
      throw new Error('Expected type for argument callback is Function.');
    }

    const dataEncoded = 'data:text/yaml;charset=utf-8,' + encodeURIComponent(data);
    link.setAttribute('href', dataEncoded);
    link.setAttribute('download', filename + '.yml');
    link.addEventListener('click', () => {}, false);

    callback();
  }

  static disableDownload(link) {
    link.setAttribute('href', '#');
    link.removeAttribute('download');
    link.removeEventListener('click', () => {}, false);
  }
}

export default FileHelper;
