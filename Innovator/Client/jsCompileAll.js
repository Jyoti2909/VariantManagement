/* eslint-env node */
const rollup = require('rollup');
const rollupConfig = require('./nodejs/rollup.config');
const jsCompileHelper = require('./nodejs/jsCompileHelper');

const usingXxHashLikeFileHash = true;
const rollupIIFEConfig = rollupConfig[0];

const uncompressedPipelinePlugins = rollupIIFEConfig.plugins.filter(
	(plugin) => plugin.name !== 'terser'
);

const bundleList = jsCompileHelper.getBundleList();

const uncompressedBundleList = bundleList.map((bundleConfig) => {
	const uncompressedBundleConfig = {
		name: bundleConfig.name + '.uncompressed',
		file: bundleConfig.file.replace('.js', '.uncompressed.js'),
		plugins: uncompressedPipelinePlugins
	};

	return Object.assign({}, bundleConfig, uncompressedBundleConfig);
});

const listOfAllBundles = [...bundleList, ...uncompressedBundleList];

listOfAllBundles.reduce(async (compileStack, rollupJSModule) => {
	await compileStack;
	const bundleResult = await rollup.rollup({
		input: rollupJSModule.input,
		external: rollupIIFEConfig.external,
		plugins: rollupJSModule.plugins || rollupIIFEConfig.plugins
	});
	return await bundleResult.write({
		file: rollupJSModule.file,
		format: rollupIIFEConfig.output.format,
		sourcemap: rollupJSModule.sourcemap || rollupIIFEConfig.output.sourcemap,
		name: rollupJSModule.name,
		globals: rollupIIFEConfig.output.globals,
		plugins: [
			{
				generateBundle: jsCompileHelper.getGenerateHookHandler(
					usingXxHashLikeFileHash
				)
			}
		]
	});
}, Promise.resolve());

(async function () {
	const rollupESMConfig = rollupConfig[1];
	const bundleResult = await rollup.rollup(rollupESMConfig);
	return await bundleResult.write(rollupESMConfig.output);
})();
