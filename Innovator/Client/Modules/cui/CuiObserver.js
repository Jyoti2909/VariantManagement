export default class CuiObserver {
	constructor() {
		this.subscriptions = new Set();
	}

	notify(data) {
		this.subscriptions.forEach((callback) => callback(data));
	}

	subscribe(callback) {
		if (typeof callback !== 'function' || this.subscriptions.has(callback)) {
			return;
		}

		this.subscriptions.add(callback);
		return () => {
			this.subscriptions.delete(callback);
		};
	}
}
