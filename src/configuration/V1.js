class V1 {
  constructor(config = null) {
    this.config = config;
  }

  marshall(values) {}

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
      sessionStorage.setItem('algo-label', algorithm.name);
    }
  }
}

export default V1;
