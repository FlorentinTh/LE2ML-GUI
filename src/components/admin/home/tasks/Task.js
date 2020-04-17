class Task {
  constructor(context) {
    this.context = context;
  }

  setProcessNavItem(value) {
    if (!(typeof value === 'string')) {
      throw new Error('Expected type for argument value is String.');
    }

    const items = document.querySelectorAll('li.task-nav-item');
    items.forEach(item => {
      if (item.dataset.task === 'process') {
        item.children[0].childNodes[1].nodeValue = value;
      }
    });
  }

  disableNavItem(task) {
    if (!(typeof task === 'string')) {
      throw new Error('Expected type for argument task is String.');
    }

    const items = document.querySelectorAll('li.task-nav-item');
    items.forEach(item => {
      if (item.classList.contains('item-disabled')) {
        item.classList.remove('item-disabled');
      }

      if (item.dataset.task === task) {
        item.classList.add('item-disabled');
      }
    });
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
