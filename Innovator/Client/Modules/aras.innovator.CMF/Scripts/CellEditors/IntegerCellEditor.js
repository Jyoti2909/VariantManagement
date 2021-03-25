define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry',
	'dijit/form/ValidationTextBox'
], function (declare, TooltipDialog, on, keys, CellEditorBase, registry) {
	var inputId = 'intCellEditorInput';
	var dojoEditor;
	var INTEGER_MAX_VALUE = Math.pow(2, 31) - 1;
	var INTEGER_MIN_VALUE = -Math.pow(2, 31);

	return declare(CellEditorBase, {
		constructor: function () {
			this.tooltipDialog = new TooltipDialog({ id: 'propertyCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			var cellValue = cell.element.textContent;

			this.tooltipDialog.set(
				'content',
				'<input data-dojo-type="dijit/form/ValidationTextBox" data-dojo-props="invalidMessage: \'' +
					CMF.Utils.getResource('invalid_integer') +
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
			dojoEditor.validator = function (value) {
				var x = parseInt(value, 10);
				//Server can't accept value larger than 2^31 (int)
				//Don't use Number.MAX_VALUE and Number.MIN_VALUE because in the Javascript Number is a 64-bit floating point value,
				//where the largest exact integral value is 2^53.
				return (
					(x == value && x <= INTEGER_MAX_VALUE && x >= INTEGER_MIN_VALUE) ||
					value.trim(' ') === ''
				);
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
			return dojoEditor.validate();
		},

		getValue: function () {
			return dojoEditor.textbox.value.trim(' ');
		}
	});
});
