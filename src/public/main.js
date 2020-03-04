import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/brands.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';

import '../styles/main.scss';
import { Router } from '../router/Router';
import { API } from '../helpers/utils';
// import Cookies from 'js-cookie';
// import dayjs from 'dayjs';

// const token = '';

const baseApiUrl = 'http://localhost:3000/api/v1';
API.setBaseURL(baseApiUrl);

Router.route();

// Cookies.set('foo', 'bar');

// let date = dayjs('1992-06-23').format('DD/MM/YYYY');
