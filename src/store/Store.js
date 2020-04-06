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

  remove(id) {
    for (let i = 0; i < this._data.length; ++i) {
      if (this._data[i].id === id) {
        this._data.splice(i, 1);
      }
    }
  }
}

const Store = new StoreInstance();
Object.freeze(Store);

export default Store;
