var aras = parent.aras;
var startConditionProviderParam;

tgvdIdParam = 'tgvdId=23ECA732F48F43B5B5DF1480AB6DDAA8';

//Logic to specify custom Start Conditions

window.CustomStartConditionProvider = function () {
	this.getCondition = function () {
		var idlist = [
			'989631704C054FD3B0F6ECD35601C529',
			'3AC05CC1B74E4AC7A3C6A44D2D83A0A4',
			'AD4CA34A5E274F3584E669B02EEE701F'
		];
		//id of RootPart, RP_2 and RP_3 from test package with RB_Part item type and items of this type.
		return {
			id: idlist
		};
	};
};
var managedById = aras.getItemProperty(parent.item, 'managed_by_id');
startConditionProviderParam =
	'startConditionProvider=parent.CustomStartConditionProvider("' +
	managedById +
	'")';

//Logic to show Tree Grid Viewer in iframe.

var tgvUrl = parent.aras.getBaseURL(
	'/Modules/aras.innovator.TreeGridView/Views/MainPage.html?'
);
var allParams = [tgvdIdParam, startConditionProviderParam];
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
