class V1 {
  constructor(config = null) {
    this.config = config;
  }

  marshall(values) {
    const result = {
      version: '1',
      process: values['process-type']
    };

    if (values['process-type'] === 'test') {
      result.model = values['process-model'];
    }

    switch (values['input-type']) {
      case 'file':
        result.input = { file: values['input-content'] };
        break;
      case 'ws':
        result.input = { ws: values['input-content'] };
        break;
    }

    const isWindowingEnabled = Boolean(values['windowing-enabled']);
    result.windowing = {
      enable: isWindowingEnabled
    };

    switch (isWindowingEnabled) {
      case true:
        result.windowing = {
          ...result.windowing,
          parameters: {
            length: Number(values['windowing-length']),
            function: values['windowing-function'],
            overlap: Number(values['windowing-overlap'])
          }
        };
        break;
    }

    if (!(values.features === undefined)) {
      const features = values.features.split(',');
      result.features = features;
    }

    if (values['process-type'] === 'train' || values['process-type'] === 'test') {
      result.algorithm = { name: values['algorithm-name'] };
    }

    return result;
  }

  unmarshall() {
    const inputType = Object.keys(this.config.input)[0];

    sessionStorage.setItem('input-type', inputType);
    sessionStorage.setItem('input-content', this.config.input[inputType]);

    const isWindowingEnable = this.config.windowing.enable;
    sessionStorage.setItem('windowing-enabled', isWindowingEnable);

    if (isWindowingEnable) {
      const windowingParams = this.config.windowing.parameters;
      sessionStorage.setItem('windowing-length', windowingParams.length);
      sessionStorage.setItem('windowing-function', windowingParams.function);
      sessionStorage.setItem('windowing-overlap', windowingParams.overlap);
    }

    const features = this.config.features;

    if (!(features === undefined)) {
      if (features.length > 0) {
        sessionStorage.setItem('features', features);
      }
    }

    const algorithm = this.config.algorithm;

    if (!(algorithm === undefined)) {
      sessionStorage.setItem('algorithm-name', algorithm.name);
    }
  }
}

export default V1;
