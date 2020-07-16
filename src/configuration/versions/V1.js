class V1 {
  constructor(config = null) {
    this.config = config;
  }

  marshall(values) {
    const result = {
      version: '1',
      pipeline: values.pipeline,
      process: values['process-type']
    };

    if (!(values['process-type'] === 'none')) {
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

    if (isWindowingEnabled) {
      result.windowing = {
        ...result.windowing,
        parameters: {
          length: Number(values['windowing-length']),
          function: {
            label: values['windowing-function-label'],
            container: values['windowing-function-container']
          },
          overlap: Number(values['windowing-overlap'])
        }
      };
    }

    const featuresArr = [];

    if (!(values.features === undefined)) {
      const features = values.features.split(',');
      for (let i = 0; i < features.length; ++i) {
        const feature = features[i].split('.');
        const featureObj = {
          label: feature[1],
          container: feature[0]
        };
        featuresArr.push(featureObj);
      }
      result.features = featuresArr;
    }

    if (values['process-type'] === 'train' || values['process-type'] === 'test') {
      result.algorithm = {
        name: values['algorithm-name'],
        container: values['algorithm-container']
      };

      const parameters = {};
      Object.keys(values).filter((key, index) => {
        if (/^algo-param-/.test(key)) {
          const value = values[key];
          const param = key.substring(11);
          const val = value.split(',')[0];
          const type = value.split(',')[1];

          if (type === 'number') {
            parameters[param] = Number(val);
          } else if (type === 'boolean') {
            parameters[param] = val === 'true';
          } else {
            parameters[param] = val;
          }
        }
      });

      if (!(Object.keys(parameters).length === 0)) {
        result.algorithm = {
          ...result.algorithm,
          parameters: parameters
        };
      }
    }

    return result;
  }

  unmarshall() {
    sessionStorage.setItem('pipeline', this.config.pipeline);
    sessionStorage.setItem('process-type', this.config.process);

    if (!(this.config.process === 'none')) {
      sessionStorage.setItem('process-model', this.config.model);
    }

    const inputType = Object.keys(this.config.input)[0];

    if (inputType === 'file') {
      const type = this.config.input[inputType].type;

      if (type === 'features') {
        sessionStorage.setItem('only-learning', true);
      }

      sessionStorage.setItem('input-type', type.concat('-', inputType));
      sessionStorage.setItem('input-content', this.config.input[inputType].filename);
    } else {
      sessionStorage.setItem('input-type', inputType);
      sessionStorage.setItem('input-content', this.config.input[inputType]);
    }

    const isWindowingEnable = this.config.windowing.enable;
    sessionStorage.setItem('windowing-enabled', isWindowingEnable);

    const features = this.config.features;
    const algorithm = this.config.algorithm;

    if (isWindowingEnable) {
      const windowingParams = this.config.windowing.parameters;
      sessionStorage.setItem('windowing-length', windowingParams.length);
      const functionLabel = windowingParams.function.label;
      sessionStorage.setItem('windowing-function-label', functionLabel);
      sessionStorage.setItem(
        'windowing-function-container',
        windowingParams.function.container
      );
      sessionStorage.setItem('windowing-overlap', windowingParams.overlap);
    } else {
      if (features === undefined) {
        if (algorithm === undefined || this.config.process === 'none') {
          return false;
        }
      }
    }

    if (!(features === undefined)) {
      if (features.length > 0) {
        const featuresArr = [];
        for (let i = 0; i < features.length; ++i) {
          featuresArr.push(features[i].container + '.' + features[i].label);
        }
        sessionStorage.setItem('features', featuresArr);
      }
    }

    if (!(algorithm === undefined)) {
      sessionStorage.setItem('algorithm-name', algorithm.name);
      sessionStorage.setItem('algorithm-container', algorithm.container);

      const algoParams = this.config.algorithm.parameters;

      Object.entries(algoParams).forEach(([key, value]) => {
        sessionStorage.setItem('algo-param-' + key, value + ',' + typeof value);
      });
    }

    return true;
  }
}

export default V1;
