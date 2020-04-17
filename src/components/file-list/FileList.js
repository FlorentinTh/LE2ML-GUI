import fileListTemplate from './file-list.hbs';
import itemsTemplate from './items.hbs';
import SortHelper from '@SortHelper';

let headers;
let fileRows;
let selectedFile;

class FileList {
  constructor(context, title, data, key = 'file') {
    this.context = context;
    this.title = title;
    this.data = data;
    this.make();
  }

  removeCurrentSelectedFile() {
    for (let i = 0; i < fileRows.length; ++i) {
      const row = fileRows[i];
      if (row.classList.contains('selected-file')) {
        row.classList.remove('selected-file');
        row.firstElementChild.innerHTML = '';
      }

      if (!(selectedFile === undefined)) {
        selectedFile = undefined;
      }
    }
  }

  fileDblClickListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.target.tagName === 'TD') {
      const row = event.target.parentNode;
      const filename = row.childNodes[3].textContent;

      if (selectedFile === filename) {
        if (!(selectedFile === undefined)) {
          this.removeCurrentSelectedFile();
        }
      }
    }
  }

  fileClickListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (event.target.tagName === 'TD') {
      const row = event.target.parentNode;
      const firstTd = row.firstElementChild;
      const filename = row.childNodes[3].textContent;

      if (!(selectedFile === filename)) {
        if (!(selectedFile === undefined)) {
          this.removeCurrentSelectedFile();
        }

        selectedFile = filename;
        row.classList.add('selected-file');
        firstTd.innerHTML = '';
        firstTd.insertAdjacentHTML('afterbegin', '<i class="fas fa-check"></i>');
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
      files: this.data
    });

    fileRows = this.context.querySelectorAll('tbody > tr');

    for (let i = 0; i < fileRows.length; ++i) {
      const row = fileRows[i];
      row.removeEventListener('click', this.fileClickListener.bind(this), false);
      row.addEventListener('click', this.fileClickListener.bind(this), false);
      row.removeEventListener('dblclick', this.fileDblClickListener.bind(this), false);
      row.addEventListener('dblclick', this.fileDblClickListener.bind(this), false);
    }
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
