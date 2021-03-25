var ClientControlsFactory = function ClientControlsFactory() {};

ClientControlsFactory.prototype.createControl = function (
	controlTypeFullName,
	controlOptions,
	callback
) {
	controlTypeFullName = controlTypeFullName
		.replace(/\./g, '/')
		.replace(/\#/g, '.');
	var domNode = controlOptions ? controlOptions.domNode : null;

	//we keep this code line for compatibility with 10.0 SP1, SP2
	controlTypeFullName = controlTypeFullName.replace('Legacy', 'Public');
	//we keep this 2 lines for compatibility
	controlTypeFullName = controlTypeFullName.replace(
		'Aras/Client/Controls/HtmlEditor',
		'Aras/Client/Controls/Public/HtmlEditor'
	);
	controlTypeFullName = controlTypeFullName.replace(
		'Aras/Client/Controls/Experimental/HtmlEditor',
		'Aras/Client/Controls/Public/HtmlEditor'
	);

	return new Promise(function (resolve) {
		var createControl = function () {
			require([controlTypeFullName, 'dojo/domReady!'], function (constructor) {
				var control = new constructor(controlOptions, domNode);
				if (callback) {
					callback(control);
				}
				resolve(control);
			});
		};

		if (controlTypeFullName.indexOf('GridContainer') > 0) {
			//dojo/searchGrid is a layer-bundle of dojo scripts for grid
			require(['dojo/searchGrid'], createControl);
		} else {
			createControl();
		}
	});
};

ClientControlsFactory.prototype.on = function (arasClientControl, arg1, arg2) {
	var eventNameToHandler = arg1;
	if (typeof arg1 === 'string') {
		eventNameToHandler = {};
		eventNameToHandler[arg1] = arg2;
	}
	require(['dojo/_base/connect'], function (connect) {
		for (var eventName in eventNameToHandler) {
			connect.connect(
				arasClientControl,
				eventName,
				eventNameToHandler[eventName]
			);
		}
	});
};
var clientControlsFactory = new ClientControlsFactory();
