class Events {
  constructor() {
    this.callbacks = {};
  }

  on(key, callback) {
    if (this.callbacks[key] === undefined) {
      this.callbacks[key] = [];
    }
    this.callbacks[key].push(callback);
  }

  emit(key, ...params) {
    if (this.callbacks[key] !== undefined) {
      for (let i = 0; i < this.callbacks[key].length; ++i) {
        this.callbacks[key][i](...params);
      }
    }
  }
}

export default Events;
