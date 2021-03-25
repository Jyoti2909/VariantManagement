define([], function () {
	function JsPdfLoader() {}

	var pluginsCount = 0;
	var pluginsLoaded = 0;
	var returnCallback;

	JsPdfLoader.prototype = {};

	JsPdfLoader.loadScripts = function (callback, plugins) {
		if (typeof jsPDF == 'function') {
			callback(jsPDF);
		} else {
			var script = document.createElement('script');
			script.src =
				aras.getBaseURL() + '/Modules/aras.innovator.Printing/Scripts/jspdf.js';
			script.type = 'text/javascript';
			script.onload = function () {
				if (plugins) {
					pluginsCount = plugins.length;
					returnCallback = callback;
					for (var i = 0; i < plugins.length; i++) {
						var pluginUrl =
							aras.getBaseURL() +
							'/Modules/aras.innovator.Printing/Scripts/' +
							plugins[i];
						var script = document.createElement('script');
						script.src = pluginUrl;
						script.type = 'text/javascript';
						/* jshint ignore:start */
						script.onload = function () {
							setTimeout(function () {
								pluginLoaded();
							}, 0);
						};
						/* jshint ignore:end */
						document.head.appendChild(script);
					}
				} else {
					setTimeout(function () {
						callback(jsPDF);
					}, 0);
				}
			};
			document.head.appendChild(script);
		}
	};

	function pluginLoaded() {
		pluginsLoaded += 1;
		if (pluginsLoaded >= pluginsCount) {
			setTimeout(function () {
				returnCallback(jsPDF);
			}, 0);
		}
	}

	return JsPdfLoader;
});
