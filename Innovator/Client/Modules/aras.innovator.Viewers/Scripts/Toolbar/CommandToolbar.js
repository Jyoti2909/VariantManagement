//dojo.require("Aras/Client/Controls/Public/Toolbar");

VC.Utils.Page.LoadModules([
	'Interfaces/IViewerToolbar',
	'Toolbar/CommandNumberTextBox',
	'Toolbar/CommandDropDown'
]);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Toolbar.CommandToolbar',
		(function () {
			var textboxTypes = {
				number: 'number',
				zoom: 'zoom'
			};

			return declare('CommandToolbar', VC.Interfaces.IViewerToolbar, {
				name: null,
				toolbarWrapper: null,
				toolbarItemsInfo: null,
				commandBarItems: null,

				constructor: function (toolbarApplet, toolbarTypeName) {
					Object.defineProperty(this, 'toolbar', {
						get: function () {
							return this.toolbarWrapper.toolbarContainer;
						}
					});

					this.toolbarItemsInfo = [];
					this.commandBarItems = [];
					this.toolbarWrapper = toolbarApplet;
					this.name = toolbarTypeName;

					var topWindow = aras.getMostTopWindowWithAras(window);
					var contextParams = { locationName: toolbarTypeName };
					this.commandBarItems = topWindow.cui.dataLoader.loadCommandBar(
						contextParams.locationName,
						contextParams
					);
					this.parseCommandBarItems(this.commandBarItems);

					clientControlsFactory.on(this.toolbar, {
						onClick: dojo.hitch(this, this.onToolbarItemEvent),
						onChange: dojo.hitch(this, this.onToolbarItemEvent)
					});
				},

				parseCommandBarItems: function (items) {
					var currentItem = null;
					var totalCount = items.length;
					var idValue = null;
					var topWindow = aras.getMostTopWindowWithAras(window);
					var initHandlers = topWindow.cui.dataLoader.utils.prepareInitHandlers(
						items
					);

					for (var i = 0; i < totalCount; i++) {
						currentItem = items[i];
						idValue = currentItem.getAttribute('id');

						var toolbarItem = {
							idx: idValue,
							type: currentItem.getAttribute('type'),
							name: currentItem.selectSingleNode('name').text,
							label: currentItem.selectSingleNode('label')
								? currentItem.selectSingleNode('label').text
								: '',
							tooltip: currentItem.selectSingleNode('tooltip_template')
								? currentItem.selectSingleNode('tooltip_template').text
								: '',
							sortOrder: currentItem.selectSingleNode('sort_order').text,
							initData: currentItem.selectSingleNode('additional_data')
								? currentItem.selectSingleNode('additional_data').text
								: '',
							image: currentItem.selectSingleNode('image')
								? currentItem.selectSingleNode('image').text
								: '',
							onInitHandler: initHandlers[idValue] ? initHandlers[idValue] : ''
						};

						aras.setItemProperty(
							currentItem,
							'item_classification',
							this.toolbarWrapper.id
						);

						if (toolbarItem.name === 'tlbSeparator') {
							this.toolbarWrapper.elementsWithoutIdsCounter++;
							toolbarItem.name =
								'emptyId_' + this.toolbarWrapper.elementsWithoutIdsCounter;
						}

						this.toolbarItemsInfo.push(toolbarItem);
					}
				},

				constructToolbarElements: function () {
					var currentItem = null;

					for (var i = 0; i < this.toolbarItemsInfo.length; i++) {
						currentItem = this.toolbar.getItem(this.toolbarItemsInfo[i].name);
						this.addToolbarItem(currentItem, this.toolbarItemsInfo[i]);
					}
				},

				addToolbarItem: function (toolbarItem, toolbarItemsInfo) {
					var commandControl = null;

					switch (toolbarItemsInfo.type) {
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarButton:
							commandControl = new VC.Toolbar.CommandButton(toolbarItem);
							break;
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarEdit:
							commandControl = new VC.Toolbar.CommandNumberTextBox(toolbarItem);
							var textboxType = this.getElementAttribute(
								toolbarItem,
								VC.Toolbar.CommandToolbar.AdditionalToolbarData.textboxType
							);

							if (textboxType === textboxTypes.zoom) {
								commandControl.textFormat = '{0}%';
							}
							break;
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarDropDown:
							var showLabel = this.getElementAttribute(
								toolbarItem,
								VC.Toolbar.CommandToolbar.AdditionalToolbarData.showLabel
							);
							commandControl = new VC.Toolbar.CommandDropDown(
								toolbarItem,
								toolbarItemsInfo.label,
								showLabel
							);
							break;
					}
					if (commandControl) {
						commandControl.bindEvent(dojo.hitch(this, this._onFireEvent));
						this[commandControl.id] = commandControl;
						this[commandControl.commandBarEventName] = function () {};
					}
				},

				bindButtonBehaviour: function (btnEventName, eventHandler) {
					if (this[btnEventName]) {
						this[btnEventName] = eventHandler;
					}
				},

				enableBtn: function (btnName) {
					var button = this.toolbar.getItem(btnName);

					if (button) {
						button.setEnabled(true);
					}
				},

				disableBtn: function (btnName) {
					var button = this.toolbar.getItem(btnName);

					if (button) {
						button.setEnabled(false);
					}
				},

				pressBtn: function (btnName) {},

				unpressBtn: function (btnName) {},

				show: function () {
					for (var i = 0; i < this.toolbarItemsInfo.length; i++) {
						this.toolbar.showItem(this.toolbarItemsInfo[i].name);
					}
					this.isOpened = true;
				},

				hide: function () {
					for (var i = 0; i < this.toolbarItemsInfo.length; i++) {
						this.toolbar.hideItem(this.toolbarItemsInfo[i].name);
					}
					this.isOpened = false;
				},

				onToolbarItemEvent: function (toolbarItem) {
					var toolbarItemId = toolbarItem.getId();
					var toolbarElement = this[toolbarItemId];

					if (
						toolbarElement &&
						toolbarElement.onClick &&
						toolbarItem.getEnabled()
					) {
						toolbarElement.onClick();
					}
					if (
						toolbarElement &&
						toolbarElement.onChange &&
						toolbarItem.getEnabled()
					) {
						toolbarElement.onChange();
					}
				},

				getElementAttribute: function (element, attributeName) {
					var widgetId = element._item_Experimental.id;
					var widget = dijit.byId(widgetId);
					var attributeValue = widget.get(attributeName);

					return attributeValue;
				},

				assignElementStatesTo: function (targetToolbar) {
					var buttonName = null;

					for (var i = 0; i < this.toolbarItemsInfo.length; i++) {
						buttonName = this.toolbarItemsInfo[i].name;

						if (this[buttonName] && targetToolbar[buttonName]) {
							this[buttonName].assignStateTo(targetToolbar[buttonName]);
						}
					}
				},

				_onFireEvent: function (eventname) {
					if (this[eventname]) {
						this[eventname]();
					}
				}
			});
		})()
	);
});

VC.Toolbar.CommandToolbar.AdditionalToolbarData = {
	colorValue: 'color_value',
	sizeValue: 'size_value',
	defaultColor: 'default_color_value',
	defaultSize: 'default_size_value',
	textboxType: 'textbox_type',
	showLabel: 'show_label'
};
