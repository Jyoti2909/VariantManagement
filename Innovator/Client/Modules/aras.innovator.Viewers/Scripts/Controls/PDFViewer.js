﻿/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define(['dojo/_base/declare', 'Viewers/BaseViewer'], function (
	declare,
	BaseViewer
) {
	return declare('PDFViewer', [BaseViewer], {
		args: null,

		constructor: function (args) {
			this.args = args;
		},

		getViewerSrc: function () {
			var url = encodeURIComponent(this.args.params.fileUrl);
			if (!window.ActiveXObject && 'ActiveXObject' in window) {
				return (
					'../Modules/aras.innovator.Viewers/Views/PDFXODViewer.html?file=' +
					url
				);
			}
			return (
				'../Modules/aras.innovator.Viewers/Views/PDFClientViewer.html?file=' +
				url
			);
		}
	});
});
