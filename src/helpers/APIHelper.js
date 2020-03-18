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
        const proxyURL = 'https://cors-anywhere.herokuapp.com/';
        axios.defaults.baseURL = proxyURL + url;
      } else {
        axios.defaults.baseURL = url;
      }
    }
  }

  static setAuthHeader() {
    const token = Cookies.get('uuid');
    return {
      Authorization: `JWT ${token}`
    };
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
}

export default APIHelper;
