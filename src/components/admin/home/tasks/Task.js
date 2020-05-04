class Task {
  constructor(context) {
    this.context = context;
    this.navItems = document.querySelectorAll('.task-nav-item');
  }

  getContext() {
    return this.context;
  }

  setProcessNavItem(value) {
    if (!(typeof value === 'string')) {
      throw new Error('Expected type for argument value is String.');
    }

    const items = document.querySelectorAll('li.task-nav-item');
    items.forEach(item => {
      if (item.dataset.task === 'process') {
        item.children[0].childNodes[1].nodeValue = value;

        if (value.toLowerCase() === 'predict') {
          item.children[0].childNodes[0].classList.remove('fa-running');
          item.children[0].childNodes[0].classList.add('fa-brain');
        } else if (value.toLowerCase() === 'training') {
          item.children[0].childNodes[0].classList.remove('fa-brain');
          item.children[0].childNodes[0].classList.add('fa-running');
        }
      }
    });
  }

  toggleNavItemEnable(task, enable = false) {
    if (!(typeof task === 'string')) {
      throw new Error('Expected type for argument task is String.');
    }

    const items = document.querySelectorAll('li.task-nav-item');
    items.forEach(item => {
      if (item.dataset.task === task) {
        if (enable) {
          if (item.classList.contains('item-disabled')) {
            item.classList.remove('item-disabled');
          }
        } else {
          if (!item.classList.contains('item-disabled')) {
            item.classList.add('item-disabled');
          }
        }
      }
    });
  }

  setNavActive(item) {
    if (!(typeof item === 'string')) {
      throw new Error('Expected type for argument item is String.');
    }

    for (let i = 0; i < this.navItems.length; ++i) {
      const navItem = this.navItems[i];
      if (navItem.classList.contains('item-active')) {
        navItem.classList.remove('item-active');
      }

      if (navItem.dataset.task === item) {
        navItem.classList.add('item-active');
      }
    }
  }

  disableSection(id) {
    if (!(typeof id === 'string')) {
      throw new Error('Expected type for argument id is String.');
    }
    const elem = document.querySelector('section#' + id);
    elem.classList.add('section-disabled');
    elem
      .querySelector('h3')
      .insertAdjacentHTML('afterbegin', '<i class="far fa-times-circle"></i>');
  }
}

export default Task;
