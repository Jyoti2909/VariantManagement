import pluginDeclarations from './plugins/pluginDeclarations';

const cuiGridPluginsFactory = (itemTypeName) => {
	const plugins = pluginDeclarations.reduce(
		(itemTypePlugins, pluginDeclaration) => {
			if (pluginDeclaration.itemTypeName === itemTypeName) {
				itemTypePlugins.push(pluginDeclaration.plugin);
			}
			return itemTypePlugins;
		},
		[]
	);
	return plugins;
};

export default cuiGridPluginsFactory;
