require([
	'ES/Scripts/Classes/Page/MainPage',
	'ES/Scripts/Classes/Utils',
	'dojo/ready'
], function (MainPage, Utils, ready) {
	var app = {
		redirect: function (path) {
			window.location = path;
		},
		blurActiveElement: function () {
			var activeElement = parent.document.activeElement;
			if (!app.utils.isNullOrUndefined(activeElement)) {
				activeElement.blur();
			}
		},
		onReady: function () {
			if (app.utils.isFeatureActivated()) {
				app.mainPage = new MainPage({
					arasObj: aras
				});
			} else {
				app.redirect('GetLicense.html');
			}

			app.blurActiveElement();
		}
	};

	aras = parent.aras;
	app.utils = new Utils({
		arasObj: aras
	});
	ready(app.onReady);

	// Set app object if code is executed by unit tests framework
	if (typeof mocha === 'object') {
		_appObject = app;
	}
});
