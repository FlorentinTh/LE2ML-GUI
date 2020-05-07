import V1 from './V1';
import { Version } from './Version';

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
        new V1().marshall(JSONValues);
        break;
    }
  }

  unmarshall() {
    switch (this.version) {
      case '1':
        new V1(this.config).unmarshall();
        break;
    }
  }
}

export default Configuration;
