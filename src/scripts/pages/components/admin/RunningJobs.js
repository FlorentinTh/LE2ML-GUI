import { Component } from './../Component';

export class RunningJobs extends Component {
	constructor() {
		super();
	}

	build() {
		this.makeTitle('Running Jobs');
	}

	makeTitle(title) {
		document.querySelector('.main-content').innerHTML = `<h1>${title}</h1>`;
	}
}
