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

    const inputType = values['input-type'];

    if (inputType.includes('file')) {
      const fileType = inputType.split('-')[0];
      result.input = { file: { type: fileType, filename: values['input-content'] } };
    } else {
      result.input = { ws: values['input-content'] };
    }

    const isWindowingEnabled = values['windowing-enabled'] === 'true';

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

    const parameters = {};
    Object.keys(values).filter((key, index) => {
      if (/^algo-param-/.test(key)) {
        const value = values[key];
        const param = key.substring(11);
        parameters[param] = value;
      }
    });

    if (!(Object.keys(parameters).length === 0)) {
      result.algorithm = {
        ...result.algorithm,
        parameters: parameters
      };
    }

    return result;
  }

  unmarshall() {
    const inputType = Object.keys(this.config.input)[0];

    if (inputType === 'file') {
      const type = this.config.input[inputType].type;
      sessionStorage.setItem('input-type', type.concat('-', inputType));
      sessionStorage.setItem('input-content', this.config.input[inputType].filename);
    } else {
      sessionStorage.setItem('input-type', inputType);
      sessionStorage.setItem('input-content', this.config.input[inputType]);
    }

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
