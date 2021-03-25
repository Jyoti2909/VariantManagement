/*
This file contains logic common for all "promote dialogs":
PromoteDialog.html, LifeCycleDialog.html

Part 1. Initialization.
*/
var aras = dialogArguments.aras;
var item = dialogArguments.item;
var itemID = item.getAttribute('id');
var itemTypeName = item.getAttribute('type');
var itemTypeDef = aras.getItemTypeForClient(itemTypeName);

aras = new Aras(aras); //create new Aras object

var fileref = document.createElement('link');
fileref.setAttribute('rel', 'stylesheet');
fileref.setAttribute('type', 'text/css');
fileref.setAttribute('href', '../styles/default.css');
document.getElementsByTagName('head')[0].appendChild(fileref);

var getComments = [];
var soapController;

/*
handler for async promote request.
Called when promote is finished.
*/
function whenPromoteFinish(res) {
	soapController = null;

	var result;
	if (!res) {
		result = 'null';
	} else if (itemTypeDef && itemTypeDef.getProperty('is_versionable') === '1') {
		result = aras.getItemLastVersion(itemTypeName, itemID);
	} else {
		result = aras.getItemById(itemTypeName, itemID);
	}
	closeWindow(result);
}

/*
Promotes item to the specified state with the specified comments
*/
function promoteWithComments(stateName, comments) {
	if (comments === null) {
		toolbar.getActiveToolbar().getItem('promote').setEnabled(true);
		return false;
	}

	var res = aras
		.getMostTopWindowWithAras(window)
		.aras.promoteEx(item, stateName, comments);
	whenPromoteFinish(res);
}

onbeforeunload = function onbeforeunloadHandler() {
	if (soapController) {
		return aras.getResource('', 'promote_dialog.promote_not_finished');
	}
};

onunload = function onunloadHandler() {
	if (soapController) {
		soapController.markInvalid();
	}
};
