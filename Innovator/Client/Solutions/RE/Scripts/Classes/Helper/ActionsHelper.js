define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ActionsHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
	'RE/Scripts/Classes/Action/VersionElementAction',
	'RE/Scripts/Classes/Action/TableAction',
	'RE/Scripts/Classes/Action/AppendExistingRequirementAction',
	'RE/Scripts/Classes/Action/ReplaceRequirementAction',
	'RE/Scripts/Classes/Action/ShiftRequirementsAction',
	'RE/Scripts/Classes/Action/AddElementAction'
],
function(declare, TechDocActionsHelper, Enums, VersionElementAction, TableAction,
	AppendExistingRequirementAction, ReplaceRequirementAction, ShiftRequirementsAction, AddElementAction) {
	return declare('Aras.Client.Controls.Requirement.ActionsHelper', [TechDocActionsHelper], {
		constructor: function(args) {
			this.viewActions.version.handler = new VersionElementAction({
				actionsHelper: this
			});

			this.viewActions.tableactions.handler = new TableAction({
				actionsHelper: this
			});

			this.viewActions['appendexistingrequirement'] = {
				handler: new AppendExistingRequirementAction({
					actionsHelper: this
				}),
				priority: 0
			};

			this.viewActions['replacerequirement'] = {
				handler: new ReplaceRequirementAction({
					actionsHelper: this
				}),
				priority: 10
			};

			this.viewActions['shiftrequirements'] = {
				handler: new ShiftRequirementsAction({
					actionsHelper: this
				}),
				priority: 20
			};

			this.viewActions['appendelement'] = {
				title: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.add'),
				handler: new AddElementAction({
					actionsHelper: this
				}),
				priority: 0
			};

			this.viewActions['pasteinfreezone'] = this.viewActions['pasteelement'];

			delete this.viewActions.makeblockinternal;
			delete this.viewActions.makeexternal;
			delete this.viewActions.viewexternalitem;
			delete this.viewActions.changecondition;
		},

		getInsertMenu: function(selectedItem) {
			var schema = this.viewmodel.Schema();
			var expectedElements = schema.GetExpectedElements(selectedItem).insert;

			var filteredExpectedElements = expectedElements.filter(function(elementName) {
				return elementName != 'External Content';
			});

			return filteredExpectedElements.map(function(elementName) {
				var type = schema.GetSchemaElementType(elementName);
				return {
					id: 'insertelement:' + elementName,
					icon: Enums.getImagefromType(type),
					name: elementName
				};
			});
		},

		getAppendMenu: function(selectedItem) {
			var schema = this.viewmodel.Schema();
			var expectedElements = schema.GetExpectedElements(selectedItem).append;

			var filteredExpectedElements = expectedElements.filter(function(elementName) {
				return elementName != 'External Content';
			});

			return filteredExpectedElements.map(function(elementName) {
				var type = schema.GetSchemaElementType(elementName);
				return {
					id: 'appendelement:' + elementName,
					icon: Enums.getImagefromType(type),
					name: elementName
				};
			});
		},

		GetActionsMenuModel: function(selectedItems) {
			var menuModel = [];
			var isEditable = this.viewmodel.IsEditable();

			if (selectedItems && selectedItems.length) {
				var isSingleSelect = selectedItems.length == 1;
				var isMultiSelect = selectedItems.length > 1;
				var immutable = this.viewmodel.hasClassificationBindedElements() && selectedItems.some(function(item) {
					return this.viewmodel.isRootElementContained(item.Parent || item);
				}.bind(this));
				var currentSelectedItems = (isMultiSelect) ? selectedItems : selectedItems[0];
				var isTableContentElement = this.searchTableElements(currentSelectedItems);
				var selectedNodeIsRelatedToClassification = this._isNodeRelatedToClassification(currentSelectedItems);

				// Copy|Paste|Cut menu action validation
				if (isMultiSelect || !selectedNodeIsRelatedToClassification) {
					this.appendActionMenuItem(menuModel, 'copyelement', currentSelectedItems);
				}

				if (!isMultiSelect && isEditable) {
					this.appendActionMenuItem(menuModel, 'pasteelement', currentSelectedItems);
				}

				if (!immutable && isEditable) {
					if (!selectedNodeIsRelatedToClassification) {
						this.appendActionMenuItem(menuModel, 'cutelement', currentSelectedItems);
					}

					if (!isTableContentElement && !selectedNodeIsRelatedToClassification) {
						this.appendActionMenuItem(menuModel, 'removeelement', currentSelectedItems);

						if (isMultiSelect && !selectedNodeIsRelatedToClassification) {
							this.appendActionMenuItem(menuModel, 'group', currentSelectedItems);
						}
					}
				}

				if (isSingleSelect) {
					var isDynamicElement = !isMultiSelect && currentSelectedItems.isDynamic();
					var isArasItem = !isMultiSelect && currentSelectedItems.is('ArasItemXmlSchemaElement');
					var isImage = !isMultiSelect && currentSelectedItems.is('ArasImageXmlSchemaElement');
					var isVersionable = isArasItem || isImage;
					var isBlocked = !isMultiSelect && currentSelectedItems.isBlocked();
					var isTableCell = !isMultiSelect && currentSelectedItems.is('ArasCellXmlSchemaElement');

					// append ViewItem action
					if (isVersionable) {
						this.appendActionMenuItem(menuModel, 'version', currentSelectedItems);
					}

					if (isEditable) {
						// append Insert|Append menu actions
						var isRoot = this.viewmodel.isRootElementContained(selectedItems[0]);
						if (!currentSelectedItems.is('ArasRowXmlSchemaElement') && !isTableCell) {
							if ((!immutable || !isRoot) && !isDynamicElement && !isBlocked && !this.viewmodel.Schema().IsContentMixed(currentSelectedItems)) {
								this.appendActionMenuItem(menuModel, 'insertelement', currentSelectedItems);
							}

							if (!immutable && !selectedNodeIsRelatedToClassification) {
								this.appendActionMenuItem(menuModel, 'appendelement', currentSelectedItems);
							}
						}

						// append Table menu action
						if (currentSelectedItems.is('ArasTableXmlSchemaElement') || isTableContentElement) {
							var titlesList = this.viewActions.tableactions.handler.GetTablesMenu(currentSelectedItems);
							var menuAction;

							for (menuAction in titlesList) {
								menuModel.push(titlesList[menuAction]);
							}

							if (isTableCell) {
								this.appendActionMenuItem(menuModel, 'insertelement', currentSelectedItems);
							}
						}

						if (!isTableContentElement) {
							this.appendActionMenuItem(menuModel, 'ungroup', currentSelectedItems);
						}

						if (!selectedNodeIsRelatedToClassification) {
							// append Internal action
							this.appendActionMenuItem(menuModel, 'refreshcontent', currentSelectedItems);
						}
					}

					this.appendActionMenuItem(menuModel, 'showattributesdialog', currentSelectedItems, isEditable);
				}
			} else if (isEditable) {
				var currentSelectedItem = this.viewmodel.getLastElement();
				var isRoot = currentSelectedItem.Uid() == this.viewmodel.getRootNodeUid();
				var actionName = isRoot ? 'insertelement' : 'appendelement';
				this.appendActionMenuItem(menuModel, actionName, currentSelectedItem);
				this.appendActionMenuItem(menuModel, 'pasteinfreezone', currentSelectedItem);
			}

			if (menuModel.length) {
				return menuModel.sort(function(a, b) {
					return a.priority - b.priority;
				});
			} else {
				return this.getNoActionMenu();
			}
		},

		getNoActionMenu: function() {
			return [{
				id: '#nothing',
				name: this.aras.getResource('../Modules/aras.innovator.TDF', 'helper.noaction')
			}];
		},

		getPasteSubMenu: function(action, selectedItem) {
			var selectedNodeIsRelatedToClassification = this._isNodeRelatedToClassification(selectedItem);
			var modes = [{
				value: 'into',
				name: this.aras.getResource('../Solutions/RE', 'contenttree_contextmenu_pasteinto')
			}];

			if (!selectedNodeIsRelatedToClassification) {
				modes.unshift({
					value: 'before',
					name: this.aras.getResource('../Solutions/RE', 'contenttree_contextmenu_pastebefore')
				});
				modes.push({
					value: 'after',
					name: this.aras.getResource('../Solutions/RE', 'contenttree_contextmenu_pasteafter')
				});
			}

			var pasteSubMenu = [];
			var validationResult;
			var currentMode;
			var i;

			validationResult = action.handler.Validate({
				selectedItem: selectedItem,
				clipboard: this.clipboard,
				actions: modes
			});

			for (i = 0; i < modes.length; i++) {
				currentMode = modes[i];

				if (validationResult[currentMode.value]) {
					pasteSubMenu.push({
						id: 'pasteelement:' + currentMode.value,
						name: currentMode.name
					});
				}
			}

			return pasteSubMenu;
		},

		_isNodeRelatedToClassification: function(currentSelectedItems) {
			var itemClassification = this.viewmodel.ItemClassification().replace(/ /g, '');
			if (itemClassification == 'Text') {
				itemClassification = 'RequirementText';
			}

			return currentSelectedItems.nodeName == itemClassification;
		},

		getCreateSiblingMenu: function(targetElement) {
			var menuItems = [];

			if (targetElement) {
				if (this.viewmodel.IsEditable()) {
					// append Insert|Append menu actions
					var isTableElement = targetElement.is('ArasTableXmlSchemaElement') || targetElement.is('ArasRowXmlSchemaElement') ||
						targetElement.is('ArasCellXmlSchemaElement');
					var menuItemCandidates;

					if (isTableElement) {
						menuItemCandidates = this.viewActions.tableactions.handler.getCreateSiblingMenu(targetElement);
					}
					return menuItemCandidates || this.getAppendMenu(targetElement);
				}
			}

			return menuItems;
		},

		appendActionMenuItem: function(menuItems, actionName, selectedItems, isEditable) {
			if (actionName != 'pasteinfreezone') {
				this.inherited(arguments);
			} else {
				var action = this.viewActions[actionName];
				var actionTitle = action.title;
				var priority = action.priority;

				var validationResult = action.handler.Validate({
					selectedItem: selectedItems,
					clipboard: this.clipboard,
					actions: [{
						value: 'into',
						name: 'Into'
					}, {
						value: 'after',
						name: 'After'
					}]
				});
				var isActionAllowed = validationResult.after || validationResult.into;

				if (isActionAllowed) {
					menuItems.push({
						id: actionName,
						name: actionTitle,
						priority: priority
					});
				}
			}
		},

		onMenuItemClick: function(cmdId, rowId) {
			// command example - pasteelement:into
			var cmd = cmdId.split(':');
			var actionName = cmd[0];
			var action = this.viewActions[actionName];

			if (actionName != 'pasteinfreezone') {
				this.inherited(arguments);
			} else {
				var currentSelectedItem = this.viewmodel.getLastElement();
				var actionMode = currentSelectedItem.Uid() == this.viewmodel.getRootNodeUid() ? 'into' : 'after';

				action.handler.Execute({
					selectedItem: currentSelectedItem,
					clipboard: this.clipboard,
					action: actionMode
				});
			}
		}
	});
});
