export default class GridEventManager {
	constructor(grid, plugins) {
		this.plugins = [...plugins].reverse();
		this.grid = grid;
		this.eventMap = new Map();
		plugins.forEach(({ events }) => {
			events?.forEach(({ type, element }) => this.on(type, element));
		});
	}

	on(type, element) {
		const key = type + (element ?? '');
		if (this.eventMap.has(key)) {
			return;
		}
		const func = (...args) => this.fire(type, element, args);
		this.eventMap.set(key, () => this.grid.off(type, func));
		this.grid.on(type, func, element);
	}

	fire(type, element, data) {
		const brokenName = new Set();
		const executeEvent = (event, context) => {
			if (
				type !== event.type ||
				element !== event.element ||
				brokenName.has(event.name)
			) {
				return;
			}
			event.method.call(context, {
				name: event.name,
				data,
				break: () => brokenName.add(event.name)
			});
		};

		this.plugins.forEach((plugin) => {
			plugin.events?.forEach((event) => executeEvent(event, plugin));
		});
	}

	destroy() {
		const iter = this.eventMap.values();
		for (const off of iter) {
			off();
		}
	}
}
