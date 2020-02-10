export class Url {
	static toSlug(value) {
		return value.toLocaleLowerCase().replace(' ', '-');
	}

	static toAnchor(value) {
		return `#${value}`;
	}

	static isRouteValid(route) {
		let regexp = new RegExp('^\\/[a-zA-Z0-9-_]+.html+#*[a-zA-Z0-9-_]*$', 'g');

		if (regexp.test(route)) {
			return true;
		}

		return false;
	}
}
