class URLHelper {
  static getURL() {
    return window.location.href;
  }

  static getProtocol() {
    return window.location.protocol;
  }

  static getPath(location = null) {
    if (!(location === null) && !(typeof location === 'string')) {
      throw new Error('Expected type for argument location is String.');
    }

    const url = location || this.getURL();
    const start = this.getProtocol().length + 2;
    return url.substr(start, url.lastIndexOf('html') + 4 - start);
  }

  static getPage() {
    const path = this.getPath();
    return path.substr(path.indexOf('/'));
  }

  static getPageName() {
    const page = this.getPage();
    return page.substr(1, page.indexOf('.') - 1);
  }

  static getHash(location = null) {
    if (!(location === null) && !(typeof location === 'string')) {
      throw new Error('Expected type for argument location is String.');
    }
    const url = location || this.getURL();
    const page = this.getPage();
    const args = url.substr(url.indexOf(page) + page.length);

    if (args.indexOf('#') > -1) {
      if (args.indexOf('?') > -1) {
        return args.substr(
          args.indexOf('#') + 1,
          args.indexOf('?') - args.indexOf('#') - 1
        );
      } else {
        return args.substr(args.indexOf('#') + 1);
      }
    }

    return null;
  }

  static getHashName(hash) {
    if (!(typeof hash === 'string')) {
      throw new Error('Expected type for argument hash is String.');
    }

    return hash.substr(1, hash.length);
  }

  static toSlug(value) {
    if (!(typeof value === 'string')) {
      throw new Error('Expected type for argument value is String.');
    }

    return value.toLocaleLowerCase().replace(' ', '-');
  }

  static toAnchor(value) {
    if (!(typeof value === 'string')) {
      throw new Error('Expected type for argument value is String.');
    }

    return '#' + value;
  }

  static isRouteValid(route) {
    if (!(typeof route === 'string')) {
      throw new Error('Expected type for argument route is String.');
    }

    // eslint-disable-next-line prefer-regex-literals
    const regexp = new RegExp('^\\/[a-zA-Z0-9-_]+.html+#*[a-zA-Z0-9-_]*$', 'g');
    return regexp.test(route);
  }

  static removeProtocol(url) {
    if (!(typeof url === 'string')) {
      throw new Error('Expected type for argument url is String.');
    }

    return url.replace(/(^\w+:|^)\/\//, '');
  }
}

export default URLHelper;
