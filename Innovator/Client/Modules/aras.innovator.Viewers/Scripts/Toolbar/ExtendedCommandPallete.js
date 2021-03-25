VC.Utils.Page.LoadModules(['Toolbar/CommandPallete', 'Interfaces/ISize']);

require(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return dojo.setObject(
		'VC.Toolbar.ExtendedCommandPallete',
		dojo.declare([VC.Toolbar.CommandPallete, VC.Interfaces.ISize], {
			sizeButtons: null, // { "sizeName1": CommandButton1, "sizeName2": CommandButton2, ... }

			onOpen: function () {},

			constructor: function () {
				this.sizeButtons = {};

				Object.defineProperty(this, 'size', {
					set: function (value) {
						this._currentSize = value;
						var button = this.sizeButtons[this._currentSize];

						if (button) {
							button.onClick();
						}
					}
				});
			},

			show: function () {
				this.inherited(arguments);

				if (this.size === null) {
					this.size = this.defaultsize;
				} else {
					var button = this.sizeButtons[this.size];

					if (button) {
						button.onClick();
					}
				}
				this.onOpen();
			},

			sizeButtonClick: function (button) {
				for (var i in this.sizeButtons) {
					var curButton = this.sizeButtons[i];
					if (curButton.IsPressed) {
						curButton.SetPressedState(false);
					}
				}

				button.SetPressedState(true);
				this._currentSize = this.getElementAttribute(
					button.commandBarItem,
					VC.Toolbar.CommandToolbar.AdditionalToolbarData.sizeValue
				);
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

					var size = null;
					var defaultsize = null;
					var sizeValue =
						VC.Toolbar.CommandToolbar.AdditionalToolbarData.sizeValue;
					var defaultSizeValue =
						VC.Toolbar.CommandToolbar.AdditionalToolbarData.defaultSize;

					if (additionalData[sizeValue]) {
						size = additionalData[sizeValue];
						widget.set(sizeValue, size);
					}
					if (additionalData[defaultSizeValue]) {
						defaultsize = additionalData[defaultSizeValue];
						widget.set(defaultSizeValue, defaultsize);
					}

					if (size) {
						if (defaultsize) {
							this.defaultsize = size;
						}

						aspect.after(
							button,
							'onClick',
							dojo.partial(dojo.hitch(this, this.sizeButtonClick), button),
							true
						);
						this.sizeButtons[size] = button;
					}
				}
			},

			assignElementStatesTo: function (targetPalette) {
				this.inherited(arguments);
				this.assignSizeTo(targetPalette);
			}
		})
	);
});
