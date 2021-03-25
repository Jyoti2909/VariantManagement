/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('AdvancedImageViewer', [BaseViewer], {
		args: null,

		constructor: function (args) {
			this.args = args;
		},

		getViewerSrc: function () {
			if (!window.ActiveXObject && 'ActiveXObject' in window) {
				return '../Modules/aras.innovator.Viewers/Views/AdvancedImageXODViewer.html';
			}
			return '../Modules/aras.innovator.Viewers/Views/AdvancedImageViewer.html';
		}
	});
});
