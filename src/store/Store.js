class StoreInstance {
  constructor() {
    if (!StoreInstance.instance) {
      this._data = [];
      StoreInstance.instance = this;
    }

    return StoreInstance.instance;
  }

  getAll() {
    return this._data;
  }

  get(id) {
    return this._data.find(elem => elem.id === id);
  }

  add(item) {
    this._data.push(item);
  }

  remove(item) {}
}

const Store = new StoreInstance();
Object.freeze(Store);

export default Store;
