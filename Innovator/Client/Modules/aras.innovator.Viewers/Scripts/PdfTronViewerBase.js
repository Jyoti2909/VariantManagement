VC.Utils.Page.LoadModules(['Viewer']);

require(['dojo/_base/declare', 'dojo/_base/lang'], function (declare, lang) {
	return dojo.setObject(
		'VC.PdfTronViewerBase',
		(function () {
			return declare('PdfTronViewerBase', Viewer, {
				docViewerEl: null,
				readerControl: null,
				onPanModeSelected: null,
				endOfDocumentResult: false,

				_toPanMode: function () {
					this.curCursorMode = this.CursorModes.Pan;

					this.cleanZoomingPage();
					this.readerControl.docViewer.clearSelection();

					this.viewer.setToolMode(VC.Utils.Viewers.PDFViewerToolMode.Pan);
					this.saveViewerParameter(
						this.type + '.ActivePalette',
						this.CursorModes.Pan
					);
					if (this.onPanModeSelected) {
						this.onPanModeSelected();
					}
				},

				_toSelectMode: function () {
					this.curCursorMode = this.CursorModes.Select;

					this.cleanZoomingPage();

					this.viewer.setToolMode(
						VC.Utils.Viewers.PDFViewerToolMode.TextSelect
					);
					this.saveViewerParameter(
						this.type + '.ActivePalette',
						this.CursorModes.Select
					);
					if (this.onSelectModeSelected) {
						this.onSelectModeSelected();
					}
				},

				getSelectedText: function () {
					var toolMode = this.viewer.getToolMode();
					if (
						toolMode === VC.Utils.Viewers.PDFViewerToolMode.TextSelect ||
						toolMode === PDFTron.WebViewer.ToolMode.AnnotationEdit
					) {
						return this.readerControl.docViewer.getSelectedText();
					}

					return null;
				},

				setViewerModes: function () {
					const layoutMode = this.viewer.getLayoutMode();
					if (layoutMode !== PDFTron.WebViewer.LayoutMode.Continuous) {
						this.viewer.setLayoutMode(PDFTron.WebViewer.LayoutMode.Continuous);
					}

					this.viewer.setToolMode(VC.Utils.Viewers.PDFViewerToolMode.Pan);
				},

				getCanvas: function (withoutCorrection) {
					var height = this.viewerContainer.offsetHeight;
					var width = this.viewerContainer.offsetWidth;

					var canvas = document.createElement('canvas');
					canvas.setAttribute('width', width);
					canvas.setAttribute('height', height);
					var ctx = canvas.getContext('2d');
					ctx.fillStyle = 'white';

					var dMode = this.viewer.getDisplayMode();
					var pCount = this.viewer.getPageCount();
					var pages = dMode.getVisiblePages();
					if (pages) {
						pages = pages.sort();
					}

					var scrollTop = this.docViewerEl.scrollTop;
					var scrollLeft = this.docViewerEl.scrollLeft;
					var dstTop = 0;
					var pageBottom = 0;

					for (var i = 0; i < pages.length; i++) {
						var pageNum = pages[i];
						var pageContainer = this.readerControl.getPageContainer(pageNum);
						var view = pageContainer[0];

						var prevPageBottom = pageBottom;
						// The .offsetParent should be used starting from WebViewer's version 2.2.0
						var pageTop = view.offsetParent.offsetTop;
						pageBottom = pageTop + view.offsetHeight;
						if (pageTop < scrollTop) {
							// PDFTron returns previous invisible page as visible
							if (pageBottom < scrollTop) {
								continue;
							} else {
								scrollTop = scrollTop - pageTop;
							}
						} else {
							if (prevPageBottom < scrollTop && pageTop >= scrollTop) {
								dstTop += pageTop - scrollTop;
							} else {
								dstTop += pageTop - prevPageBottom;
							}
							scrollTop = 0;
						}

						var dstHeight = 0;
						var dstLeft = 0;
						var pageLeft = 0;
						// The .offsetParent should be used starting from WebViewer's version 2.2.0
						var viewLeft = view.offsetLeft + view.offsetParent.offsetLeft;
						if (viewLeft < scrollLeft) {
							pageLeft = scrollLeft - viewLeft;
						} else {
							dstLeft = viewLeft - scrollLeft;
						}

						for (var j = 0; j < view.childNodes.length; j++) {
							var cNode = view.childNodes[j];
							if (cNode && cNode.attributes) {
								var classAttr = cNode.attributes.getNamedItem('class');
								if (classAttr && classAttr.value === 'hacc canvas' + pageNum) {
									var auxNode = null;
									for (var k = 0; k < view.childNodes.length; k++) {
										var tmpNode = view.childNodes[k];
										if (tmpNode && tmpNode.attributes) {
											classAttr = tmpNode.attributes.getNamedItem('class');
											if (classAttr && classAttr.value === 'auxiliary') {
												auxNode = tmpNode;

												break;
											}
										}
									}

									if (cNode.offsetTop > 0) {
										if (scrollTop > cNode.offsetTop) {
											scrollTop = scrollTop - cNode.offsetTop;
										} else {
											scrollTop = 0;
										}
									}

									if (cNode.offsetLeft > 0) {
										if (pageLeft > cNode.offsetLeft) {
											pageLeft = pageLeft - cNode.offsetLeft;
										} else {
											pageLeft = 0;
										}
									}

									var dstWidth = cNode.offsetWidth;
									dstHeight = cNode.offsetHeight;

									var srcWidth = cNode.width;
									var srcHeight = cNode.height;
									var srcTop = scrollTop * (srcHeight / dstHeight);
									var srcLeft = pageLeft * (srcWidth / dstWidth);

									if (!withoutCorrection) {
										//FireFox. If there is vertical scroll - add shift on half of scroll width
										if (
											VC.Utils.isFirefox() &&
											srcWidth - srcLeft <
												this.docViewerEl.parentNode.clientWidth
										) {
											dstLeft =
												dstLeft +
												Math.round(
													(this.docViewerEl.parentNode.clientWidth -
														this.docViewerEl.clientWidth) /
														2
												);
										}

										//IE. If there is vertical scroll - add shift on half of scroll width
										if (VC.Utils.isIE() && srcWidth < width) {
											dstLeft =
												dstLeft +
												Math.round(
													(this.docViewerEl.parentNode.clientWidth -
														this.docViewerEl.clientWidth) /
														2
												);
										}
									}
									ctx.fillRect(
										dstLeft,
										dstTop,
										dstWidth - srcLeft,
										dstHeight - scrollTop
									);
									ctx.drawImage(
										cNode,
										srcLeft,
										srcTop,
										srcWidth - srcLeft,
										srcHeight - srcTop,
										dstLeft,
										dstTop,
										dstWidth - srcLeft,
										dstHeight - scrollTop
									);

									// Draw highlighted text
									if (
										auxNode &&
										this.viewer.getToolMode() ===
											VC.Utils.Viewers.PDFViewerToolMode.TextSelect
									) {
										ctx.drawImage(
											auxNode,
											srcLeft,
											srcTop,
											srcWidth - srcLeft,
											srcHeight - srcTop,
											dstLeft,
											dstTop,
											dstWidth - srcLeft,
											dstHeight - scrollTop
										);
									}

									dstTop += dstHeight - scrollTop;
									scrollTop = 0;

									break;
								}
							}
						}
					}

					return canvas;
				},

				onPageChangeEventHandler: function (ev) {
					const pageNumberIndex = 0;
					const data = ev.detail[pageNumberIndex];

					if (this.hidden || !data) {
						return;
					}

					// works twice
					if (
						this.toolbarContainer.viewToolbar.ntbPageNumber.currentValue !==
						data
					) {
						this.toolbarContainer.viewToolbar.ntbPageNumber.currentValue = data;
					}

					var compareDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.CompareFiles
					);
					if (compareDialog) {
						compareDialog.onPageChange();
					}

					this.viewStateData.updateValue(
						'page',
						VC.Utils.GetResource('pdfv_page_number').Format(data)
					);
				},

				getNotifyFunction: function (e, type) {
					switch (type) {
						case 'endOfDocumentSearch':
							this.endOfDocumentResult = true;
							VC.Utils.AlertWarning(
								VC.Utils.GetResource('pdfv_no_more_matches_found')
							);
							break;
						case 'noMatchesFound':
							VC.Utils.AlertWarning(
								VC.Utils.GetResource('pdfv_no_matches_found')
							);
							break;
						default:
							this.iFrame.contentWindow.ControlUtils.getNotifyFunction(e, type);
					}
				},

				calculateAndUpdateZoom: function (curScale) {
					if (this.customDPI && this.customDPI > 0) {
						curScale = curScale * (this.systemDPI / this.customDPI);
					}

					// Round off to the nearest number in compliance with the IR-032259
					var roundedVal = VC.Utils.roundZoomValue(curScale * 100);
					var value = this.toolbarContainer.viewToolbar.getElementPropertyValue(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue
					);

					if (value !== roundedVal) {
						this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
							VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
							VC.Utils.Enums.TPropertyName.currentValue,
							roundedVal
						);
					}

					if (this.customDPI) {
						this.viewStateData.updateValue('customDPI', this.customDPI);
					}
					this.viewStateData.updateValue('percents', curScale * 100);
				},

				Find: function (text, matchCase, findPrevious) {
					this.readerControl.docViewer.clearSelection();

					if (this.endOfDocumentResult === true) {
						this.endOfDocumentResult = false;
						this.readerControl.docViewer.trigger('endOfDocumentResult', true);
					}

					var searchModes = 'PageStop,ProvideQuads';
					if (matchCase) {
						searchModes = searchModes + ',CaseSensitive';
					}
					if (findPrevious) {
						searchModes = searchModes + ',SearchUp';
					}

					this.viewer.searchText(text, searchModes);
				},

				initReaderControl: function () {
					this.readerControl = this.viewer.getInstance();
					this.readerControl.setContextMenu = function () {};
					this.readerControl.docViewer.setSearchHighlightColors({
						searchResult: 'rgba(0, 0, 200, 0.3)',
						activeSearchResult: 'rgba(0, 0, 200, 0.3)'
					});
					this.readerControl.docViewer.on(
						'click',
						lang.hitch(this, this.onClickDocViewer)
					);
				},

				onClickDocViewer: function (evt, nativeEvt) {
					var toolMode = this.viewer.getToolMode();
					if (
						toolMode === VC.Utils.Viewers.PDFViewerToolMode.TextSelect ||
						toolMode === PDFTron.WebViewer.ToolMode.AnnotationEdit
					) {
						this.readerControl.docViewer.clearSearchResults();
					}
				},

				switchToDefaultMode: function () {
					let btnSelectText = this.toolbarContainer.viewToolbar.btnSelectText;
					if (btnSelectText && btnSelectText.IsPressed) {
						btnSelectText.SetPressedState(false);
					}

					let btnZoomWindow = this.toolbarContainer.viewToolbar.btnZoomWindow;
					if (btnZoomWindow && btnZoomWindow.IsPressed) {
						btnZoomWindow.SetPressedState(false);
						this.zoomWindow = false;
						if (this.onZoomModeDispose) {
							this.onZoomModeDispose();
						}
					}

					let btnPan = this.toolbarContainer.viewToolbar.btnPan;
					if (btnPan && !btnPan.IsPressed) {
						btnPan.SetPressedState(true);

						this._toPanMode();
					}
				}
			});
		})()
	);
});
