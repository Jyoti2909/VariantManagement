import initGridPlugins from './gridPlugins';

export default async function cuiGrid(control, options = {}) {
	if (options.plugins) {
		return await initGridPlugins(control, options.plugins, options);
	}
}
