import Component from '@Component';
import dataVizTemplate from './data-visualisation.hbs';
import fileListTemplate from './file-list.hbs';
import sourceListTemplate from './source-list.hbs';
import attributeListTemplate from './attribute-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import SortHelper from '@SortHelper';
import ChartHelper from '@ChartHelper';
import ModalHelper from '@ModalHelper';

let allSources;
let sourceSelect;
let rawFiles;
let featuresFiles;
let attributes;

class DataVisualisation extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Data Visualisation';
    this.dataSource = undefined;
    this.selectedFile = null;
    this.selectedFileType = null;
    this.selectedAttribute = null;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const storedSources = Store.get('data-viz-sources');

    if (storedSources === undefined) {
      this.render(true);

      getSources('/sources', this.context)
        .then(response => {
          if (response) {
            allSources = response.data.sources;

            Store.add({
              id: 'data-viz-sources',
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
    this.context.innerHTML = dataVizTemplate({
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

    sourceSelect = this.context.querySelector('#sources');
    this.dataSource = sourceSelect.options[sourceSelect.selectedIndex].value;

    sourceSelect.addEventListener('change', this.sourceChangeHandler.bind(this), false);

    this.initFileData();
  }

  sourceChangeHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.dataSource = event.target.value;
    this.initFileData(true);
  }

  initFileData(refresh = false) {
    const rawStore = Store.get('raw-files');
    const featuredStore = Store.get('features-files');

    if (rawStore === undefined || featuredStore === undefined) {
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

                  this.makeContent();
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
    } else {
      if (!refresh) {
        rawFiles = rawStore.data;
        featuresFiles = featuredStore.data;
        this.makeContent();
      } else {
        Store.remove('raw-files');
        Store.remove('features-files');
        this.initFileData();
      }
    }
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

    const selectFile = this.context.querySelector('select#file');
    selectFile.removeAttribute('disabled');
    selectFile.parentNode.classList.remove('disabled');
    selectFile.options[0].selected = true;
  }

  fileSelectHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const options = Array.prototype.slice.call(
      event.target.querySelectorAll('optgroup option')
    );

    const selected = options.filter(option => option.selected === true);

    this.selectedFile = event.target.value;
    this.selectedFileType = selected[0].closest('optgroup').id;

    if (!(attributes === undefined)) {
      attributes = undefined;
    }

    const selectAttribute = this.context.querySelector('select#attribute');

    if (selectAttribute.parentNode.classList.contains('disabled')) {
      selectAttribute.parentNode.classList.remove('disabled');
      selectAttribute.removeAttribute('disabled');
    }

    ChartHelper.clearChart();
    this.initAttributeData();
  }

  initAttributeData() {
    this.renderAttributeList(true);

    getFileHeaders(
      `/files/${this.selectedFile}/headers?source=${this.dataSource}&type=${this.selectedFileType}`,
      this.context
    )
      .then(response => {
        if (response) {
          attributes = response.data;
          this.renderAttributeList(false);
        }
      })
      .catch(error => {
        ModalHelper.notification('error', error);
      });
  }

  renderAttributeList(loading = true) {
    this.buildAttributeList(loading);
  }

  buildAttributeList(loading = true) {
    const attributeSelect = this.context.querySelector('select#attribute');

    attributeSelect.innerHTML = attributeListTemplate({
      attributes,
      loading
    });
  }

  attributeSelectHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    this.selectedAttribute = event.target.value;

    const selectFile = this.context.querySelector('select#file');
    selectFile.setAttribute('disabled', true);
    selectFile.parentNode.classList.add('disabled');

    const selectAttribute = this.context.querySelector('select#attribute');
    selectAttribute.setAttribute('disabled', true);
    selectAttribute.parentNode.classList.add('disabled');

    const selectSource = this.context.querySelector('select#sources');
    selectSource.setAttribute('disabled', true);
    selectSource.parentNode.classList.add('disabled');

    ChartHelper.initChart(this.selectedAttribute);

    axios
      .get(
        `/files/${this.selectedFile}/stream?source=${this.dataSource}&type=${this.selectedFileType}&att=${this.selectedAttribute}`,
        {
          headers: APIHelper.setAuthHeader(),
          onDownloadProgress: progressEvent => {
            if (!(this.selectedAttribute === 'label')) {
              const lines = progressEvent.currentTarget.response
                .split(/\r\n|\n/)
                // eslint-disable-next-line array-callback-return
                .filter(line => {
                  if (!(line === '') && !(line === 'label')) {
                    return line;
                  }
                });
              ChartHelper.updateChart(this.selectedAttribute, { x: [lines] });
            }
          }
        }
      )
      .then(response => {
        if (response) {
          if (this.selectedAttribute === 'label') {
            const results = response.data;
            ChartHelper.updateChart(this.selectedAttribute, {
              x: [Object.keys(results)],
              y: [Object.values(results)]
            });
          }
          selectFile.removeAttribute('disabled');
          selectFile.parentNode.classList.remove('disabled');

          selectAttribute.removeAttribute('disabled');
          selectAttribute.parentNode.classList.remove('disabled');

          selectSource.removeAttribute('disabled');
          selectSource.parentNode.classList.remove('disabled');

          ChartHelper.chartDone(this.selectedAttribute);
        }
      })
      .catch(() => {
        ModalHelper.error('Chart could not be drawn. Please try again.');
      });
  }

  makeContent() {
    this.renderFileList(false);

    const fileSelect = this.context.querySelector('select#file');
    const attributeSelect = this.context.querySelector('select#attribute');

    if (rawFiles.length === 0 && featuresFiles.length === 0) {
      fileSelect.options[1].selected = true;
      this.selectedFile = null;
      this.selectedFileType = null;
      fileSelect.setAttribute('disabled', true);
      fileSelect.parentNode.classList.add('disabled');
      this.selectAttribute = null;
      attributeSelect.options[0].selected = true;
      ChartHelper.clearChart();
      Store.remove('raw-files');
      Store.remove('features-files');
    } else {
      fileSelect.addEventListener('change', this.fileSelectHandler.bind(this), false);

      attributeSelect.addEventListener(
        'change',
        this.attributeSelectHandler.bind(this),
        false
      );
    }

    attributeSelect.setAttribute('disabled', true);
    attributeSelect.parentNode.classList.add('disabled');
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

async function getFileHeaders(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default DataVisualisation;
