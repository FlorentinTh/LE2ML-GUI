class V1 {
  constructor(config = null) {
    this.config = config;
  }

  marshall(values) {
    const result = {
      version: '1',
      pipeline: values.pipeline,
      source: values['data-source'],
      process: values['process-type']
    };

    if (!(values['process-type'] === 'none')) {
      result.model = values['process-model'];
    }

    if (values['process-type'] === 'train') {
      result['cross-validation'] = values['cross-validation'] === 'true';
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
          length: values['windowing-length'] + values['windowing-unit'],
          function: {
            label: values['windowing-function-label'],
            container: values['windowing-function-container']
          },
          overlap: Number(values['windowing-overlap'])
        }
      };
    }

    if (!(values.features === undefined)) {
      const isSaveFeatures = values['features-save'] === 'true';

      result.features = {
        save: isSaveFeatures
      };

      if (isSaveFeatures) {
        if (!(values['features-file'] === undefined)) {
          result.features.filename = values['features-file'];
        } else {
          result.features.save = false;
        }
      }

      const featuresArr = [];
      const features = values.features.split(',');

      for (let i = 0; i < features.length; ++i) {
        const feature = features[i].split('.');
        const featureObj = {
          label: feature[1],
          container: feature[0]
        };
        featuresArr.push(featureObj);
      }

      result.features.list = featuresArr;
    }

    if (values['process-type'] === 'test') {
      result.algorithm = {
        container: values['algorithm-container']
      };
    } else if (values['process-type'] === 'train') {
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
    sessionStorage.setItem('data-source', this.config.source);
    sessionStorage.setItem('process-type', this.config.process);

    if (!(this.config.process === 'none')) {
      sessionStorage.setItem('process-model', this.config.model);
    }

    if (this.config.process === 'train') {
      sessionStorage.setItem('cross-validation', this.config['cross-validation']);
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

    if (!(this.config.windowing === undefined)) {
      const isWindowingEnable = this.config.windowing.enable;
      sessionStorage.setItem('windowing-enabled', isWindowingEnable);

      if (isWindowingEnable) {
        const windowingParams = this.config.windowing.parameters;
        sessionStorage.setItem(
          'windowing-length',
          windowingParams.length.replace(/\D/g, '')
        );

        sessionStorage.setItem(
          'windowing-unit',
          windowingParams.length.replace(/[0-9]+/g, '')
        );

        const functionLabel = windowingParams.function.label;
        sessionStorage.setItem('windowing-function-label', functionLabel);
        sessionStorage.setItem(
          'windowing-function-container',
          windowingParams.function.container
        );
        sessionStorage.setItem('windowing-overlap', windowingParams.overlap);
      }
    }

    const features = this.config.features;

    if (!(features === undefined)) {
      const isSaveFeatures = this.config.features.save;
      sessionStorage.setItem('features-save', isSaveFeatures);

      const featuresFilename = this.config.features.filename;

      if (!(featuresFilename === undefined)) {
        sessionStorage.setItem('features-file', featuresFilename);
      }

      if (!(features.list === undefined)) {
        if (features.list.length > 0) {
          const featuresArr = [];
          for (let i = 0; i < features.list.length; ++i) {
            featuresArr.push(features.list[i].container + '.' + features.list[i].label);
          }
          sessionStorage.setItem('features', featuresArr);
        }
      }
    }

    const algorithm = this.config.algorithm;

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
