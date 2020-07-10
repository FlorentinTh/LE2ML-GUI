import SortHelper from '@SortHelper';

export const FilterType = {
  FILES: 'files',
  USERS: 'users',
  APP_KEYS: 'app-keys',
  DEFAULT: 'default'
};

export class Filters {
  constructor(filers, type) {
    if (!Object.values(FilterType).includes(type)) {
      throw new Error('Unknown filter type');
    }

    this.filters = filers;
    this.filerClickListener = null;
    this.type = type;
  }

  enableFilters() {
    this.filters[0].classList.add('filter-active');

    for (let i = 0; i < this.filters.length; ++i) {
      const filter = this.filters[i];

      if (filter.classList.contains('filter-disabled')) {
        filter.classList.remove('filter-disabled');
      }
      if (!(this.filerClickListener === null)) {
        filter.addEventListener(...this.filerClickListener);
      }
    }
  }

  disableFilters(isEventAdded = true) {
    for (let i = 0; i < this.filters.length; ++i) {
      const filter = this.filters[i];
      if (filter.classList.contains('filter-active')) {
        filter.classList.remove('filter-active');
      }
      filter.classList.add('filter-disabled');
      if (isEventAdded) {
        if (!(this.filerClickListener === null)) {
          filter.removeEventListener(...this.filerClickListener);
        }
      }
    }
  }

  addFilterClickListener(callback) {
    if (!(typeof callback === 'function')) {
      throw new Error('Callback argument must be a function');
    }

    this.filerClickListener = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const filter =
          event.target.tagName === 'SPAN' ? event.target : event.target.parentNode;

        if (filter.className.includes('active')) {
          const sortIcon = filter.children[1].className;
          let className = null;
          if (sortIcon.includes('up')) {
            className = sortIcon.replace('up', 'down');
            filter.dataset.order = 'desc';
          } else {
            className = sortIcon.replace('down', 'up');
            filter.dataset.order = 'asc';
          }
          filter.children[1].className = className;
        } else {
          this.filters.forEach(fil => {
            if (fil.className.includes('active')) {
              const className = fil.className;
              fil.className = className
                .split(' ')
                .filter(name => name !== 'filter-active');
            }
          });
          const className = filter.className;
          filter.className = className + ' filter-active';
        }
        callback();
      },
      true
    ];

    for (let i = 0; i < this.filters.length; ++i) {
      const filter = this.filters[i];
      filter.addEventListener(...this.filerClickListener);
    }
  }

  setDefaultSort(data) {
    for (let i = 0; i < this.filters.length; ++i) {
      const filter = this.filters[i];
      if (filter.className.includes('active')) {
        return this.sort(filter.dataset.action, filter.dataset.order, data);
      }
    }
  }

  sort(filter, order, data) {
    let res;
    switch (this.type) {
      case FilterType.FILES:
        res = this.fileSort(filter, order, data);
        break;
      case FilterType.USERS:
        res = this.userSort(filter, order, data);
        break;
      case FilterType.APP_KEYS:
        res = this.appKeySort(filter, order, data);
        break;
      case FilterType.DEFAULT:
        res = this.defaultSort(filter, order, data);
        break;
    }

    return res;
  }

  fileSort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'filename', order);
    } else if (filter === 'size-sort') {
      return SortHelper.sortArrayNumber(data, 'size', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    }
  }

  userSort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'lastname', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    } else if (filter === 'connection-sort') {
      return SortHelper.sortArrayByDate(data, 'lastConnection', order);
    }
  }

  appKeySort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'name', order);
    } else if (filter === 'creation-sort') {
      return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    } else if (filter === 'user-sort') {
      return SortHelper.sortArrayAlpha(data, 'user.lastname', order, true);
    }
  }

  defaultSort(filter, order, data) {
    if (filter === 'alpha-sort') {
      return SortHelper.sortArrayAlpha(data, 'label', order);
    } else if (filter === 'state-sort') {
      return SortHelper.sortArrayBoolean(data, 'enabled', order);
    } else if (filter === 'container-sort') {
      return SortHelper.sortArrayAlpha(data, 'container', order);
    }
  }
}
