/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('HOOPSViewer', [BaseViewer], {
		args: null,

		constructor: function (args) {
			this.args = args;
		},

		getViewerSrc: function () {
			return '../Modules/aras.innovator.Viewers/Views/HoopsViewer.html';
		}
	});
});
