VC.Utils.Page.LoadModules(['Toolbar/CommandControl']);

require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Toolbar.CommandDropDown',
		(function () {
			return declare('CommandDropDown', [VC.Toolbar.CommandControl], {
				onChange: function () {},

				constructor: function (commandBarItem, label, showLabel) {
					// by default the dropdown should display with label
					showLabel = showLabel === false ? showLabel : true;
					this.eventName = 'onChange';
					this.commandBarEventName = this.id + 'Change';

					var dropDownWidget = this.commandBarItem._item_Experimental;
					var dropDownNode = dropDownWidget.domNode.getElementsByTagName(
						'table'
					);
					if (dropDownNode.length > 0) {
						dropDownNode[0].style.minHeight = '15px';
					}

					Object.defineProperties(this, {
						selectedItem: {
							get: function () {
								return this.commandBarItem.getSelectedItem();
							}
						},
						selectedIndex: {
							get: function () {
								return this.commandBarItem.getSelectedIndex();
							}
						}
					});
					if (showLabel) {
						this.setLabelBefore(label);
					}
				},

				Enable: function () {
					this.commandBarItem.setEnabled(true);
				},

				Disable: function () {
					this.commandBarItem.setEnabled(false);
				},

				setLabelBefore: function (value) {
					this.commandBarItem._item_Experimental.LabelBefore.innerHTML = value;
				},

				addOptions: function (options) {
					if (options && options.length) {
						for (i = 0; i < options.length; i++) {
							option = options[i];
							this.commandBarItem._item_Experimental.addOption({
								value: option.value,
								label: option.label,
								selected: option.selected
							});
						}
					}
				},

				addOption: function (value, label, selected) {
					this.commandBarItem._item_Experimental.addOption({
						value: value,
						label: label,
						selected: selected
					});
				},

				removeOption: function (value) {
					this.commandBarItem._item_Experimental.removeOption(value);
				},

				removeAllOptionsButThis: function (name) {
					var options = this.commandBarItem._item_Experimental.options;
					for (i = 0; i < options.length; i++) {
						if (options[i].value !== name) {
							this.commandBarItem._item_Experimental.removeOption(
								options[i].value
							);
						}
					}
				},

				setSelectedValue: function (value) {
					this.commandBarItem._item_Experimental.set('value', value);
				}
			});
		})()
	);
});
