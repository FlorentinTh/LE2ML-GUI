/* eslint-disable no-undef */
import '../scss/main.scss';
import { Router } from './middleware/Router';

jQuery(document).ready(() => {
	let router = new Router();
	router.route();
});
