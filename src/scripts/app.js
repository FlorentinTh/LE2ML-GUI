/* eslint-disable no-undef */
import '../scss/main.scss';

import 'jquery';

import * as theme from './utils/theme';

jQuery(document).ready(() => {
	theme.init();
	theme.toggle();
});
