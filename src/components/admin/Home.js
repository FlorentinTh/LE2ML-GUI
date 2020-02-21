import { Component } from './../Component';

import homeHTMLComponent from '../../pages/fragment/admin/home.html';

export class Home extends Component {
	constructor(context = null) {
		super(context);
		super.clearContent();
		super.makeTitle('Home');
		super.injectHTMLPage(homeHTMLComponent);
		this.run();
	}

	run() {
		/**
		 * your Code Logic HERE
		 */
	}
}
