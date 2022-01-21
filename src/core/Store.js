import Events from '@Events';

class StoreInstance extends Events {
  constructor() {
    super();
    if (!StoreInstance.instance) {
      this.data = [];
      StoreInstance.instance = this;
    }

    return StoreInstance.instance;
  }

  getAll() {
    return this.data;
  }

  get(id) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    return this.data.find(elem => elem.id === id);
  }

  add(entry) {
    if (!(typeof entry === 'object')) {
      throw new Error('Expected type for argument entry is Object.');
    }

    this.data.push(entry);
  }

  update(id, data) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }

    if (!(typeof data === 'object')) {
      throw new Error('Expected type for argument data is Object.');
    }

    this.data.forEach(entry => {
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

    for (let i = 0; i < this.data.length; ++i) {
      if (this.data[i].id === id) {
        this.data.splice(i, 1);
      }
    }
  }
}

const Store = new StoreInstance();
Object.freeze(Store);

export default Store;
