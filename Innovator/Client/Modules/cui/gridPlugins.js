import GridEventManager from './GridEventManager.js';

const publicGridAPIForExtend = [
	'getCellType',
	'getCellStyles',
	'getEditorType',
	'getRowClasses',
	'getCellMetadata',
	'checkEditAvailability'
];
const publicGridAPIForOverride = ['sort'];

export default async function gridPlugins(grid, plugins = [], options) {
	const defaultMethods = {};
	publicGridAPIForExtend.forEach((methodName) => {
		defaultMethods[methodName] = grid[methodName];
	});

	await Promise.all(
		plugins.map(async (plugin) => {
			plugin.grid = grid;
			plugin.options = options;
			return plugin.init && (await plugin.init());
		})
	);

	plugins.forEach((plugin) => plugin.setupAfterInit && plugin.setupAfterInit());

	publicGridAPIForExtend.forEach((methodName) => {
		grid[methodName] = function (...args) {
			const defaultResult = defaultMethods[methodName].apply(grid, args);
			return plugins.reduce(
				(result, plugin) =>
					plugin[methodName] ? plugin[methodName](result, ...args) : result,
				defaultResult
			);
		};
	});
	const reversePluginsArray = [...plugins].reverse();
	publicGridAPIForOverride.forEach((methodName) => {
		for (const plugin of reversePluginsArray) {
			const pluginMethod = plugin[methodName];
			if (pluginMethod) {
				grid[methodName] = pluginMethod.bind(plugin);
				break;
			}
		}
	});

	const eventManager = new GridEventManager(grid, plugins);
	return {
		destroy: () => eventManager.destroy()
	};
}
