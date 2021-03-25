//this file is used to set TGV parameter value from id of opened item.
var aras = parent.aras;
var cadParametersProviderParam;
var tgvdId = QueryString('tgvdId').toString();
tgvdIdParam = 'tgvdId=' + tgvdId;

//Logic to specify custom Parameters Provider

window.CustomParametersProvider = function () {
	var parameters = {};

	this.getParameters = function () {
		return parameters;
	};

	this.setParameter = function (name, value) {
		if (name === 'StartItemId' || name === 'ContextItemId') {
			value = parent.item.getAttribute('id');
		}
		parameters[name] = value;
	};
};
cadParametersProviderParam =
	'parametersProvider=parent.CustomParametersProvider()';

//Logic to show Tree Grid Viewer in iframe.

var tgvUrl = aras.getBaseURL(
	'/Modules/aras.innovator.TreeGridView/Views/MainPage.html?'
);
var allParams = [tgvdIdParam, cadParametersProviderParam];
for (var i = 0; i < allParams.length; i++) {
	if (allParams[i]) {
		tgvUrl += (i === 0 ? '' : '&') + allParams[i];
	}
}

var iframe = document.createElement('iframe');
iframe.id = 'tree_grid_viewer';
iframe.width = '100%';
iframe.height = '100%';
iframe.frameBorder = '0';
iframe.scrolling = 'auto';
iframe.src = tgvUrl;
iframe.style.position = 'absolute';
iframe.style.top = '0px';
iframe.style.left = '0px';
document.body.insertBefore(iframe, document.body.childNodes[0]);
