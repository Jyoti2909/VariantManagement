VC.Utils.Page.LoadModules(['Toolbar/CommandControl', 'Toolbar/TextBoxBase']);

dojo.setObject(
	'VC.Toolbar.CommandTextBox',
	dojo.declare([VC.Toolbar.CommandControl, VC.Toolbar.TextBoxBase], {
		constructor: function (commandBarItem) {
			this.eventName = 'onChange';
			this.commandBarEventName = this.id + 'Change';

			var textboxWidget = this.commandBarItem._item_Experimental;
			var width = textboxWidget.TextBox.style.width;
			var widthStyleTemplate = 'calc({0} + 2px)';

			VC.Utils.addClass(textboxWidget.TextBox, 'ToolbarTextBox');
			VC.Utils.addClass(textboxWidget.LabelAfter, 'ToolbarLabel');
			textboxWidget.TextBox.style.width = widthStyleTemplate.Format(width);

			Object.defineProperties(this, {
				textbox: {
					get: function () {
						return this.commandBarItem._item_Experimental.textbox;
					}
				},
				value: {
					get: function () {
						return this.commandBarItem.getText();
					},
					set: function (value) {
						this.commandBarItem.setText(value);
					}
				}
			});

			this.bindEvents();
		},

		setLabelAfter: function (value) {
			this.commandBarItem.setLabel(value, 'right');
		}
	})
);
