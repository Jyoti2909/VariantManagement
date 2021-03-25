VC.Utils.Page.LoadModules([
	'Managers/DialogManager',
	'Managers/ViewStateManager',
	'Managers/ToolbarManager'
]);

require(['dojo/aspect', 'dojox/xml/parser', 'dojo/_base/declare'], function (
	aspect,
	parser,
	declare
) {
	return dojo.setObject(
		'Viewer',
		declare(null, {
			viewer: null,
			viewerContainer: null,
			type: null,
			fileUrl: null,
			snapshotUrl: null,
			viewStateData: null,
			isViewerInitialized: false,
			isSnapshotHolderInitialized: false,
			overflowContainer: null, // container with ViewerContainer and SnapshotContainer
			snapshotContainer: null,
			snapshotImage: null,
			dialogWrap: null,
			markupPage: null,
			ViewerModes: {
				View: 'view',
				Markup: 'markup'
			},
			onMarkupModeActivate: null, //public trigger
			onViewModeActivate: null, //public trigger
			onActivateViewerInVersionedMode: null,
			progressBar: null,
			hidden: null,
			mode: null,
			currViewerMode: null,
			currentActivePalette: null,

			CursorModes: {
				Pan: 'pan',
				Select: 'select'
			},
			PaletteToSVGElementDict: null,

			curCursorMode: null,
			zoomingPage: null,
			zoomWindow: false,
			highlightedText: null,

			modalDialogs: null,
			DialogManager: null,
			ViewStateManager: null,
			ToolbarManager: null,
			isMouseKeyPressed: false,
			// IR-030663 "SSVC: viewing out-of-context file"
			// We show out-of-context file in the viewer but without ability to markup
			OnLoaded: null,

			ViewState: function (initValue) {
				var valueStr = '<view_state></view_state>';
				if (initValue) {
					valueStr = initValue;
				}

				var viewStateParser = new DOMParser();
				var viewStateSerializer = new XMLSerializer();
				var rootXml = '';
				var innerXml = '';
				function parseToXml(val) {
					rootXml = viewStateParser.parseFromString(
						'<root>' + val + '</root>',
						'text/xml'
					);
					return rootXml.getElementsByTagName('view_state')[0];
				}

				Object.defineProperty(this, 'innerString', {
					get: function () {
						return viewStateSerializer.serializeToString(innerXml);
					},
					set: function (val) {
						innerXml = '';
						innerXml = parseToXml(val);
					}
				});

				this.innerString = valueStr;
				this.innerXML = innerXml;

				this.updateValue = function (name, value) {
					var element = innerXml.getElementsByTagName(name)[0];
					if (typeof element === 'undefined') {
						element = rootXml.createElement(name);
						element.textContent = value;
						innerXml.appendChild(element);
					} else {
						element.textContent = value;
					}
				};
				this.getValue = function (name) {
					var element = innerXml.getElementsByTagName(name)[0];
					if (typeof element === 'undefined') {
						this.updateValue(name, '');
						return '';
					}

					return element.textContent;
				};
				this.isEmpty = function () {
					if (
						this.innerString.indexOf('<view_state />') === 0 ||
						this.innerString.indexOf('<view_state/>') === 0
					) {
						return true;
					}

					return false;
				};
			},

			constructor: function (args) {
				var self = this;
				this.args = args;
				this.aras = args.aras;
				this.type = 'base';
				this.modalDialogs = {};
				this.DialogManager = new VC.DialogManager();
				this.ViewStateManager = new VC.ViewStateManager();

				this.loadScripts();
				var htmlContainer = this.loadContainer(this.args);
				// should be set before 'showITContainer' calling because it uses this viewer container
				this.viewerContainer = htmlContainer.ViewerContainer;
				// should be initialized only after loading container
				this.ToolbarManager = new VC.ToolbarManager();
				aspect.after(
					this.ToolbarManager,
					'showITContainer',
					dojo.hitch(this, this._afterShowITContainer)
				);
				this.overflowContainer = htmlContainer.OverflowContainer;
				this.ToolbarManager.showITContainer();

				Object.defineProperty(this, 'toolbarContainer', {
					get: function () {
						return this.ToolbarManager.currentContainer;
					}
				});

				Object.defineProperty(this, 'viewerToolbar', {
					get: function () {
						return this.ToolbarManager.currentContainer.viewToolbar;
					}
				});

				Object.defineProperty(this, 'markupToolbar', {
					get: function () {
						return this.ToolbarManager.currentContainer.markupToolbar;
					}
				});

				this.snapshotImage = htmlContainer.SnapshotImage;
				this.snapshotImage.addEventListener(
					'load',
					dojo.hitch(this, function () {
						self.cleanMarkupPage();
						self.showSnapshotContainer('block');
						self.addMarkupPage();
						self.onWindowResizeEventHandler();
						self.isSnapshotHolderInitialized = true;
						self.restoreMarkupActivePalette();
						self.setLoadingProgress(101);
						self.refreshDialogWrap();
					})
				);
				this.snapshotContainer = htmlContainer.SnapshotContainer;
				this.dialogWrap = document.getElementsByClassName('Wrap')[0];

				this.viewStateData = new this.ViewState();
				this.viewMode = 'FitWidth';
				this.curCursorMode = this.CursorModes.Pan;

				window.addEventListener(
					'resize',
					dojo.hitch(this, 'onWindowResizeEventHandler')
				);
				var flag = false;
				this.snapshotContainer.addEventListener('mousedown', function () {
					self.isMouseKeyPressed = true;
				});
				this.snapshotContainer.addEventListener('mouseup', function () {
					self.isMouseKeyPressed = false;
				});
				this.snapshotContainer.addEventListener('mousemove', function () {
					if (self.isMouseKeyPressed === flag) {
						return;
					}
					flag = self.isMouseKeyPressed;
					var palletes = self.ToolbarManager.currentContainer.palettes();
					if (self.isMouseKeyPressed) {
						for (var dlg in palletes) {
							if (palletes[dlg].domNode) {
								palletes[dlg].domNode.style.pointerEvents = 'none';
							}
						}

						if (self.toolbarContainer.domNode) {
							self.toolbarContainer.domNode.style.pointerEvents = 'none';
						}
					} else {
						for (var dl in palletes) {
							if (palletes[dl].domNode) {
								palletes[dl].domNode.style.pointerEvents = 'auto';
							}
						}

						if (self.toolbarContainer.domNode) {
							self.toolbarContainer.domNode.style.pointerEvents = 'auto';
						}
					}
				});

				var loadToolbar =
					args && typeof args.loadToolbar !== 'undefined'
						? args.loadToolbar
						: true;
				if (loadToolbar) {
					this.loadToolbars();
				}
				this.displayToolbarButtons(false);
				Object.defineProperty(this, 'mode', {
					current: null,

					set: function (val) {
						if (val === self.ViewerModes.View) {
							this.current = self.ViewerModes.View;
							self._toViewMode();
						} else {
							this.current = self.ViewerModes.Markup;
							self._toMarkupMode();
						}
					},
					get: function () {
						return this.current;
					}
				});

				Object.defineProperty(this, 'snapshot', {
					get: function () {
						return self.getSnapshotPage();
					}
				});

				Object.defineProperty(this, 'markupData', {
					get: function () {
						return (
							self.viewStateData.innerString +
							'<markup>' +
							self.getMarkupXml() +
							'</markup>'
						);
					}
				});

				Object.defineProperty(this, 'cursorMode', {
					get: function () {
						return self.curCursorMode;
					},

					set: function (val) {
						switch (val) {
							case self.CursorModes.Pan:
								if (self.toolbarContainer.viewToolbar.btnPan) {
									self.toolbarContainer.viewToolbar.btnPan.onClick();
								}
								break;
							case self.CursorModes.Select:
								if (self.toolbarContainer.viewToolbar.btnSelectText) {
									self.toolbarContainer.viewToolbar.btnSelectText.onClick();
								}
								break;
						}
					}
				});

				Object.defineProperty(this, 'isViewerContainerDisplayed', {
					get: function () {
						return this.viewerContainer.style.display === 'block';
					},
					configurable: true
				});

				Object.defineProperty(this, 'hasHorizontalScroll', {
					configurable: true,
					get: function () {
						return (
							this.viewerContainer.scrollWidth >
							this.viewerContainer.clientWidth
						);
					}
				});

				Object.defineProperty(this, 'hasVerticalScroll', {
					configurable: true,
					get: function () {
						return (
							this.viewerContainer.scrollHeight >
							this.viewerContainer.clientHeight
						);
					}
				});

				this.PaletteToSVGElementDict = {};
				this.PaletteToSVGElementDict[VC.Utils.Enums.Palettes.Scribble] =
					VC.SVG.ActiveScribbleElement;
				this.PaletteToSVGElementDict[VC.Utils.Enums.Palettes.Highlight] =
					VC.SVG.ActiveElement;
				this.PaletteToSVGElementDict[VC.Utils.Enums.Palettes.Label] =
					VC.SVG.ActiveLabelElement;
			},

			uninitialize: function () {
				console.log('uninitialize');
				this.self = null;
				this.viewerContainer.innerHTML = '';
			},

			loadContainer: function () {
				VC.Utils.Page.LoadModules(['Widgets/BaseViewerContainer']);
				var htmlContainer = new VC.Widgets.ViewerContainer();
				htmlContainer.placeAt(document.body);
				return htmlContainer;
			},

			loadScripts: function () {},

			//virtual
			initializeViewer: function () {
				throw new Error('Viewer: initializeViewer must be overloaded');
			},

			applyViewStateData: function () {},

			_loadFile: function () {},

			_toViewMode: function () {
				this.hideSnapshot();
				this.showViewer();
				this.cleanMarkupPage();
				this.ToolbarManager.currentContainer.closeAllPalettesButThis('');
				if (this.toolbarContainer.viewToolbar) {
					this.toolbarContainer.btnView.select();
					this.toolbarContainer.activeMode = this.mode;
					this.toolbarContainer.markupToolbar.hide();
				}
				this.applyViewStateData();
				if (this.args.markupMessageId !== undefined) {
					this.args.markupMessageId = undefined;
				}
				if (this.onViewModeActivate) {
					this.onViewModeActivate();
				}
			},
			_toMarkupMode: function () {
				this.showSnapshot();
				this.hideViewer();
				this.DialogManager.closeAllDialogsButThis('');
				if (this.toolbarContainer.viewToolbar) {
					this.toolbarContainer.btnMarkup.select();
					this.toolbarContainer.activeMode = this.mode;
					this.toolbarContainer.viewToolbar.hide();
				}

				if (this.onMarkupModeActivate) {
					this.onMarkupModeActivate();
				}
			},

			refreshDialogWrap: function () {
				if (this.mode === this.ViewerModes.Markup) {
					this.dialogWrap.style.width = '100%';
					this.dialogWrap.style.height = '100%';
				} else {
					if (this.hasHorizontalScroll) {
						this.dialogWrap.style.height = 'calc(100% - 17px)';
					} else {
						this.dialogWrap.style.height = '100%';
					}
					if (this.hasVerticalScroll) {
						this.dialogWrap.style.width = 'calc(100% - 17px)';
					} else {
						this.dialogWrap.style.width = '100%';
					}
				}
			},

			displayFile: function (fileUrl) {
				if (!fileUrl && !this.fileUrl) {
					return false;
				} else if (!this.fileUrl || (this.fileUrl !== fileUrl && fileUrl)) {
					this.fileUrl = fileUrl;
					if (!this.isViewerInitialized) {
						this.initializeViewer();
					}
					if (this.isViewerInitialized) {
						this.mode = this.ViewerModes.View;
						this._loadFile();
					}
				} else if (this.fileUrl) {
					if (!this.isViewerInitialized) {
						this.initializeViewer();
					}
					if (this.isViewerInitialized) {
						this.mode = this.ViewerModes.View;
					}
				}
				return true;
			},

			displayMarkup: function (imgUrl) {
				if (!this.isViewerInitialized) {
					this.initializeViewer();
				}
				if (this.isViewerInitialized) {
					this.snapshotUrl = imgUrl;
					this.mode = this.ViewerModes.Markup;
				}
			},

			displaySketch: function () {
				if (!this.isViewerInitialized) {
					this.initializeViewer();
				}
				if (this.isViewerInitialized) {
					this.snapshotUrl = this.getSketchPage();
					this.mode = this.ViewerModes.Markup;
				}
			},

			getSketchPage: function () {
				// For alternative thumbnail's tooltip template
				this.viewStateData.updateValue('sketchTooltipTemplate', 'true');

				// gets width/height of 'OverflowContainer' because neither snapshot image,
				// nor snapshot container does not have correct width/height of viewable area
				// in just created temporary image viewer for sketch function
				var viewboxWidth = this.overflowContainer.offsetWidth;
				var viewboxHeight = this.overflowContainer.offsetHeight;
				var canvas = document.createElement('canvas');
				canvas.setAttribute('width', viewboxWidth);
				canvas.setAttribute('height', viewboxHeight);
				var ctx = canvas.getContext('2d');

				ctx.rect(0, 0, viewboxWidth, viewboxHeight);
				ctx.fillStyle = 'white';
				ctx.fill();

				return canvas.toDataURL();
			},

			setViewState: function (val) {
				if (val) {
					this.viewStateData.innerString = val;
				}
			},

			loadToolbars: function () {
				if (this.isViewerInitialized || this.isSnapshotHolderInitialized) {
					return;
				}

				this.initITContainer();
			},

			//Should be overloaded in nested class in order to lock markup button during loading progress
			isCanvasImgEmpty: function (markupImg) {
				return false;
			},

			initITContainer: function () {
				var self = this;

				this.loadViewerToolbar();
				this.loadMarkupToolbar();

				this.toolbarContainer.onBtnViewClick = function () {
					if (self.markupPage && self.markupPage.hasNotations()) {
						if (
							VC.Utils.confirm(
								VC.Utils.GetResource('mark_tb_lose_unsaved_markup'),
								window
							) !== true
						) {
							if (
								typeof self.ToolbarManager.currentContainer.btnView
									.isCancelled !== 'undefined'
							) {
								self.ToolbarManager.currentContainer.btnView.isCancelled = true;
							}

							return;
						}
					}
					if (self.mode === self.ViewerModes.Markup) {
						self.displayFile();
						self.refreshDialogWrap();
					}
				};
				this.toolbarContainer.onBtnMarkupClick = function () {
					if (self.mode === self.ViewerModes.View) {
						self.DialogManager.closeAllDialogsButThis('');
						self.refreshDialogWrap();

						// IR-039935 "CHROME: SSVC. Black snapshot when switching between modes"
						var markupImg = self.getMarkupImg();
						if (self.isCanvasImgEmpty(markupImg)) {
							return;
						}

						self.displayMarkup(markupImg);

						var highlightText = self.getSelectedTextWithPrefix();
						if (
							self.onSetHighlightText &&
							highlightText !== null &&
							highlightText !== ''
						) {
							self.onSetHighlightText(highlightText);
						}
					}
				};
				this.toolbarContainer.onBtnSwitchClick = function () {
					var containerTypeToSwitch = VC.Toolbar.ContainerTypeMapper.mapBasicToCommand();
					var currentContainer = self.ToolbarManager.currentContainer;

					if (
						containerTypeToSwitch ===
						VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes.TBasicContainer
					) {
						self.switchToDefaultMode();
					}

					self.ToolbarManager.showITContainer(containerTypeToSwitch);

					if (
						!self.ToolbarManager.currentContainer.viewToolbar ||
						!self.ToolbarManager.currentContainer.markupToolbar
					) {
						self.initITContainer();
					}

					currentContainer.assignElementStatesTo(
						self.ToolbarManager.currentContainer
					);
					self.ToolbarManager.currentContainer.refresh();
					currentContainer.refresh();
					currentContainer.closeAllPalettesButThis('');
					self._saveContainerTypeToInnovator(containerTypeToSwitch);
					if (self.OnLoaded) {
						self.OnLoaded();
					}
				};

				aspect.after(
					this.toolbarContainer,
					'onBtnSwitchClick',
					dojo.hitch(this, function () {
						if (
							this.toolbarContainer.markupToolbar &&
							this.mode === this.ViewerModes.Markup
						) {
							this.restoreMarkupActivePalette();
						}
					})
				);
			},

			displayToolbarButtons: function (flag) {
				this.toolbarContainer.btnView.enable(flag);
				this.toolbarContainer.btnMarkup.enable(flag);
			},

			restoreMarkupActivePalette: function () {
				var curPalette = this.restoreViewerParameter('Markup.ActivePalette');

				switch (curPalette) {
					case VC.Utils.Enums.Palettes.Scribble:
						this.toolbarContainer.markupToolbar.btnScribble.onClick();
						break;
					case VC.Utils.Enums.Palettes.Highlight:
						this.toolbarContainer.markupToolbar.btnRectangle.onClick();
						break;
					case VC.Utils.Enums.Palettes.Label:
						this.toolbarContainer.markupToolbar.btnLabel.onClick();
						break;
				}
			},

			changeViewerMode: function (mode) {
				this.mode = mode;
			},

			setLoadingProgress: function (progress) {
				if (progress > 100) {
					var self = this;
					setTimeout(function () {
						if (self.progressBar !== null) {
							self.progressBar.parentElement.removeChild(self.progressBar);
						}
						self.progressBar = null;
						self.displayToolbarButtons(true);
						if (self.OnLoaded) {
							self.OnLoaded();
						}
					}, 300);
				}

				if (
					typeof this.progressBar === 'undefined' ||
					this.progressBar === null
				) {
					initProgressBar(this);
				}

				var curProgress = parseInt(this.progressBar.style.width);
				if (curProgress < progress) {
					this.progressBar.style.width = progress + '%';
				}

				function initProgressBar(thisViewer) {
					thisViewer.progressBar = document.createElement('div');

					thisViewer.progressBar.style.backgroundColor = '#404040';
					thisViewer.progressBar.style.position = 'absolute';
					thisViewer.progressBar.style.zIndex = 10000;
					thisViewer.progressBar.style.top = '0px';
					thisViewer.progressBar.style.left = '0px';
					thisViewer.progressBar.style.height = '2px';
					thisViewer.progressBar.style.width = '1%';
					thisViewer.progressBar.id = 'ViewerProgressBar';

					var toolbar = document.getElementById('toolbarContainers');
					toolbar.parentElement.appendChild(thisViewer.progressBar);
				}
			},

			addMarkupPage: function () {
				VC.Utils.Page.LoadModules(['MarkupPage']);
				this.markupPage = new VC.MarkupPage(
					this.snapshotImage.width,
					this.snapshotImage.height
				);
				this.markupPage.placeAt(this.snapshotContainer);
				this.bindToMarkupPageModes(
					this.toolbarContainer.markupToolbar.btnSelect
				);
			},

			updateMarkupPage: function () {
				this.markupPage.position = {
					left: this.snapshotImage.style.left,
					top: this.snapshotImage.style.top,
					width: this.snapshotImage.style.width,
					height: this.snapshotImage.style.height
				};

				this.markupPage.clientX = 0;
				this.markupPage.clientY = 0;
				this.markupPage.width = this.markupPage.position.width;
				this.markupPage.height = this.markupPage.position.height;
			},

			cleanMarkupPage: function () {
				if (this.markupPage) {
					this.markupPage.dispose();
					this.markupPage = null;
				}
			},

			saveViewerParameter: function (name, value, persistent) {
				this.ViewStateManager.saveViewStateParameter(name, value, persistent);
			},

			deleteViewerParameter: function (name) {
				this.ViewStateManager.deleteViewStateParameter(name);
			},

			restoreViewerParameter: function (name) {
				return this.ViewStateManager.restoreViewStateParameter(name);
			},

			addZoomingPage: function (pageWidth, pageHeight) {
				VC.Utils.Page.LoadModules(['MarkupPage']);
				this.zoomingPage = new VC.MarkupPage(pageWidth, pageHeight);
				this.zoomingPage.placeAt(this.viewerContainer);
			},

			cleanZoomingPage: function () {
				if (this.zoomingPage) {
					this.zoomingPage.dispose();
					this.zoomingPage = null;
				}
			},

			loadMarkupToolbar: function () {
				var self = this;

				this.toolbarContainer.createMarkupToolbar(
					VC.Utils.Enums.TNames.MarkupViewerToolbar
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnScribbleClick,
					function () {
						self.markupPage.removeDrawableSettings();
						var scribblePalleteDialog = self.ToolbarManager.currentContainer.createPalette(
							VC.Utils.Enums.Palettes.Scribble
						);

						if (!scribblePalleteDialog.isInitHandlers) {
							self.bindUnpressedState(
								self.toolbarContainer.markupToolbar.btnScribble,
								scribblePalleteDialog
							);

							scribblePalleteDialog.btnScribbleClick = function () {
								self.markupPage.startDrawing(VC.SVG.ActiveScribbleElement);
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Scribble
								);
							};

							scribblePalleteDialog.btnSelectClick = function () {
								self.markupPage.startSelecting();
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							scribblePalleteDialog.smallScribbleButtonClick = function () {
								self.markupPage.setDrawableSettings({ strokeWidth: 4 });

								self.saveViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'scribbleSize',
									scribblePalleteDialog.sizes.small
								);
							};
							scribblePalleteDialog.mediumScribbleButtonClick = function () {
								self.markupPage.setDrawableSettings({ strokeWidth: 9 });

								self.saveViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'scribbleSize',
									scribblePalleteDialog.sizes.medium
								);
							};
							scribblePalleteDialog.largeScribbleButtonClick = function () {
								self.markupPage.setDrawableSettings({ strokeWidth: 20 });

								self.saveViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'scribbleSize',
									scribblePalleteDialog.sizes.large
								);
							};
							scribblePalleteDialog.onSelectColor = function () {
								self.markupPage.setDrawableSettings({ lineColor: this.color });

								self.saveViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'lineColor',
									this.color
								);
							};

							aspect.after(scribblePalleteDialog, 'onOpen', function () {
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Scribble
								);

								var curValue = self.restoreViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'scribbleSize'
								);
								if (curValue !== null) {
									scribblePalleteDialog.size = curValue;
								}
								curValue = self.restoreViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Scribble +
										'.' +
										'lineColor'
								);
								if (curValue !== null) {
									scribblePalleteDialog.color = curValue;
								}
							});

							scribblePalleteDialog.onCrossClick = function () {
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							scribblePalleteDialog.onClose = function () {
								if (self.markupPage) {
									self.markupPage.startSelecting();
								}
							};

							scribblePalleteDialog.isInitHandlers = true;
						}

						self.ToolbarManager.currentContainer.closeAllPalettesButThis(
							scribblePalleteDialog.id
						);
						self.markupPage.startDrawing(VC.SVG.ActiveScribbleElement);
						scribblePalleteDialog.show(VC.Utils.Enums.PalleteMode.draw);
					}
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnRectangleClick,
					function () {
						self.markupPage.removeDrawableSettings();

						var highlightPalleteDialog = self.ToolbarManager.currentContainer.createPalette(
							VC.Utils.Enums.Palettes.Highlight
						);

						if (!highlightPalleteDialog.isInitHandlers) {
							self.bindUnpressedState(
								self.toolbarContainer.markupToolbar.btnRectangle,
								highlightPalleteDialog
							);

							highlightPalleteDialog.btnHighlightClick = function () {
								self.markupPage.startDrawing(VC.SVG.ActiveElement);
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Highlight
								);
							};

							highlightPalleteDialog.btnSelectClick = function () {
								self.markupPage.startSelecting();
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							highlightPalleteDialog.onSelectColor = function () {
								self.markupPage.setDrawableSettings({
									background: this.rgbaColor
								});

								self.saveViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Highlight +
										'.' +
										'background',
									this.color
								);
							};

							aspect.after(highlightPalleteDialog, 'onOpen', function () {
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Highlight
								);

								var curValue = self.restoreViewerParameter(
									'Markup.' +
										VC.Utils.Enums.Palettes.Highlight +
										'.' +
										'background'
								);
								if (curValue !== null) {
									highlightPalleteDialog.color = curValue;
								}
							});

							highlightPalleteDialog.onCrossClick = function () {
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							highlightPalleteDialog.onClose = function () {
								if (self.markupPage) {
									self.markupPage.startSelecting();
								}
							};

							highlightPalleteDialog.isInitHandlers = true;
						}

						self.ToolbarManager.currentContainer.closeAllPalettesButThis(
							highlightPalleteDialog.id
						);
						self.markupPage.startDrawing(VC.SVG.ActiveElement);
						highlightPalleteDialog.show(VC.Utils.Enums.PalleteMode.draw);
					}
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnLabelClick,
					function () {
						self.markupPage.removeDrawableSettings();

						var labelPalleteDialog = self.ToolbarManager.currentContainer.createPalette(
							VC.Utils.Enums.Palettes.Label
						);

						if (!labelPalleteDialog.isInitHandlers) {
							self.bindUnpressedState(
								self.toolbarContainer.markupToolbar.btnLabel,
								labelPalleteDialog
							);

							labelPalleteDialog.btnLabelClick = function () {
								self.markupPage.startDrawing(VC.SVG.ActiveLabelElement);
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Label
								);
							};

							labelPalleteDialog.btnSelectClick = function () {
								self.markupPage.startSelecting();
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							labelPalleteDialog.smallLabelButtonClick = function () {
								self.markupPage.setDrawableSettings({ fontSize: 13 });

								self.saveViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'labelSize',
									labelPalleteDialog.sizes.small
								);
							};

							labelPalleteDialog.mediumLabelButtonClick = function () {
								self.markupPage.setDrawableSettings({ fontSize: 18 });

								self.saveViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'labelSize',
									labelPalleteDialog.sizes.medium
								);
							};

							labelPalleteDialog.largeLabelButtonClick = function () {
								self.markupPage.setDrawableSettings({ fontSize: 26 });

								self.saveViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'labelSize',
									labelPalleteDialog.sizes.large
								);
							};

							labelPalleteDialog.onSelectColor = function () {
								self.markupPage.setDrawableSettings({ lineColor: this.color });

								self.saveViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'lineColor',
									this.color
								);
							};

							aspect.after(labelPalleteDialog, 'onOpen', function () {
								self.saveViewerParameter(
									'Markup.ActivePalette',
									VC.Utils.Enums.Palettes.Label
								);

								var curValue = self.restoreViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'labelSize'
								);
								if (curValue !== null) {
									labelPalleteDialog.size = curValue;
								}
								curValue = self.restoreViewerParameter(
									'Markup.' + VC.Utils.Enums.Palettes.Label + '.' + 'lineColor'
								);
								if (curValue !== null) {
									labelPalleteDialog.color = curValue;
								}
							});

							labelPalleteDialog.onCrossClick = function () {
								self.saveViewerParameter('Markup.ActivePalette', 'None');
							};

							labelPalleteDialog.onClose = function () {
								if (self.markupPage) {
									self.markupPage.startSelecting();
								}
							};

							labelPalleteDialog.isInitHandlers = true;
						}
						self.ToolbarManager.currentContainer.closeAllPalettesButThis(
							labelPalleteDialog.id
						);
						self.markupPage.startDrawing(VC.SVG.ActiveLabelElement);
						labelPalleteDialog.show(VC.Utils.Enums.PalleteMode.draw);
					}
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnSelectClick,
					function () {
						self.markupPage.startSelecting();
						self.saveViewerParameter('Markup.ActivePalette', 'None');
					}
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnDeleteClick,
					function () {
						self.markupPage.deleteSelected();
					}
				);

				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnDownloadMarkupClick,
					dojo.hitch(self, self.DownloadMarkup)
				);
				this.toolbarContainer.markupToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnViewFileMarkupClick,
					dojo.hitch(self, self.PrintMarkupClick)
				);

				this.bindPaletteClick(
					this.toolbarContainer.markupToolbar.btnScribble,
					VC.Utils.Enums.Palettes.Scribble
				);
				this.bindPaletteClick(
					this.toolbarContainer.markupToolbar.btnRectangle,
					VC.Utils.Enums.Palettes.Highlight
				);
				this.bindPaletteClick(
					this.toolbarContainer.markupToolbar.btnLabel,
					VC.Utils.Enums.Palettes.Label
				);
				this.bindSelectClick(this.toolbarContainer.markupToolbar.btnSelect);
			},

			palleteButtonClick: function (btn, paletteName) {
				var self = this;
				if (btn.IsPressed) {
					btn.SetPressedState(false);
					self.ToolbarManager.currentContainer.closePalette(paletteName);
					self.currentActivePalette = null;
				} else {
					btn.SetPressedState(true);
					self.currentActivePalette = self.ToolbarManager.currentContainer.createPalette(
						paletteName
					);
				}
			},

			bindPaletteClick: function (button, paletteName) {
				aspect.after(
					button,
					'onClick',
					dojo.partial(
						dojo.hitch(this, this.palleteButtonClick),
						button,
						paletteName
					),
					true
				);
			},

			dialogButtonClick: function (btn, dialogName) {
				var self = this;
				if (btn.IsPressed) {
					btn.SetPressedState(false);
					self.DialogManager.closeDialog(dialogName);
				} else {
					btn.SetPressedState(true);
					self.DialogManager.openDialog(dialogName);
				}
			},

			bindDialogClick: function (button, dialogName) {
				if (button) {
					aspect.after(
						button,
						'onClick',
						dojo.partial(
							dojo.hitch(this, this.dialogButtonClick),
							button,
							dialogName
						),
						true
					);
				}
			},

			bindUnpressedState: function (button, palette) {
				if (button) {
					if (palette && palette.onCrossClick) {
						aspect.after(palette, 'onCrossClick', function () {
							button.SetPressedState(false);
						});
					}

					if (palette && palette.hide) {
						aspect.after(palette, 'hide', function () {
							button.SetPressedState(false);
						});
					}
				}
			},

			bindToMarkupPageModes: function (toolbarButton) {
				aspect.after(
					this.markupPage,
					'startDrawing',
					dojo.partial(
						dojo.hitch(this, this.setDrawButtonStates),
						toolbarButton
					),
					true
				);

				aspect.after(
					this.markupPage,
					'startSelecting',
					dojo.partial(
						dojo.hitch(this, this.setSelectButtonStates),
						toolbarButton
					),
					true
				);
			},

			setDrawButtonStates: function (toolbarButton) {
				if (toolbarButton) {
					toolbarButton.SetPressedState(false);
				}

				if (
					this.currentActivePalette &&
					this.currentActivePalette.setDrawButtonStates
				) {
					this.currentActivePalette.setDrawButtonStates();
				}
			},

			setSelectButtonStates: function (toolbarButton) {
				if (toolbarButton) {
					toolbarButton.SetPressedState(true);
				}

				if (
					this.currentActivePalette &&
					this.currentActivePalette.resetModeButtonsStates
				) {
					this.currentActivePalette.resetModeButtonsStates();
					this.currentActivePalette.btnSelect.SetPressedState(true);
				}
			},

			selectButtonClick: function (btn) {
				btn.SetPressedState(!btn.IsPressed);
				this.ToolbarManager.currentContainer.closeAllPalettesButThis('');
				this.currentActivePalette = null;
			},

			bindSelectClick: function (button) {
				if (button) {
					aspect.after(
						button,
						'onClick',
						dojo.partial(dojo.hitch(this, this.selectButtonClick), button),
						true
					);
				}
			},

			loadViewerToolbar: function () {
				throw new Error('Viewer: loadViewerToolbar must be overloaded');
			},

			getMarkupImg: function () {
				throw new Error('getMarkupImg should be overridden');
			},

			showSnapshotContainer: function (style) {
				if (this.snapshotContainer) {
					this.snapshotContainer.style.display = style ? style : 'block';
				}
			},

			showSnapshot: function () {
				this.snapshotImage.src = this.snapshotUrl;
			},

			hideSnapshot: function () {
				if (this.snapshotContainer) {
					this.snapshotContainer.style.display = 'none';
				}
			},

			showViewer: function () {
				if (this.viewerContainer) {
					this.viewerContainer.style.display = 'block';
				}
			},

			hideViewer: function () {
				if (this.viewerContainer) {
					this.viewerContainer.style.display = 'none';
				}
			},

			getMarkupXml: function (pageNumberPar) {
				pageNumberPar = pageNumberPar || 1;
				if (this.markupPage) {
					var xmlDoc = this.markupPage.getXML();
					if (xmlDoc.childNodes.length === 0) {
						return '';
					}
					xmlDoc.setAttribute('page', '1');
					return parser.innerXML(xmlDoc);
				}

				return '';
			},

			onWindowResizeSnapshotBehavior: function (viewerFrameRect) {
				var newWidth;
				var newHeight;
				var newTop;
				var newLeft;
				var fpRatio = viewerFrameRect.width / viewerFrameRect.height;
				var imgRatio =
					this.snapshotImage.naturalWidth / this.snapshotImage.naturalHeight;

				if (this.mode === this.ViewerModes.Markup) {
					if (
						(fpRatio >= 1.0 &&
							imgRatio * viewerFrameRect.height <= viewerFrameRect.width) ||
						(fpRatio < 1.0 &&
							viewerFrameRect.width / imgRatio > viewerFrameRect.height)
					) {
						newHeight = viewerFrameRect.height;
						newWidth = imgRatio * newHeight;
						newTop = 0;
						newLeft = 0.5 * (viewerFrameRect.width - newWidth);
					} else {
						newWidth = viewerFrameRect.width;
						newHeight = newWidth / imgRatio;
						newTop = 0.5 * (viewerFrameRect.height - newHeight);
						newLeft = 0;
					}
				}

				var maxMoveLength;

				if (this.mode === this.ViewerModes.Markup && this.markupPage) {
					var rect = this.markupPage.detectBoundingRect();

					if (
						(fpRatio >= 1.0 &&
							imgRatio * viewerFrameRect.height <= viewerFrameRect.width) ||
						(fpRatio < 1.0 &&
							viewerFrameRect.width / imgRatio > viewerFrameRect.height)
					) {
						newHeight = viewerFrameRect.height;
						newWidth = imgRatio * newHeight;
						newTop = 0;

						if (!rect) {
							newLeft = 0.5 * (viewerFrameRect.width - newWidth);
						} else {
							var markupHorCenter = rect.width;
							var frameHorCenter = viewerFrameRect.width;
							maxMoveLength = viewerFrameRect.width - newWidth;

							if (frameHorCenter - markupHorCenter <= 0) {
								newLeft = 0;
							} else {
								if (frameHorCenter - markupHorCenter < maxMoveLength) {
									newLeft = (frameHorCenter - markupHorCenter) / 2;
								} else {
									newLeft = maxMoveLength / 2;
								}
							}
						}
					} else {
						newWidth = viewerFrameRect.width;
						newHeight = newWidth / imgRatio;
						newLeft = 0;

						if (!rect) {
							newTop = 0.5 * (viewerFrameRect.height - newHeight);
						} else {
							var markupVerCenter = rect.height;
							var frameVerCenter = viewerFrameRect.height;
							maxMoveLength = viewerFrameRect.height - newHeight;

							if (frameVerCenter - markupVerCenter <= 0) {
								newTop = 0;
							} else {
								if (frameVerCenter - markupVerCenter < maxMoveLength) {
									newTop = (frameVerCenter - markupVerCenter) / 2;
								} else {
									newTop = maxMoveLength / 2;
								}
							}
						}
					}
				}

				this.snapshotImage.style.top = newTop + 'px';
				this.snapshotImage.style.left = newLeft + 'px';
				this.snapshotImage.style.width = newWidth + 'px';
				this.snapshotImage.style.height = newHeight + 'px';

				if (this.markupPage && newWidth > 0 && newHeight > 0) {
					var prevWidth = this.markupPage.width;
					var prevHeight = this.markupPage.height;

					this.updateMarkupPage();

					if (this.markupPage.isHasChilds) {
						this.markupPage.scale(newWidth / prevWidth, newHeight / prevHeight);
					}
				}
			},

			getSnapshotPage: function () {
				return this.getCanvDataUrl(
					this.snapshotImage,
					this.snapshotImage.offsetWidth,
					this.snapshotImage.offsetHeight
				);
			},

			getBlobSnapshotPage: function () {
				return this.getCanvData(
					this.snapshotImage,
					this.snapshotImage.offsetWidth,
					this.snapshotImage.offsetHeight
				).msToBlob();
			},

			getCanvDataUrl: function (img, width, height) {
				return this.getCanvData(img, width, height).toDataURL();
			},

			getCanvData: function (img, width, height) {
				var canvas = document.createElement('canvas');
				canvas.setAttribute('width', width);
				canvas.setAttribute('height', height);
				var ctx = canvas.getContext('2d');

				ctx.drawImage(img, 0, 0, width, height);

				var svgXml = this.getMarkupXml();
				if (svgXml !== '') {
					ctx.drawSvg(svgXml);
				}

				return canvas;
			},

			//todo: should be moved to Utils
			getLoggedIdentityId: function () {
				return VC.Utils.getLoggedIdentityId();
			},

			onViewerLoaded: function () {
				this.refreshDialogWrap();
			},

			onZoomChangeEventHandler: function () {
				this.refreshDialogWrap();
			},

			onWindowResizeViewerBehavior: function () {
				this.DialogManager.repositionAllDialogs();
				this.refreshDialogWrap();

				if (this.ToolbarManager.currentContainer.repositionAllPalettes) {
					this.ToolbarManager.currentContainer.repositionAllPalettes();
				}

				if (this.toolbarContainer.reposition) {
					this.toolbarContainer.reposition();
				}

				if (this.mode === this.ViewerModes.View) {
					if (this.updateZoomingPage) {
						this.updateZoomingPage();
					}

					return;
				}
				var parent = this.snapshotImage.parentElement;
				var scaleX = 1.0;
				if (this.snapshotImage.offsetWidth > 0) {
					scaleX = parent.offsetWidth / this.snapshotImage.offsetWidth;
				}

				var scaleY = 1.0;
				if (this.snapshotImage.offsetHeight > 0) {
					scaleY = parent.offsetHeight / this.snapshotImage.offsetHeight;
				}

				if (scaleX < scaleY) {
					this.snapshotImage.style.width =
						this.snapshotImage.offsetWidth * scaleX + 'px';
					this.snapshotImage.style.height =
						this.snapshotImage.offsetHeight * scaleX + 'px';
				} else {
					this.snapshotImage.style.width =
						this.snapshotImage.offsetWidth * scaleY + 'px';
					this.snapshotImage.style.height =
						this.snapshotImage.offsetHeight * scaleY + 'px';
				}

				this.snapshotImage.style.left =
					(parent.offsetWidth - this.snapshotImage.offsetWidth) / 2 + 'px';
				this.snapshotImage.style.top =
					parent.offsetHeight - this.snapshotImage.offsetHeight + 'px';
				this.onWindowResizeSnapshotBehavior({
					width: this.snapshotContainer.clientWidth,
					height: this.snapshotContainer.clientHeight
				});
			},

			onWindowResizeEventHandler: function () {
				this.onWindowResizeViewerBehavior();
			},

			_saveContainerTypeToInnovator: function (containerType) {
				switch (containerType) {
					case VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
						.TBasicContainer:
						VC.Utils.setUseStandartToolbar(false);
						break;
					case VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
						.TCommandContainer:
						VC.Utils.setUseStandartToolbar(true);
						break;
				}
			},

			_afterShowITContainer: function () {
				VC.Utils.Page.LoadWidgets(['Moveable']);
				switch (VC.Toolbar.ContainerTypeMapper.currentType) {
					case VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
						.TCommandContainer:
						this.overflowContainer.style.top = '29px';
						this.overflowContainer.style.height = 'calc(100% - 29px)';
						VC.Widgets.Moveable.topLimiter = 28;
						break;
					case VC.Toolbar.ContainerTypeMapper.ToolbarContainerTypes
						.TBasicContainer:
						this.overflowContainer.style.top = '0';
						this.overflowContainer.style.height = '100%';
						VC.Widgets.Moveable.topLimiter = 0;
						break;
				}
			},

			validatePasteImage: function () {
				var isSketch = this.viewStateData.getValue('sketchTooltipTemplate');

				if (
					!isSketch ||
					this.mode !== this.ViewerModes.Markup ||
					!this.markupPage ||
					this.markupPage.hasNotations()
				) {
					return false;
				}

				return true;
			},

			pasteImageHandler: function (imageUrl) {
				this.drawImageWithoutScaling(imageUrl);
			},

			displaySelectedFile: function (imageUrl) {
				this.viewStateData.updateValue('sketchTooltipTemplate', 'true');
				this.drawImageWithoutScaling(imageUrl);
			},

			drawImageWithoutScaling: function (imageUrl) {
				var img = document.createElement('img');
				var self = this;

				this.snapshotContainer.appendChild(img);
				img.src = imageUrl;
				img.onload = function () {
					var width = window.innerWidth;
					var height = window.innerHeight;
					var imageWidth = img.width;
					var imageHeight = img.height;

					if (imageWidth > width || imageHeight > height) {
						self.displayMarkup(imageUrl);
					} else {
						var result = VC.Utils.createCanvas(width, height);

						result.context.rect(0, 0, width, height);
						result.context.fillStyle = 'black';
						result.context.fill();
						result.context.drawImage(img, 0, 0, imageWidth, imageHeight);

						self.displayMarkup(result.canvas.toDataURL());
					}

					self.snapshotContainer.removeChild(img);
				};
			},

			DownloadClick: function () {
				if (VC.Utils.isChrome()) {
					var link = window.document.createElement('a');
					link.href = this.aras.IomInnovator.getFileUrl(
						this.args.fileId,
						this.aras.Enums.UrlType.SecurityToken
					);
					link.download = this.localFileName || '';

					var e = document.createEvent('MouseEvents');
					e.initEvent('click', true, true);
					link.dispatchEvent(e);
				} else {
					this.selectDirectory();
				}
			},

			selectDirectory: function () {
				var fileId = this.args.fileId;
				var selectedFile = self.aras.getItemById('File', fileId, 0);

				this.downloadFile(selectedFile);
			},

			downloadFile: function (fileNode) {
				if (fileNode) {
					var aras = self.aras;
					var downloadResult = aras.downloadFile(fileNode);

					if (downloadResult) {
						aras.AlertSuccess(
							aras.getResource(
								'',
								'file_management.file_succesfully_downloaded',
								aras.getItemProperty(fileNode, 'filename')
							)
						);
					}
				}
			},

			isWindows: function () {
				var regExp = /^Win/;
				if (regExp.test(navigator.platform)) {
					return true;
				} else {
					return false;
				}
			},

			getDirectoryName: function (filePath) {
				if (filePath) {
					var pathSeparator = this.isWindows() ? '\\' : '/';
					return filePath.substring(0, filePath.lastIndexOf(pathSeparator) + 1);
				}
			},

			DownloadMarkup: function () {
				var fileName = this.getSnapshotFileName() + '.jpg';
				if (VC.Utils.isIE() || VC.Utils.isEdge()) {
					window.navigator.msSaveBlob(this.getBlobSnapshotPage(), fileName);
				} else {
					var link = window.document.createElement('a');
					link.href = this.getSnapshotPage();
					link.download = fileName;

					var e = document.createEvent('MouseEvents');
					e.initEvent('click', true, true);
					link.dispatchEvent(e);
				}
			},

			PrintMarkupClick: function () {
				VC.Utils.Page.LoadModules(['Managers/PrintManager']);
				var markupData = this.getSnapshotPage();
				VC.PrintManager.openPDFFromImage(
					markupData,
					this.snapshotImage.width,
					this.snapshotImage.height,
					'',
					VC.PrintManager.printFile
				);
			},

			getSelectedText: function () {
				return null;
			},

			getSelectedTextWithPrefix: function () {
				var selectedText = this.getSelectedText();
				var textPrefix = VC.Utils.getHighlightTextPrefix();

				if (selectedText !== null && selectedText !== '') {
					this.highlightedText = selectedText;
					return textPrefix === ''
						? selectedText
						: textPrefix + '\n' + selectedText;
				}

				return null;
			},

			getViewerType: function () {
				return null;
			},

			getSnapshotFileName: function () {
				var fileNode = this.aras.getItemById('File', this.args.fileId, 0);
				var fileName = '';
				if (fileNode !== null) {
					fileName = this.trimFileExtension(
						this.aras.getItemProperty(fileNode, 'filename')
					);
				}

				const tooltipTemplate = VC.Utils.GetResource(
					'downloaded_snapshot_filename_template'
				);
				return tooltipTemplate.Format(
					fileName,
					VC.Utils.getItemTypeLabelbyName(this.args.markupHolderItemtypeName),
					this.args.holderKeyedName
				);
			},

			trimFileExtension: function (name) {
				return /(.+)\.\w+/gi.exec(name)[1];
			},

			clearDiscussionFeedTextbox: function () {
				if (this.onGetDiscussionFeedText && this.onSetDiscussionFeedText) {
					var prefix = VC.Utils.getHighlightTextPrefix();
					var feedText = this.onGetDiscussionFeedText();

					if (feedText && feedText.indexOf(prefix, 0) !== -1) {
						this.onSetDiscussionFeedText('');
					}
				}
			},

			getViewerOutMode: function (message) {
				let actualMode = null;
				let item = this.aras.newIOMItem('File', 'get');

				item.setAttribute('id', message.markup.fileId);
				item.setAttribute('select', 'id,fileName,generation');
				item = item.apply();

				if (item.getItemCount() === 0) {
					actualMode = VC.Utils.Enums.ViewerOutModes.Limited;
				} else {
					actualMode = VC.Utils.Enums.ViewerOutModes.Versioned;
				}

				return actualMode;
			},

			loseCurrentMarkup: function () {
				if (this.markupPage && this.markupPage.hasNotations()) {
					const message = VC.Utils.GetResource('mark_tb_lose_unsaved_markup');

					return VC.Utils.confirm(message, window) !== true;
				}

				return false;
			},

			setupViewerInOutOfContextMode: function (message) {
				const fileUrl = this.fileUrl;

				this.displayFileIfViewerNotInitializedBefore(message);

				if (!fileUrl) {
					this.displayMarkup(message.markup.getSnapshot());
					this.setViewState(message.markup.getViewData());

					this.OnLoaded = this.showViewerInOutOfContextModeHandler.bind(
						this,
						message
					);
				}
			},

			showViewerInOutOfContextModeHandler: function (message) {
				if (this.toolbarContainer.btnView) {
					this.toolbarContainer.btnView.onClick = this.showViewerInOutOfContextMode.bind(
						this,
						message
					);
				}
			},

			setupViewer: function (message) {
				if (this.loseCurrentMarkup()) {
					return;
				}

				this.displayFileIfViewerNotInitializedBefore(message);
				this.displayMarkup(message.markup.getSnapshot());
				this.setViewState(message.markup.getViewData());
			},

			displayFileIfViewerNotInitializedBefore: function (message) {
				if (!this.fileUrl) {
					const actualMode = this.getViewerOutMode(message);

					if (actualMode !== VC.Utils.Enums.ViewerOutModes.Limited) {
						const url = this.aras.IomInnovator.getFileUrl(
							message.markup.fileId,
							this.aras.Enums.UrlType.SecurityToken
						);
						this.displayFile(url);
					}
				}
			},

			applyOutOfContextMode: function (message) {
				const url = this.aras.IomInnovator.getFileUrl(
					message.markup.fileId,
					this.aras.Enums.UrlType.SecurityToken
				);
				const isDisplayed = this.displayFile(url);

				if (!isDisplayed) {
					this.fileUrl = this.fileUrl ? this.fileUrl : url;
					this.displayMarkup(message.markup.getSnapshot());
				}

				this.OnLoaded = function () {
					this.fileUrl = null;

					if (isDisplayed) {
						this.toolbarContainer.btnMarkup.enable(false);
					} else {
						this.toolbarContainer.btnView.enable(false);
					}
				};
			},

			showViewerInOutOfContextMode: function (message) {
				const actualMode = this.getViewerOutMode(message);

				if (actualMode === VC.Utils.Enums.ViewerOutModes.Limited) {
					this.applyLimitedMode();
				} else {
					const self = this;
					const params = {
						buttons: {
							btnYes: this.aras.getResource('', 'common.ok'),
							btnCancel: this.aras.getResource('', 'common.cancel')
						},
						defaultButton: 'btnCancel',
						aras: this.aras,
						dialogWidth: 300,
						dialogHeight: 200,
						center: true,
						content: '../../../scripts/groupChgsDialog.html',
						message: VC.Utils.GetResource(
							'file_is_no_longer_available_switch_to_disabled_mode'
						)
					};

					ArasModules.Dialog.show('iframe', params).promise.then(function (
						res
					) {
						if (res !== 'btnYes') {
							return;
						}

						if (self.onActivateViewerInVersionedMode) {
							self.onActivateViewerInVersionedMode();
						}
					});
				}
			},

			applyLimitedMode: function () {
				VC.Utils.AlertWarning(
					VC.Utils.GetResource('file_is_no_longer_available')
				);
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
		})
	);
});
