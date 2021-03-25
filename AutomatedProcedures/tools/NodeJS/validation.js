const path = require('path');
const { execFile } = require('child_process');

const pathToRepositoryRoot = path.resolve('..\\..\\..\\');
const pathToAMLPackages = path.join(pathToRepositoryRoot, 'Tests\\PackageMethods');
const pathToInnovatorClient = path.resolve(pathToRepositoryRoot, 'Innovator\\Client');

const mainProcess = process;
mainProcess.exitCode = 0;

const stdoutLogCallback = (error, stdout, stderr) => { 
	console.log(stdout);
	if (error) {
		console.log(error, stderr);
		mainProcess.exitCode += 1;
	}
};

function jshintValidate(pathToTargetFolder, args = []) {
	const pathToJshint = path.resolve('node_modules\\.bin\\jshint.cmd');
	const jshintArgs = ['.', ...args];

	validate(pathToJshint, pathToTargetFolder, jshintArgs);
}

function eslintValidate(pathToTargetFolder, args = []) {
	const pathToEslint = path.resolve('node_modules\\.bin\\eslint.cmd');
	const pathToEslintIgnore = path.resolve('..\\..\\..\\.eslintignore');
	const pathToNodeModules = path.resolve('node_modules');
	const eslintArgs = [
		pathToTargetFolder,
		'--ignore-path', pathToEslintIgnore,
		'--no-error-on-unmatched-pattern',
		'--resolve-plugins-relative-to', pathToNodeModules,
		...args
	];
	
	validate(pathToEslint, pathToRepositoryRoot, eslintArgs);
}

function validate(pathToValidator, pathToTargetFolder, args, execFileCallback = stdoutLogCallback) {
	const options = {
		cwd: pathToTargetFolder,
		maxBuffer: 10 * 1024 * 1024
	};

	console.log(`Starting '${pathToValidator} ${args.join(' ')}' in '${pathToTargetFolder}'\n`);

	execFile(pathToValidator, args, options, execFileCallback);
}

exports.jshint = (args) => {
	jshintValidate(pathToAMLPackages, args);
	jshintValidate(pathToInnovatorClient, args);
};
exports.eslint = (args) => {
	eslintValidate(pathToAMLPackages, args);
	eslintValidate(pathToInnovatorClient, args);
};

exports.eslintAutoFix = () => {
	exports.eslint(['--fix']);
};
exports.lint = () => {
	exports.jshint();
	exports.eslint();
};