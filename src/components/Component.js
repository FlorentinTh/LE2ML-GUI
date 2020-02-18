export class Component {
	constructor(context) {
		if (context === null) {
			let ctx = document.querySelector('main.content');
			if (ctx === null) {
				ctx = document.querySelector('div.wrap');
				ctx.innerHTML = '';
				ctx.innerHTML = '<div class="center"></div>';
			}

			this.context = ctx;
		} else {
			if (typeof context === 'string') {
				this.context = document.querySelector(context);
			} else {
				throw new Error('expected type for argument context is string.');
			}
		}
	}

	clearContent() {
		this.context.innerHTML = '';
	}

	injectHTMLPage(html) {
		if (typeof html === 'string') {
			this.context.insertAdjacentHTML('beforeend', html);
		} else {
			throw new Error('expected type for argument html is string.');
		}
	}

	makeTitle(title) {
		if (typeof title === 'string') {
			this.context.insertAdjacentHTML('beforeend', `<h1>${title}</h1>`);
		} else {
			throw new Error('expected type for argument title is string.');
		}
	}
}
