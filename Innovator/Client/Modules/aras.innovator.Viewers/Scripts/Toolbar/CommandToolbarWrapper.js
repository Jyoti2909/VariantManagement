VC.Utils.Page.LoadModules(['Toolbar/CommandToolbar']);

require([
	'dojo/_base/declare',
	'Aras/Client/Controls/Public/Toolbar'
], function (declare) {
	return dojo.setObject(
		'VC.Toolbar.CommandToolbarWrapper',
		(function () {
			var getSelectedDropdownValue = function (items) {
				var returnedValue = null;

				for (var item in items) {
					if (items[item].selected === true) {
						returnedValue = items[item].value;
					}
				}
				return returnedValue;
			};
			return declare('CommandToolbarWrapper', VC.Interfaces.IViewerToolbar, {
				id: null,
				prefix: null,
				toolbarContainer: null,
				elementsWithoutIdsCounter: null,

				constructor: function (containerName) {
					this.id = 'CommandToolbar';
					this.prefix = this.id + 'SALTkA7_Aras_';
					this.elementsWithoutIdsCounter = 0;
					this.toolbarContainer = new Aras.Client.Controls.Public.Toolbar({
						id: this.id,
						connectId: containerName,
						region: 'top'
					});

					var topWindow = aras.getMostTopWindowWithAras(window);
					topWindow.cui.initToolbarEvents(this.toolbarContainer);
				},

				addToolbarItem: function (toolbarItem, index) {
					var elementWidget = null;
					var additionalData = null;
					var elementPrefix = this.prefix + 'Tbi_';

					switch (toolbarItem.type) {
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarButton:
							elementWidget = this.toolbarContainer.addButton_Experimental(
								elementPrefix + toolbarItem.name,
								toolbarItem,
								index
							);

							if (
								toolbarItem.initData &&
								toolbarItem.initData !== null &&
								toolbarItem.initData !== ''
							) {
								additionalData = JSON.parse(toolbarItem.initData);
								var sizeValue =
									VC.Toolbar.CommandToolbar.AdditionalToolbarData.sizeValue;
								var defaultSize =
									VC.Toolbar.CommandToolbar.AdditionalToolbarData.defaultSize;
								var colorValue =
									VC.Toolbar.CommandToolbar.AdditionalToolbarData.colorValue;
								var defaultColor =
									VC.Toolbar.CommandToolbar.AdditionalToolbarData.defaultColor;

								if (additionalData[sizeValue]) {
									elementWidget._item_Experimental.set(
										sizeValue,
										additionalData[sizeValue]
									);
								}

								if (additionalData[defaultSize]) {
									elementWidget._item_Experimental.set(
										defaultSize,
										additionalData[defaultSize]
									);
								}

								if (additionalData[colorValue]) {
									elementWidget._item_Experimental.set(
										colorValue,
										additionalData[colorValue]
									);
								}

								if (additionalData[defaultColor]) {
									elementWidget._item_Experimental.set(
										defaultColor,
										additionalData[defaultColor]
									);
								}
							}
							break;
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarSeparator:
							elementWidget = this.toolbarContainer.addSeparator_Experimental(
								'CommandToolbarSALTkA7_Aras_Tbi_' + toolbarItem.name,
								index
							);
							break;
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarEdit:
							additionalData = JSON.parse(toolbarItem.initData);
							toolbarItem.text = additionalData.text;
							toolbarItem.size = additionalData.size;
							toolbarItem.textboxType = additionalData.textbox_type;
							toolbarItem.placeholder = additionalData.cui_placeholder;

							elementWidget = this.toolbarContainer.addTextBox_Experimental(
								'CommandToolbarSALTkA7_Aras_Tbi_' + toolbarItem.name,
								toolbarItem,
								index
							);
							break;
						case VC.Utils.Enums.CommandBarItemTypes.CommandBarDropDown:
							elementWidget = this.initDropDownItem(toolbarItem, index);

							if (
								toolbarItem.initData &&
								toolbarItem.initData !== null &&
								toolbarItem.initData !== ''
							) {
								var showLabel =
									VC.Toolbar.CommandToolbar.AdditionalToolbarData.showLabel;
								additionalData = JSON.parse(toolbarItem.initData);
								elementWidget._item_Experimental.set(
									showLabel,
									additionalData[showLabel]
								);
							}
							break;
					}

					return elementWidget;
				},

				initDropDownItem: function (toolbarItem, index) {
					var items = null;
					var selectedValue = null;
					var elementWidget = null;

					if (toolbarItem.onInitHandler !== '') {
						items = toolbarItem.onInitHandler().cui_items;
						selectedValue = getSelectedDropdownValue(items);
					}

					elementWidget = this.toolbarContainer.addChoice_Experimental(
						'CommandToolbarSALTkA7_Aras_Tbi_' + toolbarItem.name,
						toolbarItem.label,
						items,
						index
					);

					if (selectedValue) {
						elementWidget.setSelected(selectedValue);
					}

					return elementWidget;
				}
			});
		})()
	);
});
