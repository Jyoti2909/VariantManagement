/* eslint-disable no-console */
const path = require('path');
const rollupBabel = require('rollup-plugin-babel');
const externalGlobals = require('rollup-plugin-external-globals');
const injectProcessEnv = require('rollup-plugin-inject-process-env');
const rollupTerser = require('rollup-plugin-terser').terser;
const postcss = require('rollup-plugin-postcss');
const babelConfig = require('./babel.config');
const minifyConfig = require('./uglify.config');
const jsCompileHelper = require('./jsCompileHelper');

const name = process.argv[4];
const bundles = jsCompileHelper.getBundleList();
const bundle = bundles.find((bundle) => bundle.name === name) || {};
const globals = {
	'inferno': 'Inferno',
	'hyperhtml-element': 'HyperHTMLElement'
};
const external = Object.keys(globals);
const ignoredESMBundles = ['classStructure', 'cui', 'graphView', 'multiLingual'];
const esmBundleInput = bundles.reduce((acc, bundle) => {
	if (!ignoredESMBundles.includes(bundle.name)) {
		acc[bundle.name] = bundle.input;
	}
	return acc;
}, {});
const plugins = [
	postcss({
		minimize: true,
		inject: false
	}),
	rollupBabel(babelConfig),
	rollupTerser(minifyConfig)
];

module.exports = [
	{
		input: bundle.input,
		external,
		plugins: [
			...plugins,
			{
				generateBundle(...args) {
					if (bundle.file) {
						console.log(bundle.file);
						console.log(jsCompileHelper.getDependenciesFiles(...args).join('\n'));
					}
				}
			},
			injectProcessEnv({
				NODE_ENV: 'production'
			}),
		],
		output: {
			name,
			format: 'iife',
			file: bundle.file,
			globals,
			sourcemap: true
		}
	},
	{
		input: esmBundleInput,
		external,
		plugins: [
			...plugins,
			externalGlobals((moduleId) => {
				const dependencyName = path.basename(moduleId, '.js');
				if (globals[dependencyName]) {
					return globals[dependencyName];
				}
			})
		],
		output: {
			chunkFileNames: '[name].es.js',
			dir: path.resolve(__dirname, '../jsBundles'),
			entryFileNames: '[name].es.js',
			format: 'es',
			sourcemap: true
		}
	}
];
