define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/GroupAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/UngroupAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/MakeExternalAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/MakeBlockInternalAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ChangeConditionAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/AddElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/AddNewItemAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/AddFromTemplateAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/RemoveElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ShowDocumentViewDialogAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ArasTextActions',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ListAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/TableAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/CopyElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/CutElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/PasteElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/UndoAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/RedoAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ShowAttributesDialog',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ViewExternalItem',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/VersionElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/RefreshContentAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ReplaceReferencedItemAction',
	'Modules/aras.innovator.core.Core/Scripts/Classes/Eventable',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (
	declare,
	connect,
	popup,
	GroupAction,
	UngroupAction,
	MakeExternalAction,
	MakeBlockInternalAction,
	ChangeConditionAction,
	AddElementAction,
	AddNewItemAction,
	AddFromTemplateAction,
	RemoveElementAction,
	ShowDocumentViewDialogAction,
	ArasTextActions,
	ListAction,
	TableAction,
	CopyElementAction,
	CutElementAction,
	PasteElementAction,
	UndoAction,
	RedoAction,
	ShowAttributesDialog,
	ViewExternalItem,
	VersionElementAction,
	RefreshContentAction,
	ReplaceReferencedItemAction,
	Eventable,
	Enums
) {
	return declare('Aras.Client.Controls.TechDoc.ActionsHelper', Eventable, {
		viewmodel: null,
		clipboard: null,
		aras: null,
		topWindow: null,

		// TODO ADD CACHE
		constructor: function (args) {
			this.viewmodel = args.viewmodel;
			this.clipboard = args.clipboard;
			this.aras = args.aras;
			this.topWindow = this.aras.getMostTopWindowWithAras();

			this.viewActions = {
				appendelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.add'
					),
					handler: new AddElementAction({
						actionsHelper: this
					}),
					priority: 0
				},
				appendnewitem: {
					handler: new AddNewItemAction({
						actionsHelper: this
					}),
					priority: 0
				},
				insertnewitem: {
					handler: new AddNewItemAction({
						actionsHelper: this
					}),
					priority: 0
				},
				insertelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.insert'
					),
					handler: new AddElementAction({
						actionsHelper: this
					}),
					priority: 10
				},
				replaceitemreference: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.replacereferenceditem'
					),
					handler: new ReplaceReferencedItemAction({
						actionsHelper: this
					}),
					priority: 15
				},
				addfromtemplate: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.addfromtemplate.title'
					),
					handler: new AddFromTemplateAction({
						actionsHelper: this
					})
				},
				version: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.version'
					),
					handler: new VersionElementAction({
						actionsHelper: this
					}),
					priority: 20
				},
				removeelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.remove'
					),
					handler: new RemoveElementAction({
						actionsHelper: this
					}),
					priority: 30
				},
				copyelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.copy'
					),
					handler: new CopyElementAction({
						actionsHelper: this
					}),
					priority: 40
				},
				cutelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.cut'
					),
					handler: new CutElementAction({
						actionsHelper: this
					}),
					priority: 50
				},
				pasteelement: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.paste'
					),
					handler: new PasteElementAction({
						actionsHelper: this
					}),
					priority: 60
				},
				group: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.group'
					),
					handler: new GroupAction({
						actionsHelper: this
					}),
					priority: 70
				},
				ungroup: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.ungroup'
					),
					handler: new UngroupAction({
						actionsHelper: this
					}),
					priority: 80
				},
				makeblockinternal: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.makeinternal'
					),
					handler: new MakeBlockInternalAction({
						actionsHelper: this
					}),
					priority: 90
				},
				makeexternal: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.makeexternal'
					),
					handler: new MakeExternalAction({
						actionsHelper: this
					}),
					priority: 100
				},
				viewexternalitem: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.viewitem'
					),
					handler: new ViewExternalItem({
						actionsHelper: this
					}),
					priority: 110
				},
				changecondition: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.changecondition'
					),
					viewtitle: 'View Condition',
					handler: new ChangeConditionAction({
						actionsHelper: this
					}),
					priority: 120
				},
				showattributesdialog: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.editattributes'
					),
					viewtitle: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.viewattributes'
					),
					handler: new ShowAttributesDialog({
						actionsHelper: this
					}),
					priority: 130
				},
				refreshcontent: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.refreshcontent'
					),
					handler: new RefreshContentAction({
						actionsHelper: this
					}),
					priority: 140
				},
				showdocumentview: {
					handler: new ShowDocumentViewDialogAction({
						actionsHelper: this
					})
				},
				arastextactions: {
					handler: new ArasTextActions({
						actionsHelper: this
					})
				},
				listaction: {
					handler: new ListAction({
						actionsHelper: this
					})
				},
				tableactions: {
					handler: new TableAction({
						actionsHelper: this
					})
				},
				undoaction: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.undo'
					),
					handler: new UndoAction({
						actionsHelper: this
					})
				},
				redoaction: {
					title: this.aras.getResource(
						'../Modules/aras.innovator.TDF',
						'action.redo'
					),
					handler: new RedoAction({
						actionsHelper: this
					})
				}
			};

			this.attachActionEventHandlers();
		},

		attachActionEventHandlers: function () {
			for (let actionName in this.viewActions) {
				const actionHandler = this.viewActions[actionName].handler;

				actionHandler.addEventListener(
					actionHandler,
					this,
					'Executed',
					this.onActionExecuted.bind(this, actionName)
				);
			}
		},

		onActionExecuted: function () {
			const eventArguments = Array.from(arguments);

			eventArguments.unshift('ActionExecuted');
			this.raiseEvent.apply(this, eventArguments);
		},

		getAction: function (actionName) {
			var targetAction = this.viewActions[actionName];

			return targetAction && targetAction.handler;
		},

		executeAction: function (actionName, actionArguments) {
			var targetAction = this.getAction(actionName);

			if (targetAction) {
				return targetAction.Execute(actionArguments);
			}
		},

		GetActionsMenuModel: function (selectedItems) {
			var menuModel = [];

			if (selectedItems.length) {
				var isEditable = this.viewmodel.IsEditable();
				var isSingleSelect = selectedItems.length == 1;
				var isMultiSelect = selectedItems.length > 1;
				var immutable =
					this.viewmodel.hasClassificationBindedElements() &&
					selectedItems.some(
						function (item) {
							return this.viewmodel.isRootElementContained(item.Parent || item);
						}.bind(this)
					);
				var isElementFromInternalBlock = !this.viewmodel
					.ExternalBlockHelper()
					.isExternalBlockContains(selectedItems);
				var currentSelectedItems = isMultiSelect
					? selectedItems
					: selectedItems[0];
				var isTableContentElement = this.searchTableElements(
					currentSelectedItems
				);

				// Copy|Paste|Cut menu action validation
				this.appendActionMenuItem(
					menuModel,
					'copyelement',
					currentSelectedItems
				);

				if (!immutable && isEditable && isElementFromInternalBlock) {
					this.appendActionMenuItem(
						menuModel,
						'cutelement',
						currentSelectedItems
					);

					if (!isMultiSelect) {
						this.appendActionMenuItem(
							menuModel,
							'pasteelement',
							currentSelectedItems
						);
					}

					if (!isTableContentElement) {
						this.appendActionMenuItem(
							menuModel,
							'removeelement',
							currentSelectedItems
						);

						if (isMultiSelect) {
							this.appendActionMenuItem(
								menuModel,
								'group',
								currentSelectedItems
							);
						}

						this.appendActionMenuItem(
							menuModel,
							'makeexternal',
							currentSelectedItems
						);
					}
				}

				if (isSingleSelect) {
					var isExternalBlock =
						!isMultiSelect &&
						currentSelectedItems.is('ArasBlockXmlSchemaElement') &&
						currentSelectedItems.ByReference() ==
							Enums.ByReferenceType.External;
					var isDynamicElement =
						!isMultiSelect && currentSelectedItems.isDynamic();
					var isArasItem =
						!isMultiSelect &&
						currentSelectedItems.is('ArasItemXmlSchemaElement');
					var isImage =
						!isMultiSelect &&
						currentSelectedItems.is('ArasImageXmlSchemaElement');
					var isVersionable = isExternalBlock || isArasItem || isImage;
					var isBlocked = !isMultiSelect && currentSelectedItems.isBlocked();
					var isTableCell =
						!isMultiSelect &&
						currentSelectedItems.is('ArasCellXmlSchemaElement');

					// append ViewItem action
					if (isVersionable) {
						this.appendActionMenuItem(
							menuModel,
							'version',
							currentSelectedItems
						);
					}

					if (isExternalBlock || isArasItem) {
						this.appendActionMenuItem(
							menuModel,
							'viewexternalitem',
							currentSelectedItems
						);
					}

					if (isEditable) {
						// append Insert|Append menu actions
						var isRoot = this.viewmodel.isRootElementContained(
							selectedItems[0]
						);
						if (
							!currentSelectedItems.is('ArasRowXmlSchemaElement') &&
							!isTableCell &&
							isElementFromInternalBlock
						) {
							if (
								(!immutable || !isRoot) &&
								!isExternalBlock &&
								!isDynamicElement &&
								!isBlocked &&
								!this.viewmodel.Schema().IsContentMixed(currentSelectedItems)
							) {
								this.appendActionMenuItem(
									menuModel,
									'insertelement',
									currentSelectedItems
								);
							}

							if (!immutable) {
								this.appendActionMenuItem(
									menuModel,
									'appendelement',
									currentSelectedItems
								);
							}
						}

						if (isElementFromInternalBlock) {
							// append Table menu action
							if (
								currentSelectedItems.is('ArasTableXmlSchemaElement') ||
								isTableContentElement
							) {
								var titlesList = this.viewActions.tableactions.handler.GetTablesMenu(
									currentSelectedItems
								);
								var menuAction;

								for (menuAction in titlesList) {
									menuModel.push(titlesList[menuAction]);
								}

								if (isTableCell) {
									this.appendActionMenuItem(
										menuModel,
										'insertelement',
										currentSelectedItems
									);
								}
							}

							if (!isTableContentElement) {
								this.appendActionMenuItem(
									menuModel,
									'ungroup',
									currentSelectedItems
								);
							}

							// append Internal action
							this.appendActionMenuItem(
								menuModel,
								'makeblockinternal',
								currentSelectedItems
							);
							this.appendActionMenuItem(
								menuModel,
								'refreshcontent',
								currentSelectedItems
							);
							this.appendActionMenuItem(
								menuModel,
								'replaceitemreference',
								currentSelectedItems
							);
						}
					}

					if (!isTableCell) {
						this.appendActionMenuItem(
							menuModel,
							'changecondition',
							currentSelectedItems,
							isEditable
						);
					}
					this.appendActionMenuItem(
						menuModel,
						'showattributesdialog',
						currentSelectedItems,
						isEditable
					);
				}
			}

			if (menuModel.length) {
				return menuModel.sort(function (a, b) {
					return a.priority - b.priority;
				});
			} else {
				return [
					{
						id: '#nothing',
						name: this.aras.getResource(
							'../Modules/aras.innovator.TDF',
							'helper.noaction'
						)
					}
				];
			}
		},

		getCreateSiblingMenu: function (targetElement) {
			var menuItems = [];

			if (targetElement) {
				if (this.viewmodel.IsEditable()) {
					var isElementFromInternalBlock = !this.viewmodel
						.ExternalBlockHelper()
						.isExternalBlockContains(targetElement);

					// append Insert|Append menu actions
					if (isElementFromInternalBlock) {
						var isTableElement =
							targetElement.is('ArasTableXmlSchemaElement') ||
							targetElement.is('ArasRowXmlSchemaElement') ||
							targetElement.is('ArasCellXmlSchemaElement');
						var menuItemCandidates;

						if (isTableElement) {
							menuItemCandidates = this.viewActions.tableactions.handler.getCreateSiblingMenu(
								targetElement
							);
						}
						return menuItemCandidates || this.getAppendMenu(targetElement);
					}
				}
			}

			return menuItems;
		},

		onMenuItemClick: function (cmdId, rowId) {
			var selectedWrappedObject = this.viewmodel.GetElementById(rowId);
			var selectedItems = this.viewmodel.GetSelectedItems();
			var cmd = cmdId.split(':');
			var actionName = cmd[0];
			var target = cmd[1];
			var action = this.viewActions[actionName];

			this.viewmodel.SuspendInvalidation();

			try {
				switch (actionName) {
					case 'insertelement':
						action.handler.Execute({
							elementName: target,
							context: selectedWrappedObject,
							direction: 'insert'
						});
						break;
					case 'appendelement':
						action.handler.Execute({
							elementName: target,
							context: selectedWrappedObject,
							direction: 'append'
						});
						break;
					case 'addfromtemplate':
						action.handler.Execute({
							selectedElement: selectedWrappedObject,
							direction: target
						});
						break;
					case 'appendnewitem':
						action.handler.Execute({
							elementName: target,
							context: selectedWrappedObject,
							direction: 'append'
						});
						break;
					case 'insertnewitem':
						action.handler.Execute({
							elementName: target,
							context: selectedWrappedObject,
							direction: 'insert'
						});
						break;
					case 'replaceitemreference':
						action.handler.Execute({
							mode: target,
							selectedElement: selectedWrappedObject
						});
						break;
					case 'makeexternal':
					case 'removeelement':
					case 'group':
						action.handler.Execute({
							selectedItems: selectedItems
						});
						break;
					case 'changecondition':
					case 'refreshcontent':
					case 'showattributesdialog':
					case 'ungroup':
						action.handler.Execute({
							selectedElement: selectedWrappedObject
						});
						break;
					case 'makeblockinternal':
					case 'viewexternalitem':
						action.handler.Execute({
							selectedItem: selectedItems[0]
						});
						break;
					case 'copyelement':
					case 'cutelement':
						action.handler.Execute({
							selectedItems: selectedItems,
							clipboard: this.clipboard
						});
						break;
					case 'pasteelement':
						action.handler.Execute({
							selectedItem: selectedItems[0],
							clipboard: this.clipboard,
							action: target
						});
						break;
					case 'table':
						this.viewActions.tableactions.handler.Execute({
							action: target
						});
						break;
					case 'version':
						action.handler.Execute({
							selectedItem: selectedItems[0],
							action: target
						});
						break;
				}
			} catch (ex) {
				this.aras.AlertError(ex.message);
			} finally {
				this.viewmodel.ResumeInvalidation();
			}
		},

		showContextMenu: function (
			contextMenu,
			parentWidget,
			menuModel,
			rowId,
			additionalSettings
		) {
			additionalSettings = additionalSettings || {};

			if (contextMenu && parentWidget && menuModel) {
				const popupSettings = {
					popup: contextMenu.menu,
					parent: parentWidget,
					x: !isNaN(additionalSettings.x) ? additionalSettings.x : 0,
					y: !isNaN(additionalSettings.y) ? additionalSettings.y : 0,
					onClose: additionalSettings.onClose,
					onExecute: additionalSettings.onExecute
				};

				if (contextMenu.getItemCount()) {
					contextMenu.removeAll();
				}

				contextMenu.addRange(menuModel);
				contextMenu.rowId = rowId;

				connect.connect(
					contextMenu.menu,
					'onBlur',
					function () {
						this.hideContextMenu(contextMenu);
					}.bind(this)
				);

				connect.connect(
					contextMenu.menu,
					'onKeyPress',
					function (keyEvent) {
						if (keyEvent.keyCode == 27) {
							this.hideContextMenu(contextMenu);
						}
					}.bind(this)
				);

				// HACK: In IE11 context menu just closes after menu item click due blur event handler executed before click
				contextMenu.menu.domNode.addEventListener(
					'pointerdown',
					function (mouseEvent) {
						mouseEvent.stopPropagation();
					},
					true
				);

				// trying to apply maxHeight parameter if it was passed
				if (additionalSettings.maxHeight) {
					const maxHeight = parseInt(additionalSettings.maxHeight, 10);
					popupSettings.maxHeight =
						!isNaN(maxHeight) && maxHeight > 0 ? maxHeight : undefined;
				}

				popup.open(popupSettings);
				contextMenu.menu.focus();
			}
		},

		hideContextMenu: function (targetMenu) {
			targetMenu.rowId = null;
			targetMenu.removeAll();
		},

		appendActionMenuItem: function (
			menuItems,
			actionName,
			selectedItems,
			isEditable
		) {
			if (actionName) {
				var action = this.viewActions[actionName];
				var actionTitle = action.title;
				var isActionAllowed = true;
				var subMenuItems;

				switch (actionName) {
					case 'insertelement':
						subMenuItems = this.getInsertMenu(selectedItems);
						isActionAllowed = Boolean(subMenuItems.length);
						break;
					case 'appendelement':
						subMenuItems = this.getAppendMenu(selectedItems);
						isActionAllowed = Boolean(subMenuItems.length);
						break;
					case 'replaceitemreference':
						isActionAllowed = action.handler.Validate({
							selectedElement: selectedItems
						});

						if (isActionAllowed) {
							subMenuItems = this.getReplaceReferenceMenu(
								selectedItems.nodeName
							);
						}
						break;
					case 'copyelement':
					case 'cutelement':
						isActionAllowed = this.haveSameParentCheck(
							selectedItems,
							'ArasCellXmlSchemaElement'
						);
						break;
					case 'group':
						isActionAllowed = this.haveSameParentCheck(selectedItems);
						break;
					case 'viewexternalitem':
						isActionAllowed = action.handler.Validate({
							selectedItem: selectedItems
						});
						break;
					case 'refreshcontent':
					case 'ungroup':
						isActionAllowed = action.handler.Validate({
							selectedElement: selectedItems
						});
						break;
					case 'pasteelement':
						subMenuItems = this.getPasteSubMenu(action, selectedItems);
						isActionAllowed = Boolean(subMenuItems.length);
						break;
					case 'makeblockinternal':
						isActionAllowed =
							selectedItems.Parent &&
							selectedItems.is('ArasBlockXmlSchemaElement') &&
							selectedItems.ByReference() == Enums.ByReferenceType.External &&
							!selectedItems.isBlocked();
						break;
					case 'makeexternal':
						if (!Array.isArray(selectedItems)) {
							isActionAllowed =
								selectedItems.Parent &&
								(!selectedItems.is('ArasBlockXmlSchemaElement') ||
									selectedItems.ByReference() ==
										Enums.ByReferenceType.Internal);
						} else {
							isActionAllowed = this.haveSameParentCheck(selectedItems);
						}
						break;
					case 'changecondition':
						actionTitle = action[isEditable ? 'title' : 'viewtitle'];
						break;
					case 'showattributesdialog':
						isActionAllowed = action.handler.Validate({
							selectedElement: selectedItems
						});

						if (isActionAllowed) {
							actionTitle = action[isEditable ? 'title' : 'viewtitle'];
						}
						break;
					case 'removeelement':
						isActionAllowed = !this.viewmodel.isRootElementContained(
							selectedItems
						);
						break;
					case 'version':
						subMenuItems = this.getVersionSubMenu(action, selectedItems);
						isActionAllowed = Boolean(subMenuItems.length);
						break;
				}

				if (isActionAllowed) {
					var actionPriority = isNaN(this.viewActions[actionName].priority)
						? 1000
						: this.viewActions[actionName].priority;

					menuItems.push({
						id: actionName,
						name: actionTitle,
						subMenu: subMenuItems,
						priority: actionPriority
					});
				}
			}
		},

		getInsertMenu: function (selectedItem) {
			const schema = this.viewmodel.Schema();
			const expectedElements = schema.GetExpectedElements(selectedItem).insert;
			const menuItems = expectedElements.map(
				function (elementName) {
					return this._createAddElementMenuItem(elementName, 'insert');
				}.bind(this)
			);

			this._extendAddElementsMenu(menuItems, 'insert');

			return menuItems;
		},

		getAppendMenu: function (selectedItem) {
			const schema = this.viewmodel.Schema();
			const expectedElements = schema.GetExpectedElements(selectedItem).append;
			const menuItems = expectedElements.map(
				function (elementName) {
					return this._createAddElementMenuItem(elementName, 'append');
				}.bind(this)
			);

			this._extendAddElementsMenu(menuItems, 'append');

			return menuItems;
		},

		getReplaceReferenceMenu: function (elementName) {
			const addElementMenu = this._createAddElementMenuItem(
				elementName,
				'replaceitemreference:'
			);

			return addElementMenu.subMenu;
		},

		_extendAddElementsMenu: function (menuItems, addDirection) {
			if (menuItems && menuItems.length) {
				const specialItems = [];

				if (this.viewmodel.getAdditionalSetting('addContentFromTemplate')) {
					const fromTemplateAction = this.viewActions.addfromtemplate;

					specialItems.push({
						id: 'addfromtemplate:' + addDirection,
						icon: '../../images/FromTemplate.svg',
						name: fromTemplateAction.title
					});
				}

				if (!this.viewmodel.getAdditionalSetting('disableExternalContent')) {
					specialItems.push({
						id: addDirection + 'element:External Content',
						icon: '../../images/TechDocItemType.svg',
						name: 'External Content'
					});
				}

				if (specialItems.length) {
					menuItems.unshift({
						id: addDirection + 'fromtemplateseparator',
						separator: true
					});

					for (let i = specialItems.length - 1; i >= 0; i--) {
						menuItems.unshift(specialItems[i]);
					}
				}
			}
		},

		_createAddElementMenuItem: function (elementName, addDirection) {
			const schemaHelper = this.viewmodel.Schema();
			const elementType = schemaHelper.GetSchemaElementType(elementName);
			const isCreateSupported =
				(elementType & Enums.XmlSchemaElementType.Item) ===
					Enums.XmlSchemaElementType.Item ||
				(elementType & Enums.XmlSchemaElementType.Image) ===
					Enums.XmlSchemaElementType.Image;
			const menuItemIcon =
				elementName === 'External Content'
					? '../../images/TechDocItemType.svg'
					: Enums.getImagefromType(elementType);
			const menuItem = {
				id: addDirection + 'element:' + elementName,
				icon: menuItemIcon,
				name: elementName
			};

			if (isCreateSupported) {
				// If create action is supported, then our menuItem will additionally contain
				// two child items ('pick' and 'create')
				Object.assign(menuItem, {
					id: addDirection + 'elementmenu:' + elementName,
					subMenu: [
						{
							id: addDirection + 'element:' + elementName,
							icon: '../../images/SelectItem.svg',
							name: this.aras.getResource(
								'../Modules/aras.innovator.TDF',
								'action.pickitem'
							)
						},
						{
							id: addDirection + 'newitem:' + elementName,
							icon: '../../images/CreateRelatedItem.svg',
							name: this.aras.getResource(
								'../Modules/aras.innovator.TDF',
								'action.createitem'
							)
						}
					]
				});
			}

			return menuItem;
		},

		getPasteSubMenu: function (action, selectedItem) {
			var modes = [
				{
					value: 'before',
					name: 'Before'
				},
				{
					value: 'into',
					name: 'Into'
				},
				{
					value: 'after',
					name: 'After'
				}
			];
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

		getVersionSubMenu: function (action, selectedItem) {
			var isEditable = this.viewmodel.IsEditable();
			var versionSubMenu = [];
			var i;

			if (selectedItem.isUpdatable()) {
				if (isEditable) {
					versionSubMenu.push({
						id: 'version:update',
						name: 'Update to Latest'
					});
					versionSubMenu.push({
						id: 'version:viewlatest',
						name: 'View Latest'
					});
					versionSubMenu.push({
						id: 'version:ignore',
						name: 'Ignore'
					});
					versionSubMenu.push({
						id: 'version:ignoreall',
						name: 'Ignore All Versions'
					});
				} else {
					versionSubMenu.push({
						id: 'version:viewlatest',
						name: 'View Latest'
					});
				}
			} else if (isEditable) {
				var isAllIgnored =
					selectedItem.getReferenceProperty('ignoreAllVersions') == '1';
				var isIgnoredId = Boolean(
					selectedItem.getReferenceProperty('ignoredVersionId')
				);

				if (isAllIgnored || isIgnoredId) {
					versionSubMenu.push({
						id: 'version:restoretracking',
						name: 'Restore Version Tracking'
					});
				}
			}

			return versionSubMenu;
		},

		haveSameParentCheck: function (selectedItems, invalidElementType) {
			var itemsList = Array.isArray(selectedItems)
				? selectedItems
				: [selectedItems];
			var firstItem = itemsList[0];
			var parentItem = firstItem.Parent;

			if (
				parentItem &&
				(!invalidElementType || !firstItem.is(invalidElementType))
			) {
				var parentId = parentItem.Id();
				var isAllSelectedSiblings = true;
				var selectedItem;
				var i;

				for (i = 1; i < itemsList.length; i++) {
					selectedItem = itemsList[i];

					if (
						!selectedItem.Parent ||
						selectedItem.Parent.Id() != parentId ||
						(invalidElementType && selectedItem.is(invalidElementType))
					) {
						isAllSelectedSiblings = false;
						break;
					}
				}

				if (isAllSelectedSiblings) {
					var childItems = parentItem.ChildItems();
					var indexArray = [];

					for (i = 0; i < itemsList.length; i++) {
						indexArray.push(childItems.index(itemsList[i]));
					}

					// By default, array sorts it's element as they are strings. So specific sorter should be passed to sort elements as numbers.
					indexArray.sort(function (firstIndex, secondIndex) {
						return firstIndex - secondIndex;
					});
					return (
						indexArray[indexArray.length - 1] - indexArray[0] + 1 ==
						itemsList.length
					);
				}
			}

			return false;
		},

		searchTableElements: function (selectedItems) {
			var selectedItem;
			var i;

			selectedItems = Array.isArray(selectedItems)
				? selectedItems
				: [selectedItems];

			for (i = 0; i < selectedItems.length; i++) {
				selectedItem = selectedItems[i];

				if (
					selectedItem.is('ArasRowXmlSchemaElement') ||
					(selectedItem.is('ArasCellXmlSchemaElement') &&
						selectedItem.Parent.is('ArasRowXmlSchemaElement'))
				) {
					return true;
				}
			}
			return false;
		}
	});
});
