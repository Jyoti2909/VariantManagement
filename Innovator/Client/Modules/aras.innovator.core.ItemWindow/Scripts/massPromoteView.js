var item = window.opener[paramObjectName].item;
var itemID = window.opener[paramObjectName].itemID;
var itemType = window.opener[paramObjectName].itemType;

onload = function onloadHandler() {
	var isTab = aras.getMainWindow().document.getElementById(window.name);
	if (isTab) {
		arasTabsobj.updateTitleTab(window.name, { label: 'Mass Promote' });
	}

	function initStatusBar(StatusBar) {
		window.statusbar = new StatusBar({
			aras: aras,
			resourceUrl: aras.getI18NXMLResource(
				'defaultstatusbar.xml',
				aras.getBaseURL()
			)
		});

		const statusDiv = document.getElementById('bottom_statusBar');
		statusDiv.appendChild(window.statusbar.domNode);
	}

	// initialize mass promote mediator (entrance for the mass promote functionality)
	require([
		'../Modules/aras.innovator.MassPromote/Scripts/Classes/mediator.js',
		'Aras/Client/Controls/Experimental/StatusBar'
	], function (Mediator, StatusBar) {
		initStatusBar(StatusBar);
		window.mediator = new Mediator();

		const nativeClose = window.close;
		window.close = function (callback) {
			mediator.onCloseButtonClick().then(function (needClose) {
				if (callback) {
					// it is the tab, callback will remove tab and window
					callback(needClose);
				} else if (needClose) {
					// we need to close the tear off window using native mechanism
					nativeClose();
				}
			});
		};
		aras.browserHelper.toggleSpinner(document, false);
	});
};
