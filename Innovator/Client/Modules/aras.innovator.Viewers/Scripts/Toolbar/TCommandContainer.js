VC.Utils.Page.LoadModules([
	'Interfaces/ITContainer',
	'Toolbar/CommandButton',
	'Toolbar/CommandToolbarWrapper',
	'Toolbar/CommandPallete',
	'Toolbar/ExtendedCommandPallete'
]);

require(['dojo/aspect'], function (aspect) {
	return dojo.setObject(
		'VC.Toolbar.TCommandContainer',
		(function () {
			return dojo.declare('TCommandContainer', VC.Interfaces.ITContainer, {
				btnView: null,
				btnMarkup: null,
				btnSwitch: null,

				activeMode: null,
				viewToolbar: null,
				markupToolbar: null,

				onBtnViewClick: function () {},
				onBtnMarkupClick: function () {},
				onBtnSwitchClick: function () {},

				toolbarWrapper: null,
				_palettes: null,
				_preloadedToolbars: null,

				constructor: function (parentContainerName) {
					this._palettes = {};
					this.toolbarWrapper = new VC.Toolbar.CommandToolbarWrapper(
						this.containerName
					);
					this._preloadedToolbars = this._preloadToolbars();

					var mainToolbar = this._preloadedToolbars.mainToolbar;
					var switchToolbar = this._preloadedToolbars.switchToolbar;

					if (mainToolbar.btnView) {
						this.btnView = mainToolbar.btnView;
						this.btnView.onSelect = dojo.hitch(this, function () {
							this.btnView.select();
							this.btnMarkup.deselect();
						});
					}

					if (mainToolbar.btnMarkup) {
						this.btnMarkup = mainToolbar.btnMarkup;
						this.btnMarkup.onSelect = dojo.hitch(this, function () {
							this.btnView.deselect();
							this.btnMarkup.select();
						});
					}

					if (switchToolbar.btnSwitch) {
						this.btnSwitch = switchToolbar.btnSwitch;
					}

					mainToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnViewClick,
						dojo.hitch(this, this._onBtnViewClick)
					);
					mainToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnMarkupClick,
						dojo.hitch(this, this._onBtnMarkupClick)
					);
					switchToolbar.bindButtonBehaviour(
						VC.Utils.Enums.TButtonEvents.btnSwitchClick,
						dojo.hitch(this, this._onBtnSwitchClick)
					);

					aspect.after(
						this.btnView,
						'onClick',
						dojo.partial(dojo.hitch(this, this.toggleToolbar), this.btnView),
						true
					);
					aspect.after(
						this.btnMarkup,
						'onClick',
						dojo.partial(dojo.hitch(this, this.toggleToolbar), this.btnMarkup),
						true
					);

					var mainContainer = document.getElementById(this.containerName);
					mainContainer.style.zIndex = '10111';
					mainContainer.style.position = 'fixed';
					mainContainer.style.width = '100%';

					mainToolbar.show();
					switchToolbar.show();
				},

				createViewToolbar: function (toolbarTypeName) {
					this.viewToolbar = new VC.Toolbar.CommandToolbar(
						this.toolbarWrapper,
						toolbarTypeName
					);
					this._proccessToolbarItems(this.viewToolbar);
					this.btnView.placeholder = this.viewToolbar;
				},

				createMarkupToolbar: function (toolbarTypeName) {
					this.markupToolbar = this._preloadedToolbars.markupToolbar;
					this.btnMarkup.placeholder = this.markupToolbar;
				},

				createPalette: function (paletteName) {
					var returnedPalette = this._palettes[paletteName];

					if (!returnedPalette) {
						throw new Error(
							paletteName + ' should be added in _preloadToolbars'
						);
					}

					return returnedPalette;
				},

				palettes: function () {
					return this._palettes;
				},

				show: function () {
					var container = document.getElementById(this.containerName);
					container.visible(true);
				},

				hide: function () {
					var container = document.getElementById(this.containerName);
					container.visible(false);
				},

				toggleToolbar: function (button) {
					if (button.isCancelled) {
						button.isCancelled = false;
						return;
					}

					this._closePalettes();
					this.viewToolbar.hide();
					this.markupToolbar.hide();

					button.placeholder.show();
				},

				setActiveMode: function (mode) {
					this.activeMode = mode;

					switch (this.activeMode) {
						case VC.Utils.Enums.ViewerViewMode.View:
							this.btnView.select();
							this.viewToolbar.show();
							break;
						case VC.Utils.Enums.ViewerViewMode.Markup:
							this.btnMarkup.select();
							this.markupToolbar.show();
							break;
					}
				},

				closePalette: function (paletteName) {
					var palette = this._palettes[paletteName];

					if (palette) {
						palette.hide();
					}
				},

				closeAllPalettesButThis: function (paletteId) {
					var palette = null;
					for (var paletteName in this._palettes) {
						palette = this._palettes[paletteName];
						if (palette.id === paletteId) {
							continue;
						}
						if (palette.isOpened) {
							palette.hide();
						}
					}
				},

				refresh: function () {
					this.toolbarWrapper.toolbarContainer.refreshToolbar_Experimental();

					var id = this.toolbarWrapper.prefix + '$EmptyClassification_toolbar';
					var dropdown = document.getElementById(id);

					if (dropdown && dropdown.parentNode) {
						dropdown.parentNode.visible(false);
					}
				},

				_onBtnViewClick: function () {
					if (this.btnView.IsDisable) {
						return;
					}
					this.onBtnViewClick();
				},

				_onBtnMarkupClick: function () {
					if (this.btnMarkup.IsDisable) {
						return;
					}
					this.onBtnMarkupClick();
				},

				_onBtnSwitchClick: function () {
					this.onBtnSwitchClick();
				},

				_createSectionContainer: function (id) {
					var mainContainer = document.getElementById(this.containerName);
					var container = document.createElement('div');

					container.id = id;
					container.style.display = 'table-cell';
					mainContainer.appendChild(container);

					return container;
				},

				_closePalettes: function () {
					for (var palette in this._palettes) {
						if (this._palettes[palette].isOpened) {
							this._palettes[palette].hide();
						}
					}
				},

				_preloadToolbars: function () {
					var mainToolbar = new VC.Toolbar.CommandToolbar(
						this.toolbarWrapper,
						VC.Utils.Enums.TNames.MainButtons
					);
					var markupToolbar = new VC.Toolbar.CommandToolbar(
						this.toolbarWrapper,
						VC.Utils.Enums.TNames.MarkupViewerToolbar
					);
					var scribbleToolbar = new VC.Toolbar.ExtendedCommandPallete(
						this.toolbarWrapper,
						VC.Utils.Enums.Palettes.Scribble
					);
					var highlightToolbar = new VC.Toolbar.CommandPallete(
						this.toolbarWrapper,
						VC.Utils.Enums.Palettes.Highlight
					);
					var labelToolbar = new VC.Toolbar.ExtendedCommandPallete(
						this.toolbarWrapper,
						VC.Utils.Enums.Palettes.Label
					);
					var extendedMarkupToolbar = new VC.Toolbar.CommandToolbar(
						this.toolbarWrapper,
						VC.Utils.Enums.TNames.ExtendedMarkupViewerToolbar
					);
					var switchToolbar = new VC.Toolbar.CommandToolbar(
						this.toolbarWrapper,
						VC.Utils.Enums.TNames.SwitchButtons
					);
					var currentInfo = null;

					for (
						var i = 0;
						i < extendedMarkupToolbar.toolbarItemsInfo.length;
						i++
					) {
						currentInfo = extendedMarkupToolbar.toolbarItemsInfo[i];
						markupToolbar.toolbarItemsInfo.push(currentInfo);
					}

					var collectibleArray = [];
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(mainToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(markupToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(scribbleToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(highlightToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(labelToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(extendedMarkupToolbar.commandBarItems)
					);
					collectibleArray = collectibleArray.concat(
						Array.prototype.slice.call(switchToolbar.commandBarItems)
					);

					var topWindow = aras.getMostTopWindowWithAras(window);
					var contextParams = {
						locationName: this.toolbarWrapper.id,
						toolbarApplet: this.toolbarWrapper.toolbarContainer
					};

					contextParams.items = collectibleArray;
					topWindow.cui.loadToolbarFromCommandBars(contextParams);
					this.toolbarWrapper.toolbarContainer.show();

					mainToolbar.constructToolbarElements();
					switchToolbar.constructToolbarElements();
					markupToolbar.constructToolbarElements();
					scribbleToolbar.constructToolbarElements();
					highlightToolbar.constructToolbarElements();
					labelToolbar.constructToolbarElements();

					mainToolbar.hide();
					switchToolbar.hide();
					markupToolbar.hide();
					scribbleToolbar.hide();
					highlightToolbar.hide();
					labelToolbar.hide();

					this._palettes[VC.Utils.Enums.Palettes.Scribble] = scribbleToolbar;
					this._palettes[VC.Utils.Enums.Palettes.Highlight] = highlightToolbar;
					this._palettes[VC.Utils.Enums.Palettes.Label] = labelToolbar;

					return {
						mainToolbar: mainToolbar,
						switchToolbar: switchToolbar,
						markupToolbar: markupToolbar
					};
				},

				_proccessToolbarItems: function (toolbar) {
					var currentItemInfo = null;
					var currentToolbarItem = null;
					var insertedIndex = this._preloadedToolbars.mainToolbar
						? this._preloadedToolbars.mainToolbar.toolbarItemsInfo.length
						: undefined;

					for (var i = toolbar.toolbarItemsInfo.length - 1; i >= 0; i--) {
						currentItemInfo = toolbar.toolbarItemsInfo[i];
						currentToolbarItem = this.toolbarWrapper.addToolbarItem(
							currentItemInfo,
							insertedIndex
						);
						toolbar.addToolbarItem(currentToolbarItem, currentItemInfo);
						this.toolbarWrapper.toolbarContainer.hideItem(currentItemInfo.name);
					}
				}
			});
		})()
	);
});
