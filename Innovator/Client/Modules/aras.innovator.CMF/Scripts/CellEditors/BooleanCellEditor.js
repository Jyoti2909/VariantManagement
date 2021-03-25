define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/dom',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/form/CheckBox',
	'dojo/domReady!'
], function (declare, TooltipDialog, dom, on, keys, CellEditorBase) {
	var inputId = 'booleanCellEditorInput';
	var inputElement;

	return declare(CellEditorBase, {
		constructor: function () {
			this.tooltipDialog = new TooltipDialog({ id: 'booleanCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			//TODO: do not use textContent - bool should be
			var checked = !!cell.element.textContent;
			this.tooltipDialog.set(
				'content',
				"<input data-dojo-type='dijit/form/CheckBox' id='" +
					inputId +
					"'" +
					" checked='" +
					checked +
					"'>"
			);

			this.inherited(arguments); //popup.open

			inputElement = dom.byId(inputId);

			//disable browser's menu, e.g., on RMB click.
			inputElement.parentElement.parentElement.parentElement.parentElement.addEventListener(
				'contextmenu',
				function (menuEvent) {
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			inputElement.focus();

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
			return inputElement.checked ? 1 : 0;
		},

		formatter: function (value) {
			//TODO: move in configuration
			//TODO: not to forget: formatter shouldn't return undefined, because "undefined" user will see.
			return value == 1 ? '*' : '';
		}
	});
});
