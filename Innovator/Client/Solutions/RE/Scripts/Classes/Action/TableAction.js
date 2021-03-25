define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/TableAction',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
],
function(declare, TechDocTableAction, Enums) {
	return declare('Aras.Client.Controls.Requirement.Action.TableAction', [TechDocTableAction], {
		GetTablesMenu: function(/*WrappedObject*/ targetElement) {
			var elementMenu;

			if (targetElement.is('ArasTableXmlSchemaElement')) {
				elementMenu = {table: {
					id: 'table:add',
					name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.table'),
					priority: 11,
					subMenu: [
						{id: 'table:addrow', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.addrow')},
						{id: 'table:addcolumn', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.addcolumn')}
					]}};
			} else if (targetElement.is('ArasRowXmlSchemaElement')) {
				elementMenu = {
					append: {id: 'table:append', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.add'), priority: 11, subMenu: [
						{
							id: 'table:appendrow',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.row'),
							icon: '../../images/TableRow.svg'
						}]
					},
					table: {
						id: 'table:add',
						name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.table'),
						priority: 12,
						subMenu: [{
							id: 'table:removerow',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.removerow')
						}]
					},
					wrapping: {id: 'group', name: this.actionsHelper.viewActions.group.title, priority: 13}
				};
			} else if (targetElement.is('ArasCellXmlSchemaElement')) {
				var parentTable = targetElement.GetTable();

				elementMenu = {
					table: {
						id: 'table:add',
						name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.table'),
						priority: 11,
						subMenu: [
							{id: 'table:addrow', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.addrow')},
							{id: 'table:addcolumn', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.addcolumn')},
							{id: 'table:removerow', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.removerow')},
							{id: 'table:removecolumn', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.removecolumn')}
						]
					}
				};

				if (parentTable) {
					var mergeMatrix = parentTable._GetMergeMatrix();
					var rowItem = targetElement.Parent;
					var rowIndex = parentTable._GetRowIndex(rowItem);
					var columnIndex = rowItem.ChildItems().index(targetElement);
					var aroundMatrix = mergeMatrix._BiuldArroundMatrix(rowIndex, columnIndex);

					elementMenu.table.subMenu.push({
						id: 'table:merge',
						name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.merge'),
						priority: 13,
						subMenu: [{
							id: 'table:mergeleft',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.withleftcolumn'),
							disable: !mergeMatrix.ValidateMerge(rowIndex, columnIndex, 'left')
						},
						{
							id: 'table:mergeright',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.withrightcolumn'),
							disable: !mergeMatrix.ValidateMerge(rowIndex, columnIndex, 'right')
						},
						{
							id: 'table:mergetop',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.withrowabove'),
							disable: !mergeMatrix.ValidateMerge(rowIndex, columnIndex, 'top')
						},
						{
							id: 'table:mergebot',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.withrowbelow'),
							disable: !mergeMatrix.ValidateMerge(rowIndex, columnIndex, 'bot')
						}
						]
					});

					if (aroundMatrix.w > 1 || aroundMatrix.h > 1) {
						elementMenu.table.subMenu.push({
							id: 'table:unmerge',
							name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.unmerge'),
							priority: 14
						});
					}
				}
			}

			return elementMenu || {};
		},

		getCreateSiblingMenu: function(/*WrappedObject*/ targetElement) {
			if (targetElement.is('ArasRowXmlSchemaElement')) {
				return [
					{id: 'table:appendrow', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.row'), icon: '../../images/TableRow.svg'}
				];
			}
		},

		_CallAction_table: function(createTableHelper) {
			var selectedItem = this.contextObject;

			if (selectedItem) {
				var direction = createTableHelper && createTableHelper.direction;
				var element = createTableHelper && createTableHelper.newElementName;
				var schemaHelper = this._viewmodel.Schema();

				if (!direction || !element) {
					var expetedElements = schemaHelper.GetExpectedElements(selectedItem);
					var insertList = expetedElements.insert;
					var appendList = expetedElements.append;
					var type;
					var i;

					if (!direction || direction == 'insert') {
						for (i = 0; i < insertList.length; i++) {
							element = insertList[i];
							type = schemaHelper.GetSchemaElementType(element);

							if ((type & Enums.XmlSchemaElementType.Table) == Enums.XmlSchemaElementType.Table) {
								direction = 'insert';
								break;
							}
						}
					}

					if (!direction || direction == 'append') {
						for (i = 0; i < appendList.length; i++) {
							element = appendList[i];
							type = schemaHelper.GetSchemaElementType(element);

							if ((type & Enums.XmlSchemaElementType.Table) == Enums.XmlSchemaElementType.Table) {
								direction = 'append';
								break;
							}
						}
					}
				}

				if (direction && element) {
					var param = {
						title: 'Attributes Dialog',
						formId: 'C25EF9D09C844CF99E2FFC4BB19D3B28', // tp_AddTable Form
						aras: this.aras,
						isEditMode: true,
						dialogWidth: 250,
						dialogHeight: 100,
						content: 'ShowFormAsADialog.html'
					};

					this.actionsHelper.topWindow.ArasModules.Dialog.show('iframe', param).promise.then(
						function(result) {
							if (result) {
								var createTableInfo = {};
								createTableInfo.direction = direction;
								createTableInfo.newElementName = element;

								if (this._updateClassification) {
									this._updateClassification({
										newElementName: createTableInfo.newElementName,
										contextObject: this.contextObject,
										xmlSchemaElements: schemaHelper._xmlSchemaElements
									});
								}

								this._GenerateNewTable(result.cols, result.rows, createTableInfo);
							}
						}.bind(this)
					);
				} else {
					this.aras.AlertError(this.aras.getResource('../Modules/aras.innovator.TDF', 'action.cannot_table_here'));
				}
			}
		},

		_GenerateNewTable: function(colsNum, rowsNum, helper) {
			var selectedItem = this.contextObject;
			var newElementName = helper.newElementName;
			var newTableElement = this._viewmodel.CreateElement('element', {type: newElementName});
			var direction = helper.direction;

			switch (direction) {
				case 'insert':
					selectedItem.ChildItems().insertAt(0, newTableElement);
					break;
				case 'append':
					var indexInParent = selectedItem.Parent.ChildItems().index(selectedItem);
					selectedItem.Parent.ChildItems().insertAt(indexInParent + 1, newTableElement);
					break;
			}

			newTableElement.GenerateTableBody(colsNum, rowsNum);
			this._viewmodel.focusElement(newTableElement, true);
		}
	});
});
