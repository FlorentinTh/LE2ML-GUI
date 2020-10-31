import fileListTemplate from './file-list.hbs';
import itemsTemplate from './items.hbs';
import SortHelper from '@SortHelper';
import Events from '@Events';

let headers;
let fileRows;
class FileList extends Events {
  // eslint-disable-next-line default-param-last
  constructor(context, title, data, key = 'file', selectedFile, loading = true) {
    super();
    this.context = context;
    this.title = title;
    this.data = data;
    this.loading = loading;
    this.key = key;
    this.selectedFile = selectedFile;
    this.make();
  }

  setData(data) {
    this.data = data;
  }

  setSelected(row) {
    const firstTd = row.firstElementChild;
    row.classList.add('selected-file');
    firstTd.innerHTML = '';
    firstTd.insertAdjacentHTML('afterbegin', '<i class="fas fa-check"></i>');
  }

  removeCurrentSelectedFile() {
    for (let i = 0; i < fileRows.length; ++i) {
      const row = fileRows[i];
      if (row.classList.contains('selected-file')) {
        row.classList.remove('selected-file');
        row.firstElementChild.innerHTML = '';
      }

      if (!(this.selectedFile === undefined)) {
        sessionStorage.removeItem(this.key);
        this.selectedFile = undefined;
      }
    }
  }

  fileClickListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.target.tagName === 'TD') {
      const row = event.target.parentNode;
      if (row.querySelector('.no-data') === null) {
        const filename = row.childNodes[3].textContent.toLowerCase();
        const ext = row.childNodes[5].textContent.toLowerCase();

        if (!(this.selectedFile === filename)) {
          if (!(this.selectedFile === null)) {
            this.removeCurrentSelectedFile();
          }

          this.emit('selected', true);
          this.selectedFile = filename;
          this.setSelected(row);

          sessionStorage.setItem(this.key, filename + '.' + ext);

          const container = row.dataset.container;
          if (!(container === '')) {
            sessionStorage.setItem('algorithm-container', container);
          }
        } else {
          this.emit('selected', false);
          this.removeCurrentSelectedFile();
        }
      }
    }
  }

  removeHeaderFilter() {
    for (let i = 0; i < headers.length; ++i) {
      const header = headers[i];
      const isEnabled = header.dataset.enable === 'true';
      if (isEnabled) {
        header.dataset.enable = 'false';
        const classes = header.children[0].classList;
        for (let j = 0; j < classes.length; ++j) {
          const c = classes[j];
          if (/fa-sort-.*/.test(c)) {
            classes.remove(c);
            classes.add('fa-sort');
          }
        }
      }
    }
  }

  headerClickListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.target.tagName === 'TH') {
      const elem = event.target;
      const isEnable = elem.dataset.enable === 'true';

      if (!isEnable) {
        this.removeHeaderFilter();
        elem.dataset.enable = 'true';
        if (elem.dataset.order === 'asc') {
          elem.children[0].classList.add('fa-sort-up');
        } else {
          elem.children[0].classList.add('fa-sort-down');
        }
      } else {
        if (elem.dataset.order === 'asc') {
          elem.dataset.order = 'desc';
          elem.children[0].classList.remove('fa-sort-up');
          elem.children[0].classList.add('fa-sort-down');
        } else {
          elem.dataset.order = 'asc';
          elem.children[0].classList.remove('fa-sort-down');
          elem.children[0].classList.add('fa-sort-up');
        }
      }

      this.data = this.sort(elem.dataset.action, elem.dataset.order, this.data);
      this.buildFileList();
    }
  }

  sort(action, order, data) {
    switch (action) {
      case 'filename':
        return SortHelper.sortArrayAlpha(data, action, order);
      case 'type':
        return SortHelper.sortArrayAlpha(data, action, order);
      case 'size':
        return SortHelper.sortArrayNumber(data, action, order);
      case 'date':
        return SortHelper.sortArrayByDate(data, 'dateCreated', order);
    }
  }

  buildFileList() {
    const body = this.context.querySelector('tbody');
    body.innerHTML = '';
    body.innerHTML = itemsTemplate({
      files: this.data,
      loading: this.loading
    });

    if (this.loading) {
      this.loading = !this.loading;
    }

    fileRows = this.context.querySelectorAll('tbody > tr');

    for (let i = 0; i < fileRows.length; ++i) {
      const row = fileRows[i];

      if (!(this.selectedFile === undefined)) {
        if (this.selectedFile === row.children[1].textContent) {
          this.setSelected(row);
        }
      }

      row.removeEventListener('click', this.fileClickListener.bind(this), false);
      row.addEventListener('click', this.fileClickListener.bind(this), false);
    }
    this.emit('build', true);
  }

  make() {
    this.context.innerHTML = fileListTemplate({
      title: this.title,
      files: this.data
    });

    headers = this.context.querySelectorAll('thead th:not(:first-child)');

    for (let i = 0; i < headers.length; ++i) {
      const header = headers[i];
      const isEnable = header.dataset.enable === 'true';

      if (isEnable) {
        const action = header.dataset.action;
        const order = header.dataset.order;
        this.sort(action, order, this.data);
      }

      header.addEventListener('click', this.headerClickListener.bind(this), false);
    }

    this.buildFileList();
  }
}

export default FileList;
