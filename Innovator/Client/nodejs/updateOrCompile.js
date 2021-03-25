const rollup = require('rollup');
const rollupConfig = require('./rollup.config');
const jsCompileHelper = require('./jsCompileHelper');
const path = require('path');

const rollupIIFEConfig = rollupConfig[0];
const rollupJSModuleListForReCompile = [];
jsCompileHelper.getCacheModuleList();

const rollupJSModuleList = jsCompileHelper
	.getBundleList()
	.map(async (rollupJSModule) => {
		const cacheModule = jsCompileHelper.cacheModuleList.find((cacheModule) => {
			const srcPath = path.normalize(cacheModule.srcPath);
			const srcPathRollupModule = path.normalize(rollupJSModule.input);
			return srcPath.indexOf(srcPathRollupModule) > -1 && rollupJSModule.name === cacheModule.name;
		});

		if (!cacheModule) {
			rollupJSModuleListForReCompile.push(rollupJSModule);
			return;
		};

		const currentXXHash = await jsCompileHelper.getCacheModuleXXHash(cacheModule);
		const currentTimeHash = await jsCompileHelper.getCacheModuleTimeHash(cacheModule);

		if (currentXXHash !== cacheModule.moduleHash && currentTimeHash !== cacheModule.moduleHash) {
			rollupJSModuleListForReCompile.push(rollupJSModule);
		} else if (currentXXHash === cacheModule.moduleHash) {
			cacheModule.moduleHash = currentTimeHash;
		}
	});

(async function main() {
	await Promise.all(rollupJSModuleList);
	if (rollupJSModuleListForReCompile.length === 0) {
		return await jsCompileHelper.writeCacheConfigFile();
	}

	rollupJSModuleListForReCompile.map(async (rollupJSModule) => {
		const bundleResult = await rollup.rollup({
			input: path.normalize(rollupJSModule.input),
			plugins: rollupIIFEConfig.plugins,
			external: rollupIIFEConfig.external
		});
		return bundleResult.write({
			file: path.normalize(rollupJSModule.file),
			format: rollupIIFEConfig.output.format,
			sourcemap: rollupIIFEConfig.output.sourcemap,
			name: rollupJSModule.name,
			globals: rollupIIFEConfig.output.globals,
			plugins: [{
				generateBundle: jsCompileHelper.getGenerateHookHandler()
			}]
		});
	});

	const rollupESMConfig = rollupConfig[1];
	const bundleResult = await rollup.rollup(rollupESMConfig);
	return await bundleResult.write(rollupESMConfig.output);
})();
