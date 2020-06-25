import Component from '@Component';
import dataVizTemplate from './data-visualisation.hbs';
import fileListTemplate from './file-list.hbs';
import attributeListTemplate from './attribute-list.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import SortHelper from '@SortHelper';
import ChartHelper from '@ChartHelper';
import ModalHelper from '@ModalHelper';

let rawFiles;
let featuresFiles;
let attributes;

class DataVisualisation extends Component {
  constructor(context = null) {
    super(context);
    this.title = 'Data Visualisation';
    this.selectedFile = null;
    this.selectedFileType = null;
    this.selectedAttribute = null;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initFileData();
  }

  initFileData() {
    const rawStore = Store.get('raw-files');
    const featuredStore = Store.get('features-files');

    if (rawStore === undefined || featuredStore === undefined) {
      this.renderFileList(true);

      getFiles('/files?type=raw', this.context).then(response => {
        if (response) {
          rawFiles = SortHelper.sortArrayAlpha(response.data, 'filename', 'asc');

          Store.add({
            id: 'raw-files',
            data: rawFiles
          });

          getFiles('/files?type=features', this.context).then(response => {
            if (response) {
              featuresFiles = SortHelper.sortArrayAlpha(response.data, 'filename', 'asc');

              Store.add({
                id: 'features-files',
                data: featuresFiles
              });

              this.make();
            }
          });
        }
      });
    } else {
      rawFiles = rawStore.data;
      featuresFiles = featuredStore.data;
      this.make();
    }
  }

  renderFileList(loading = true) {
    this.context.innerHTML = dataVizTemplate({
      title: this.title
    });

    this.buildFileList('#raw', loading);
    this.buildFileList('#features', loading);
  }

  buildFileList(id, loading = true) {
    const files = id.includes('raw') ? rawFiles : featuresFiles;

    const optGroup = this.context.querySelector(id);
    optGroup.innerHTML = fileListTemplate({
      files: files,
      loading: loading
    });
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
      `/files/headers/${this.selectedFile}?type=${this.selectedFileType}`,
      this.context
    ).then(response => {
      if (response) {
        attributes = response.data;
        this.renderAttributeList(false);
      }
    });
  }

  renderAttributeList(loading = true) {
    this.buildAttributeList(loading);
  }

  buildAttributeList(loading = true) {
    const attributeSelect = this.context.querySelector('select#attribute');

    attributeSelect.innerHTML = attributeListTemplate({
      attributes: attributes,
      loading: loading
    });
  }

  attributeSelectHandler(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    this.selectedAttribute = event.target.value;

    const selectFile = this.context.querySelector('select#file');
    const selectAttribute = this.context.querySelector('select#attribute');

    selectFile.setAttribute('disabled', true);
    selectFile.parentNode.classList.add('disabled');
    selectAttribute.setAttribute('disabled', true);
    selectAttribute.parentNode.classList.add('disabled');

    ChartHelper.initChart(this.selectedAttribute);

    axios
      .get(
        `/files/stream/data/${this.selectedFile}?type=${this.selectedFileType}&att=${this.selectedAttribute}`,
        {
          headers: APIHelper.setAuthHeader(),
          onDownloadProgress: progressEvent => {
            if (!(this.selectedAttribute === 'label')) {
              const lines = progressEvent.currentTarget.response
                .split(/\r\n|\n/)
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
          ChartHelper.chartDone(this.selectedAttribute);
        }
      })
      // eslint-disable-next-line handle-callback-err
      .catch(error => {
        ModalHelper.error('Chart could not be drawn. Please try again.');
      });
  }

  make() {
    this.renderFileList(false);

    const fileSelect = this.context.querySelector('select#file');
    fileSelect.addEventListener('change', this.fileSelectHandler.bind(this), false);

    const attributeSelect = this.context.querySelector('select#attribute');
    attributeSelect.setAttribute('disabled', true);
    attributeSelect.parentNode.classList.add('disabled');

    attributeSelect.addEventListener(
      'change',
      this.attributeSelectHandler.bind(this),
      false
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
