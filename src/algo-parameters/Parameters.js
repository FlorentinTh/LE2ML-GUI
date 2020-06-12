import V1 from './versions/v1/V1';
import APIHelper from '@APIHelper';

class Parameters {
  constructor(config = null, container = null) {
    this.config = config;
    this.container = container;
    this.version = config === null ? null : config.version;
  }

  build(template) {
    switch (this.version) {
      case '1':
        new V1(this.config, this.container).build(template);
        break;
      default:
        APIHelper.errorsHandler(
          { message: 'Version : ' + this.version + ' is not supported' },
          true
        );
        break;
    }
  }
}

export default Parameters;
