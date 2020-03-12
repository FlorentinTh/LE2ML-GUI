class URLHelper {
  static getURL() {
    return window.location.href;
  }

  static getPath(location = null) {
    const url = location || this.getURL();
    return url.substr(7, url.lastIndexOf('html') + 4 - 7);
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
    return hash.substr(1, hash.length);
  }

  static toSlug(value) {
    return value.toLocaleLowerCase().replace(' ', '-');
  }

  static toAnchor(value) {
    return `#${value}`;
  }

  static isRouteValid(route) {
    const regexp = new RegExp('^\\/[a-zA-Z0-9-_]+.html+#*[a-zA-Z0-9-_]*$', 'g');

    if (regexp.test(route)) {
      return true;
    }

    return false;
  }
}

export default URLHelper;
