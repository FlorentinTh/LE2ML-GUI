import './styles/utils/_font.scss';
import '@Styles';

import Router from '@Router';
import APIHelper from '@APIHelper';

const baseApiUrl = window.env.API_URL + '/v' + window.env.API_VERSION;
APIHelper.setBaseURL(baseApiUrl);

Router.route();
