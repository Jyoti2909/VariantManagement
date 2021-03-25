var ModulesManager = {
	_mapPathClasses: function (classes) {
		return classes.map(function (classIndex) {
			const tmp = classIndex.split('/');
			const moduleName = tmp.slice(0, tmp.length - 1).join('/'); // get everything before last segment.
			const className = tmp.slice(-1)[0]; // class name is last segment
			return aras.getBaseURL(
				'/Modules/' + moduleName + '/Scripts/Classes/' + className + '.js'
			);
		});
	},
	// class format -> ['moduleName/className', 'moduleName2/className2']
	using: function (classes, func) {
		const mapClass = this._mapPathClasses(classes);

		return new Promise(function (resolve) {
			require(mapClass, function () {
				if (func instanceof Function) {
					resolve(func.apply(null, arguments));
				} else {
					resolve(arguments[0]);
				}
			});
		});
	},
	define: function (classes, classFullName, func, isAsync) {
		const mapClass = this._mapPathClasses(classes);
		define(mapClass, func);
	}
};
