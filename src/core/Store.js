import Event from './Events';

class StoreInstance extends Event {
  constructor() {
    super();
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
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    return this._data.find(elem => elem.id === id);
  }

  add(entry) {
    if (!(typeof entry === 'object')) {
      throw new Error('Expected type for argument entry is Object.');
    }

    this._data.push(entry);
  }

  update(id, data) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    if (!(typeof data === 'object')) {
      throw new Error('Expected type for argument data is Object.');
    }

    this._data.find(entry => {
      if (entry.id === id) {
        entry.data = data;
      }
    });

    this.emit('update', this.get(id));
  }

  updateEnd(id) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    this.remove(id);
    this.emit('updateEnd');
  }

  remove(id) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

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
