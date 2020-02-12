export class PageComponent {
	constructor() {}

	clearContent(context) {
		context.innerHTML = '';
	}

	injectHTMLPage(context, html) {
		if (typeof html === 'string') {
			context.insertAdjacentHTML('beforeend', html);
		} else {
			throw new Error('Expected type for argument html is string.');
		}
	}

	makeTitle(context, title) {
		if (typeof title === 'string') {
			context.insertAdjacentHTML('beforeend', `<h1>${title}</h1>`);
		} else {
			throw new Error('Expected type for argument title is string.');
		}
	}
}
