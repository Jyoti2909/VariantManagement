VC.Utils.Page.LoadWidgets(['Moveable']);
VC.Utils.Page.LoadModules([
	'Toolbar/MainButton',
	'Toolbar/BasicToolbar',
	'Interfaces/ITContainer',
	'Managers/ViewStateManager'
]);

require([
	'dojo/_base/fx',
	'dojo/dom',
	'dojo/query',
	'dojo/dom-construct',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/mouse',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/aspect',
	'dojo/window',
	'dojo/dom-geometry',
	'dojo/_base/declare'
], function (
	baseFx,
	dom,
	query,
	domConstruct,
	lang,
	domStyle,
	mouse,
	on,
	_WidgetBase,
	_TemplatedMixin,
	aspect,
	winUtils,
	domGeometry,
	declare
) {
	function deselectAllButThis(btn, newcontext) {
		var context = this;
		if (!context._mainButtons) {
			context = newcontext;
		}

		if (context.isMooving) {
			alert();
		}
		for (var i in context._mainButtons) {
			var currBtn = context._mainButtons[i];
			if (currBtn.IsPressed && btn.id !== currBtn.id) {
				currBtn.deselect();
				currBtn.placeholder.hide();
			}
		}
	}

	function _findPreviousButton(mainButtons, index) {
		var keys = Object.keys(mainButtons);
		var buttonName = keys[index - 1];
		var previousButton = mainButtons[buttonName];

		return previousButton;
	}

	return dojo.setObject(
		'VC.Toolbar.TBasicContainer',
		declare([_WidgetBase, _TemplatedMixin, VC.Interfaces.ITContainer], {
			templateString:
				"<div data-dojo-attach-point='MainToolbarContainerMovable' style='position: absolute'>" +
				"<div class='MainToolbarContainer' data-dojo-attach-point='MainToolbarContainerNode'>" +
				"<div class='ContainerPanel' data-dojo-attach-point='ContainerPanel'></div>" +
				'</div>' +
				'</div>',
			_mainButtons: {},
			_container: null,
			_ownerContainer: null,

			self: this,

			btnView: null,
			btnMarkup: null,
			btnSwitch: null,

			activeMode: null,
			viewToolbar: null,
			markupToolbar: null,

			onBtnViewClick: function () {},
			onBtnMarkupClick: function () {},
			onBtnSwitchClick: function () {},

			ViewStateManager: null,

			constructor: function (parentContainerName) {
				Object.defineProperty(this, 'position', {
					get: function () {
						var x = 0;
						var y = 0;
						var left = this.domNode.style.left;
						var top = this.domNode.style.top;

						if (left && left !== '') {
							x = left.replace('px', '');
						}

						if (top && top !== '') {
							y = top.replace('px', '');
						}

						return { x: x, y: y };
					}
				});

				Object.defineProperty(this, 'height', {
					get: function () {
						return this.domNode.clientHeight;
					}
				});

				Object.defineProperty(this, 'width', {
					get: function () {
						return this.domNode.clientWidth;
					}
				});

				Object.defineProperty(this, 'container', {
					// 'container' is wrapper for 'MainToolbarContainer' of 'TBasicContainer'.
					get: function () {
						if (!this._container) {
							this._container = document.getElementById(this.containerName);
						}

						return this._container;
					}
				});

				Object.defineProperty(this, 'ownerContainer', {
					// 'ownerContainer' is top parent which represents viewable area of viewer
					get: function () {
						if (!this._ownerContainer) {
							this._ownerContainer = document.getElementsByClassName('Wrap')[0];
						}

						return this._ownerContainer;
					}
				});

				this._palettes = {};
				this.id = 'MainToolbarContainer' + VC.Utils.getTimestampString();

				var switchToolbar = new VC.Toolbar.BasicToolbar(
					'basic_' + VC.Utils.Enums.TNames.SwitchButtons
				);

				if (switchToolbar.btnBasicSwitch) {
					this.btnSwitch = switchToolbar.btnBasicSwitch;
					this.btnSwitch.relocate = function (newPlaceId) {
						var place = null;

						if (this.placeId) {
							place = document.getElementById(this.placeId);
							place.removeChild(this.domNode);
						}

						this.placeId = newPlaceId;
						place = document.getElementById(this.placeId);
						place.appendChild(this.domNode);
					};
				}
				this.ViewStateManager = new VC.ViewStateManager();

				switchToolbar.bindButtonBehaviour(
					VC.Utils.Enums.TButtonEvents.btnBasicSwitchClick,
					lang.hitch(this, this._onBtnSwitchClick)
				);
			},

			postCreate: function () {
				var moveable = new VC.Widgets.Moveable(
					this.ownerContainer,
					this.MainToolbarContainerMovable,
					this.ContainerPanel
				);

				aspect.after(
					moveable,
					'onMoveEnd',
					lang.hitch(this, 'onDragEnd'),
					true
				);
				this.placeAt(this.container);
				this.container.style.position = 'absolute';
				this.show();
			},

			_select: function (btn, runClick) {
				var previousButton = _findPreviousButton(this._mainButtons, btn.index);

				btn.select(runClick);
				deselectAllButThis(btn, this);

				btn.addBottomBorder();

				if (previousButton) {
					previousButton.deleteBottomBorder();
				}

				this.btnSwitch.relocate(btn.placeholder.domNode.id);
			},

			reposition: function () {
				var clientWidth = document.body.clientWidth;
				var clientHeight = document.body.clientHeight;

				var curPosition = domGeometry.position(this.domNode);
				var y = 0;
				var x = 0;

				if (curPosition.y > clientHeight) {
					y = clientHeight - this.domNode.clientHeight;
					if (y < 0) {
						y = 0;
					}
				} else if (VC.Utils.isIE11() || VC.Utils.isEdge()) {
					y = curPosition.y + 0.01;
				}
				domStyle.set(this.domNode, 'top', y + 'px');

				if (curPosition.x > clientWidth) {
					x = clientWidth - this.domNode.clientWidth;
					if (x < 0) {
						x = 0;
					}
				} else if (VC.Utils.isIE11() || VC.Utils.isEdge()) {
					x = curPosition.x + 0.01;
				}
				domStyle.set(this.domNode, 'left', x + 'px');
			},

			onDragEnd: function (e) {
				var viewport = winUtils.getBox(this.ownerDocument);
				var clientWidth = viewport.w;
				var clientHeight = viewport.h;

				if (this.domNode.offsetTop + this.domNode.clientHeight > clientHeight) {
					var y = clientHeight - this.domNode.clientHeight;
					if (y < 0) {
						y = 0;
					}
					dojo.style(this.domNode, 'top', y + 'px');
				}
				if (this.domNode.offsetLeft + this.domNode.clientWidth > clientWidth) {
					var x = clientWidth - this.domNode.clientWidth;
					if (x < 0) {
						x = 0;
					}
					dojo.style(this.domNode, 'left', x + 'px');
				}
				if (this.domNode.offsetLeft < 0) {
					dojo.style(this.domNode, 'left', 0 + 'px');
				}
				if (this.domNode.offsetTop < 0) {
					dojo.style(this.domNode, 'top', 0 + 'px');
				}
			},

			_getMainButtons: function () {
				var keys = Object.keys(this._mainButtons);
				var returnedArray = [];
				var buttonName = null;

				for (var i = 0; i < keys.length; i++) {
					buttonName = keys[i];
					returnedArray.push(this._mainButtons[buttonName]);
				}

				return returnedArray;
			},

			_addToMainButtons: function (btn) {
				btn.placeAt(this.MainToolbarContainerNode);
				this._mainButtons[btn] = btn;
				aspect.after(
					btn,
					'onClick',
					lang.partial(lang.hitch(this, this.toggleToolbars), btn),
					true
				);
			},

			toggleToolbars: function (btn) {
				if (!btn.IsDisable && btn.IsPressed) {
					if (btn.placeholder.isOpened) {
						btn.placeholder.hide();
					} else {
						btn.placeholder.show();
					}
				}
			},

			createViewToolbar: function (toolbarTypeName) {
				this.viewToolbar = new VC.Toolbar.BasicToolbar(
					'basic_' + toolbarTypeName
				);
				this.btnView = new VC.Toolbar.MainButton({
					src: VC.Utils.getBaseURL() + '/images/Navigate.svg',
					placeholder: this.viewToolbar,
					onClick: lang.hitch(this, this._onBtnViewClick)
				});
				this.btnView.onSelect = lang.partial(
					lang.hitch(this, this._select),
					this.btnView
				);
				this._addToMainButtons(this.btnView);
			},

			createMarkupToolbar: function (toolbarTypeName) {
				this.markupToolbar = new VC.Toolbar.BasicToolbar(
					'basic_' + toolbarTypeName
				);
				this.btnMarkup = new VC.Toolbar.MainButton({
					src: VC.Utils.getBaseURL() + '/images/Markup.svg',
					placeholder: this.markupToolbar,
					onClick: lang.hitch(this, this._onBtnMarkupClick)
				});
				this.btnMarkup.onSelect = lang.partial(
					lang.hitch(this, this._select),
					this.btnMarkup
				);
				this._addToMainButtons(this.btnMarkup);
			},

			createPalette: function (paletteName) {
				var returnedPalette = this._palettes[paletteName];

				if (!returnedPalette) {
					switch (paletteName) {
						case VC.Utils.Enums.Palettes.Scribble:
							VC.Utils.Page.LoadModules(['Widgets/ScribblePalleteDialog']);
							returnedPalette = new VC.Widgets.ScribblePalleteDialog();
							break;
						case VC.Utils.Enums.Palettes.Highlight:
							VC.Utils.Page.LoadModules(['Widgets/HighlightPalleteDialog']);
							returnedPalette = new VC.Widgets.HighlightPalleteDialog();
							break;
						case VC.Utils.Enums.Palettes.Label:
							VC.Utils.Page.LoadModules(['Widgets/LabelPalleteDialog']);
							returnedPalette = new VC.Widgets.LabelPalleteDialog();
							break;
						default:
							throw new Error('Could not create pallete ' + paletteName);
					}
					this.bindViewStateProcessing(paletteName, returnedPalette);
					this._palettes[paletteName] = returnedPalette;
				}

				return returnedPalette;
			},

			bindViewStateProcessing: function (paletteName, dialog) {
				var self = this;

				aspect.before(dialog, 'show', function () {
					var restoredValue = self.ViewStateManager.restoreViewStateParameter(
						'Markup.' +
							paletteName +
							'.' +
							VC.Utils.Enums.ViewStateParameters.Position
					);

					if (restoredValue !== null && restoredValue !== '') {
						dialog.position = JSON.parse(restoredValue);
					}
				});

				aspect.after(dialog, 'onMoveEnd', function () {
					var storedValue = JSON.stringify(dialog.position);

					self.ViewStateManager.saveViewStateParameter(
						'Markup.' +
							paletteName +
							'.' +
							VC.Utils.Enums.ViewStateParameters.Position,
						storedValue
					);
				});

				aspect.after(dialog, 'reposition', function () {
					var storedValue = JSON.stringify(dialog.position);

					self.ViewStateManager.saveViewStateParameter(
						'Markup.' +
							paletteName +
							'.' +
							VC.Utils.Enums.ViewStateParameters.Position,
						storedValue
					);
				});
			},

			show: function () {
				this.container.style.display = 'block';

				var position = this.position;
				var containerX = position.x;
				var containerY = position.y;
				var containerWidth = this.width;
				var containerHeight = this.height;

				if (
					containerX > this.ownerContainer.clientWidth - containerWidth ||
					containerY > this.ownerContainer.clientHeight - containerHeight
				) {
					this.reposition();
				}
			},

			hide: function () {
				this.container.style.display = 'none';
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
					palette.hide();
				}
			},

			repositionAllPalettes: function () {
				for (var paletteName in this._palettes) {
					if (this._palettes[paletteName].reposition) {
						this._palettes[paletteName].reposition();
					}
				}
			},

			refresh: function () {},

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
			}
		})
	);
});
