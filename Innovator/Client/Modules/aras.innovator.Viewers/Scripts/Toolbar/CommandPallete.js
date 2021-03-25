VC.Utils.Page.LoadModules(['Toolbar/CommandToolBar', 'Interfaces/IColor']);

require(['dojo/_base/declare'], function (declare, lang) {
	return dojo.setObject(
		'VC.Toolbar.CommandPallete',
		dojo.declare([VC.Interfaces.IColor, VC.Toolbar.CommandToolbar], {
			isInitHandlers: false,
			colorButtons: null, // { "colorName1": CommandButton1, "colorName2": CommandButton2, ... }

			onOpen: function () {},
			onClose: function () {},

			constructor: function () {
				this.id = 'jsdialog' + VC.Utils.getTimestampString();

				this.colorButtons = {};

				// sets color with button click
				Object.defineProperty(this, 'color', {
					set: function (value) {
						this._currentColor = value;
						var button = this.colorButtons[this._currentColor];

						if (button) {
							button.onClick();
						}
					}
				});

				Object.defineProperty(this, 'rgbaColor', {
					get: function () {
						return this._currentColor
							? VC.Utils.convertHexToRGBA(this._currentColor, '0.5')
							: null;
					}
				});
			},

			show: function () {
				this.inherited(arguments);

				if (this.color === null) {
					this.color = this.defaultcolor;
				} else {
					var button = this.colorButtons[this.color];

					if (button) {
						button.onClick();
					}
				}
				this.onOpen();
			},

			hide: function () {
				this.inherited(arguments);
				this.onClose();
			},

			_onSelectColor: function (button) {
				for (var i in this.colorButtons) {
					var curButton = this.colorButtons[i];
					if (curButton.IsPressed) {
						curButton.SetPressedState(false);
					}
				}

				button.SetPressedState(true);
				var colorValue = this.getElementAttribute(
					button.commandBarItem,
					VC.Toolbar.CommandToolbar.AdditionalToolbarData.colorValue
				);

				this._currentColor = colorValue;
				this.onSelectColor();
			},

			addToolbarItem: function (toolbarItem, toolbarItemsInfo) {
				this.inherited(arguments);

				var id = toolbarItem.getId();
				var button = this[id];

				if (
					toolbarItemsInfo.initData &&
					toolbarItemsInfo.initData !== null &&
					toolbarItemsInfo.initData !== ''
				) {
					var widgetId = toolbarItem._item_Experimental.id;
					var widget = dijit.byId(widgetId);

					var additionalData = JSON.parse(toolbarItemsInfo.initData);

					var color = null;
					var defaultcolor = null;
					var colorValue =
						VC.Toolbar.CommandToolbar.AdditionalToolbarData.colorValue;
					var defaultColorValue =
						VC.Toolbar.CommandToolbar.AdditionalToolbarData.defaultColor;

					if (additionalData[colorValue]) {
						color = additionalData[colorValue];
						widget.set(colorValue, color);
					}
					if (additionalData[defaultColorValue]) {
						defaultcolor = additionalData[defaultColorValue];
						widget.set(defaultColorValue, defaultcolor);
					}

					if (color && color.indexOf('#') === 0) {
						if (defaultcolor) {
							this.defaultcolor = color;
						}

						button.onClick = dojo.partial(
							dojo.hitch(this, this._onSelectColor),
							button
						);
						this.colorButtons[color] = button;
					}
				}
			},

			assignElementStatesTo: function (targetPalette) {
				if (this.isOpened) {
					targetPalette.show(targetPalette.currentMode);
					this.assignColorTo(targetPalette);
				} else {
					targetPalette.hide();
				}
			}
		})
	);
});
