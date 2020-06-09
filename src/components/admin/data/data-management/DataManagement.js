import Component from '@Component';
import dataManagementTemplate from './data-management.hbs';
import fileListTemplate from './file-list.hbs';
import attributeListTemplate from './attribute-list.hbs';
import editFileTemplate from './edit-file.hbs';
import saveFileTemplate from './save-file.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import SortHelper from '@SortHelper';

let rawFiles;
let featuresFiles;
// let selectedFile;
// let selectedFileType;

class DataManagement extends Component {
  constructor(
    context = null,
    attributes = [],
    edited = false,
    selectedFile = undefined,
    selectedFileType = undefined
  ) {
    super(context);
    this.title = 'Manage File Content';
    this.attributes = attributes;
    this.edited = edited;
    this.selectedFile = selectedFile;
    this.selectedFileType = selectedFileType;
    this.mount();
  }

  mount() {
    const menu = Store.get('menu-admin').data;
    menu.setActive('data');
    this.initData();
  }

  initData() {
    const rawStore = Store.get('raw-files');
    const featuredStore = Store.get('features-files');

    if (rawStore === undefined || featuredStore === undefined) {
      this.render(true);

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

  render(loading = true) {
    this.context.innerHTML = dataManagementTemplate({
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

  selectChangeListener(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const options = Array.prototype.slice.call(
      event.target.querySelectorAll('optgroup option')
    );
    const selected = options.filter(option => option.selected === true);

    this.selectedFile = event.target.value;
    this.selectedFileType = selected[0].closest('optgroup').id;

    this.buildAttributeList(true);
  }

  buildAttributeList(reset) {
    const badge = this.context.querySelector('h2 .badge');
    badge.innerHTML = '0';

    const container = this.context.querySelector('#attributes .grid-attributes');

    container.innerHTML = attributeListTemplate({
      attributes: this.attributes,
      loading: true
    });

    const storedEdit = Store.get('edit-list');

    if (storedEdit === undefined) {
      Store.add({
        id: 'edit-list',
        data: new Map()
      });
    }

    if (!(this.selectedFile === 'none') && !(this.selectedFileType === null)) {
      if (!reset && !(this.attributes.length === 0)) {
        badge.innerHTML = this.attributes.length;
        container.innerHTML = attributeListTemplate({
          attributes: this.attributes,
          loading: false
        });

        this.setActions();

        const saveBtn = this.context.querySelector('button#save');

        if (saveBtn.classList.contains('disabled')) {
          if (this.edited) {
            saveBtn.classList.remove('disabled');
            saveBtn.removeAttribute('disabled');
            saveBtn.classList.add('primary');
          }
        }
      } else {
        if (!(storedEdit.data.size === 0)) {
          storedEdit.data.clear();
        }

        getFileHeaders(
          `/files/headers/${this.selectedFile}?type=${this.selectedFileType}`,
          this.context
        ).then(response => {
          if (response) {
            this.attributes = response.data;
            badge.innerHTML = this.attributes.length;
            container.innerHTML = attributeListTemplate({
              attributes: this.attributes,
              loading: false
            });

            this.setActions();

            const saveBtn = this.context.querySelector('button#save');

            if (!saveBtn.classList.contains('disabled')) {
              if (this.edited) {
                saveBtn.classList.remove('primary');
                saveBtn.classList.add('disabled');
                saveBtn.setAttribute('disabled', true);
                this.edited = false;
              }
            }
          }
        });
      }
    } else {
      container.innerHTML = attributeListTemplate({
        attributes: this.attributes,
        loading: false
      });
    }
  }

  make() {
    this.render(false);

    const select = this.context.querySelector('select#file');

    if (!(this.selectedFile === undefined)) {
      const options = Array.prototype.slice.call(
        select.querySelectorAll('optgroup option')
      );

      const selected = options.filter(option => option.value === this.selectedFile);
      selected[0].setAttribute('selected', true);
    } else {
      this.selectedFile = select.value;
      this.selectedFileType = null;
    }

    select.addEventListener('change', this.selectChangeListener.bind(this), false);

    this.buildAttributeList(false);
  }

  setActions() {
    this.saveAction();
    this.editAction();
    this.deleteAction();
  }

  editAction() {
    const buttons = this.context.querySelectorAll('button#edit');

    buttons.forEach(button => {
      const item = button.closest('#attribute-infos');
      const attribute = item
        .querySelector('.label')
        .dataset.att.trim()
        .toLowerCase();

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = editFileTemplate({
          attribute: attribute
        });

        const elems = ['attribute-name'];
        ModalHelper.edit('Edit Attribute', content, 'Update', elems).then(result => {
          if (result.value) {
            const data = {
              label: result.value['attribute-name']
            };

            for (let i = 0; i < this.attributes.length; ++i) {
              const att = this.attributes[i];

              if (att.label === attribute) {
                if (!(data.label === att.label)) {
                  const storedEdit = Store.get('edit-list');

                  if (!(storedEdit === undefined)) {
                    const invertedMap = new Map(
                      [...storedEdit.data.entries()].map(([key, value]) => [value, key])
                    );

                    const originalAtt = invertedMap.get(att.label);
                    if (!(originalAtt === undefined)) {
                      if (originalAtt === data.label) {
                        storedEdit.data.delete(originalAtt);
                      } else {
                        storedEdit.data.set(originalAtt, data.label);
                      }
                    } else {
                      storedEdit.data.set(att.label, data.label);
                    }
                  }

                  att.label = data.label;
                }
              }
            }

            const atts = this.attributes;

            // eslint-disable-next-line no-new
            new DataManagement(
              null,
              atts,
              true,
              this.selectedFile,
              this.selectedFileType
            );
          }
        });

        const attributeNameInput = document.querySelector('input#attribute-name');
        this.inputListener(attributeNameInput);
      });
    });
  }

  deleteAction() {
    const buttons = this.context.querySelectorAll('button#delete');

    buttons.forEach(button => {
      const item = button.closest('#attribute-infos');
      const attribute = item
        .querySelector('.label')
        .dataset.att.trim()
        .toLowerCase();

      const stringPos = item.querySelector('.position').dataset.pos.trim();
      const position = parseInt(stringPos, 10);

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const askTitle = 'Delete attribute ?';
        const askMessage = attribute + ' will be permanently deleted.';
        ModalHelper.confirm(askTitle, askMessage).then(result => {
          if (result.value) {
            for (let i = 0; i < this.attributes.length; ++i) {
              const att = this.attributes[i];

              if (att.pos > position) {
                att.pos = att.pos - 1;
              }
            }

            const storedEdit = Store.get('edit-list');

            if (!(storedEdit === undefined)) {
              const invertedMap = new Map(
                [...storedEdit.data.entries()].map(([key, value]) => [value, key])
              );

              const originalAtt = invertedMap.get(attribute);

              if (!(originalAtt === undefined)) {
                storedEdit.data.set(originalAtt, 'none');
              } else {
                storedEdit.data.set(attribute, 'none');
              }
            }

            const atts = this.attributes.filter(att => att.label !== attribute);

            // eslint-disable-next-line no-new
            new DataManagement(
              null,
              atts,
              true,
              this.selectedFile,
              this.selectedFileType
            );
          }
        });
      });
    });
  }

  saveAction() {
    const button = this.context.querySelector('button#save');

    button.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const storedEdit = Store.get('edit-list');

        const data = {
          modifications: null,
          newFilename: null
        };

        if (!(storedEdit === undefined)) {
          data.modifications = Object.fromEntries(storedEdit.data);
        }

        const askTitle = 'Replace File ?';
        const askMessage = 'Current file content will be override.';
        ModalHelper.confirm(
          askTitle,
          askMessage,
          'Override',
          'Save new file...',
          true,
          false
        ).then(result => {
          if (result.value) {
            const loader = ModalHelper.loading(
              'Saving file...',
              'Please wait while the file is begin saved'
            );

            saveFile(
              `/files/edit/${this.selectedFile}?type=${this.selectedFileType}&override=true`,
              data,
              this.context
            ).then(response => {
              if (response) {
                loader.close();
                ModalHelper.notification('success', response.message);

                // eslint-disable-next-line no-new
                new DataManagement();
              }
            });
          } else {
            const content = saveFileTemplate({
              filename: this.selectedFile.split('.').slice(0, -1)
            });

            const elems = ['filename'];
            ModalHelper.edit('Create File', content, 'Create', elems).then(result => {
              if (result.value) {
                const loader = ModalHelper.loading(
                  'Saving file...',
                  'Please wait while the file is begin saved'
                );

                data.newFilename =
                  result.value.filename + '.' + this.selectedFile.split('.').pop();

                saveFile(
                  `/files/edit/${this.selectedFile}?type=${this.selectedFileType}&override=false`,
                  data,
                  this.context
                ).then(response => {
                  if (response) {
                    loader.close();
                    ModalHelper.notification('success', response.message);

                    if (this.selectedFileType === 'raw') {
                      Store.remove('raw-files');

                      const fileRawStore = Store.get('admin-file-raw');
                      if (!(fileRawStore === undefined)) {
                        Store.remove('admin-file-raw');
                      }
                    } else if (this.selectedFileType === 'features') {
                      Store.remove('features-files');

                      const fileFeatureStore = Store.get('admin-file-features');
                      if (!(fileFeatureStore === undefined)) {
                        Store.remove('admin-file-features');
                      }
                    }
                    // eslint-disable-next-line no-new
                    new DataManagement();
                  }
                });
              }
            });

            const filenameInput = document.querySelector('input#filename');
            this.inputListener(filenameInput);
          }
        });
      },
      false
    );
  }

  inputListener(input) {
    input.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        switch (input.id) {
          case 'filename':
            input.value = input.value.replace(/[^0-9a-zA-Z_]/gi, '_').toLowerCase();
            break;
          case 'attribute-name':
            input.value = input.value.replace(/[^0-9a-zA-Z_]/gi, '_').toLowerCase();
            break;
        }
      },
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
    APIHelper.errorsHandler(error, context, true);
  }
}

async function getFileHeaders(url, context) {
  try {
    const response = await axios.get(url, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

async function saveFile(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, context, true);
  }
}

export default DataManagement;
