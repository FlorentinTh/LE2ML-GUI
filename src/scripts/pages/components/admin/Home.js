import { Component } from './../Component';

export class Home extends Component {
	constructor() {
		super();
	}

	build() {
		this.makeTitle('Home');
	}

	makeTitle(title) {
		document.querySelector('.main-content').innerHTML = `<h1>${title}</h1>`;
	}
}
