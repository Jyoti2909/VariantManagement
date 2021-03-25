VC.Utils.Page.LoadModules(['Viewer']);

require(['dojo/aspect', 'dojo/_base/declare'], function (aspect, declare) {
	return dojo.setObject(
		'VC.ImageViewer',
		(function () {
			var maxZoom = 500;

			return declare('ImageViewer', Viewer, {
				viewMode: null,
				imageCanvas: null,
				parentImgContainer: null,
				type: 'image',
				restoringFromSnapshot: false,
				isDragging: false,
				curYPos: 0,
				curXPos: 0,

				constructor: function (args) {
					this.type = this.DialogManager.viewerType = 'image';
					this.viewMode = 'FitWidth';
					var viewImage = document.createElement('img');
					viewImage.id = 'ViewImage';
					viewImage.setAttribute('tabindex', '-1');
					this.viewerContainer.appendChild(viewImage);

					this.parentImgContainer = this.viewerContainer.parentElement;
					VC.Utils.Page.AddEvent(
						viewImage,
						'load',
						dojo.hitch(this, 'onWindowResizeEventHandler')
					);
					VC.Utils.Page.AddEvent(
						this.snapshotImage,
						'load',
						dojo.hitch(this, 'onWindowResizeEventHandler')
					);
					VC.Utils.Page.AddEvent(
						viewImage,
						'mousedown',
						dojo.hitch(this, 'onMouseDown')
					);
					VC.Utils.Page.AddEvent(
						viewImage,
						'mouseup',
						dojo.hitch(this, 'onMouseUp')
					);
					VC.Utils.Page.AddEvent(
						viewImage,
						'mouseleave',
						dojo.hitch(this, 'onMouseLeave')
					);
					VC.Utils.Page.AddEvent(
						viewImage,
						'mousemove',
						dojo.hitch(this, 'onMouseMove')
					);
				},

				initializeViewer: function () {
					this.viewer = {};
					this.viewer.image = document.getElementById('ViewImage');
					this.viewer.image.ondragstart = function () {
						return false;
					};
					this.viewer.image.crossOrigin = 'anonymous';
					// Copy image to canvas
					this.viewer.image.addEventListener(
						'load',
						dojo.hitch(this, this.onViewerLoaded)
					);
					this.setLoadingProgress(0);
					this.isViewerInitialized = true;
				},

				restoreViewerState: function () {
					var curState = this.restoreViewerParameter(
						this.type + '.' + VC.Utils.Enums.Dialogs.ExtendedZoom
					);
					if (curState !== null && curState.localeCompare('On') === 0) {
						this.toolbarContainer.viewToolbar.btnView.onClick();
					}

					curState = this.restoreViewerParameter(this.type + '.ActivePalette');
					if (curState !== null) {
						this.cursorMode = curState;
					}
				},

				onViewerLoaded: function () {
					this.inherited(arguments);

					var self = this;
					self.setLoadingProgress(101);
					if (self.imageCanvas) {
						return;
					}
					self.imageCanvas = document.createElement('canvas');
					self.imageCanvas.setAttribute(
						'width',
						self.viewer.image.naturalWidth
					);
					self.imageCanvas.setAttribute(
						'height',
						self.viewer.image.naturalHeight
					);
					self.imageCanvas.style.cursor = self.getCursor();
					var ctx = self.imageCanvas.getContext('2d');
					ctx.drawImage(self.viewer.image, 0, 0);
					self.onWindowResizeEventHandler();
					self.applyViewStateData();
					self.restoreViewerState();
					self._initZoomTextBox();
				},

				loadViewerToolbar: function () {
					var self = this;

					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.ImageViewerToolbar
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomUpClick,
						dojo.hitch(self, self.ZoomIn)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnZoomDownClick,
						dojo.hitch(self, self.ZoomOut)
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
						VC.Utils.Enums.TButtonEvents.btnZoomWindowClick,
						dojo.hitch(self, self.ZoomWindowClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.tbxZoomPercentageChange,
						dojo.hitch(self, self.ZoomPercentChange)
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
				},

				initITContainer: function () {
					this.inherited(arguments);

					if (this.isViewerInitialized) {
						this._initZoomTextBox();
					}

					aspect.after(
						this.toolbarContainer,
						'onBtnSwitchClick',
						dojo.hitch(this, function () {
							this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
								VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
								VC.Utils.Enums.TPropertyName.currentValue,
								this.GetScale()
							);
						})
					);
				},

				displayMarkup: function () {
					this.restoringFromSnapshot = true;
					this.inherited(arguments);
					this.restoringFromSnapshot = false;
					this.applyViewStateData();
				},

				_loadFile: function () {
					this.viewMode = 'SetScale';
					this.viewer.image.src = this.fileUrl;
					this.setLoadingProgress(20);
				},

				_toViewMode: function () {
					this.inherited(arguments);
					this.parentImgContainer.style.cursor = this.getCursor();
				},

				_toMarkupMode: function () {
					this.inherited(arguments);
					this.parentImgContainer.style.cursor = this.getCursor();
				},

				_initZoomTextBox: function () {
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue,
						this.GetScale()
					);
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.maxValue,
						maxZoom
					);
				},

				applyViewStateData: function () {
					if (
						!this.imageCanvas ||
						!this.imageCanvas.width ||
						this.viewStateData.isEmpty()
					) {
						return;
					}
					var angle = this.viewStateData.getValue('angle');
					if (angle !== '') {
						this.rotateImage(angle);
					} else {
						this.rotateImage(0);
					}
					var percents =
						this.viewStateData.getValue('percents') === ''
							? 100
							: this.viewStateData.getValue('percents');
					this.SetScale((percents * 1) / 100);

					var scrollPos = this.viewStateData.getValue('scroll_left');
					this.parentImgContainer.scrollLeft = scrollPos * 1;

					scrollPos = this.viewStateData.getValue('scroll_top');
					this.parentImgContainer.scrollTop = scrollPos * 1;
				},

				getMarkupImg: function () {
					var canvas = this.getCanvas();
					return canvas.toDataURL();
				},

				getCanvas: function () {
					var width = this.viewer.image.offsetWidth;
					var height = this.viewer.image.offsetHeight;

					var viewstateWidth = this.viewer.image.offsetParent.clientWidth;
					var viewstateHeight = this.viewer.image.offsetParent.clientHeight;
					var viewWidth =
						viewstateWidth !== '' ? Math.min(viewstateWidth, width) : width;
					var viewHeight =
						viewstateHeight !== '' ? Math.min(viewstateHeight, height) : height;
					var scrollTop = this.parentImgContainer.scrollTop;
					this.viewStateData.updateValue('scroll_top', scrollTop);
					var scrollLeft = this.parentImgContainer.scrollLeft;
					this.viewStateData.updateValue('scroll_left', scrollLeft);

					var viewCanvas = document.createElement('canvas');
					viewCanvas.setAttribute('width', viewWidth);
					viewCanvas.setAttribute('height', viewHeight);
					this.viewStateData.updateValue('view_width', viewWidth);
					this.viewStateData.updateValue('view_height', viewHeight);

					var wScale =
						this.viewer.image.offsetWidth / this.viewer.image.naturalWidth;
					var hScale =
						this.viewer.image.offsetHeight / this.viewer.image.naturalHeight;

					var viewCtx = viewCanvas.getContext('2d');
					viewCtx.scale(wScale, hScale);
					var w = viewWidth / wScale;
					var h = viewHeight / hScale;
					viewCtx.drawImage(
						this.viewer.image,
						scrollLeft / wScale,
						scrollTop / hScale,
						w,
						h,
						0,
						0,
						w,
						h
					);

					return viewCanvas;
				},

				onWindowResizeEventHandler: function () {
					this.inherited(arguments);
					if (this.viewer && this.viewer.image === null) {
						return;
					}
					if (this.viewMode === 'FitWidth') {
						this.FitWidth();
						return;
					}

					if (this.viewMode === 'FitHeight') {
						this.FitHeight();
						return;
					}
				},

				getCursor: function () {
					var dragCursor = 'default';
					var cursCoords;
					if (this.zoomWindow || this.mode === this.ViewerModes.Markup) {
						dragCursor = 'default';
					} else {
						// IE doesn't support co-ordinates
						cursCoords = VC.Utils.isIE() ? '' : ' 4 4';

						if (this.isDragging) {
							dragCursor = VC.Utils.isFirefox()
								? '-moz-grabbing'
								: 'url(../styles/closedhand.cur)' + cursCoords + ', move';
						} else {
							dragCursor = VC.Utils.isFirefox()
								? '-moz-grab'
								: 'url(../styles/openhand.cur)' + cursCoords + ', move';
						}
					}
					return dragCursor;
				},

				onMouseDown: function (e) {
					this.curXPos = e.clientX;
					this.curYPos = e.clientY;

					this.isDragging = true;
					this.parentImgContainer.style.cursor = this.getCursor();
				},

				onMouseUp: function (e) {
					this.isDragging = false;
					this.parentImgContainer.style.cursor = this.getCursor();
				},

				onMouseMove: function (e) {
					if (this.isDragging) {
						var diffX = e.clientX - this.curXPos;
						var diffY = e.clientY - this.curYPos;

						this.parentImgContainer.scrollTop -= diffY;
						this.parentImgContainer.scrollLeft -= diffX;

						this.curXPos = e.clientX;
						this.curYPos = e.clientY;
					}
				},

				onMouseLeave: function (e) {
					this.isDragging = false;
					if (this.parentImgContainer) {
						this.parentImgContainer.style.cursor = this.getCursor();
					}
				},

				FitWidth: function () {
					this.viewMode = 'FitWidth';

					var containerWidth = this.viewerContainer.parentElement.clientWidth;

					this.viewer.image.style.width = containerWidth + 'px';
					this.viewer.image.style.height = 'auto';

					var scale =
						this.viewer.image.offsetHeight / this.viewer.image.naturalHeight;
					scale = Math.round(scale * 100) / 100;
					if (
						this.viewer.image.naturalWidth * scale >
						this.viewerContainer.parentElement.clientWidth
					) {
						scale = scale - 0.01;
					}
					this.SetScale(scale);
				},

				FitHeight: function () {
					this.viewMode = 'FitHeight';

					var containerHeight = this.viewerContainer.parentElement.clientHeight;

					this.viewer.image.style.width = 'auto';
					this.viewer.image.style.height = containerHeight + 'px';

					var scale =
						this.viewer.image.offsetHeight / this.viewer.image.naturalHeight;
					scale = Math.round(scale * 100) / 100;
					if (
						this.viewer.image.naturalHeight * scale >
						this.viewerContainer.parentElement.clientHeight
					) {
						scale = scale - 0.01;
					}
					this.SetScale(scale);
				},

				SetScale: function (scale) {
					this.viewMode = 'SetScale';
					var imgHeight = this.viewer.image.naturalHeight;
					var imgWidth = this.viewer.image.naturalWidth;
					this.viewer.image.style.width = imgWidth * scale + 'px';
					this.viewer.image.style.height = imgHeight * scale + 'px';

					var percents = scale * 100;
					this.updateZoomData(percents);
					this.viewStateData.updateValue('view_mode', 'SetScale');
					this.viewStateData.updateValue('view_width', imgWidth);
					this.viewStateData.updateValue('view_height', imgHeight);
				},

				GetScale: function () {
					return (
						(this.viewer.image.offsetHeight / this.viewer.image.naturalHeight) *
						100
					);
				},

				ZoomOut: function () {
					this.viewMode = 'ZoomOut';

					var imgHeight = this.viewer.image.naturalHeight;
					var imgWidth = this.viewer.image.naturalWidth;
					var scale = this.viewer.image.offsetHeight / imgHeight;
					scale = scale - 0.2;
					this.viewer.image.style.width = imgWidth * scale + 'px';
					this.viewer.image.style.height = imgHeight * scale + 'px';

					var percents = scale * 100;
					this.viewStateData.updateValue('view_mode', 'SetScale');
					this.updateZoomData(percents);
					this.viewStateData.updateValue('view_width', imgWidth);
					this.viewStateData.updateValue('view_height', imgHeight);
				},

				ZoomIn: function () {
					this.viewMode = 'ZoomIn';

					var imgHeight = this.viewer.image.naturalHeight;
					var imgWidth = this.viewer.image.naturalWidth;
					var scale = this.viewer.image.offsetHeight / imgHeight;
					scale = scale + 0.2;
					if (scale > maxZoom / 100) {
						scale = maxZoom / 100;
					}
					this.viewer.image.style.width = imgWidth * scale + 'px';
					this.viewer.image.style.height = imgHeight * scale + 'px';

					var percents = scale * 100;
					this.viewStateData.updateValue('view_mode', 'SetScale');
					this.updateZoomData(percents);
					this.viewStateData.updateValue('view_width', imgWidth);
					this.viewStateData.updateValue('view_height', imgHeight);
				},

				RotateCW: function () {
					var angle = this.viewStateData.getValue('angle');
					angle = +angle + 90;
					this.rotateImage(angle);
					this.viewStateData.updateValue('angle', angle);
					this.onWindowResizeEventHandler();
				},

				RotateCCW: function () {
					var angle = this.viewStateData.getValue('angle');
					angle = +angle - 90;
					this.rotateImage(angle);
					this.viewStateData.updateValue('angle', angle);
					this.onWindowResizeEventHandler();
				},

				ZoomPercentChange: function () {
					var zoom = this.toolbarContainer.viewToolbar.getElementPropertyValue(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue
					);
					if (zoom !== '') {
						this.SetScale(zoom / 100);
					}
				},

				ZoomWindowClick: function () {
					this._toZoomMode();

					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(true);
				},

				PrintClick: function () {
					VC.Utils.Page.LoadModules(['Managers/PrintManager']);
					var newFileUrl = this.aras.IomInnovator.getFileUrl(
						this.args.fileId,
						this.aras.Enums.UrlType.SecurityToken
					);
					var fileUrl =
						VC.Utils.getBaseUrlWithoutSalt(this.aras) +
						'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
						encodeURIComponent(newFileUrl) +
						VC.Utils.Enums.PdfHandlerActions.ImageToPdf;
					VC.PrintManager.openPDFFile(fileUrl, VC.PrintManager.printFile);
				},

				_toPanMode: function () {
					this.curCursorMode = this.CursorModes.Pan;
					this.parentImgContainer.style.cursor = this.getCursor();

					this.cleanZoomingPage();

					this.saveViewerParameter(
						this.type + '.ActivePalette',
						this.CursorModes.Pan
					);
				},

				_toZoomMode: function () {
					var self = this;
					this.zoomWindow = true;
					this.parentImgContainer.style.cursor = this.getCursor();

					this.cleanZoomingPage();
					this.addZoomingPage(
						this.viewer.image.offsetWidth,
						this.viewer.image.offsetHeight
					);

					this.zoomingPage.startSelecting();

					aspect.before(
						this.zoomingPage.container,
						'OnSelectingStart',
						function () {
							self.DialogManager.disableOpenedDialogs();
						}
					);

					aspect.before(
						this.zoomingPage.container,
						'OnSelectingEnd',
						function () {
							self.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(
								false
							);
							self.zoomWindow = false;
							self.DialogManager.enableOpenedDialogs();
							self.execZooming();
							self._toPanMode();
							if (self.onZoomModeDispose) {
								self.onZoomModeDispose();
							}
						}
					);

					if (this.onZoomModeSelected) {
						this.onZoomModeSelected();
					}
				},

				updateZoomingPage: function () {
					if (this.zoomingPage) {
						this.zoomingPage.position = {
							left: '0px',
							top: '0px',
							width: this.viewer.image.offsetWidth + 'px',
							height: this.viewer.image.offsetHeight + 'px'
						};

						this.zoomingPage.clientX = 0;
						this.zoomingPage.clientY = 0;
						this.zoomingPage.width = this.viewer.image.offsetWidth;
						this.zoomingPage.height = this.viewer.image.offsetHeight;
					}
				},

				execZooming: function () {
					var zoomingBox = this.zoomingPage.getSelectionBox();
					var selectedRect = this.zoomingPage.container.selectionRect.Node.getBBox();

					if (zoomingBox && zoomingBox.width > 0 && zoomingBox.height > 0) {
						var ratioX = this.parentImgContainer.clientWidth / zoomingBox.width;
						var ratioY =
							this.parentImgContainer.clientHeight / zoomingBox.height;
						var curRatio = Math.min(ratioX, ratioY);

						var imgHeight = this.viewer.image.naturalHeight;
						var imgWidth = this.viewer.image.naturalWidth;
						var curScale = this.GetScale() * curRatio;
						if (curScale > maxZoom) {
							curScale = maxZoom;
							curRatio = curScale / this.GetScale();
						}

						var styleWidth = this.viewer.image.offsetWidth * curRatio;
						var styleHeight = this.viewer.image.offsetHeight * curRatio;
						this.viewer.image.style.width = styleWidth + 'px';
						this.viewer.image.style.height = styleHeight + 'px';

						var scroll_top = zoomingBox.y * curRatio;
						var scroll_left = zoomingBox.x * curRatio;
						var offsetX =
							(this.parentImgContainer.clientWidth -
								selectedRect.width * curRatio) /
							2;
						var offsetY =
							(this.parentImgContainer.clientHeight -
								selectedRect.height * curRatio) /
							2;

						if (scroll_left - offsetX >= 0) {
							scroll_left = scroll_left - offsetX;
						}

						if (scroll_top - offsetY >= 0) {
							scroll_top = scroll_top - offsetY;
						}

						this.parentImgContainer.scrollTop = scroll_top;
						this.parentImgContainer.scrollLeft = scroll_left;

						this.updateZoomData(curScale);
						this.viewStateData.updateValue('view_mode', 'SetScale');
						this.viewStateData.updateValue('view_width', imgWidth);
						this.viewStateData.updateValue('view_height', imgHeight);
					}
				},

				rotateImage: function (angle) {
					var radAngle = (+angle / 180) * Math.PI;
					var canvas = document.createElement('canvas');
					var width = this.imageCanvas.width;
					var height = this.imageCanvas.height;

					var vectorW = roatateVector({ x: width, y: 0 }, radAngle);
					var vectorH = roatateVector({ x: 0, y: height }, radAngle);
					var vectorWH = roatateVector({ x: width, y: height }, radAngle);

					var minX = Math.min(0, vectorW.x, vectorW.x, vectorWH.x);
					var minY = Math.min(0, vectorW.y, vectorW.y, vectorWH.y);
					var maxX = Math.max(0, vectorW.x, vectorW.x, vectorWH.x);
					var maxY = Math.max(0, vectorW.y, vectorW.y, vectorWH.y);

					var newWidth = maxX - minX;
					var newHeight = maxY - minY;

					var percents = this.viewStateData.getValue('percents');
					var scale = percents === '' ? 1 : +percents / 100;

					canvas.setAttribute('width', newWidth);
					canvas.setAttribute('height', newHeight);

					this.viewStateData.updateValue('view_width', newWidth);
					this.viewStateData.updateValue('view_height', newHeight);

					var ctx = canvas.getContext('2d');
					ctx.translate(minX * -1, minY * -1);
					ctx.rotate(radAngle);
					ctx.drawImage(this.imageCanvas, 0, 0);
					this.viewer.image.src = canvas.toDataURL();

					this.viewer.image.style.width = newWidth * scale + 'px';
					this.viewer.image.style.height = newHeight * scale + 'px';

					function roatateVector(vector, radAngle) {
						var rotateMatrix = {
							x1: Math.cos(radAngle),
							y1: Math.sin(radAngle),
							x2: Math.cos(radAngle + Math.PI / 2),
							y2: Math.sin(radAngle + Math.PI / 2)
						};

						var newVector = {
							x: vector.x * rotateMatrix.x1 + vector.y * rotateMatrix.x2,
							y: vector.x * rotateMatrix.y1 + vector.y * rotateMatrix.y2
						};
						return newVector;
					}
				},

				updateZoomData: function (zoomValue) {
					if (typeof zoomValue === 'undefined') {
						return;
					}

					var correctedZoomValue = zoomValue;

					var zoomPercentageValue = this.toolbarContainer.viewToolbar.getElementPropertyValue(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue
					);
					if (zoomPercentageValue != Math.round(zoomValue)) {
						this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
							VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
							VC.Utils.Enums.TPropertyName.currentValue,
							zoomValue
						);
						var currentZoomValue = this.toolbarContainer.viewToolbar.getElementPropertyValue(
							VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
							VC.Utils.Enums.TPropertyName.currentValue
						);

						if (currentZoomValue) {
							correctedZoomValue = currentZoomValue;
						}

						if (
							correctedZoomValue &&
							correctedZoomValue != zoomPercentageValue
						) {
							this.ZoomPercentChange();
						}

						if (correctedZoomValue) {
							this.viewStateData.updateValue('percents', correctedZoomValue);
						}

						this.updateZoomingPage();
					}
				}
			});
		})()
	);
});
