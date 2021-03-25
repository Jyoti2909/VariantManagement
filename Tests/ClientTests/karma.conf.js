var includingJSLibrares = {
	libs: [
		// To use Sinon framework
		'../../AutomatedProcedures/tools/NodeJS/node_modules/sinon/pkg/sinon.js',


		// Necessary for Aras object
		'../../Innovator/Client/javascript/aras_object.js',
		'../../Innovator/Client/javascript/mscorlib.js',
		'../../Innovator/Client/javascript/IOM.ScriptSharp.js',

		'../../Innovator/Client/BrowserCode/common/javascript/XmlDocument.js',
		'../../Innovator/Client/BrowserCode/common/javascript/XmlDocumentCommon.js'
	],
	libsToCoverage: [// librares to include in browser and process by coverage processor
		'../PackageMethods/JavascriptMethods/samples/SimpleClientMethod.js',
		'../PackageMethods/JavascriptMethods/samples/ShowIdentities.js',
		'../PackageMethods/JavascriptMethods/samples/GetUserKeyedNameByLoginName.js',
		'../PackageMethods/JavascriptMethods/Grammer/GAG_SetOnSearchCriteria.js',
		'../PackageMethods/JavascriptMethods/Grammer/GAG_OnSearchCADDesigners.js',
		'../PackageMethods/JavascriptMethods/Grammer/GAG_OnSearchProductEngineer.js',
		'../PackageMethods/JavascriptMethods/Grammer/GAG_OnSearchTechSpecialist.js',
		'../PackageMethods/JavascriptMethods/Grammer/GAG_OnSearchPEExceptCreator.js'
	],
	testCases: [// list of testcases to include in browser
		'tests/SimpleClientTest.js',
		'tests/ShowIdentitiesTest.js',
		'tests/GetUserKeyedNameByLoginNameTest.js',
		'tests/GAG_OnSearchCADDesignersTest.js',
		'tests/GAG_OnSearchProductEngineerTest.js',
		'tests/GAG_OnSearchTechSpecialistTests.js',
		'tests/GAG_OnSearchPEExceptCreatorTests.js'
	]
};

module.exports = function(config) {
	var files = includingJSLibrares.libs.concat(includingJSLibrares.libsToCoverage, includingJSLibrares.testCases);	

	var preprocessors = [];

	for (var i = 0; i < includingJSLibrares.libsToCoverage.length ; i++) {
		preprocessors[includingJSLibrares.libsToCoverage[i]] = ['coverage'];
	}

	var browsers = ['Chrome', 'Edge'];

	var reporters = ['mocha', 'junit'];
	if (includingJSLibrares.libsToCoverage.length > 0) {
		reporters.push('coverage');
	}

	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['mocha', 'chai'],

		// list of files / patterns to load in the browser
		files: files,

		// list of files / patterns to exclude
		exclude: [
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: preprocessors,

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: reporters,

		coverageReporter: {
			sourceStore: null, //Required for correct generation of coverage when running compiled ES tests
			type: 'html',
			dir: 'reporters/coverage'
		},

		junitReporter: {
			outputDir: 'reporters/junit',
			outputFile: 'unitTests.xml'
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: browsers,

		customLaunchers: {
			ChromeNoSandbox: {
				base: 'Chrome',
				flags: ['--no-sandbox']
			}
		},

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	});
};
