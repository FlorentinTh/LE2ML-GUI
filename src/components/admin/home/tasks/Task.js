class Task {
  constructor(context) {
    this.context = context;
    this.navItems = document.querySelectorAll('.task-nav-item');
  }

  getContext() {
    return this.context;
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
        sessionStorage.setItem('active-nav', item);
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

  toggleNextBtnEnable(enable) {
    if (!(typeof enable === 'boolean')) {
      throw new Error('Expected type for argument enable is Boolean.');
    }
    const nextBtn = this.context.querySelector('.btn-group-nav .next button');
    if (enable) {
      if (nextBtn.classList.contains('disabled')) {
        nextBtn.classList.remove('disabled');
      }
    } else {
      if (!nextBtn.classList.contains('disabled')) {
        nextBtn.classList.add('disabled');
      }
    }
  }

  initNavBtn(button, options) {
    if (!(typeof button === 'string')) {
      if (!(button === 'next') || !(button === 'previous')) {
        throw new Error('Argument button should be one of : next or previous.');
      }
    }

    if (!(typeof options === 'object')) {
      throw new Error('Expected type for argument options is Object.');
    }

    const btnClickListener = [
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const btn =
          event.target.tagName === 'BUTTON' ? event.target : event.target.parentNode;

        if (!btn.classList.contains('disabled')) {
          // eslint-disable-next-line no-new
          new options.Task(this.context);
          this.setNavActive(options.label);
        }
      },
      false
    ];

    const nextBtn = this.context.querySelector('.btn-group-nav .next button');
    const previousBtn = this.context.querySelector('.btn-group-nav .previous button');

    if (!(nextBtn === null) && button === 'next') {
      nextBtn.addEventListener(...btnClickListener);
    } else if (!(previousBtn === null) && button === 'previous') {
      previousBtn.addEventListener(...btnClickListener);
    }
  }
}

export default Task;
