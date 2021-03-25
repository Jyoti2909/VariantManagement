module.exports = {
	babelrc: false, // stops babel from using .babelrc files
	presets: [
		[
			__dirname + '/node_modules/@babel/preset-env',
			{
				'modules': false
			}
		]
	],
	plugins: [
		['@babel/plugin-proposal-class-properties', {loose: true}],
		[__dirname + '/node_modules/babel-plugin-inferno', {imports: true}],
		__dirname + '/node_modules/@babel/plugin-syntax-jsx',
		__dirname + '/node_modules/@babel/plugin-transform-flow-strip-types'
	],
	exclude: [
		'node_modules/**'
	]
}
