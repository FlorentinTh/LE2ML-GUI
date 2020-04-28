class Events {
  constructor() {
    this._callbacks = {};
  }

  on(key, callback) {
    if (this._callbacks[key] === undefined) {
      this._callbacks[key] = [];
    }
    this._callbacks[key].push(callback);
  }

  emit(key, ...params) {
    if (this._callbacks[key] !== undefined) {
      for (let i = 0; i < this._callbacks[key].length; ++i) {
        this._callbacks[key][i](...params);
      }
    }
  }
}

export default Events;
