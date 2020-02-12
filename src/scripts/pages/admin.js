import { Menu } from '../components/Menu';
import { Router } from './../middleware/Router';

const menu = new Menu();

(function() {
	menu.build();
	menu.enableTheme();
	menu.switchMenu((hash) => {
		Router.route(hash);
	});
})();
