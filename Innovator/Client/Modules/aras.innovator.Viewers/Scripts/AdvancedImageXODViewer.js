VC.Utils.Page.LoadModules(['AdvancedPdfViewer']);

require(['dojo/_base/declare'], function (declare) {
	dojo.setObject(
		'VC.AdvancedImageXODViewer',
		(function () {
			var intervalObject = {};

			return declare('AdvancedImageXODViewer', VC.AdvancedPdfViewer, {
				constructor: function (args) {
					this.args = args;
					this.currentPageNumber = 1;
					this.type = this.DialogManager.viewerType = 'advancedImage';
				},

				initializeViewer: function () {
					var self = this;
					var cData = VC.Utils.getPdfFileInfo(
						this.fileUrl,
						VC.Utils.Enums.PdfHandlerActions.ClientData
					);
					if (cData === null || cData === '') {
						VC.Utils.AlertError(
							VC.Utils.GetResource('pdfv_license_is_invalid')
						);
						return;
					}

					this.viewer = new VC.WebViewer.PdfTronWrapper(
						{
							ui: 'legacy',
							type: 'html5,silverlight,html5Mobile,flash',
							hideAnnotationPanel: true,
							path:
								this.aras.getBaseURL() +
								'/Modules/aras.innovator.Viewers/Scripts/3rdPartyLibs/pdftronwebviewer-v2.2/lib',
							initialDoc:
								VC.Utils.getBaseUrlWithoutSalt(this.aras) +
								'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
								encodeURIComponent(this.fileUrl) +
								VC.Utils.Enums.PdfHandlerActions.PdfToXod,
							enableAnnotations: false,
							showToolbarControl: false,
							streaming: true
						},
						this.viewerContainer
					);

					this.viewerContainer.addEventListener(
						'ready',
						dojo.hitch(this, this.onViewerReady)
					);
					this.viewerContainer.addEventListener(
						'documentLoaded',
						dojo.hitch(this, this.onViewerLoaded)
					);
					this.viewerContainer.addEventListener(
						'pageChanged',
						dojo.hitch(this, this.onPageChangeEventHandler)
					);
					this.viewerContainer.addEventListener(
						'zoomChanged',
						dojo.hitch(this, this.onZoomChangeEventHandler)
					);

					this.hidden = false;
					this.initLoadingProgress(0);
					this.systemDPI = VC.Utils.getXYDPIs()[0];

					var params = {};
					params.viewStateData = self.viewStateData;
					params.docViewerEl = self.docViewerEl;
					this.onHandleScrollStateEvent(params);
					this.isViewerInitialized = true;
				},

				loadViewerToolbar: function () {
					var self = this;

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.AdvancedImageViewerToolbar
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPageUpClick,
						dojo.hitch(self, self.PageUpClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPageDownClick,
						dojo.hitch(self, self.PageDownClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.ntbPageNumberChange,
						dojo.hitch(self, self.PageNumberChange)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomWindowClick,
						dojo.hitch(self, self.ZoomWindowClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomDownClick,
						dojo.hitch(self, self.ZoomOut)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomUpClick,
						dojo.hitch(self, self.ZoomIn)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.tbxZoomPercentageChange,
						dojo.hitch(self, self.ZoomPercentChange)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnFitWidthClick,
						dojo.hitch(self, self.FitWidth)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnFitHeightClick,
						dojo.hitch(self, self.FitHeight)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnMeasureClick,
						dojo.hitch(self, self.MeasureClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnCompareClick,
						dojo.hitch(self, self.CompareClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnDownloadClick,
						dojo.hitch(self, self.DownloadClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnViewFileClick,
						dojo.hitch(self, self.PrintClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnClockwiseClick,
						dojo.hitch(self, self.RotateCW)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnCounterClockwiseClick,
						dojo.hitch(self, self.RotateCCW)
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnMeasure,
						VC.Utils.Enums.Dialogs.Measurement
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnCompare,
						VC.Utils.Enums.Dialogs.CompareFiles
					);
				},

				PrintClick: function () {
					VC.Utils.Page.LoadModules(['Managers/PrintManager']);
					var newFileUrl = aras.IomInnovator.getFileUrl(
						this.args.fileId,
						aras.Enums.UrlType.SecurityToken
					);
					var fileUrl =
						this.args.baseUrlWithoutSalt +
						'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
						encodeURIComponent(newFileUrl) +
						VC.Utils.Enums.PdfHandlerActions.ImageToPdf;
					VC.PrintManager.openPDFFile(fileUrl, VC.PrintManager.printFile);
				},

				getViewerType: function () {
					return VC.Utils.Enums.MeasurementUtils.AdvancedImageViewer;
				}
			});
		})()
	);
});
