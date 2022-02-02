import Component from '@Component';
import attributeContentTemplate from './attribute-content.hbs';
import attributeListTemplate from './attribute-list.hbs';
import editFileTemplate from './edit-file.hbs';
import saveFileTemplate from './save-file.hbs';
import Store from '@Store';
import axios from 'axios';
import APIHelper from '@APIHelper';
import ModalHelper from '@ModalHelper';
import FileContent from '../FileContent';

let storedEdit;

class AttributeContent extends Component {
  constructor(
    context = null,
    dataSource = undefined,
    selectedFile = undefined,
    selectedFileType = undefined,
    attributes = []
  ) {
    super(context);
    this.dataSource = dataSource;
    this.selectedFile = selectedFile;
    this.selectedFileType = selectedFileType;
    this.attributes = attributes;
    this.mount();
  }

  mount() {
    storedEdit = Store.get('edit-list');
    if (storedEdit === undefined) {
      Store.add({
        id: 'edit-list',
        data: new Map()
      });

      storedEdit = Store.get('edit-list');
    }

    this.initData();
  }

  initData() {
    this.render(true);

    if (!(this.attributes.length > 0)) {
      getFileHeaders(
        `/files/${this.selectedFile}/headers?source=${this.dataSource}&type=${this.selectedFileType}`,
        this.context
      )
        .then(response => {
          if (response) {
            this.attributes = response.data;
            this.make();
          }
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    }
  }

  render(loading = true) {
    const total = this.attributes === undefined ? 0 : this.attributes.length;
    this.context.innerHTML = attributeContentTemplate({
      total
    });

    this.buildAttributeList(loading);
  }

  buildAttributeList(loading) {
    const container = this.context.querySelector('#attributes .grid-attributes');

    container.innerHTML = attributeListTemplate({
      attributes: this.attributes,
      loading: true
    });

    if (storedEdit === undefined) {
      Store.add({
        id: 'edit-list',
        data: new Map()
      });
    }

    if (!loading && !(this.attributes.length === 0)) {
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
        `/files/${this.selectedFile}/headers?source=${this.dataSource}&type=${this.selectedFileType}`,
        this.context
      )
        .then(response => {
          if (response) {
            this.attributes = response.data;
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
        })
        .catch(error => {
          ModalHelper.notification('error', error);
        });
    }
  }

  make() {
    this.render(false);
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
      const attribute = item.querySelector('.label').dataset.att.trim().toLowerCase();
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const content = editFileTemplate({
          attribute
        });
        const elems = ['attribute-name'];
        ModalHelper.edit('Edit Attribute', content, 'Update', elems)
          .then(result => {
            if (result.value) {
              const data = {
                label: result.value['attribute-name']
              };
              for (let i = 0; i < this.attributes.length; ++i) {
                const att = this.attributes[i];
                if (att.label === attribute) {
                  if (!(data.label === att.label)) {
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

              this.edited = true;
              this.buildAttributeList(false);
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
          });
        const attributeNameInput = document.querySelector('input#attribute-name');
        this.inputListener(attributeNameInput);
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
        )
          .then(result => {
            if (result.value) {
              const loader = ModalHelper.loading(
                'Saving file...',
                'Please wait while the file is begin saved'
              );
              saveFile(
                `/files/${this.selectedFile}/edit?source=${this.dataSource}&type=${this.selectedFileType}&override=true`,
                data,
                this.context
              )
                .then(response => {
                  if (response) {
                    loader.close();
                    ModalHelper.notification('success', response.message);
                    // eslint-disable-next-line no-new
                    new AttributeContent(
                      '#att-content',
                      this.dataSource,
                      this.selectedFile,
                      this.selectedFileType,
                      this.attributes
                    );
                  }
                })
                .catch(error => {
                  ModalHelper.notification('error', error);
                });
            } else {
              const content = saveFileTemplate({
                filename: this.selectedFile.split('.').slice(0, -1)
              });
              const elems = ['filename'];
              ModalHelper.edit('Create File', content, 'Create', elems)
                .then(result => {
                  if (result.value) {
                    const loader = ModalHelper.loading(
                      'Saving file...',
                      'Please wait while the file is begin saved'
                    );
                    data.newFilename =
                      result.value.filename + '.' + this.selectedFile.split('.').pop();
                    saveFile(
                      `/files/${this.selectedFile}/edit?source=${this.dataSource}&type=${this.selectedFileType}&override=false`,
                      data,
                      this.context
                    )
                      .then(response => {
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
                          new FileContent(
                            null,
                            this.dataSource,
                            this.selectedFile,
                            this.selectedFileType,
                            true
                          );
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
              const filenameInput = document.querySelector('input#filename');
              this.inputListener(filenameInput);
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
          });
      },
      false
    );
  }

  deleteAction() {
    const buttons = this.context.querySelectorAll('button#delete');
    buttons.forEach(button => {
      const item = button.closest('#attribute-infos');
      const attribute = item.querySelector('.label').dataset.att.trim().toLowerCase();
      const stringPos = item.querySelector('.position').dataset.pos.trim();
      const position = parseInt(stringPos, 10);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const askTitle = 'Delete attribute ?';
        const askMessage = attribute + ' will be permanently deleted.';
        ModalHelper.confirm(askTitle, askMessage)
          .then(result => {
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
              this.attributes = this.attributes.filter(att => att.label !== attribute);
              this.edited = true;
              this.buildAttributeList(false);
            }
          })
          .catch(error => {
            ModalHelper.notification('error', error);
          });
      });
    });
  }

  inputListener(input) {
    input.addEventListener(
      'input',
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (input.id === 'filename' || input.id === 'attribute-name') {
          input.value = input.value.replace(/[^0-9a-zA-Z_]/gi, '_').toLowerCase();
        }
      },
      false
    );
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

async function saveFile(url, data, context) {
  try {
    const response = await axios.post(url, data, {
      headers: APIHelper.setAuthHeader()
    });
    return response.data;
  } catch (error) {
    APIHelper.errorsHandler(error, true);
  }
}

export default AttributeContent;
