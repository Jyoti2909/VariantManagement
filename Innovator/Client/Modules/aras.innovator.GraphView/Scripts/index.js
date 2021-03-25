import GraphViewApplicationCore from './GraphViewApplicationCore';

const paramObjectName = window.paramObjectName;
const paramsObject = paramObjectName ? window.opener[paramObjectName] : parent;
window.item = paramsObject.item;
window.itemId = paramsObject.itemID;
window.itemType = paramsObject.itemType;
window.itemTypeName = paramsObject.itemTypeName;

function getWindowParameter(parameterName) {
	const allWindowParameters = decodeURIComponent(
		window.location.search.substring(1)
	).split('&');
	for (let i = 0; i < allWindowParameters.length; i++) {
		const currentArg = allWindowParameters[i].split('=');
		if (currentArg[0] === parameterName) {
			return currentArg[1];
		}
	}
}

window.addEventListener('load', function () {
	const arasObject = window.aras || parent.aras;
	arasObject.getResource('../Modules/aras.innovator.GraphView', '');
	window.graphViewControl = new GraphViewApplicationCore({
		contextItem: window.item,
		arasObject: arasObject,
		gvdId: getWindowParameter('gvdId')
	});
	window.layout.observer.notify('UpdateTearOffWindowState');
	window.graphViewControl.init();

	window.graphViewControl.loadView(window.itemId, window.itemTypeName);
	arasObject.browserHelper.toggleSpinner(document, false);
});
