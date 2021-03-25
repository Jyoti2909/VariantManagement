define([
	'dojo/_base/declare',
	'dijit/TooltipDialog',
	'dojo/on',
	'dojo/keys',
	'./CellEditorBase',
	'dijit/registry',
	'dojo/store/Memory',
	'CMF/Scripts/PublicApi/PropertyItem',
	'CMF/Scripts/PublicApi/Element',
	'dijit/form/ComboBox',
	'dojo/domReady!'
], function (
	declare,
	TooltipDialog,
	on,
	keys,
	CellEditorBase,
	registry,
	Memory,
	PropertyItem,
	Element
) {
	var inputId = 'comboCellEditorInput';
	var aras = parent.aras;
	var dojoEditor;

	return declare(CellEditorBase, {
		constructor: function () {
			this.tooltipDialog = new TooltipDialog({ id: 'comboCellEditor' });
		},

		show: function (cell, onCellEditorClosed) {
			var value = cell.element.textContent;
			this.tooltipDialog.set(
				'content',
				"<input data-dojo-type='dijit/form/ComboBox' id='" +
					inputId +
					"'" +
					" value='" +
					value +
					"'>"
			);

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

			var methodName = cell.column.editorDataSourceMethod;
			var editorUseBoth = cell.column.editorUseBoth;
			var dataSourceReturn;
			var i;
			var j;
			var row;
			var z;
			var returnValue;
			var subRow;
			var subRowCell;
			var storeValues = [];
			var store = new Memory({});
			var gridData = cell.column.grid._renderedCollection.data;

			if (methodName) {
				var dataStore = cell.column.grid.qpGrid.dataStore;
				var tableItem = dataStore.getPropertyElement(cell.element.cellId);
				var treeItem = dataStore.getDocElement(tableItem.treeItemId);
				var element = new Element(treeItem, dataStore);
				var propertyItem = new PropertyItem(tableItem, element);
				dataSourceReturn = aras.evalMethod(methodName, '', {
					propertyItem: propertyItem
				});
				for (z = 0; z < dataSourceReturn.length; z++) {
					returnValue = dataSourceReturn[z];
					if (returnValue && storeValues.indexOf(returnValue) === -1) {
						storeValues.push(returnValue);
					}
				}
			}

			if ((editorUseBoth && editorUseBoth === '1') || !methodName) {
				for (i = 0; i < gridData.length; i++) {
					row = gridData[i];
					for (j = 0; j < row.subrs.length; j++) {
						subRow = row.subrs[j];
						subRowCell = subRow[cell.column.field];
						if (
							subRowCell &&
							subRowCell.value &&
							storeValues.indexOf(subRowCell.value) === -1
						) {
							storeValues.push(subRowCell.value);
						}
					}
				}
			}

			for (i = 0; i < storeValues.length; i++) {
				store.put({ name: storeValues[i] });
			}

			dojoEditor.set('store', store);

			this.inherited(arguments); //popup.open

			dojoEditor.textbox.focus();
			dojoEditor.textbox.select();

			if ((cell.column.dataType || '').toLowerCase() === 'integer') {
				dojoEditor.validator = function (value) {
					return parseInt(value, 10) == value || value.trim(' ') === '';
				};
			}

			var self = this;

			var handler = on(dojoEditor.domNode, 'keydown', function (event) {
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
			return dojoEditor.textbox.value;
		}
	});
});
