/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('DynamicHOOPSViewer', [BaseViewer], {
		args: null,

		constructor: function (args) {
			this.args = args;
		},

		getViewerSrc: function () {
			var item = this.args.params.itemWindow.aras.getItemById(
				this.args.params.markupHolderItemtypeName,
				this.args.params.markupHolderId
			);
			var streamingEnabledProperty = item.selectSingleNode('streaming_enabled');
			if (streamingEnabledProperty && streamingEnabledProperty.text === '1') {
				return '../Modules/aras.innovator.Viewers/Views/StreamingHoopsViewer.html';
			} else {
				return '../Modules/aras.innovator.Viewers/Views/DynamicHoopsViewer.html';
			}
		}
	});
});
