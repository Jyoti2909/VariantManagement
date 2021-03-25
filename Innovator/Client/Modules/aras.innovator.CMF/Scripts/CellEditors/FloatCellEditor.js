define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry',
	'dijit/form/ValidationTextBox'
], function (declare, TooltipDialog, on, keys, CellEditorBase, registry) {
	var inputId = 'floatCellEditorInput';
	var dojoEdito;
	var innovatorFloatPattern = 'float';
	var aras;
	var floatMaxCharacters = 16;
	var format;

	return declare(CellEditorBase, {
		constructor: function (arasObj) {
			aras = arasObj;
			format = aras.getDotNetDatePattern(innovatorFloatPattern);
			this.tooltipDialog = new TooltipDialog({ id: 'floatPropertyCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			var cellValue = cell.element.textContent;

			this.tooltipDialog.set(
				'content',
				'<input data-dojo-type="dijit/form/ValidationTextBox" data-dojo-props="invalidMessage: \'' +
					aras.getResource(
						'',
						'aras_object.value_property_invalid_must_be_float'
					) +
					"'\" type='text' id='" +
					inputId +
					"' value='" +
					cellValue +
					"'>"
			);

			this.inherited(arguments); //popup.open

			dojoEditor = registry.byId(inputId);

			//disable browser's menu, e.g., on RMB click.
			dojoEditor.domNode.parentElement.parentElement.parentElement.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			dojoEditor.textbox.focus();
			dojoEditor.textbox.select();
			dojoEditor.textbox.maxLength = floatMaxCharacters;
			dojoEditor.validator = function (value) {
				return !isNaN(value);
			};

			var self = this;

			var handler = on(dojoEditor.textbox, 'keydown', function (event) {
				switch (event.keyCode) {
					case keys.ENTER:
						if (self.isValueValid()) {
							onCellEditorClosed();
						}
						break;
					case keys.ESCAPE:
						onCellEditorClosed(true);
						break;
					case keys.TAB:
						if (self.isValueValid()) {
							onCellEditorClosed(false, true);
						}
						break;
				}
			});
			this.handlers.push(handler);
		},

		isValueValid: function () {
			return aras.isPropertyValueValid(
				{
					data_type: 'float',
					pattern: format
				},
				dojoEditor.textbox.value.trim(' ')
			);
		},

		getValue: function () {
			return dojoEditor.textbox.value.trim(' ');
		}
	});
});
