dojo.registerModulePath(
	'viewersScripts',
	top.aras.getBaseURL() + '/Modules/aras.innovator.Viewers/Scripts'
);

define(['dojo/_base/declare', 'viewersScripts/Controls/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('ComparisonLoader', [BaseViewer], {
		getViewerSrc: function () {
			return '../Modules/aras.innovator.Viewers/Views/ComparisonViewer.html';
		}
	});
});
