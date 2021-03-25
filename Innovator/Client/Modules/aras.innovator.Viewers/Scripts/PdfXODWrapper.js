require([
	'dojo/_base/declare',
	'../Scripts/3rdPartyLibs/pdftronwebviewer-v2.2/lib/webviewer.js'
], function (declare, PDFTron) {
	window.PDFTron = PDFTron;
	dojo.setObject(
		'VC.WebViewer.PdfTronCustom',
		declare(PDFTron.WebViewer, {
			lastZoom: 0,

			_viewerLoaded: function () {
				var self = this;

				this.instance.docViewer.margin = 2;
				this.inherited(arguments);

				this.instance.setZoomLevel = function (zoomLevel) {
					var now = +new Date();

					if (now - self.lastZoom > 500) {
						//filters one execution of zoom per 500 milliseconds
						self.lastZoom = now;
						self.instance.docViewer.zoomTo(zoomLevel);
					}
				};
			},

			isMobileDevice: function () {
				return false;
			}
		})
	);
	return dojo.setObject('VC.WebViewer.PdfTronWrapper', function (
		props,
		element
	) {
		var tronObj = new VC.WebViewer.PdfTronCustom(props, element);
		var docViewer = null;
		var instance = null;

		return {
			loadDocument: function (args) {
				tronObj.loadDocument(args);
			},

			getInstance: function () {
				instance = tronObj.getInstance();
				docViewer = instance.getDocumentViewer();
				return instance;
			},

			setToolbarVisibility: function (args) {
				tronObj.setToolbarVisibility(args);
			},

			setSideWindowVisibility: function (args) {
				tronObj.setSideWindowVisibility(args);
			},

			setZoomLevel: function (args) {
				tronObj.setZoomLevel(args);
			},

			setFitMode: function (args) {
				tronObj.setFitMode(args);
			},

			getToolMode: function () {
				return tronObj.getToolMode();
			},

			setToolMode: function (args) {
				tronObj.setToolMode(args);
			},

			getLayoutMode: function () {
				return tronObj.getLayoutMode();
			},

			setLayoutMode: function (args) {
				tronObj.setLayoutMode(args);
			},

			getZoomLevel: function () {
				return tronObj.getZoomLevel();
			},

			goToPrevPage: function () {
				tronObj.goToPrevPage();
			},

			goToNextPage: function () {
				tronObj.goToNextPage();
			},

			goToFirstPage: function () {
				tronObj.goToFirstPage();
			},

			goToLastPage: function () {
				tronObj.goToLastPage();
			},

			setCurrentPageNumber: function (args) {
				tronObj.setCurrentPageNumber(args);
			},

			getCurrentPageNumber: function () {
				return tronObj.getCurrentPageNumber();
			},

			searchText: function (pattern, searchModes) {
				tronObj.searchText(pattern, searchModes);
			},

			rotateClockwise: function () {
				tronObj.rotateClockwise();
			},

			rotateCounterClockwise: function () {
				tronObj.rotateCounterClockwise();
			},

			getPageCount: function () {
				return docViewer.getPageCount();
			},

			setRotation: function (args) {
				docViewer.setRotation(args);
			},

			getRotation: function () {
				return docViewer.getRotation();
			},

			getDisplayMode: function () {
				return docViewer.getDisplayModeManager().getDisplayMode();
			},

			on: function (action, fn) {
				docViewer.on(action, fn);
			},

			off: function (action, fn) {
				docViewer.off(action, fn);
			},

			watchOnViewerRendering: function (callback, viewerClass) {
				//Overriding setter of tronObj.instance.viewerRendering to trigger callback on value change
				Object.defineProperty(tronObj.instance, 'viewerRendering', {
					configurable: true,
					set: function (val) {
						this._viewerRendering = val;
						callback.call(viewerClass, val);
					},
					get: function () {
						return this._viewerRendering;
					}
				});
			}
		};
	});
});
