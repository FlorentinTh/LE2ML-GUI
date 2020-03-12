import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/brands.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';

import '@Styles';
import Router from '@Router';
import APIHelper from '@APIHelper';

const baseApiUrl = 'http://localhost:3000/api/v1';
APIHelper.setBaseURL(baseApiUrl);

Router.route();
