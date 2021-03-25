/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('GraphViewerLoader', [BaseViewer], {
		args: null,

		constructor: function (args) {
			this.inherited(arguments);
			this.itemID = args.itemID;
			this.itemTypeName = args.itemTypeName;
			this.gvdId = args.gvdId;
		},
		startup: function () {
			this.inherited(arguments);
			this.domNode.classList.add('graphViewer');
		},

		getViewerSrc: function () {
			return `../Modules/aras.innovator.GraphView/Views/GraphViewInFrame.html?id=${this.itemID}&type=${this.itemTypeName}&gvdId=${this.gvdId}`;
		}
	});
});
