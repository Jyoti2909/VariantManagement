VC.Utils.Page.LoadModules(['PdfTronClientViewer']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.AdvancedImageViewer',
		(function () {
			return declare('AdvancedImageViewer', VC.PdfTronClientViewer, {
				constructor: function (args) {
					this.messageId = null;
					this.type = this.DialogManager.viewerType = 'advancedImage';
					this.args = args;
					this.serverMaxZoom = args.maxZoom;
					this.cData = args.cData;
				},

				initializeViewer: function () {
					var self = this;

					if (
						typeof this.cData === 'undefined' ||
						this.cData === null ||
						this.cData === ''
					) {
						VC.Utils.AlertError(
							VC.Utils.GetResource('pdfv_license_is_invalid')
						);
						return;
					}
					var pdfInitOptions = {
						ui: 'legacy',
						type: 'html5',
						documentType: 'pdf',
						enableAnnotations: false,
						hideAnnotationPanel: true,
						showToolbarControl: false,
						path:
							self.args.baseUrl +
							'/Modules/aras.innovator.Viewers/Scripts/3rdPartyLibs/pdftronwebviewer-v2.2/lib',
						pdfBackend: VC.Utils.Viewers.PDFViewerSettings.pdfBackend,
						preloadPDFWorker: false,
						useDownloader: false
					};
					this.viewer = new VC.WebViewer.PdfTronWrapper(
						pdfInitOptions,
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
				},

				_loadFile: function () {
					if (this.isViewerInitialized) {
						this.viewer.loadDocument(
							this.args.baseUrlWithoutSalt +
								'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
								encodeURIComponent(this.fileUrl) +
								VC.Utils.Enums.PdfHandlerActions.ImageToPdf
						);
					}
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
					var newFileUrl = this.aras.IomInnovator.getFileUrl(
						this.args.fileId,
						this.aras.Enums.UrlType.SecurityToken
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
				},

				switchToDefaultMode: function () {
					let btnZoomWindow = this.toolbarContainer.viewToolbar.btnZoomWindow;
					if (btnZoomWindow && btnZoomWindow.IsPressed) {
						btnZoomWindow.SetPressedState(false);
						this.zoomWindow = false;
						this._toPanMode();

						if (this.onZoomModeDispose) {
							this.onZoomModeDispose();
						}
					}
				}
			});
		})()
	);
});
