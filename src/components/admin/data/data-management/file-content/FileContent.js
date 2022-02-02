import Component from '@Component';
import fileContentTemplate from './file-content.hbs';
import sourceListTemplate from './source-list.hbs';
import fileListTemplate from './file-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import SortHelper from '@SortHelper';

import AttributeContent from './attribute-content/AttributeContent';

let allSources;
let rawFiles;
let featuresFiles;

class FileContent extends Component {
  constructor(
    context = null,
    dataSource = undefined,
    selectedFile = undefined,
    selectedFileType = undefined,
    loadContent = false
  ) {
    super(context);
    this.title = 'Manage File Content';
    this.dataSource = dataSource;
    this.selectedFile = selectedFile;
    this.selectedFileType = selectedFileType;
    this.loadContent = loadContent;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('file-atts-data-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context)
        .then(response => {
          if (response) {
            allSources = response.data.sources;

            Store.add({
              id: 'file-atts-data-sources',
              data: allSources
            });

            this.make();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    } else {
      allSources = storedSources.data;
      this.make();
    }
  }

  render(loading = true) {
    this.context.innerHTML = fileContentTemplate({
      title: this.title
    });

    this.buildSourceList('#sources', loading);
  }

  buildSourceList(id, loading = true) {
    const select = this.context.querySelector(id);
    select.innerHTML += sourceListTemplate({
      sources: allSources,
      loading
    });
  }

  make() {
    this.render(false);

    const sourceSelect = this.context.querySelector('#sources');
    this.dataSource = sourceSelect.options[sourceSelect.selectedIndex].value;

    const isEditable = sourceSelect.options[sourceSelect.selectedIndex].dataset.editable;

    if (isEditable === 'false') {
      const selectFile = this.context.querySelector('select#file');
      selectFile.removeAttribute('disabled');
      selectFile.parentNode.classList.remove('disabled');

      ModalHelper.error(`Files of data source ${this.dataSource} are not editable.`);
    } else {
      this.initFileListData();
    }

    sourceSelect.addEventListener('change', this.sourceChangeHandler.bind(this), false);
  }

  sourceChangeHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const isEditable = event.target.options[event.target.selectedIndex].dataset.editable;

    this.dataSource = event.target.value;
    if (isEditable === 'false') {
      this.disableFileSelect();
      ModalHelper.error(`Files of data source ${this.dataSource} are not editable.`);
    } else {
      this.initFileListData();
    }
  }

  disableFileSelect() {
    const selectFile = this.context.querySelector('select#file');
    selectFile.setAttribute('disabled', true);
    selectFile.parentNode.classList.add('disabled');
    this.selectedFile = undefined;
    selectFile.options[0].selected = true;
    this.context.querySelector('#att-content').innerHTML = '';
  }

  initFileListData() {
    this.renderFileList(true);
    getFiles(`/files?source=${this.dataSource}&type=raw`, this.context)
      .then(response => {
        if (response) {
          rawFiles = SortHelper.sortArrayAlpha(response.data, 'filename', 'asc');
          Store.add({
            id: 'raw-files',
            data: rawFiles
          });
          getFiles(`/files?source=${this.dataSource}&type=features`, this.context)
            .then(response => {
              if (response) {
                featuresFiles = SortHelper.sortArrayAlpha(
                  response.data,
                  'filename',
                  'asc'
                );
                Store.add({
                  id: 'features-files',
                  data: featuresFiles
                });
                this.makeFileList();
              }
            })
            .catch(error => {
              ModalHelper.notification('error', error);
            });
        }
      })
      .catch(error => {
        ModalHelper.notification('error', error);
      });
  }

  renderFileList(loading = true) {
    this.buildFileList('#raw', loading);
    this.buildFileList('#features', loading);
  }

  buildFileList(id, loading = true) {
    const files = id.includes('raw') ? rawFiles : featuresFiles;
    const optGroup = this.context.querySelector(id);
    optGroup.innerHTML = fileListTemplate({
      files,
      loading
    });
  }

  makeFileList() {
    this.renderFileList(false);
    const select = this.context.querySelector('select#file');

    select.removeAttribute('disabled');
    select.parentNode.classList.remove('disabled');

    if (!(this.selectedFile === undefined)) {
      const options = Array.prototype.slice.call(
        select.querySelectorAll('optgroup option')
      );
      const selected = options.filter(option => option.value === this.selectedFile);
      selected[0].setAttribute('selected', true);
    } else {
      this.selectedFile = select.value;
      this.selectedFileType = undefined;
    }

    select.addEventListener('change', this.selectFileChangeListener.bind(this), false);

    if (this.loadContent) {
      // eslint-disable-next-line no-new
      new AttributeContent(
        '#att-content',
        this.dataSource,
        this.selectedFile,
        this.selectedFileType
      );
    }
  }

  selectFileChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const options = Array.prototype.slice.call(
      event.target.querySelectorAll('optgroup option')
    );
    const selected = options.filter(option => option.selected === true);
    this.selectedFile = event.target.value;
    this.selectedFileType = selected[0].closest('optgroup').id;
    // eslint-disable-next-line no-new
    new AttributeContent(
      '#att-content',
      this.dataSource,
      this.selectedFile,
      this.selectedFileType
    );
  }
}

async function getFiles(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

async function getSources(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default FileContent;
