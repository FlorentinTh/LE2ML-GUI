import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/main.scss';
import { Router } from '../router/Router';
import { config, env } from '../config';
import { API } from '../helpers/utils';
// import Cookies from 'js-cookie';
// import dayjs from 'dayjs';

// const token = '';

if (config.env === env.dev) {
	API.setBaseURL(config.baseApiUrl, true);
} else {
	API.setBaseURL(config.baseApiUrl);
}

// API.setAuthorization(token);
Router.route();

// Cookies.set('foo', 'bar');

// let date = dayjs('1992-06-23').format('DD/MM/YYYY');
