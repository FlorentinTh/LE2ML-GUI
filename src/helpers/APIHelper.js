import ModalHelper from '@ModalHelper';
import axios from 'axios';
import Cookies from 'js-cookie';

class APIHelper {
  static setBaseURL(url, proxy = false) {
    if (typeof url !== 'string' && url !== '') {
      throw new Error('Expected type for argument url is String.');
    } else if (typeof proxy !== 'boolean') {
      throw new Error('Expected type for argument url is Boolean.');
    } else {
      if (proxy) {
        axios.defaults.baseURL = window.env.API_PROXY + '/' + url;
      } else {
        axios.defaults.baseURL = url;
      }
    }
  }

  static setAuthHeader() {
    const token = Cookies.get('uuid');
    return {
      Authorization: 'Bearer ' + token
    };
  }

  static getUploadProgress(progress) {
    return Math.round((progress.loaded * 100) / progress.total);
  }

  static isUserConnected() {
    const uuid = Cookies.get('uuid');
    return uuid !== null && uuid !== undefined;
  }

  static parseJWT(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      throw new Error('Token corrupted.');
    }
  }

  static getConnectedUser() {
    const uuid = Cookies.get('uuid');
    return this.parseJWT(uuid);
  }

  static errorsHandler(error, replaceContent = false) {
    let code = '';
    let msg = '';

    if (error.request) {
      const err = error.request;
      if (err.status === 0) {
        msg = error.message;
      } else {
        code = err.status;

        if (code === 500 || code === 401) {
          msg = err.statusText;
          if (msg === '') {
            msg = JSON.parse(err.response).message;
          }
        } else if (typeof msg === 'object') {
          msg = 'Invalid input data.';
        } else {
          const data = JSON.parse(err.response).data;
          if (data) {
            msg = 'your file is not valid, ';
            for (let i = 0; i < data.length; ++i) {
              const elem = data[i];
              if (i === data.length - 1) {
                msg += elem.entry + ' ' + elem.message;
              } else {
                msg += elem.entry + ' ' + elem.message + ' & ';
              }
            }
          } else {
            msg = JSON.parse(err.response).message;
          }
        }
      }
    } else if (error.response) {
      const err = error.response;

      if (err.code && err.message) {
        code = err.code;
        msg = err.message;
      } else {
        code = err.status;
        msg = err.message;
      }
    } else {
      msg = error.message;
    }

    const text = code !== '' ? code + ': ' + msg : msg;

    if (replaceContent) {
      ModalHelper.error(text);
    } else {
      ModalHelper.notification('error', text);
    }
  }
}

export default APIHelper;
