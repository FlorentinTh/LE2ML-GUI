import V1 from './versions/V1';
import { Version } from './Version';
import APIHelper from '@APIHelper';

class Configuration {
  constructor(config = null) {
    this.config = config;
    this.version = config === null ? null : config.version;
  }

  marshall(version) {
    if (!(version instanceof Version)) {
      throw new Error('Expected type for argument version is Version.');
    }

    const JSONValues = JSON.parse(JSON.stringify(sessionStorage));

    switch (version.value) {
      case '1':
        return new V1().marshall(JSONValues);
      default:
        APIHelper.errorsHandler(
          { message: 'Still unsupported version of the configuration' },
          true
        );
        break;
    }
  }

  unmarshall() {
    this.clean();
    switch (this.version) {
      case '1':
        return new V1(this.config).unmarshall();
      default:
        APIHelper.errorsHandler(
          { message: 'Version : ' + this.version + ' is not supported yet.' },
          true
        );
        break;
    }
  }

  clean() {
    const items = Object.keys(sessionStorage);

    for (let i = 0; i < items.length; ++i) {
      const item = items[i];

      if (!(item === 'active-nav')) {
        sessionStorage.removeItem(item);
      }
    }
  }
}

export default Configuration;
