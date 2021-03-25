/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/layout/ContentPane',
	'Aras/Client/Controls/Experimental/LazyLoaderBase'
], function (declare, ContentPane, LazyLoaderBase) {
	return declare('BaseViewer', [ContentPane, LazyLoaderBase], {
		args: null,
		viewerFrame: null,

		constructor: function (args) {
			this.args = args;
		},

		getViewerSrc: function () {
			return '';
		},

		startup: function () {
			this.inherited(arguments);

			this.viewerFrame = document.createElement('iframe');
			this.viewerFrame.setAttribute('id', this.id + 'instViewer');
			this.viewerFrame.setAttribute('frameborder', '0');
			this.viewerFrame.setAttribute('width', '100%');
			this.viewerFrame.setAttribute('height', '100%');
			this.viewerFrame.setAttribute('src', this.getViewerSrc());
			this.domNode.appendChild(this.viewerFrame);
			this.viewerFrame.contentWindow.params = this.args.params;

			var that = this;

			this.viewerFrame.onload = function () {
				that.onloaded();
			};
		},

		destroyRecursive: function () {
			this.domNode.innerHTML = 'about:blank';
			this.inherited(arguments);
		}
	});
});
