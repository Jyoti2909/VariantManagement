require([
	'ES/Scripts/Classes/Page/InternalReindex',
	'ES/Scripts/Classes/Utils',
	'dojo/ready'
], function (InternalReindex, Utils, ready) {
	var app = {
		redirect: function (path) {
			window.location = path;
		},
		onReady: function () {
			if (app.utils.isFeatureActivated()) {
				app.internalReindexPage = new InternalReindex({
					arasObj: aras
				});
				app.internalReindexPage.init();
			} else {
				app.redirect('GetLicense.html');
			}
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
