VC.Utils.Page.LoadModules(['PdfXODViewer']);

require(['dojo/aspect', 'dojox/xml/parser'], function (aspect, parser) {
	return dojo.setObject(
		'VC.AdvancedPdfViewer',
		(function () {
			var intervalObject = {};

			return dojo.declare('AdvancedPdfViewer', VC.PdfTronViewer, {
				measureContainer: null,

				onInitTempViewer: function (viewename, args) {},
				onRecordMeasurmentClick: function (args) {},
				onSetComparisonData: function (args) {},
				onBindDocumentVersions: function (args) {},
				onRestoreComparisonData: function (fileInfo1, fileInfo2) {},
				clearComparisonData: function () {},
				updateComparisonData: function () {},
				comparisonManager: null,

				constructor: function (args) {
					this.currentPageNumber = 1;
					this.args = args;
					this.type = this.DialogManager.viewerType = 'pdf';
				},

				loadViewerToolbar: function () {
					var self = this;

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.PdfViewerToolbar
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
						VC.Utils.Enums.TButtonEvents.btnSelectTextClick,
						dojo.hitch(self, self.SelectTextClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPanClick,
						dojo.hitch(self, self.PanClick)
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
						VC.Utils.Enums.TButtonEvents.btnFindClick,
						dojo.hitch(self, self.FindClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnLayersClick,
						dojo.hitch(self, self.LayersClick)
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
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnPreferencesClick,
						dojo.hitch(self, self.Preferences)
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnFind,
						VC.Utils.Enums.Dialogs.Find
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnLayers,
						VC.Utils.Enums.Dialogs.Layers
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnMeasure,
						VC.Utils.Enums.Dialogs.Measurement
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnCompare,
						VC.Utils.Enums.Dialogs.CompareFiles
					);
					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnPreferences,
						VC.Utils.Enums.Dialogs.Preferences
					);

					this.setBtnLayersAccessibility();
				},

				LayersClick: function () {
					var layersDialog = null;
					var self = this;

					if (self.layersList === null || self.layersList === '') {
						self.layersList = '[]';
					}

					layersDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Layers,
						self.layersList
					);

					if (!layersDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnLayers,
							layersDialog
						);

						layersDialog.onChange = function (strLayers) {
							self.layersList = strLayers;

							var retStr = collectLayersString();
							self.reloadDocument(retStr);

							if (retStr !== '') {
								self.viewStateData.updateValue('layers', retStr);
							}
						};

						layersDialog.onReset = function () {
							self.resetLayersDialog();
						};

						layersDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						layersDialog.isInitHandlers = true;
					}

					function collectLayersString() {
						var resultLayers = JSON.parse(self.layersList);

						var retStr = '';
						for (var layer in resultLayers) {
							if (retStr !== '') {
								retStr += ';';
							}
							retStr += resultLayers[layer].title;
							if (resultLayers[layer].checked) {
								retStr += '&&';
							}
						}

						return retStr;
					}
				},

				MeasureClick: function () {
					var self = this;
					var measureDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Measurement
					);

					if (self.measureContainer === null) {
						var frameDocument =
							self.viewerContainer.firstElementChild.contentDocument;
						VC.Utils.Page.LoadWidgets(['MeasureContainer']);
						var measureContainer = new VC.Widgets.MeasureContainer();
						measureContainer.placeAt(frameDocument);

						self.measureContainer = measureContainer;

						VC.Utils.Page.LoadStyles(
							frameDocument,
							'../../../../../styles/Measure.css'
						);
						VC.Utils.Page.LoadStyles(
							frameDocument,
							'../../../../../styles/svgSettings.css'
						);
					}

					if (!measureDialog.isInitHandlers) {
						measureDialog.initMeasurementUnits(self.getViewerType());
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnMeasure,
							measureDialog
						);

						measureDialog.onClearStartPoint = function () {
							self.measureContainer.clearStartPoint();
						};

						measureDialog.onClearEndPoint = function () {
							self.measureContainer.clearEndPoint();
						};

						measureDialog.onResetPoints = function () {
							self.measureContainer.clearStartPoint();
							self.measureContainer.clearEndPoint();
						};

						measureDialog.onRecordMeasurement = function () {
							var textContent = self.measureContainer.measureMessageTemplate.Format(
								this.straightLine.toPrecision(3),
								this.differenceX.toPrecision(3),
								this.differenceY.toPrecision(3),
								this.abbreviation,
								this.scale
							);
							var smProperties = {
								snapshotUrl: self.getMarkupImg(),
								markupData: self.markupData,
								comments: textContent
							};
							self.onRecordMeasurmentClick(smProperties);

							self.measureContainer.clearStartPoint();
							self.measureContainer.clearEndPoint();
							measureDialog.resetDialog();
						};

						measureDialog.onSelectMeasurementUnit = function () {
							self.recalculateMeasurements();

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Measurement +
									'.' +
									'Unit',
								measureDialog.ratioToInch
							);
						};

						measureDialog.onChangeScaleValue = function () {
							self.recalculateMeasurements();

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Measurement +
									'.' +
									'Scale',
								measureDialog.scale
							);
						};

						measureDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						aspect.after(measureDialog, 'onOpen', function () {
							// We should remove zooming page
							if (self.zoomWindow) {
								self.cleanZoomingPage();
							}

							self.measureContainer.startDrawing();
						});

						aspect.after(measureDialog, 'onClose', function () {
							self.measureContainer.clearAll();
							self.measureContainer.svgPageContainer.style.display = 'none';
							measureDialog.resetDialog();

							// We should restore zooming page
							if (self.zoomWindow) {
								self._toZoomMode();
							}
						});

						var curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Measurement +
								'.' +
								'Unit'
						);
						if (curValue !== null) {
							measureDialog.ratioToInch = curValue;
							measureDialog.selectMeasurementUnit(curValue);
						}

						curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Measurement +
								'.' +
								'Scale'
						);
						if (curValue !== null) {
							measureDialog.scale = curValue;
						}

						measureDialog.isInitHandlers = true;
					}

					self.measureContainer.onStartPointChange = function (x, y) {
						var screenRes = self.systemDPI;
						var curScale = self.GetScale() / 100.0;
						var docScale = measureDialog.scale;

						if (self.customDPI) {
							screenRes = self.customDPI;
						}

						if (docScale === 0) {
							docScale = 1.0;
						}

						measureDialog.startPointX =
							(x / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
						measureDialog.startPointY =
							(y / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
					};

					self.measureContainer.onEndPointChange = function (x, y) {
						var screenRes = self.systemDPI;
						var curScale = self.GetScale() / 100.0;
						var docScale = measureDialog.scale;

						if (self.customDPI) {
							screenRes = self.customDPI;
						}

						if (docScale === 0) {
							docScale = 1.0;
						}

						measureDialog.endPointX =
							(x / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
						measureDialog.endPointY =
							(y / (curScale * screenRes) / docScale) *
							measureDialog.ratioToInch;
					};
				},

				CompareClick: function () {
					var self = this;
					var compareDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.CompareFiles
					);

					if (!compareDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnCompare,
							compareDialog
						);

						compareDialog.onStartComparison = function () {
							self.updateFilesInfo();
							self.updateComparisonData();

							self.initComparisonViewer(false);
							self.clearComparisonData();
						};

						compareDialog.onStartComparisonDiffVersion = function () {
							var pageNum = self.GetCurrentPage();
							var pageCount = VC.Utils.getPdfFileInfo(
								self.comparisonManager.currentFile,
								VC.Utils.Enums.PdfHandlerActions.PageCount
							);

							self.comparisonManager.currentFile.filePage = pageNum;
							self.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
								self.comparisonManager.currentFile
							);

							if (pageNum > pageCount) {
								VC.Utils.AlertWarning(
									VC.Utils.GetResource('pdfv_page_not_found').Format(
										self.comparisonManager.currentFile.fileVersion,
										pageNum
									)
								);
								return false;
							}

							self.updateFilesInfo();
							self.clearComparisonData();
							self.initComparisonViewer(true);
						};

						compareDialog.onSelectAnotherItem = function () {
							var deletedObj = compareDialog.getMarkedAsDelete();
							for (var i = 0; i < deletedObj.length; i++) {
								self.comparisonManager.cleanFileInfoByName(
									deletedObj[i].fileName
								);
							}

							self.updateFilesInfo();
							self.updateComparisonData();
						};

						aspect.after(compareDialog, 'onCrossClick', function () {
							if (compareDialog.getMarkedAsDelete().length > 1) {
								self.clearComparisonData();
							}
						});

						compareDialog.onSelectDiffVersion = function (version, fileName) {
							if (version === '') {
								return;
							}

							var pageNum = self.GetCurrentPage();

							self.comparisonManager = self.onSetComparisonData({
								currentList: 1,
								filePage: pageNum,
								fileVersion: version,
								fileName: fileName
							});
							var pageCount = VC.Utils.getPdfFileInfo(
								self.comparisonManager.currentFile,
								VC.Utils.Enums.PdfHandlerActions.PageCount
							);

							if (pageNum > pageCount) {
								VC.Utils.AlertWarning(
									VC.Utils.GetResource('pdfv_page_not_found').Format(
										version,
										pageNum
									)
								);
								return;
							}

							self.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
								self.comparisonManager.currentFile
							);
						};

						compareDialog.onPageChange = function () {
							var fileInfo = null;
							if (compareDialog.dvStartComparison.disabled) {
								fileInfo = self.comparisonManager.currentFile;
							} else {
								fileInfo = self.comparisonManager.getAnotherFileInfo();
							}

							fileInfo.filePage = self.GetCurrentPage();

							compareDialog.updateFileInfoPage(
								fileInfo.fileName,
								fileInfo.filePage
							);
						};

						compareDialog.isInitHandlers = true;
					}

					this.updateFilesInfo = function () {
						var pageNum = this.GetCurrentPage();
						this.comparisonManager.currentFile.filePage = pageNum;
						this.comparisonManager.currentFile.angle =
							'e_' + this.viewer.getRotation() * 90;
						this.comparisonManager.currentFile.percents = this.GetScale();

						if (
							!this.comparisonManager.isFileEmpty(0) &&
							!this.comparisonManager.isFileEmpty(1) &&
							Math.abs(
								this.GetScale() -
									this.comparisonManager.getAnotherFileProperty('percents')
							) > 0.000000000001
						) {
							this.comparisonManager.currentFile = this.addPageToPNGConvertionParameters(
								this.comparisonManager.currentFile,
								this.comparisonManager.getAnotherFileInfo()
							);
						} else {
							this.comparisonManager.currentFile = this.addPageToPNGConvertionParameters(
								this.comparisonManager.currentFile
							);
						}
					};

					this.comparisonManager = this.onSetComparisonData({
						filePage: this.GetCurrentPage(),
						fileUrl: this.fileUrl,
						updateFromCache: true
					});

					// Scaling of both files is assumed to be the same;
					if (
						!this.comparisonManager.isFileEmpty(0) &&
						!this.comparisonManager.isFileEmpty(1) &&
						Math.abs(
							self.GetScale() -
								this.comparisonManager.getAnotherFileProperty('percents')
						) > 0.000000000001
					) {
						this.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
							this.comparisonManager.currentFile,
							this.comparisonManager.getAnotherFileInfo()
						);
					} else {
						this.comparisonManager.currentFile = self.addPageToPNGConvertionParameters(
							this.comparisonManager.currentFile
						);
					}

					var documentVersions = this.onBindDocumentVersions(
						this.comparisonManager.currentFile.mhitemType,
						this.comparisonManager.currentFile.mhitemConfigId,
						this.comparisonManager.currentFile.fileVersion,
						this.comparisonManager.currentFile.fileSelectorId
					);

					compareDialog.cleanFileInfo();

					for (var i = 0; i < this.comparisonManager.fileList.length; i++) {
						var fileInfo = this.comparisonManager.fileList[i];
						if (!fileInfo.isEmpty) {
							if (i >= 1) {
								compareDialog.showComparisonContent = false;
							}
							compareDialog.addFileInfo(
								fileInfo.fileName,
								fileInfo.filePage,
								fileInfo.documentName,
								fileInfo.fileVersion
							);
						}
					}

					if (compareDialog.fileInfoControls.length === 1) {
						compareDialog.fileInfoControls[0].hideButton();
					}

					compareDialog.addVersionsDefinition(documentVersions);
					compareDialog.startup();
				},

				Preferences: function () {
					var self = this;
					var preferencesDialog = self.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.Preferences
					);

					if (!preferencesDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnPreferences,
							preferencesDialog
						);

						preferencesDialog.onChangeScalingValue = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.changeCustomDPI(preferencesDialog.scaling);
						};

						preferencesDialog.onSelectDefaultResolution = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Custom',
								'Off'
							);
							self.deleteViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Scaling'
							);
							self.changeCustomDPI(self.systemDPI);
						};

						preferencesDialog.onSelectCustomResolution = function () {
							if (!preferencesDialog.isInitHandlers) {
								return;
							}

							self.saveViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.Preferences +
									'.' +
									'Custom',
								'On'
							);
							if (preferencesDialog.scaling) {
								self.changeCustomDPI(preferencesDialog.scaling);
							}
						};

						preferencesDialog.ownerDocument.onkeydown = dojo.hitch(
							self,
							self.onDialogKeyDown
						);

						aspect.after(preferencesDialog, 'onOpen', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Preferences,
								'On'
							);
						});

						aspect.after(preferencesDialog, 'onClose', function () {
							self.saveViewerParameter(
								self.type + '.' + VC.Utils.Enums.Dialogs.Preferences,
								'Off'
							);
						});

						var curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Custom'
						);
						if (curValue !== null && curValue.localeCompare('On') === 0) {
							preferencesDialog.customResolution.isChecked = true;
							preferencesDialog.showScale();
						} else {
							preferencesDialog.scaling = self.systemDPI;
						}

						curValue = self.restoreViewerParameter(
							self.type +
								'.' +
								VC.Utils.Enums.Dialogs.Preferences +
								'.' +
								'Scaling'
						);
						if (curValue !== null && curValue !== '') {
							preferencesDialog.scaling = curValue;
						}

						preferencesDialog.isInitHandlers = true;
					}
				},

				applyViewStateData: function () {
					if (
						this.viewStateData.isEmpty() ||
						this.mode === this.ViewerModes.Markup
					) {
						return;
					}

					var fileInfo1 = this.viewStateData.getValue('fileInfo1');
					var fileInfo2 = this.viewStateData.getValue('fileInfo2');
					if (fileInfo1 !== '' && fileInfo2 !== '') {
						var diffVersion =
							this.viewStateData
								.getValue('diffVersion')
								.localeCompare('true') === 0;

						this.comparisonManager = this.onRestoreComparisonData(
							fileInfo1,
							fileInfo2
						);
						this.initComparisonViewer(
							diffVersion,
							true,
							this.viewStateData.innerString
						);

						return;
					}

					this.inherited(arguments);
				},

				initComparisonViewer: function (
					diffVersion,
					fromSnapshot,
					viewStateData
				) {
					var params = {
						maxZoom: this.maxZoom * 100,
						diffVersion: diffVersion,
						fromSnapshot: fromSnapshot ? fromSnapshot : false,
						viewStateData: viewStateData ? viewStateData : null
					};

					this.onInitTempViewer('CViewerLoader', params);
				},

				recalculateMeasurements: function () {
					var startX;
					var startY;
					var startPoint = this.measureContainer.getStartPoint();
					var endPoint = this.measureContainer.getEndPoint();

					if (startPoint) {
						startX = startPoint.startX;
						startY = startPoint.startY;

						this.measureContainer.onStartPointChange(startX, startY);
					}

					if (endPoint) {
						startX = endPoint.startX;
						startY = endPoint.startY;

						this.measureContainer.onEndPointChange(startX, startY);
					}
				},

				getMarkupImg: function () {
					// IR-033937 "ITG Viewer: Incorrect viewer state after switch from markup"
					this.viewStateData.updateValue('percents', this.GetScale());

					var self = this;
					var canvas = this.getCanvas(true);

					if (
						this.measureContainer !== null &&
						this.measureContainer.svgPage.childs !== 0
					) {
						var measureSvg = parser.innerXML(
							this.measureContainer.svgPage.getXML()
						);

						if (measureSvg) {
							var scrollTop =
								this.measureContainer.svgPageContainer.offsetTop +
								(this.measureContainer.svgPageContainer.scrollHeight -
									this.measureContainer.svgPage.height) /
									2 -
								this.scrollPositionTop;
							var scrollLeft =
								this.measureContainer.svgPageContainer.offsetLeft +
								(this.measureContainer.svgPageContainer.scrollWidth -
									this.measureContainer.svgPage.width) /
									2 -
								this.scrollPositionLeft;
							canvas
								.getContext('2d')
								.drawSvg(
									measureSvg,
									scrollLeft,
									scrollTop,
									this.measureContainer.svgPage.width,
									this.measureContainer.svgPage.height
								);
						}
					}

					return canvas.toDataURL();
				},

				addPageToPNGConvertionParameters: function (
					currentFileInfo,
					anotherFileInfo
				) {
					var curScale = this.GetScale();

					var height = this.docViewerEl.clientHeight;
					var width = this.docViewerEl.clientWidth;

					var scrollTop = this.docViewerEl.scrollTop;
					var scrollLeft = this.docViewerEl.scrollLeft;

					var pageNum = this.GetCurrentPage();
					var pageContainer = this.readerControl.getPageContainer(pageNum - 1);
					var view = pageContainer[0];

					// The .offsetParent should be used starting from WebViewer's version 2.2.0
					var pageTop = view.offsetParent.offsetTop;
					var pageHeight = view.offsetHeight;
					var pageBottom = pageTop + pageHeight;
					if (pageTop < scrollTop) {
						if (pageBottom >= scrollTop) {
							scrollTop = scrollTop - pageTop;
						}

						if (pageHeight >= scrollTop) {
							pageHeight = pageHeight - scrollTop;
						} else {
							pageHeight = 0;
						}
					} else {
						scrollTop = 0;
					}

					var pageWidth = view.offsetWidth;
					// The .offsetParent should be used starting from WebViewer's version 2.2.0
					var viewLeft = view.offsetLeft + view.offsetParent.offsetLeft;
					if (viewLeft < scrollLeft) {
						scrollLeft = scrollLeft - viewLeft;

						if (pageWidth >= scrollLeft) {
							pageWidth = pageWidth - scrollLeft;
						} else {
							pageWidth = 0;
						}
					} else {
						scrollLeft = 0;
					}

					if (pageHeight < height) {
						height = pageHeight;
					}

					if (pageWidth < width) {
						width = pageWidth;
					}

					if (this.customDPI) {
						currentFileInfo.dpi = this.customDPI;
					} else {
						currentFileInfo.dpi = this.systemDPI;
					}
					currentFileInfo.percents = curScale;
					currentFileInfo.angle = 'e_' + this.viewer.getRotation() * 90;
					currentFileInfo.rectX = scrollLeft;
					currentFileInfo.rectY = scrollTop;
					currentFileInfo.rectW = width;
					currentFileInfo.rectH = height;
					currentFileInfo.pageW = view.offsetWidth;
					currentFileInfo.pageH = view.offsetHeight;
					currentFileInfo.layers = this.layersOnOffOptions;

					if (anotherFileInfo) {
						var prevScale = anotherFileInfo.percents;
						if (prevScale && prevScale !== curScale) {
							var ratio = curScale / prevScale;

							anotherFileInfo.percents = curScale;
							anotherFileInfo.rectX = anotherFileInfo.rectX * ratio;
							anotherFileInfo.rectY = anotherFileInfo.rectY * ratio;
							anotherFileInfo.pageW = anotherFileInfo.pageW * ratio;
							anotherFileInfo.pageH = anotherFileInfo.pageH * ratio;
							anotherFileInfo.rectW = anotherFileInfo.rectW * ratio;
							anotherFileInfo.rectH = anotherFileInfo.rectH * ratio;
						}
					}

					return currentFileInfo;
				},

				adjustDocPad: function () {
					this.inherited(arguments);

					if (this.measureContainer !== null) {
						this.measureContainer.resizeSvgPage(
							this.viewerContainer.firstElementChild.contentWindow.document
						);
					}
				},

				onZoomChangeEventHandler: function (ev, data) {
					this.inherited(arguments);

					if (this.measureContainer !== null) {
						this.measureContainer.resizeSvgPage(
							this.viewerContainer.firstElementChild.contentWindow.document
						);
					}
				},

				getViewerType: function () {
					return VC.Utils.Enums.MeasurementUtils.PDFViewer;
				}
			});
		})()
	);
});
