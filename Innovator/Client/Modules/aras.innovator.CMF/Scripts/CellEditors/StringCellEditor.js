define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/dom',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase'
], function (declare, TooltipDialog, dom, on, keys, CellEditorBase) {
	var inputId = 'stringCellEditorInput';
	var inputElement;

	return declare(CellEditorBase, {
		constructor: function () {
			this.tooltipDialog = new TooltipDialog({ id: 'stringCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			var maxLength = cell.column.maxLength || '';
			var value = cell.element.textContent;

			this.tooltipDialog.set(
				'content',
				"<input type='text' maxLength='" +
					maxLength +
					"' id='" +
					inputId +
					"' " +
					"value='" +
					value +
					"'>"
			);

			this.inherited(arguments); //popup.open

			inputElement = dom.byId(inputId);

			//disable browser's menu, e.g., on RMB click.
			inputElement.parentElement.parentElement.parentElement.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			inputElement.focus();
			inputElement.select();

			var handler = on(inputElement, 'keydown', function (event) {
				switch (event.keyCode) {
					case keys.ENTER:
						onCellEditorClosed();
						break;
					case keys.ESCAPE:
						onCellEditorClosed(true);
						break;
					case keys.TAB:
						onCellEditorClosed(false, true);
						break;
				}
			});
			this.handlers.push(handler);
		},

		getValue: function () {
			return inputElement.value;
		}
	});
});
