/*global dojo,VC,top,resemble,Utils,ImageViewer,document*/
VC.Utils.Page.LoadModules(['ImageViewer']);
VC.Utils.Page.LoadWidgets(['ScrollManager']);

require(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return dojo.setObject(
		'VC.ComparisonViewer',
		(function () {
			function ImageObject(imageSource, canvas) {
				var imageX = 0;
				var imageY = 0;
				var startX = 0;
				var startY = 0;
				var img = document.createElement('img');
				var canv = canvas;
				var canvContext = canv.getContext('2d');
				var isMouseCaptured = false;
				var currentOpacity = 1;
				var isObjectVisible = false;
				var isSpecialCall = false;
				var self = this;

				this.isLongTermOperation = false;
				this.mouseMove = null;
				this.loaded = null;

				this.setOpacity = function (opacity) {
					currentOpacity = opacity;
					this.repaint();
				};

				this.moveImage = function (dx, dy) {
					imageX += dx;
					imageY += dy;
					startX += dx;
					startY += dy;

					self.repaint();
				};

				this.repaint = function () {
					if (!img.src) {
						return;
					}

					canv.style.opacity = currentOpacity;
					canvContext.clearRect(0, 0, canv.width, canv.height);
					canvContext.drawImage(img, imageX, imageY, img.width, img.height);
				};

				this.resetCoordinates = function () {
					startX = startY = imageX = imageY = 0;
				};

				this.reset = function () {
					self.resetCoordinates();
					self.repaint();
				};

				Object.defineProperty(this, 'isVisible', {
					get: function () {
						return isObjectVisible;
					},
					set: function (val) {
						isObjectVisible = val;
						canv.style.display = isObjectVisible ? 'block' : 'none';
						self.repaint();
					}
				});

				this.getImageData = function () {
					return canvContext.getImageData(0, 0, canv.width, canv.height);
				};

				this.getDataUrl = function () {
					return canv.toDataURL();
				};

				this.getCanvas = function () {
					return canv;
				};

				this.getImage = function () {
					return img;
				};

				this.getOffset = function () {
					return {
						x: imageX,
						y: imageY
					};
				};

				this.setOffset = function (offset) {
					imageX = offset.x;
					imageY = offset.y;
				};

				this.LoadImage = function (imageSource) {
					img.onload = dojo.hitch(this, function () {
						canv.style.cursor = self.getCursor();
						canv.width = viewerContainer.clientWidth;
						canv.height = viewerContainer.clientHeight;
						canvContext.drawImage(img, imageX, imageY, img.width, img.height);

						//add event handlers
						self.setupCanvasHandlers();
						if (self.loaded) {
							self.loaded();
						}
					});

					if (imageSource) {
						img.src = imageSource;
					}
				};

				this.resizeCanvas = function () {
					if (
						viewerContainer.clientWidth > 0 &&
						viewerContainer.clientHeight > 0
					) {
						canv.width = viewerContainer.clientWidth;
						canv.height = viewerContainer.clientHeight;
						self.repaint();
					}
				};

				this.setupCanvasHandlers = function () {
					canv.onmousedown = canvasOnMouseDown;
					canv.onmousemove = canvasOnMouseMove;
					canv.onmouseup = canvasOnMouseUp;
					canv.onmouseout = canvasOnMouseOut;
				};

				function canvasOnMouseDown(e, isSpecCall) {
					var posX = e.clientX - canv.offsetLeft;
					var posY = e.clientY - canv.offsetTop;
					if (hitImage(posX, posY)) {
						isMouseCaptured = true;
						startX = posX;
						startY = posY;
					}
					canv.style.cursor = self.getCursor();
					isSpecialCall = isSpecCall;
				}

				function canvasOnMouseMove(e) {
					if (isMouseCaptured) {
						var posX = e.clientX - canv.offsetLeft;
						var posY = e.clientY - canv.offsetTop;

						self.mouseMove(posX - startX, posY - startY);
					}
				}

				function canvasOnMouseUp(e) {
					isMouseCaptured = false;
					canv.style.cursor = self.getCursor();
					if (isSpecialCall) {
						CompareCanvasDiff.onmouseup(e);
					}
				}

				function canvasOnMouseOut(e) {
					canv.style.cursor = self.getCursor();
					if (isMouseCaptured) {
						isMouseCaptured = false;
					}
				}

				function hitImage(x, y) {
					return true; //(x > imageX && x < imageX + img.width && y > imageY && y < imageY + img.height);
				}

				this.getCursor = function () {
					var dragCursor = 'default';
					var cursCoords;

					if (isLongTermOperation) {
						dragCursor = 'wait';
					} else {
						// IE doesn't support co-ordinates
						cursCoords = VC.Utils.isIE() || VC.Utils.isEdge() ? '' : ' 4 4';

						if (isMouseCaptured) {
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
				};

				this.LoadImage(imageSource);
			}

			var isDraggingEnabled = false;
			var isLongTermOperation = false;
			var resembleControl = null;
			var bothImagesAreLoaded = 0;
			var bothLoadedFunc = null;
			var option = {
				errorColor: {
					red: 255,
					green: 0,
					blue: 0
				},
				tolerance: 5
			};
			var imgFrontObject;
			var imgBackObject;
			var btnZoomUp = null;
			var btnZoomDown = null;
			var imgDiffObject = null;
			var CompareImageDiff = null;
			var currState = null;
			var frontTotalOffsetX = null;
			var frontTotalOffsetY = null;

			function getDifferances(file1, file2, options, canvas, progressCallback) {
				var self = this;
				var resultData = '';
				if (options) {
					resemble.outputSettings(options);
				}
				resembleControl = resemble(file1)
					.compareTo(file2)
					.setTolerance(option.tolerance)
					.onComplete(
						function (data) {
							resultData = data.getImageDataUrl();
							var localCanvasContext = canvas.getContext('2d');
							imgDiffObject.reset();
							CompareImageDiff.onload = dojo.hitch(this, function () {
								canvas.width = viewerContainer.clientWidth;
								canvas.height = viewerContainer.clientHeight;
								localCanvasContext.drawImage(
									CompareImageDiff,
									0,
									0,
									CompareImageDiff.width,
									CompareImageDiff.height
								);
								canvas.style.display = 'block';
								imgFrontObject.isVisible = false;
								imgBackObject.isVisible = false;

								// We should restore image's offsets after loading diff image for "Diff" mode
								if (self.viewState) {
									var imageX = self.viewStateData.getValue('frontImageX');
									var imageY = self.viewStateData.getValue('frontImageY');
									if (imageX && imageY) {
										imgFrontObject.setOffset({
											x: +imageX,
											y: +imageY
										});
										imgFrontObject.repaint();
									}

									imageX = self.viewStateData.getValue('backImageX');
									imageY = self.viewStateData.getValue('backImageY');
									if (imageX && imageY) {
										imgBackObject.setOffset({
											x: +imageX,
											y: +imageY
										});
										imgBackObject.repaint();
									}

									imageX = self.viewStateData.getValue('diffImageX');
									imageY = self.viewStateData.getValue('diffImageY');
									if (imageX && imageY) {
										imgDiffObject.setOffset({
											x: +imageX,
											y: +imageY
										});
										imgDiffObject.repaint();
									}

									self.viewState = null;
								}

								btnZoomUp.Enable();
								btnZoomDown.Enable();
							});
							CompareImageDiff.src = resultData;
						},
						function (percentage) {
							progressCallback(percentage);
						}
					);
				isLongTermOperation = false;
				viewerContainer.style.cursor = imgFrontObject.getCursor();
				return resultData;
			}

			function onKeyUp(e) {
				if (
					e.keyCode === VC.Utils.Enums.AffectedKey.UP_ARROW ||
					e.keyCode === VC.Utils.Enums.AffectedKey.DOWN_ARROW ||
					e.keyCode === VC.Utils.Enums.AffectedKey.LEFT_ARROW ||
					e.keyCode === VC.Utils.Enums.AffectedKey.RIGHT_ARROW
				) {
					var func = dojo.hitch(this, this.currentState.apply);
					func();
				}
			}

			function onDragByKeys(e) {
				if (!isDraggingEnabled || !this.currentState.isDraggable()) {
					return;
				}

				var dx = 0;
				var dy = 0;
				var multiplier = 1;

				if (e.ctrlKey) {
					multiplier = 10;
				}
				switch (e.keyCode) {
					case VC.Utils.Enums.AffectedKey.UP_ARROW: {
						dy = -1;
						break;
					}
					case VC.Utils.Enums.AffectedKey.DOWN_ARROW: {
						dy = 1;
						break;
					}
					case VC.Utils.Enums.AffectedKey.LEFT_ARROW: {
						dx = -1;
						break;
					}
					case VC.Utils.Enums.AffectedKey.RIGHT_ARROW: {
						dx = 1;
						break;
					}
				}
				var moveFunc = dojo.hitch(this, frontObjectMoveHandler);
				moveFunc(dx * multiplier, (dy *= multiplier));
			}

			function frontObjectMoveHandler(posX, posY) {
				if (isDraggingEnabled && this.currentState.isDraggable()) {
					var offset = { posX: posX, posY: posY };
					var backBorders = getImageBorders(
						this.fileInfo2,
						imgBackObject,
						posX,
						posY
					);
					var frontBorders = getImageBorders(
						this.fileInfo1,
						imgFrontObject,
						posX,
						posY
					);

					if (posX > 0) {
						// Do not allow gap between left border of the front image and right border of the back one
						if (frontBorders.left > backBorders.right) {
							offset.posX = 0;
						}

						// Do not allow to transfer front image from the viewport over the right border (one pixel should stay visible)
						if (frontBorders.left > viewerContainer.scrollWidth - 1.0) {
							offset.posX = 0;
						}
					} else {
						// Do not allow gap between right border of the front image and left border of the back one
						if (frontBorders.right < backBorders.left) {
							offset.posX = 0;
						}

						// Do not allow to transfer front image from the viewport over the left border (one pixel should stay visible)
						if (frontBorders.right < 1.0) {
							offset.posX = 0;
						}
					}

					if (posY > 0) {
						// Do not allow gap between top border of the front image and bottom border of the back one
						if (frontBorders.top > backBorders.bottom) {
							offset.posY = 0;
						}

						// Do not allow to transfer front image from the viewport over the bottom border (one pixel should stay visible)
						if (frontBorders.top > viewerContainer.scrollHeight - 1.0) {
							offset.posY = 0;
						}
					} else {
						// Do not allow gap between bottom border of the front image and top border of the back one
						if (frontBorders.bottom < backBorders.top) {
							offset.posY = 0;
						}

						// Do not allow to transfer front image from the viewport over the top border (one pixel should stay visible)
						if (frontBorders.bottom < 1.0) {
							offset.posY = 0;
						}
					}

					imgFrontObject.moveImage(offset.posX, offset.posY);
					frontTotalOffsetX += offset.posX;
					frontTotalOffsetY += offset.posY;

					resizeScroll.apply(this);
					setScrollPosition.apply(this);

					return;
				}

				moveBothHandler.apply(this, [posX, posY]);
			}

			function getImageBorders(fileInfo, imgObject, posX, posY) {
				var rect = { x: 0, y: 0 };
				var offset = { x: 0, y: 0 };
				var imgObjectOffset = imgObject.getOffset();

				imgObjectOffset.x = imgObjectOffset.x + posX;
				imgObjectOffset.y = imgObjectOffset.y + posY;
				if (fileInfo.rectX * 1.0 + imgObjectOffset.x > 0) {
					var differnceX = fileInfo.rectX * 1.0 - imgObjectOffset.x;
					if (differnceX >= 0) {
						rect.x = differnceX;
						offset.x = 0;
					} else {
						rect.x = 0;
						offset.x = differnceX * -1;
					}
				} else {
					rect.x = (imgObjectOffset.x - fileInfo.rectX * 1.0) * -1;
					offset.x = 0;
				}

				if (fileInfo.rectY * 1.0 + imgObjectOffset.y > 0) {
					var differnceY = fileInfo.rectY * 1.0 - imgObjectOffset.y;
					if (differnceY >= 0) {
						rect.y = differnceY;
						offset.y = 0;
					} else {
						rect.y = 0;
						offset.y = differnceY * -1;
					}
				} else {
					rect.y = (imgObjectOffset.y - fileInfo.rectY * 1.0) * -1;
					offset.y = 0;
				}

				var rightBorder = 1.0 * offset.x + 1.0 * fileInfo.pageW - 1.0 * rect.x;
				var bottomBorder = 1.0 * offset.y + 1.0 * fileInfo.pageH - 1.0 * rect.y;

				return {
					right: rightBorder,
					bottom: bottomBorder,
					left: offset.x,
					top: offset.y
				};
			}

			function getOffsetPositions(posX, posY) {
				var offset = { posX: posX, posY: posY };
				var backBorders = getImageBorders(
					this.fileInfo2,
					imgBackObject,
					posX,
					posY
				);
				var frontBorders = getImageBorders(
					this.fileInfo1,
					imgFrontObject,
					posX,
					posY
				);

				if (posX > 0) {
					// Do not allow gap between left border and nearest image
					var leftBorder = Math.min(frontBorders.left, backBorders.left);
					if (leftBorder > 0) {
						offset.posX = 0;
					}

					// Do not allow to transfer nearest image from the viewport over the right border (one pixel should stay visible)
					leftBorder = Math.max(frontBorders.left, backBorders.left);
					if (leftBorder > viewerContainer.scrollWidth - 1.0) {
						offset.posX = 0;
					}
				} else {
					// Do not allow gap between right border and nearest image
					var rightBorder = Math.max(frontBorders.right, backBorders.right);
					if (rightBorder < viewerContainer.scrollWidth) {
						offset.posX = 0;
					}

					// Do not allow to transfer nearest image from the viewport over the left border (one pixel should stay visible)
					rightBorder = Math.min(frontBorders.right, backBorders.right);
					if (rightBorder < 1.0) {
						offset.posX = 0;
					}
				}

				if (posY > 0) {
					// Do not allow gap between top border and nearest image
					var topBorder = Math.min(frontBorders.top, backBorders.top);
					if (topBorder > 0) {
						offset.posY = 0;
					}

					// Do not allow to transfer nearest image from the viewport over the bottom border (one pixel should stay visible)
					topBorder = Math.max(frontBorders.top, backBorders.top);
					if (topBorder > viewerContainer.scrollHeight - 1.0) {
						offset.posY = 0;
					}
				} else {
					// Do not allow gap between bottom border and nearest image
					var bottomBorder = Math.max(frontBorders.bottom, backBorders.bottom);
					if (bottomBorder < viewerContainer.scrollHeight) {
						offset.posY = 0;
					}

					// Do not allow to transfer nearest image from the viewport over the top border (one pixel should stay visible)
					bottomBorder = Math.min(frontBorders.bottom, backBorders.bottom);
					if (bottomBorder < 1.0) {
						offset.posY = 0;
					}
				}

				return offset;
			}

			function moveBothHandler(posX, posY) {
				var positions = getOffsetPositions.apply(this, [posX, posY]);

				imgFrontObject.moveImage(positions.posX, positions.posY);
				imgBackObject.moveImage(positions.posX, positions.posY);

				this.scrollControl.setPosition(
					this.scrollControl.referenceX - positions.posX,
					this.scrollControl.referenceY - positions.posY
				);
			}

			function moveAllHandler(posX, posY) {
				var positions = getOffsetPositions.apply(this, [posX, posY]);

				imgDiffObject.moveImage(positions.posX, positions.posY);
				imgFrontObject.moveImage(positions.posX, positions.posY);
				imgBackObject.moveImage(positions.posX, positions.posY);

				this.scrollControl.setPosition(
					this.scrollControl.referenceX - positions.posX,
					this.scrollControl.referenceY - positions.posY
				);
			}

			function bothImagesLoaded() {
				bothImagesAreLoaded += 1;

				// Show bar half-way after file 1, then complete after file 2
				this.setLoadingProgress(50 * bothImagesAreLoaded + 1);

				if (bothImagesAreLoaded > 1) {
					bothImagesAreLoaded = 0;

					if (this.viewState) {
						this.setViewState(this.viewState);
						this.restoreViewStateData();
					} else {
						this.currentState.apply.apply(this);
					}

					frontTotalOffsetX = 0;
					frontTotalOffsetY = 0;

					if (this.scrollControl === null) {
						var scrollSize = getScrollSize.apply(this);

						this.scrollControl = new VC.Widgets.ScrollManager(
							scrollSize.width,
							scrollSize.height
						);
						this.scrollControl.placeAt(this.viewerContainer);

						this.scrollControl.onVerticalScroll = dojo.hitch(
							this,
							moveAllHandler
						);
						this.scrollControl.onHorizontalScroll = dojo.hitch(
							this,
							moveAllHandler
						);

						this.restoreViewerState();
						this.toolbarContainer.viewToolbar.btnComparisonPallete.onClick();
					} else {
						resizeScroll.apply(this);
					}

					setScrollPosition.apply(this);

					if (this.refreshStarted) {
						this.refreshStarted = false;

						var comparePalleteDialog = this.DialogManager.getExistingDialog(
							VC.Utils.Enums.Dialogs.ComparePallete
						);
						comparePalleteDialog.btnRefresh.Enable();
					}
				} else {
					return;
				}
			}

			function resizeScroll() {
				var scrollSize = getScrollSize.apply(this);

				this.scrollControl.recalculate(scrollSize.width, scrollSize.height);
			}

			function getScrollSize() {
				var offsetFront = imgFrontObject.getOffset();
				var offsetBack = imgBackObject.getOffset();
				var scrollWidth = +this.fileInfo2.pageW;
				var scrollHeight = +this.fileInfo2.pageH;
				var totalOffsetX = offsetFront.x - offsetBack.x;
				var totalOffsetY = offsetFront.y - offsetBack.y;
				var offsetX =
					+this.fileInfo1.rectX - +this.fileInfo2.rectX + -totalOffsetX;
				var offsetY =
					+this.fileInfo1.rectY - +this.fileInfo2.rectY + -totalOffsetY;

				if (offsetX < 0) {
					var intersectX = +this.fileInfo2.pageW - Math.abs(offsetX);

					if (+this.fileInfo1.pageW > intersectX) {
						scrollWidth += +this.fileInfo1.pageW - intersectX;
					}
				} else {
					scrollWidth += offsetX;
					var intersect = +this.fileInfo1.pageW - offsetX;

					if (intersect > +this.fileInfo2.pageW) {
						scrollWidth += intersect - +this.fileInfo2.pageW;
					}
				}

				if (offsetY < 0) {
					var intersectY = +this.fileInfo2.pageH - Math.abs(offsetY);

					if (+this.fileInfo1.pageH > intersectY) {
						scrollHeight += +this.fileInfo1.pageH - intersectY;
					}
				} else {
					scrollHeight += offsetY;
					var intersectWithPossibleAddArea = +this.fileInfo1.pageH - offsetY;

					if (intersectWithPossibleAddArea > +this.fileInfo2.pageH) {
						var additionalArea =
							intersectWithPossibleAddArea - +this.fileInfo2.pageH;
						scrollHeight += additionalArea;
					}
				}

				return {
					width: scrollWidth,
					height: scrollHeight
				};
			}

			function setScrollPosition() {
				if (this.scrollControl) {
					var offsetFront = imgFrontObject.getOffset();
					var offsetBack = imgBackObject.getOffset();
					var totalOffsetX = offsetFront.x - offsetBack.x;
					var totalOffsetY = offsetFront.y - offsetBack.y;
					var offsetX =
						+this.fileInfo1.rectX - +this.fileInfo2.rectX + -totalOffsetX;
					var offsetY =
						+this.fileInfo1.rectY - +this.fileInfo2.rectY + -totalOffsetY;

					if (offsetX > 0) {
						this.scrollControl.setPosition(
							+this.fileInfo1.rectX - offsetFront.x,
							this.scrollControl.referenceY
						);
					} else {
						this.scrollControl.setPosition(
							+this.fileInfo2.rectX - offsetBack.x,
							this.scrollControl.referenceY
						);
					}

					if (offsetY > 0) {
						this.scrollControl.setPosition(
							this.scrollControl.referenceX,
							+this.fileInfo1.rectY - offsetFront.y
						);
					} else {
						this.scrollControl.setPosition(
							this.scrollControl.referenceX,
							+this.fileInfo2.rectY - offsetBack.y
						);
					}
				}
			}

			return declare('ComparisonViewer', VC.ImageViewer, {
				fileInfo1: null,
				fileInfo2: null,

				CompareCanvasFront: null,
				CompareCanvasBack: null,
				CompareCanvasDiff: null,
				viewerContainer: null,
				States: {
					Front: {
						apply: function () {
							if (this.diffVersion) {
								imgFrontObject.isVisible = false;
								imgBackObject.isVisible = true;
							} else {
								imgFrontObject.isVisible = true;
								imgFrontObject.setOpacity(1);
								imgBackObject.isVisible = false;
							}
							CompareCanvasDiff.style.display = 'none';

							btnZoomUp.Enable();
							btnZoomDown.Enable();
						},

						getSnapshot: function () {
							if (this.diffVersion) {
								return imgBackObject.getDataUrl();
							} else {
								return imgFrontObject.getDataUrl();
							}
						},

						isDraggable: function () {
							return false;
						}
					},
					Back: {
						apply: function () {
							if (this.diffVersion) {
								imgFrontObject.isVisible = true;
								imgFrontObject.setOpacity(1);
								imgBackObject.isVisible = false;
							} else {
								imgFrontObject.isVisible = false;
								imgBackObject.isVisible = true;
							}
							CompareCanvasDiff.style.display = 'none';

							btnZoomUp.Enable();
							btnZoomDown.Enable();
						},

						getSnapshot: function () {
							if (this.diffVersion) {
								return imgFrontObject.getDataUrl();
							} else {
								return imgBackObject.getDataUrl();
							}
						},

						isDraggable: function () {
							return false;
						}
					},
					Both: {
						apply: function () {
							imgFrontObject.isVisible = true;
							imgFrontObject.setOpacity(0.5);
							imgBackObject.isVisible = true;
							CompareCanvasDiff.style.display = 'none';

							btnZoomUp.Enable();
							btnZoomDown.Enable();
						},

						getSnapshot: function () {
							var mycanvas = document.createElement('canvas');
							var backCanvas = imgBackObject.getCanvas();
							var frontCanvas = imgFrontObject.getCanvas();
							mycanvas.width = backCanvas.width;
							mycanvas.height = backCanvas.height;
							var context = mycanvas.getContext('2d');
							context.drawImage(backCanvas, 0, 0);
							context.globalAlpha = 0.5;
							context.drawImage(
								frontCanvas,
								0,
								0,
								frontCanvas.width,
								frontCanvas.height
							);
							return mycanvas.toDataURL();
						},

						isDraggable: function () {
							return true;
						}
					},
					Diff: {
						apply: function () {
							var self = this;
							isLongTermOperation = true;
							viewerContainer.style.cursor = imgFrontObject.getCursor();
							imgFrontObject.setOpacity(1);
							getDifferances.apply(this, [
								imgBackObject.getImageData(),
								imgFrontObject.getImageData(),
								option,
								CompareCanvasDiff,
								function () {}
							]);
							CompareCanvasDiff.style.display = 'block';

							this.setupDiffCanvasHandlers(isDraggingEnabled);
						},

						getSnapshot: function () {
							return CompareCanvasDiff.toDataURL();
						},

						isDraggable: function () {
							return true;
						}
					}
				},

				maxZoom: null,
				viewState: null,
				diffVersion: false,
				refreshStarted: false,
				scrollControl: null,

				initValStore: null,

				constructor: function (args) {
					this.currentPageNumber = 1;
					this.type = this.DialogManager.viewerType = 'comparizon';
					this.maxZoom = args.maxZoom;
					this.viewState = args.viewStateData;
					this.diffVersion = args.diffVersion ? args.diffVersion : false;

					var self = this;

					VC.Utils.Page.AddEvent(
						document,
						'keydown',
						dojo.hitch(self, onDragByKeys)
					);
					VC.Utils.Page.AddEvent(document, 'keyup', dojo.hitch(self, onKeyUp));
					document.getElementById('ViewImage').style.display = 'none';

					// We should swap incoming parameters args.fileInfo1 and args.fileInfo2 in case of different versions of same Item.
					// Since File1 should be fixed (i.e. placed into imgBackObject which corresponds to "Display File 2" button on "Compare" palette)
					// and File2 is moving on top of File1 (i.e. placed into imgFrontObject which corresponds to "Display File 1" button on "Compare" palette).
					// But "Display File 1" button should show imgBackObject and "Display File 2" one should show imgFrontObject in this case.
					if (this.diffVersion) {
						this.fileInfo1 = args.fileInfo2;
						this.fileInfo2 = args.fileInfo1;
					} else {
						this.fileInfo1 = args.fileInfo1;
						this.fileInfo2 = args.fileInfo2;
					}

					if (this.fileInfo1) {
						var file1InfoForTest = this.getImageUrl(this.fileInfo1);
						imgFrontObject = new ImageObject(
							file1InfoForTest,
							CompareCanvasFront
						);
						imgFrontObject.mouseMove = dojo.hitch(self, frontObjectMoveHandler);
						imgFrontObject.loaded = dojo.hitch(self, bothImagesLoaded);
					}

					if (this.fileInfo2) {
						var imageUrl = this.getImageUrl(this.fileInfo2);
						imgBackObject = new ImageObject(imageUrl, CompareCanvasBack);
						imgBackObject.mouseMove = dojo.hitch(self, moveBothHandler);
						imgBackObject.loaded = dojo.hitch(self, bothImagesLoaded);
					}

					imgDiffObject = new ImageObject(null, CompareCanvasDiff);
					CompareImageDiff = imgDiffObject.getImage();
					imgDiffObject.mouseMove = dojo.hitch(self, moveAllHandler);

					Object.defineProperty(this, 'currentState', {
						get: function () {
							return currState;
						},
						set: function (val) {
							currState = val;
						}
					});

					this.currentState = this.States.Both;
					this.viewStateData.updateValue('compare_state', 'Both');

					this.initValStore = {
						file1: {
							rectX: args.fileInfo1.rectX,
							rectY: args.fileInfo1.rectY,
							rectW: args.fileInfo1.rectW,
							rectH: args.fileInfo1.rectH,
							pageW: args.fileInfo1.pageW,
							pageH: args.fileInfo1.pageH,
							percents: args.fileInfo1.percents,
							angle: args.fileInfo1.angle,
							dpi: args.fileInfo1.dpi
						},
						file2: {
							rectX: args.fileInfo2.rectX,
							rectY: args.fileInfo2.rectY,
							rectW: args.fileInfo2.rectW,
							rectH: args.fileInfo2.rectH,
							pageW: args.fileInfo2.pageW,
							pageH: args.fileInfo2.pageH,
							percents: args.fileInfo2.percents,
							angle: args.fileInfo2.angle,
							dpi: args.fileInfo2.dpi
						}
					};
				},

				initializeViewer: function () {
					this.inherited(arguments);
					this._initZoomTextBox();
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
								VC.Utils.roundZoomValue(
									VC.Utils.roundZoomValue(this.fileInfo1.percents)
								)
							);
						})
					);
				},

				_loadFile: function () {
					// Should do nothing
				},

				fileInfoToXml: function (tagName, fileInfo) {
					if (!fileInfo) {
						return undefined;
					}

					var xmlDocument = this.aras.createXMLDocument();
					var fileInfoElement = xmlDocument.createElement(tagName);
					var fileInfoFields = Object.keys(fileInfo);
					var currentField = null;
					var currentValue = null;
					var currentElement = null;

					for (var j = 0; j < fileInfoFields.length; j++) {
						currentField = fileInfoFields[j];

						currentValue = fileInfo[currentField];
						if (currentValue !== null) {
							currentElement = xmlDocument.createElement(currentField);
							currentElement.text = currentValue;
							fileInfoElement.appendChild(currentElement);
						}
					}

					return fileInfoElement.xml;
				},

				restoreViewStateData: function () {
					if (this.viewStateData.isEmpty()) {
						this.viewState = null;
						return;
					}

					var state = this.viewStateData.getValue('compare_state');
					if (state !== '') {
						var comparePalleteDialog = this.DialogManager.getExistingOrNewDialog(
							VC.Utils.Enums.Dialogs.ComparePallete
						);

						switch (state) {
							case 'Front': {
								this.comparePalleteDialogInit(comparePalleteDialog);
								comparePalleteDialog.btnDisplayFile1.onClick();
								break;
							}
							case 'Back': {
								this.comparePalleteDialogInit(comparePalleteDialog);
								comparePalleteDialog.btnDisplayFile2.onClick();
								break;
							}
							case 'Both': {
								this.comparePalleteDialogInit(comparePalleteDialog);
								comparePalleteDialog.btnDisplayBothFiles.onClick();
								break;
							}
							case 'Diff': {
								var color = this.viewStateData.getValue('diffColor');
								var tolerance = this.viewStateData.getValue('diffTolerance');
								this.comparePalleteDialogInit(
									comparePalleteDialog,
									color,
									+tolerance
								);

								var diffImageX = this.viewStateData.getValue(
									'frontImageX4Diff'
								);
								var diffImageY = this.viewStateData.getValue(
									'frontImageY4Diff'
								);
								if (diffImageX && diffImageY) {
									imgFrontObject.setOffset({
										x: +diffImageX,
										y: +diffImageY
									});
									imgFrontObject.repaint();
								}

								diffImageX = this.viewStateData.getValue('backImageX4Diff');
								diffImageY = this.viewStateData.getValue('backImageY4Diff');
								if (diffImageX && diffImageY) {
									imgBackObject.setOffset({
										x: +diffImageX,
										y: +diffImageY
									});
									imgBackObject.repaint();
								}

								comparePalleteDialog.btnDifferenceView.onClick();
								break;
							}
						}
					}

					if (state !== 'Diff') {
						var imageX = this.viewStateData.getValue('frontImageX');
						var imageY = this.viewStateData.getValue('frontImageY');
						if (imageX && imageY) {
							imgFrontObject.setOffset({
								x: +imageX,
								y: +imageY
							});
							imgFrontObject.repaint();
						}

						imageX = this.viewStateData.getValue('backImageX');
						imageY = this.viewStateData.getValue('backImageY');
						if (imageX && imageY) {
							imgBackObject.setOffset({
								x: +imageX,
								y: +imageY
							});
							imgBackObject.repaint();
						}

						this.viewState = null;
					}
				},

				applyViewStateData: function () {
					setScrollPosition.apply(this);
				},

				getImageUrl: function (fileInfo) {
					if (!fileInfo) {
						return undefined;
					}

					this.checkFileInCache(fileInfo);

					var parametersUrl = '';
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'page',
						fileInfo.filePage
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'dpi',
						fileInfo.dpi
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'percents',
						fileInfo.percents
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'angle',
						fileInfo.angle
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'layers',
						encodeURIComponent(fileInfo.layers)
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'rectX',
						fileInfo.rectX
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'rectY',
						fileInfo.rectY
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'rectW',
						fileInfo.rectW
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'rectH',
						fileInfo.rectH
					);

					return (
						VC.Utils.getBaseUrlWithoutSalt(this.aras) +
						'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
						encodeURIComponent(fileInfo.fileUrl) +
						VC.Utils.Enums.PdfHandlerActions.PageToPng +
						parametersUrl
					);
				},

				checkFileInCache: function (fileInfo) {
					if (!fileInfo) {
						return false;
					}

					var result = false;
					var parametersUrl = '';

					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'page',
						fileInfo.filePage
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'angle',
						fileInfo.angle
					);
					parametersUrl = this.concatUrlParameters(
						parametersUrl,
						'layers',
						encodeURIComponent(fileInfo.layers)
					);

					var inCache = VC.Utils.getPdfFileInfo(
						fileInfo,
						VC.Utils.Enums.PdfHandlerActions.CheckCache + parametersUrl
					);

					if (inCache && inCache.localeCompare('True') === 0) {
						result = true;
					}

					// Should be generated new security token if file is not in cache
					if (!result) {
						fileInfo.fileUrl = this.aras.IomInnovator.getFileUrl(
							fileInfo.fileId,
							this.aras.Enums.UrlType.SecurityToken
						);
					}
				},

				loadContainer: function () {
					VC.Utils.Page.LoadWidgets(['ComparisonContainer']);
					var htmlContainer = new VC.Widgets.ComparisonContainer();
					htmlContainer.placeAt(document.body);
					CompareCanvasFront = htmlContainer.CompareCanvasFront;
					CompareCanvasBack = htmlContainer.CompareCanvasBack;
					CompareCanvasDiff = htmlContainer.CompareCanvasDiff;
					viewerContainer = htmlContainer.ViewerContainer;

					return htmlContainer;
				},

				setupDiffCanvasHandlers: function (enableDragging) {
					if (enableDragging) {
						CompareCanvasDiff.onmousedown = dojo.hitch(this, function (e) {
							imgFrontObject.isVisible = true;
							imgFrontObject.setOpacity(0.5);
							imgBackObject.isVisible = true;
							CompareCanvasDiff.style.display = 'none';
							CompareCanvasFront.onmousedown(e, true);
						});

						CompareCanvasDiff.onmouseup = dojo.hitch(this, function (e) {
							isLongTermOperation = true;
							viewerContainer.style.cursor = imgFrontObject.getCursor();
							imgFrontObject.setOpacity(1);
							imgBackObject.setOpacity(1);
							this.generateDiffImage();
						});

						CompareCanvasDiff.onmousemove = null;
						CompareCanvasDiff.onmouseout = null;
					} else {
						imgDiffObject.setupCanvasHandlers();
					}
				},

				restoreViewerState: function () {
					var curState = this.restoreViewerParameter(
						this.type + '.ActivePalette'
					);
					if (curState !== null) {
						this.cursorMode = curState;
					}
				},

				loadViewerToolbar: function () {
					var self = this;
					this.toolbarContainer.createViewToolbar(
						VC.Utils.Enums.TNames.ComparizonViewerToolbar
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
						VC.Utils.Enums.TButtonEvents.btnZoomWindowClick,
						dojo.hitch(self, self.ZoomWindowClick)
					);
					this.toolbarContainer.viewToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnComparisonPalleteClick,
						dojo.hitch(self, self.ComparisonPalleteClick)
					);

					this.bindDialogClick(
						this.toolbarContainer.viewToolbar.btnComparisonPallete,
						VC.Utils.Enums.Dialogs.ComparePallete
					);

					btnZoomUp = this.toolbarContainer.viewToolbar.btnZoomUp;
					btnZoomDown = this.toolbarContainer.viewToolbar.btnZoomDown;
				},

				_toFrontState: function () {
					this.currentState = this.States.Front;
					this.currentState.apply.apply(this);
					this.viewStateData.updateValue('compare_state', 'Front');
				},

				_toBackState: function () {
					this.currentState = this.States.Back;
					this.currentState.apply.apply(this);
					this.viewStateData.updateValue('compare_state', 'Back');
				},

				_toBothState: function () {
					this.currentState = this.States.Both;
					this.currentState.apply.apply(this);
					this.viewStateData.updateValue('compare_state', 'Both');
				},

				_toDiffState: function () {
					this.currentState = this.States.Diff;
					this.currentState.apply.apply(this);
					this.viewStateData.updateValue('compare_state', 'Diff');

					// We should store front and back images positions for possible restoring
					var imagePos = imgFrontObject.getOffset();
					this.viewStateData.updateValue('frontImageX4Diff', imagePos.x);
					this.viewStateData.updateValue('frontImageY4Diff', imagePos.y);

					imagePos = imgBackObject.getOffset();
					this.viewStateData.updateValue('backImageX4Diff', imagePos.x);
					this.viewStateData.updateValue('backImageY4Diff', imagePos.y);
				},

				comparePalleteDialogInit: function (
					comparePalleteDialog,
					initColor,
					initTolerance
				) {
					var self = this;

					if (!comparePalleteDialog.isInitHandlers) {
						self.bindUnpressedState(
							self.toolbarContainer.viewToolbar.btnComparisonPallete,
							comparePalleteDialog
						);

						comparePalleteDialog.onReset = function () {
							function refreshFileIfoVal(fileInfo, vals) {
								fileInfo.rectX = vals.rectX;
								fileInfo.rectY = vals.rectY;
								fileInfo.rectW = vals.rectW;
								fileInfo.rectH = vals.rectH;
								fileInfo.pageW = vals.pageW;
								fileInfo.pageH = vals.pageH;
								fileInfo.percents = vals.percents;
								fileInfo.angle = vals.angle;
								fileInfo.dpi = vals.dpi;
							}

							imgFrontObject.reset();
							imgBackObject.reset();

							refreshFileIfoVal(self.fileInfo1, self.initValStore.file1);
							refreshFileIfoVal(self.fileInfo2, self.initValStore.file2);

							comparePalleteDialog.btnRefresh.Disable();
							self.refresh();
						};

						comparePalleteDialog.onDragAndDrop = function () {
							isDraggingEnabled = comparePalleteDialog.isDraggingEnabled;
							CompareCanvasFront.style.cursor = imgFrontObject.getCursor();
							self.setupDiffCanvasHandlers(isDraggingEnabled);
						};

						comparePalleteDialog.onRefresh = function () {
							comparePalleteDialog.btnRefresh.Disable();
							self.refresh();
						};

						comparePalleteDialog.onDisplayFile1 = function () {
							self._toFrontState();
						};

						comparePalleteDialog.onDisplayFile2 = function () {
							self._toBackState();
						};

						comparePalleteDialog.onDisplayBothFiles = function () {
							self._toBothState();
						};

						comparePalleteDialog.onDisplayDiffView = function () {
							self._toDiffState();
						};

						comparePalleteDialog.onSelectColor = function () {
							self.setColor(comparePalleteDialog.color);

							if (comparePalleteDialog.isInitHandlers) {
								isLongTermOperation = true;
								viewerContainer.style.cursor = imgFrontObject.getCursor();
								self.generateDiffImage();

								self.saveViewerParameter(
									self.type +
										'.' +
										VC.Utils.Enums.Dialogs.ComparePallete +
										'.' +
										'Color',
									comparePalleteDialog.color
								);
							}
						};

						comparePalleteDialog.onChangeTolerance = function () {
							// To avoid duplicate diff image generating when tolerance value is restored from the view state
							if (option.tolerance === comparePalleteDialog.tolerance) {
								return;
							}

							option.tolerance = comparePalleteDialog.tolerance;

							if (comparePalleteDialog.isInitHandlers && resembleControl) {
								isLongTermOperation = true;
								viewerContainer.style.cursor = imgFrontObject.getCursor();
								self.generateDiffImage();
							}
						};

						if (initTolerance) {
							option.tolerance = initTolerance;
							comparePalleteDialog.tolerance = initTolerance;
						}

						if (initColor) {
							comparePalleteDialog.color = initColor;
						} else {
							var curColor = self.restoreViewerParameter(
								self.type +
									'.' +
									VC.Utils.Enums.Dialogs.ComparePallete +
									'.' +
									'Color'
							);
							if (curColor !== null) {
								comparePalleteDialog.color = curColor;
							}
						}

						comparePalleteDialog.isInitHandlers = true;
					}
				},

				ComparisonPalleteClick: function () {
					var comparePalleteDialog = this.DialogManager.getExistingOrNewDialog(
						VC.Utils.Enums.Dialogs.ComparePallete
					);

					this.comparePalleteDialogInit(comparePalleteDialog);
				},

				refresh: function () {
					this.refreshStarted = true;
					this.refreshFileInfo(this.fileInfo2, imgBackObject);
					this.refreshFileInfo(this.fileInfo1, imgFrontObject);

					resizeScroll.apply(this);
					setScrollPosition.apply(this);
					this.SetScale(VC.Utils.roundZoomValue(this.fileInfo1.percents));

					imgFrontObject.LoadImage(this.getImageUrl(this.fileInfo1));
					imgBackObject.LoadImage(this.getImageUrl(this.fileInfo2));
				},

				refreshFileInfo: function (
					fileInfo,
					imgObject,
					ratio,
					offsetForCentering
				) {
					if (ratio === undefined) {
						ratio = 1.0;
					}

					if (offsetForCentering === undefined) {
						offsetForCentering = { x: 0, y: 0 };
					}

					var offset = { x: 0, y: 0 };
					var imgObjectOffset = imgObject.getOffset();

					//X branch
					if (+fileInfo.rectX + imgObjectOffset.x > 0) {
						var differenceX = +fileInfo.rectX - imgObjectOffset.x;
						if (differenceX >= 0) {
							fileInfo.rectX = differenceX * ratio - offsetForCentering.x;
							offset.x = 0;
						} else {
							fileInfo.rectX = 0;
							offset.x = differenceX * -1 * ratio + offsetForCentering.x;
						}
					} else {
						fileInfo.rectX =
							(imgObjectOffset.x - +fileInfo.rectX) * ratio +
							offsetForCentering.x;
						if (fileInfo.rectX < 0) {
							offset.x += fileInfo.rectX;
							fileInfo.rectX = 0;
						} else {
							offset.x = 0;
						}
					}

					//Y branch
					if (+fileInfo.rectY + imgObjectOffset.y > 0) {
						var differenceY = +fileInfo.rectY - imgObjectOffset.y;
						if (differenceY >= 0) {
							fileInfo.rectY = differenceY * ratio - offsetForCentering.y;
							offset.y = 0;
						} else {
							fileInfo.rectY = 0;
							offset.y = differenceY * -1 * ratio + offsetForCentering.y;
						}
					} else {
						fileInfo.rectY =
							(imgObjectOffset.y - +fileInfo.rectY) * ratio +
							offsetForCentering.y;
						if (fileInfo.rectY < 0) {
							offset.y += fileInfo.rectY;
							fileInfo.rectY = 0;
						} else {
							offset.y = 0;
						}
					}

					var rightBorder =
						1.0 * offset.x +
						1.0 * fileInfo.pageW * ratio -
						1.0 * fileInfo.rectX;
					if (rightBorder > viewerContainer.scrollWidth) {
						fileInfo.rectW = viewerContainer.scrollWidth - 1.0 * offset.x;
					} else {
						fileInfo.rectW =
							1.0 * fileInfo.pageW * ratio - 1.0 * fileInfo.rectX;
					}

					var bottomBorder =
						1.0 * offset.y +
						1.0 * fileInfo.pageH * ratio -
						1.0 * fileInfo.rectY;
					if (bottomBorder > viewerContainer.scrollHeight) {
						fileInfo.rectH = viewerContainer.scrollHeight - 1.0 * offset.y;
					} else {
						fileInfo.rectH =
							1.0 * fileInfo.pageH * ratio - 1.0 * fileInfo.rectY;
					}

					fileInfo.rectW = Math.abs(fileInfo.rectW);
					fileInfo.rectH = Math.abs(fileInfo.rectH);

					fileInfo.pageW = fileInfo.pageW * ratio;
					fileInfo.pageH = fileInfo.pageH * ratio;

					imgObject.setOffset(offset);
				},

				scaleFileInfo: function (
					fileInfo,
					imageObject,
					newScale,
					offsetForCentering
				) {
					fileInfo.rectW = this.viewerContainer.scrollWidth;
					fileInfo.rectH = this.viewerContainer.scrollHeight;

					if (newScale && +fileInfo.percents !== newScale) {
						if (+fileInfo.percents !== 0) {
							var ratio = newScale / +fileInfo.percents;

							this.refreshFileInfo(
								fileInfo,
								imageObject,
								ratio,
								offsetForCentering
							);
						}
						fileInfo.percents = newScale;
					} else {
						this.refreshFileInfo(
							fileInfo,
							imageObject,
							1.0,
							offsetForCentering
						);
					}
				},

				ZoomPercentChange: function () {
					var zoom = this.toolbarContainer.viewToolbar.getElementPropertyValue(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue
					);
					if (zoom) {
						this.SetScale(zoom);
					}
				},

				SetScale: function (scale, offsetForCentering) {
					var self = this;
					var roundedVal = VC.Utils.roundZoomValue(scale); // Round off to the nearest number in compliance with the IR-032259
					var zoomDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Zoom
					);

					btnZoomUp.Disable();
					btnZoomDown.Disable();

					this.scaleFileInfo(
						this.fileInfo2,
						imgBackObject,
						roundedVal,
						offsetForCentering
					);
					this.scaleFileInfo(
						this.fileInfo1,
						imgFrontObject,
						roundedVal,
						offsetForCentering
					);

					imgFrontObject.LoadImage(this.getImageUrl(this.fileInfo1));
					imgBackObject.LoadImage(this.getImageUrl(this.fileInfo2));

					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue,
						roundedVal
					);
				},

				ZoomOut: function () {
					var curScale = this.fileInfo1.percents * 1.0;
					if (curScale > 100.0 && curScale - 25.0 < 100.0) {
						curScale = 100.0;
					} else {
						curScale = Math.max(1.0, curScale - 25.0);
					}

					this.SetScale(curScale);
				},

				ZoomIn: function () {
					var curScale = this.fileInfo1.percents * 1.0;
					if (curScale < 100.0 && curScale + 25.0 > 100.0) {
						curScale = 100.0;
					} else {
						curScale = Math.min(this.maxZoom, curScale + 25.0);
					}

					this.SetScale(curScale);
				},

				ZoomWindowClick: function () {
					this._toZoomMode();

					this.toolbarContainer.viewToolbar.btnZoomWindow.SetPressedState(true);
				},

				_toPanMode: function () {
					this.curCursorMode = this.CursorModes.Pan;

					this.cleanZoomingPage();

					this.saveViewerParameter(
						this.type + '.ActivePalette',
						this.CursorModes.Pan
					);
				},

				_toZoomMode: function () {
					var self = this;
					this.zoomWindow = true;
					this.viewerContainer.style.cursor = this.getCursor();

					this.cleanZoomingPage();
					this.addZoomingPage(
						this.viewerContainer.clientWidth - 17,
						this.viewerContainer.clientHeight - 17
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

				_toSelectMode: function () {
					this.curCursorMode = this.CursorModes.Select;

					this.cleanZoomingPage();

					this.saveViewerParameter(
						this.type + '.ActivePalette',
						this.CursorModes.Select
					);
				},

				updateZoomingPage: function () {
					if (this.zoomingPage) {
						this.zoomingPage.position = {
							left: '0px',
							top: '0px',
							width: this.viewerContainer.clientWidth - 17 + 'px',
							height: this.viewerContainer.clientHeight - 17 + 'px'
						};

						this.zoomingPage.clientX = 0;
						this.zoomingPage.clientY = 0;
						this.zoomingPage.width = this.viewerContainer.clientWidth - 17;
						this.zoomingPage.height = this.viewerContainer.clientHeight - 17;
					}
				},

				execZooming: function () {
					var zoomingBox = this.zoomingPage.getSelectionBox();
					if (zoomingBox && zoomingBox.width > 0 && zoomingBox.height > 0) {
						var ratioX = this.viewerContainer.clientWidth / zoomingBox.width;
						var ratioY = this.viewerContainer.clientHeight / zoomingBox.height;
						var curRatio = Math.min(ratioX, ratioY);
						var curScale = this.fileInfo1.percents * curRatio;
						if (curScale > this.maxZoom) {
							curScale = this.maxZoom;
							curRatio = curScale / this.fileInfo1.percents;
						}

						var self = this;
						var selectedRect = this.zoomingPage.container.selectionRect.Node.getBBox();
						var offsetX =
							(this.viewerContainer.clientWidth -
								selectedRect.width * curRatio) /
							2;
						var offsetY =
							(this.viewerContainer.clientHeight -
								selectedRect.height * curRatio) /
							2;

						var offset = imgFrontObject.getOffset();
						offset.x -= zoomingBox.x;
						offset.y -= zoomingBox.y;
						imgFrontObject.setOffset(offset);

						offset = imgBackObject.getOffset();
						offset.x -= zoomingBox.x;
						offset.y -= zoomingBox.y;
						imgBackObject.setOffset(offset);

						this.SetScale(curScale, { x: offsetX, y: offsetY });
					}
				},

				_initZoomTextBox: function () {
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue,
						VC.Utils.roundZoomValue(this.fileInfo1.percents)
					);
					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.maxValue,
						this.maxZoom
					);
				},

				FitWidth: function () {
					var scrollSize = getScrollSize.apply(this);
					var ratio = this.viewerContainer.clientWidth / scrollSize.width;
					var zoomDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Zoom
					);

					this.resetScrollPosition();
					this.fitImagePair(ratio);
				},

				FitHeight: function () {
					var scrollSize = getScrollSize.apply(this);
					var ratio = this.viewerContainer.clientHeight / scrollSize.height;
					var zoomDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.Zoom
					);

					this.resetScrollPosition();
					this.fitImagePair(ratio);
				},

				resetScrollPosition: function () {
					var xOffset = this.scrollControl.referenceX;
					var yOffset = this.scrollControl.referenceY;
					moveBothHandler.apply(this, [xOffset, yOffset]);
				},

				fitImagePair: function (ratio) {
					btnZoomUp.Disable();
					btnZoomDown.Disable();

					this.fitImage(this.fileInfo1, imgFrontObject, ratio);
					this.fitImage(this.fileInfo2, imgBackObject, ratio);

					imgFrontObject.LoadImage(this.getImageUrl(this.fileInfo1));
					imgBackObject.LoadImage(this.getImageUrl(this.fileInfo2));

					this.toolbarContainer.viewToolbar.bindPropertyBehaviour(
						VC.Utils.Enums.TButtonNames.tbxZoomPercentage,
						VC.Utils.Enums.TPropertyName.currentValue,
						+this.fileInfo2.percents
					);
				},

				fitImage: function (fileInfo, imageObject, ratio) {
					var percentage = VC.Utils.roundZoomValue(ratio * +fileInfo.percents); // Round off to the nearest number in compliance with the IR-032259

					fileInfo.rectX = 0;
					fileInfo.rectY = 0;
					fileInfo.rectW = this.viewerContainer.scrollWidth;
					fileInfo.rectH = this.viewerContainer.scrollHeight;

					this.refreshFileInfo(fileInfo, imageObject, ratio);
					fileInfo.percents = percentage;
				},

				concatUrlParameters: function (
					parametersUrl,
					parameterName,
					parameterValue
				) {
					if (parameterValue !== null) {
						parametersUrl = parametersUrl.concat('&');
						parametersUrl = parametersUrl.concat(
							parameterName,
							'=',
							parameterValue
						);
					}

					return parametersUrl;
				},

				generateDiffImage: function () {
					getDifferances.apply(this, [
						imgBackObject.getImageData(),
						imgFrontObject.getImageData(),
						option,
						CompareCanvasDiff,
						function () {}
					]);
				},

				setColor: function (hexFormatColor) {
					var parsedColor =
						hexFormatColor.charAt(0) === '#'
							? hexFormatColor.substring(1, 7)
							: hexFormatColor;

					option.errorColor.red = parseInt(parsedColor.substring(0, 2), 16);
					option.errorColor.green = parseInt(parsedColor.substring(2, 4), 16);
					option.errorColor.blue = parseInt(parsedColor.substring(4, 6), 16);
				},

				onWindowResizeEventHandler: function () {
					this.onWindowResizeViewerBehavior();

					resizeScroll.apply(this);
					setScrollPosition.apply(this);
					imgFrontObject.resizeCanvas();
					imgBackObject.resizeCanvas();
				},

				getMarkupImg: function () {
					this.viewStateData.updateValue(
						'fileInfo1',
						this.fileInfoToXml(
							'fileInfo1',
							this.diffVersion ? this.fileInfo2 : this.fileInfo1
						)
					);
					this.viewStateData.updateValue(
						'fileInfo2',
						this.fileInfoToXml(
							'fileInfo2',
							this.diffVersion ? this.fileInfo1 : this.fileInfo2
						)
					);
					this.viewStateData.updateValue('diffVersion', this.diffVersion);

					// For alternative thumbnail's tooltip template
					this.viewStateData.updateValue('comparisonTooltipTemplate', 'true');
					var fileName = this.diffVersion
						? this.fileInfo2.fileName
						: this.fileInfo1.fileName;
					if (fileName.lastIndexOf('.') > 0) {
						fileName = fileName.substring(0, fileName.lastIndexOf('.'));
					}
					this.viewStateData.updateValue('fileName1', fileName);
					this.viewStateData.updateValue(
						'filePage1',
						this.diffVersion ? this.fileInfo2.filePage : this.fileInfo1.filePage
					);
					this.viewStateData.updateValue(
						'docName1',
						this.diffVersion
							? this.fileInfo2.documentName
							: this.fileInfo1.documentName
					);
					this.viewStateData.updateValue(
						'docVersion1',
						this.diffVersion
							? this.fileInfo2.fileVersion
							: this.fileInfo1.fileVersion
					);

					fileName = this.diffVersion
						? this.fileInfo1.fileName
						: this.fileInfo2.fileName;
					if (fileName.lastIndexOf('.') > 0) {
						fileName = fileName.substring(0, fileName.lastIndexOf('.'));
					}
					this.viewStateData.updateValue('fileName2', fileName);
					this.viewStateData.updateValue(
						'filePage2',
						this.diffVersion ? this.fileInfo1.filePage : this.fileInfo2.filePage
					);
					this.viewStateData.updateValue(
						'docName2',
						this.diffVersion
							? this.fileInfo1.documentName
							: this.fileInfo2.documentName
					);
					this.viewStateData.updateValue(
						'docVersion2',
						this.diffVersion
							? this.fileInfo1.fileVersion
							: this.fileInfo2.fileVersion
					);

					var comparePalleteDialog = this.DialogManager.getExistingDialog(
						VC.Utils.Enums.Dialogs.ComparePallete
					);
					if (comparePalleteDialog) {
						this.viewStateData.updateValue(
							'diffColor',
							comparePalleteDialog.color
						);
						this.viewStateData.updateValue(
							'diffTolerance',
							comparePalleteDialog.tolerance
						);
					}

					var imagePos = imgFrontObject.getOffset();
					this.viewStateData.updateValue('frontImageX', imagePos.x);
					this.viewStateData.updateValue('frontImageY', imagePos.y);

					imagePos = imgBackObject.getOffset();
					this.viewStateData.updateValue('backImageX', imagePos.x);
					this.viewStateData.updateValue('backImageY', imagePos.y);

					imagePos = imgDiffObject.getOffset();
					this.viewStateData.updateValue('diffImageX', imagePos.x);
					this.viewStateData.updateValue('diffImageY', imagePos.y);

					return this.currentState.getSnapshot.apply(this);
				},

				getSnapshotFileName: function () {
					var tooltipTemplate = VC.Utils.GetResource(
						'comparison_downloaded_snapshot_filename_template'
					);
					return tooltipTemplate.Format(
						this.viewStateData.getValue('fileName1'),
						this.viewStateData.getValue('filePage1'),
						this.viewStateData.getValue('docName1'),
						this.viewStateData.getValue('docVersion1'),
						this.viewStateData.getValue('fileName2'),
						this.viewStateData.getValue('filePage2'),
						this.viewStateData.getValue('docName2'),
						this.viewStateData.getValue('docVersion2')
					);
				}
			});
		})()
	);
});
