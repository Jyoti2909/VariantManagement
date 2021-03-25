/* eslint no-console:0 */
const rollup = require('rollup');
const rollupConfig = require('./nodejs/rollup.config');
const jsCompileHelper = require('./nodejs/jsCompileHelper');
const babelConfig = require('./nodejs/babel.config');
const rollupBabel = require('rollup-plugin-babel');
const glob = require('glob');

const filterMinifyPluginOut = (plugin) => plugin.name !== 'terser';

const rollupIIFEConfig = rollupConfig[0];
const rollupESMConfig = rollupConfig[1];
const rollupPlugins = rollupIIFEConfig.plugins
	.concat([
		{
			generateBundle: jsCompileHelper.getGenerateHookHandler()
		}
	])
	.filter(filterMinifyPluginOut);

const watchOptions = jsCompileHelper
	.getBundleList()
	.map(({ name, input, file }) => ({
		input,
		external: rollupIIFEConfig.external,
		output: {
			...rollupIIFEConfig.output,
			name,
			file
		},
		plugins: rollupPlugins
	}))
	.concat({
		...rollupESMConfig,
		plugins: rollupESMConfig.plugins.filter(filterMinifyPluginOut)
	});

const babelConfigForTests = Object.assign({}, babelConfig, {
	plugins: babelConfig.plugins.concat([
		require.resolve('babel-plugin-rewire-exports'),
		'import-glob-array'
	])
});
const postCssPlugin = rollupPlugins.find((plugin) => plugin.name === 'postcss');
const rollupPluginsForTests = [postCssPlugin, rollupBabel(babelConfigForTests)];

function updateWatchOptionsForTests() {
	const testCasesForESCompile = glob.sync(
		'{' +
			require('./tests/javascriptTests').includingJSLibrares.testCasesForESCompile.join(
				','
			) +
			',}',
		{ nodir: true, nosort: true }
	);

	testCasesForESCompile.forEach(function (esTestModule) {
		watchOptions.push({
			input: esTestModule,
			external: rollupIIFEConfig.external,
			output: [
				{
					format: rollupIIFEConfig.output.format,
					sourcemap: 'inline',
					file: esTestModule.replace('testCases', 'testCasesCompiled'),
					globals: rollupIIFEConfig.output.globals
				}
			],
			plugins: rollupPluginsForTests
		});
	});
}
function updateWatchOptionsForAmls() {
	const testCasesForESCompile = glob.sync(
		'{' +
			require('./tests/javascriptTests').includingJSLibrares.bundledSources.join(
				','
			) +
			',}',
		{ nodir: true, nosort: true }
	);

	testCasesForESCompile.forEach(function (esTestModule) {
		watchOptions.push({
			input: esTestModule,
			external: rollupIIFEConfig.external,
			output: [
				{
					format: rollupIIFEConfig.output.format,
					sourcemap: 'inline',
					file: esTestModule.replace('tests', 'tests\\testCasesCompiled'),
					globals: rollupIIFEConfig.output.globals
				}
			],
			plugins: rollupPluginsForTests
		});
	});
}

function watch(options = {}) {
	if (options.tests === true) {
		updateWatchOptionsForTests();
	}
	if (options.amls === true) {
		updateWatchOptionsForAmls();
	}

	const watcher = rollup.watch(watchOptions);
	watcher.on('event', function (event) {
		const eventHandlers = {
			START: () => {
				console.log('\x1Bc');
			},
			BUNDLE_START: () => {
				console.log('Build Bundle start (' + event.input + ')...');
			},
			BUNDLE_END: () => {
				console.log(
					'\x1b[32m',
					'Build Bundle complete (' +
						event.input +
						') \x1b[35m' +
						event.duration,
					'\x1b[37m'
				);
			},
			END: () => {
				console.log('\x1b[42m                                \x1b[0m');
				console.log('\x1b[42m  %s\x1b[0m', 'Build All js Bundles complete ');
				console.log('\x1b[42m                                \x1b[0m');
			},
			ERROR: () => {
				console.log('\x1b[31m', event.error, '\x1b[37m');
			},
			FATAL: () => {
				console.log('\x1b[31m', event.error, '\x1b[37m');
			}
		};

		if (eventHandlers[event.code]) {
			eventHandlers[event.code]();
		}
	});
	return watcher;
}

module.exports = watch;

if (require.main === module) {
	watch();
}
