import { Menu } from '../components/Menu';
import { PageController } from './PageController';

let menu = null;

export class Admin extends PageController {
	constructor() {
		super();

		if (menu === null) {
			menu = new Menu();
		}

		this.run();
	}

	run() {
		menu.listen();

		// menu.listen((hash, link) => {
		// 	console.log(hash, link);
		// });
	}
}
