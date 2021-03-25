define([
	'dojo/_base/declare',
	'dojo/aspect',
	'RE/Scripts/Classes/ChapterTreeBase',
	'RE/Scripts/Classes/Helper/ChapterTreeHelper',
	'RE/Scripts/Classes/RequirementDialog'
],

function(declare, aspect, ChapterTreeBase, ChapterTreeHelper, RequirementDialog) {
	return declare('Aras.Client.Controls.RequirementDocument.ChapterTree', [ChapterTreeBase], {
		_contextMenu: null,
		_requirementDialog: null,
		_clipboard: {},
		_menuData: null,
		_menuDataForEmptyArea: null,
		chapterTreeHelper: null,
		_iconByState: null,
		_suspendSectionsInvalidation: false,

		constructor: function(args) {
			this._reqDocId = args.requirementDocumentId;
			this.chapterTreeHelper = new ChapterTreeHelper({
				aras: this.aras,
				requirementsHelper: this._requirementsHelper
			});
			this.populateChapterTreeHeplerByRequiredFields();

			this._iconByState = {
				'Blank': '',
				'NewItem': '../images/New.svg?req=1',
				'Modified': '../images/Edit.svg?req=1',
				'LockedAndModified': '../images/Edit.svg?req=1',
				'LockedByMe': '../images/ClaimOn.svg?req=1',
				'LockedByOther': '../images/ClaimOther.svg?req=1',
				'Unresolved': '../Solutions/RE/Images/Unresolved.svg',
				'LowerConflicts': '../Solutions/RE/Images/LowerConflicts.svg',
				'UnresolvedPlusLower': '../Solutions/RE/Images/UnresolvedPlusLower.svg'
			};
		},

		populateChapterTreeHeplerByRequiredFields: function() {
			var requiredRequirementFields = this._requirementDialog.getRequiredFields();
			this.chapterTreeHelper.setRequiredFields(requiredRequirementFields);
		},

		init: function() {
			this.inherited(arguments);

			this._initContextMenu();

			aspect.after(this.viewmodel, 'OnInvalidate', this._onViewModelInvalidate.bind(this), true);
			aspect.after(this.viewmodel, 'onSelectionChanged', this.selectionChangeHandler.bind(this), true);
			aspect.after(this.viewmodel, 'OnRequirementDocumentContentChange', this._onReqDocContentChange.bind(this), true);
			aspect.after(this.viewmodel, 'Reload', this._reloadHandler.bind(this), true);
			aspect.after(this.viewmodel, 'setRequirementState', this._setStateToTreeElement.bind(this), true);
			this._tree.on('mouseup', this.onClickHandler.bind(this));
			this._tree.on('contextmenu', this._showContextMenu.bind(this));

			this._requirementDialog = new RequirementDialog({aras: this.aras});

			this.controlsActionMap = {
				're_moveUp': 'move_up',
				're_moveDown': 'move_down',
				're_moveIndent': 'move_indent',
				're_moveUnindent': 'move_unindent',
				're_replace': 'replace_requirement',
				're_delete_req': 'remove_current',
				're_delete_section': 'remove_nested'
			};
		},

		_invalidateSectionsAtRows: function() {
			const sectionsByConfigIds = this.chapterTreeHelper._getSectionsByConfigIds(this._tree);
			this.viewmodel.InvalidateSections(sectionsByConfigIds);

			for (let configId in sectionsByConfigIds) {
				let rowId = this._getRowIndexById(configId);
				let row = this._tree.rows.get(rowId);

				if (row.chapter != sectionsByConfigIds[configId]) {
					row.chapter = sectionsByConfigIds[configId];
					this._tree.rows.set(rowId, row);
				}
			}
		},

		_deleteChildrenRows: function(row) {
			if (row.children) {
				for (let index = 0; index < row.children.length; index++) {
					this._deleteRows(row.children[index]);
				}
			}
		},

		_deleteRows: function(rowIndex) {
			const row = this._tree.rows.get(rowIndex);
			this._deleteChildrenRows(row);
			this._tree.rows.delete(rowIndex);
		},

		_reloadHandler: function() {
			this.suspendSectionsInvalidation(true);
			return this._collapseAll().then(function() {
				const rootName = 'root';
				this._rowsById = {};
				this._rowIndexes = [];

				let root = this._tree.rows.get(rootName);
				this._deleteChildrenRows(root);

				let treeData = this._getTreeData();
				treeData.rows.forEach(function(row, index) {
					this._tree.rows.set(index, row);
				}, this);

				root.children.length = 0;

				Array.prototype.push.apply(root.children, treeData.roots);

				this._tree.roots = [rootName];

				let selectedItems = this.viewmodel.GetSelectedItems();
				if (selectedItems.length > 0) {
					this.selectionChangeHandler(this.viewmodel, selectedItems);
				} else {
					this._tree.expandBranches(['root']);
				}
				this.suspendSectionsInvalidation(false);
			}.bind(this)).then(function() {
				this.viewmodel._invalidate(this.viewmodel.Dom());
			}.bind(this));
		},

		suspendSectionsInvalidation: function(suspend) {
			this._suspendSectionsInvalidation = suspend;
		},

		isSectionsInvalidationSuspended: function() {
			return this._suspendSectionsInvalidation;
		},

		_collapseAll: function() {
			let rowsToCollapse = [];
			this._tree.rows._store.forEach(function(row, index) {
				rowsToCollapse.push(this._collapse(index));
			}, this);

			return Promise.all(rowsToCollapse);
		},

		_onViewModelInvalidate: function(sender, earg) {
			if (!this.isSectionsInvalidationSuspended()) {
				const invalidationList = (earg && earg.invalidationList) || [];
				if (!this.viewmodel.isDomInitializing() && invalidationList.some(function(element) {
					return element.is('ArasBlockXmlSchemaElement');
				})) {
					this._invalidateSectionsAtRows();
				}
			}
		},

		_isStateIconUpdateAllowed: function(reqId) {
			if (reqId) {
				const rowIndex = this._getRowIndexById(reqId);
				const row = this._tree.rows.get(rowIndex);
				return row && !row.state;
			}
		},

		_setStateToTreeElement: function(newState, reqId) {
			if (this._isStateIconUpdateAllowed(reqId)) {
				this.setNewStateIcon(reqId, this._iconByState[newState]);
			}
		},

		refresh: function() {
			this._tree.render();
			this.setTreeTitle();
		},

		setTreeTitle: function() {
			var reqDocItem = this.viewmodel.GetRequirementDocumentWithRequirements();
			var newTitle = reqDocItem.getProperty('reqdoc_title');
			if (this._label != newTitle) {
				this._label = newTitle;
				var head = this._tree.head.get('requirement');
				head.label = this._label;
				this._tree.head.set('requirement', head);
			}
		},

		// There is no possibility to subscribe on this method if it handler for mouse down event. That's why that method is added
		onClickHandler: function(event) {
			this._onSelectRow(event);
		},

		_onSelectRow: function(event) {
			if (!event.target.closest('div.aras-grid-header')) {
				let selectedWrappedObjects = [];
				const rowNode = event.target.closest('tr.aras-grid-row');
				if (rowNode) {
					const rowId = this._tree.settings.indexRows[rowNode.dataset.index];
					const row = this._tree._rows.get(rowId);
					if (row) {
						const selectedOrigin = this.viewmodel._getOriginByReqId(row.reqId);
						if (selectedOrigin) {
							selectedWrappedObjects = this.viewmodel.GetElementsByOrigin(selectedOrigin);
						}
					}
				}
				this.viewmodel.Cursor().Set(null, -1, null, -1);
				this.viewmodel.SetSelectedItems(selectedWrappedObjects);
			}
		},

		selectionChangeHandler: function(sender, selectedItems) {
			if (selectedItems.length != 0) {
				var parent = this.viewmodel._getClassifiedParentElement(selectedItems[0]);
				var reqId = parent.origin.getAttribute('reqId');
				var rowIndex = this._getRowIndexById(reqId);

				this._setActiveRow(rowIndex);
				this._expandAllParents(rowIndex);
			} else {
				this.clearSelection();
			}
		},

		_setActiveRow: function(rowIndex) {
			this._tree.settings.selectedRows = [];
			this._tree.settings.selectedRows.push(rowIndex);
			return this._tree.render();
		},

		clearSelection: function() {
			this._tree.settings.selectedRows = [];
			return this._tree.render();
		},

		_getActiveRows: function() {
			return this._tree.settings.selectedRows;
		},

		_expandAllParents: function(rowIndex) {
			var expandHierarchy = this._calculateExpandHierarchy(rowIndex);
			this._tree.expandBranches(expandHierarchy);
		},

		_calculateExpandHierarchy: function(rowId) {
			var parentRowId = this._getParentRowIndex(rowId);
			// parentRowId can be equal to 0
			if (parentRowId != undefined) {
				var expandHierarchy = this._calculateExpandHierarchy(parentRowId);
				expandHierarchy.push(parentRowId);
				return expandHierarchy;
			}

			return [];
		},

		getAllParentsIdsByReqId: function(reqId) {
			var rowId = this._getRowIndexById(reqId);
			return this._calculateExpandHierarchy(rowId);
		},

		_getParentRowIndex: function(rowIndex) {
			const row = this._tree.rows.get(rowIndex);
			return row && row.parentIndex;
		},

		_initContextMenu: function() {
			this._contextMenu = new ArasModules.ContextMenu();
			this._menuData = {
				'new_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_newrequirement')
				},
				'pick_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_pickrequirement')
				},
				'replace_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_replacerequirement')
				},
				'copy_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_copyrequirement')
				},
				'paste_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_pasterequirement')
				},
				'move_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_moverequirement'),
					children: {
						'move_up': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_move_up_requirement')},
						'move_down': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_move_down_requirement')},
						'move_indent': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_move_indent_requirement')},
						'move_unindent': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_move_unindent_requirement')}
					}
				},
				'before_remove_separator': {},
				'remove_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_removerequirement'),
					children: {
						'remove_current': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_remove_current')},
						'remove_nested': {label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_remove_nested')}
					}
				},
				'before_view_separator': {},
				'view_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_viewrequirement')
				}
			};
			this._menuDataForEmptyArea = {
				'new_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_newrequirement')
				},
				'pick_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_pickrequirement')
				},
				'paste_requirement': {
					label: this.aras.getResource('../Solutions/RE', 'chaptertree_contextmenu_pasterequirement')
				}
			};
			this._contextMenu.on('click', this._contextMenuClick.bind(this));
		},

		_reInitMenuBasedOnSelectedItem: function(rowIndex) {
			var menuData = this._getMenuData(rowIndex);

			menuData['paste_requirement'].disabled = (!this._clipboard || this._clipboard.rowIndex == undefined);
			// rowIndex can be equal to 0
			if (rowIndex != undefined) {
				var moveState = this._getMoveMenuState(rowIndex);
				var movements = menuData['move_requirement'].children;
				movements['move_up'].disabled = moveState.up;
				movements['move_down'].disabled = moveState.down;
				movements['move_indent'].disabled = moveState.indent;
				movements['move_unindent'].disabled = moveState.unindent;
			}
			this._contextMenu.applyData(menuData);
		},

		_getMenuData: function(rowIndex) {
			// rowIndex can be equal to 0
			return rowIndex != undefined ? this._menuData : this._menuDataForEmptyArea;
		},

		_showContextMenu: function(e) {
			e.preventDefault();
			e.stopPropagation();

			if (this.viewmodel.IsItemLockedByUser() && !e.target.closest('div.aras-grid-header')) {
				var row = e.target.closest('tr.aras-grid-row');
				var rowId;
				if (row) {
					rowId = this._tree.settings.indexRows[row.dataset.index];
				}
				this._reInitMenuBasedOnSelectedItem(rowId);

				this._contextMenu.show({x: e.clientX, y: e.clientY}, rowId);
			}
		},

		_contextMenuClick: function(menuItemId, e, rowId) {
			this.ExecuteAction(menuItemId, e, rowId);
		},

		_appendEmptyRowToTree: function() {
			const gridView = this._tree.view;

			const tr = document.createElement('tr');
			tr.setAttribute('class', 'aras-grid-row');
			tr.innerHTML = '<td class="aras-grid-row-cell" />';

			gridView.scroller.firstChild.appendChild(tr);
			gridView.bodyBoundary.scrollTop += gridView.defaultSettings.rowHeight;

			return tr;
		},

		_isLastRenderedRow: function(row) {
			const gridTable = this._tree.view.scroller.firstChild;
			const lastRenderedRow = gridTable.lastChild;
			return lastRenderedRow.getAttribute('data-index') === row.chapter;
		},

		_newRequirement: function(rowId, isLastChild) {
			var parentRow = this._tree.rows._store.get(rowId);
			var newRowId = this.aras.generateNewGUID();
			var newRowIndex = this._getNewRowIndex();
			this._addNewElementToTree(rowId, parentRow, newRowId, newRowIndex, null, isLastChild).then(function() {
				var oldActiveRow = this._getActiveRows()[0];
				let emptyRow;
				if (this._isLastRenderedRow(parentRow)) {
					emptyRow = this._appendEmptyRowToTree();
				}
				this._setActiveRow(newRowIndex).then(function() {
					if (emptyRow) {
						this._tree.view.scroller.firstChild.removeChild(emptyRow);
					}
					var newNode = this._tree.dom.querySelector('span[reqId="' + newRowId + '"]');
					if (newNode && newNode.parentNode) {
						var xmlSchemaHelper = this.viewmodel.Schema();
						var schemaItem = xmlSchemaHelper.getSchemaItem();
						const reqItem = this._requirementsHelper.getNewRequirement(newRowId, {
							properties: {
								'req_document_type': schemaItem.getID()
							},
							attributes: {
								'treeIndex': newRowIndex,
								'parentId': parentRow.reqId
							}
						});
						this._requirementDialog.show({
							requirement: reqItem,
							node: newNode.parentNode,
							callback: {
								'onSuccess': this._populateNewRequirement.bind(this, reqItem),
								'onCancel': function() {
									this._removeTreeRow(newRowIndex, newRowId);
									this._setActiveRow(oldActiveRow);
								}.bind(this)
							}
						});
					}
				}.bind(this));
			}.bind(this));
		},

		_removeTreeRow: function(rowIndex, rowId) {
			const parentRowIndex = this._getParentRowIndex(rowIndex);
			const parentRow = this._tree.rows.get(parentRowIndex);
			const childIndex = parentRow.children.indexOf(rowIndex);
			Array.prototype.splice.apply(parentRow.children, [childIndex, 1]);
			delete this._tree.settings.indexTreeRows[rowIndex];
			this._removeRowIndexById(rowId);
			this._tree.rows.delete(rowIndex);
			this._invalidateMetadata([{index: parentRowIndex, children: parentRow.children}]);
		},

		_addNewElementToTree: function(rowId, parentRow, newRowId, newRowIndex, name, isLastChild) {
			return this._collapse(rowId).then(function() {
				const newRowInfo = {
					name: name,
					id: newRowId,
					index: newRowIndex,
				};
				this._addNewRowToTreeStore(rowId, parentRow, newRowInfo, isLastChild);
				return this._tree.expand(rowId);
			}.bind(this));
		},

		_addNewElementListToTree: function(rowId, parentRow, newRowsList, isLastChild) {
			return this._collapse(rowId).then(function() {
				const rowsList = !isLastChild ? newRowsList.slice(0).reverse() : newRowsList;
				for (let i = 0; i < rowsList.length; i ++) {
					this._addNewRowToTreeStore(rowId, parentRow, rowsList[i], isLastChild);
				}
				return this._tree.expand(rowId);
			}.bind(this));
		},

		_addNewRowToTreeStore: function(rowId, parentRow, newRowInfo, isLastChild) {
			const newRow = {
				requirement: newRowInfo.name || '...',
				icon: '../Solutions/RE/Images/Requirement.svg?req=3',
				children: false,
				reqId: newRowInfo.id,
				chapter: '...'
			};

			this._setRowsById(newRowInfo.id, newRowInfo.index);
			if (!Array.isArray(parentRow.children)) {
				parentRow.children = [];
			}

			this._tree.rows._store.set(newRowInfo.index, newRow);
			if (isLastChild) {
				parentRow.children.push(newRowInfo.index);
			} else {
				parentRow.children.unshift(newRowInfo.index);
			}
			newRow.parentIndex = rowId;

			this._tree.settings.indexTreeRows[rowId] = parentRow.children;
			this._tree.metadata = this._tree.actions._calcRowsMetadata(this._tree.settings.indexTreeRows);
		},

		_populateNewRequirement: function(requirement, appendExist) {
			if (!this.chapterTreeHelper._validateRequiredFields(requirement)) {
				return false;
			}
			const treeIndex = this._requirementsHelper.getRequirementAttributeValue(requirement, 'treeIndex');
			const parentId = this._requirementsHelper.getRequirementAttributeValue(requirement, 'parentId');
			var row = this._tree.rows._store.get(parseInt(treeIndex));
			if (row) {
				row.requirement = this._requirementsHelper.getRequirementPropertyValue(requirement, 'req_title');
				this._tree.render();
			}

			this.viewmodel.AddRequirementToRequirementDocument(requirement);
			if (!appendExist) {
				let classification = this.viewmodel.GetNormalizedClassification(requirement);
				const reqId = this._requirementsHelper.getRequirementId(requirement);
				this._createNewElement(parentId, reqId, classification);
			} else {
				this._appendExistElement(requirement);
			}

			return true;
		},

		_createNewElement: function(parentReqIdId, requirementId, target) {
			var selectedOrigin;
			if (parentReqIdId == 0) {
				var arasBlockOrigin = this.viewmodel.Dom().origin;
				selectedOrigin = arasBlockOrigin.lastChild || arasBlockOrigin;
			} else {
				selectedOrigin = this.viewmodel.origin.selectSingleNode('/aras:document/aras:content/aras:block/*[@reqId="' + parentReqIdId + '"]');
			}
			if (selectedOrigin) {
				var selectedWrappedObject = this.viewmodel.GetElementsByOrigin(selectedOrigin);
				var action = this._actionsHelper.viewActions['appendelement'];
				var direction = selectedWrappedObject[0].nodeName == 'aras:block' ? 'insert' : 'append';
				action.handler.Execute({
					elementName: target,
					context: selectedWrappedObject[0],
					direction: direction
				});
			}
		},

		_pickRequirement: function(rowId, isLastChild) {
			const topWindow = this.aras.getMostTopWindowWithAras(window);
			return window.parent.ArasModules.MaximazableDialog.show('iframe', {
				aras: this.aras,
				type: 'SearchDialog',
				multiselect: true,
				itemtypeName: 're_Requirement'
			}).promise.then(
				function(searchResult) {
					this.aras.browserHelper.toggleSpinner(topWindow.document, true);
					if (searchResult && searchResult.length) {
						const newReqItems = this._requirementsHelper.getExistingRequirementsFromServer({
							attributes: {
								'idlist': Array.prototype.join.call(searchResult),
								'language': this.viewmodel.CurrentLanguageCode()
							}
						});
						if (newReqItems.isError()) {
							this.aras.AlertError(newReqItems.isEmpty() ?
								this.aras.getResource('../Solutions/RE', 'chaptertree_pick_newly_unsaved_req') : newReqItems);
							this.aras.browserHelper.toggleSpinner(topWindow.document, false);
							return;
						}

						const newRowsList = [];
						const parentRow = this._tree.rows._store.get(rowId);
						let newRowIndex = this._getNewRowIndex();
						let duplucates = [];
						const itemsCount = this._requirementsHelper.getItemsCount(newReqItems);
						for (let i = 0; i < itemsCount; i++) {
							const currentReq = this._requirementsHelper.getItemByIndex(newReqItems, i);
							const newReqId = this._requirementsHelper.getRequirementPropertyValue(currentReq, 'config_id');
							const isDuplucate = this._rowsById.hasOwnProperty(newReqId);
							if (isDuplucate) {
								duplucates.push(this._requirementsHelper.getRequirementPropertyValue(currentReq, 'req_title'));
								continue;
							}

							this._requirementsHelper.setRequirementAttributeValue(currentReq, 'treeIndex', newRowIndex);
							this._requirementsHelper.setRequirementAttributeValue(currentReq, 'parentId', parentRow.reqId);
							newRowsList.push({
								name: this._requirementsHelper.getRequirementPropertyValue(currentReq, 'req_title'),
								id: newReqId,
								index: newRowIndex,
								reqItem: currentReq
							});
							newRowIndex++;
						}

						if (duplucates.length) {
							this.aras.AlertError(this.aras.getResource('../Solutions/RE', 'chaptertree_requirements_list_duplicate',
								newRowsList.length, '\n' + duplucates.length, ': ' + duplucates.join(', ')));
						}

						if (newRowsList.length) {
							return this._addNewElementListToTree(rowId, parentRow, newRowsList, isLastChild).then(function() {
								const arrayOfPromises = [];
								this.viewmodel.SuspendInvalidation();
								for (let i = 0; i < newRowsList.length; i++) {
									const newRow = newRowsList[i];
									arrayOfPromises.push(this._setActiveRow(newRow.index).then(function() {
										this._populateNewRequirement(newRow.reqItem, true, true);
									}.bind(this)));
								}
								return Promise.all(arrayOfPromises).then(function() {
									const firstAddedReqId = newRowsList[0].id;
									this.viewmodel.restoreItemSelectionByReqId(firstAddedReqId);
									this.viewmodel.ResumeInvalidation();
									this.aras.browserHelper.toggleSpinner(topWindow.document, false);
								}.bind(this));
							}.bind(this));
						}
					}
					this.aras.browserHelper.toggleSpinner(topWindow.document, false);
				}.bind(this)
			);
		},

		_appendExistElement: function(requirement) {
			this._applyRequirementAction('appendexistingrequirement', requirement);
		},

		_replaceExistElement: function(requirement, toReplaceReqId) {
			this._applyRequirementAction('replacerequirement', requirement, toReplaceReqId);
		},

		_applyRequirementAction: function(actionName, requirement, selectedReqId) {
			var action = this._actionsHelper.viewActions[actionName];
			var selectedItem;
			if (!selectedReqId) {
				selectedItem = this._getPreviousNode();
			}
			if (selectedReqId && !selectedItem) {
				var selectedOrigin = this.viewmodel.origin.selectSingleNode('/aras:document/aras:content/aras:block/*[@reqId="' + selectedReqId + '"]');
				if (selectedOrigin) {
					var wrappedObject = this.viewmodel.GetElementsByOrigin(selectedOrigin);
					selectedItem = wrappedObject && wrappedObject[0];
				}
			}
			const contentAsString = this._requirementsHelper.getRequirementPropertyValue(requirement, 'content', '', this.viewmodel.CurrentLanguageCode());
			var content = new XmlDocument();
			content.loadXML(contentAsString);
			action.handler.Execute({
				selectedItem: selectedItem,
				content: content.firstChild
			});
		},

		_removeRequirement: function(rowId, allStructure, skipReqDocUpdate) {
			var elements = [];
			var reqsToDelete = [];
			var setRowsElements = (function(reqId) {
				var selectedOrigin = this.viewmodel.origin.selectSingleNode('/aras:document/aras:content/aras:block/*[@reqId="' + reqId + '"]');
				if (selectedOrigin) {
					var element = this.viewmodel.GetElementsByOrigin(selectedOrigin);
					if (element && element[0]) {
						elements.push(element[0]);
					}

					reqsToDelete.push(reqId);
				}
			}).bind(this);

			var deleteChildRows = (function(parentRowIndex) {
				var parentRow = this._tree.rows.get(parentRowIndex);
				if (parentRow.children) {
					for (var index = 0; index < parentRow.children.length; index++) {
						var rowIndex = parentRow.children[index];
						deleteChildRows(rowIndex);
					}
					delete this._tree.settings.indexTreeRows[parentRowIndex];
				}

				var reqId = parentRow.reqId;
				setRowsElements(reqId);
				this._removeRowIndexById(reqId);
				this._tree.rows.delete(parentRowIndex);
			}).bind(this);

			const parentRowIndex = this._getParentRowIndex(rowId);
			let newChilds = [];
			if (!allStructure) {
				const currentRow = this._tree.rows._store.get(rowId);
				const currentRowChildren = currentRow.children;
				if (currentRowChildren && currentRowChildren.length) {
					for (let i = 0; i < currentRowChildren.length; i++) {
						const childIndex = currentRowChildren[i];
						const childRow = this._tree.rows._store.get(childIndex);
						childRow.parentIndex = parentRowIndex;
					}
					newChilds = newChilds.concat(currentRowChildren);
				}

				currentRow.children = false;
			}

			deleteChildRows(rowId);
			var parentRow = this._tree.rows.get(parentRowIndex);
			var childIndex = parentRow.children.indexOf(rowId);
			var args = [childIndex, 1].concat(newChilds);
			Array.prototype.splice.apply(parentRow.children, args);

			if (this._clipboard.rowIndex == rowId) {
				this._clipboard = {};
			}

			var action = this._actionsHelper.viewActions['removeelement'];
			this.viewmodel.SuspendInvalidation();
			action.handler.Execute({
				selectedItems: elements
			});
			this.viewmodel.ResumeInvalidation();

			if (!skipReqDocUpdate) {
				this.viewmodel.MarkAsDeletedRequirementDocRequirementsByIds(reqsToDelete);
			}

			var sectionsById = this.chapterTreeHelper._getSectionsByConfigIds(this._tree);
			this.viewmodel.InvalidateSections(sectionsById);

			this._invalidateMetadata([{index: parentRowIndex, children: parentRow.children}]);

			this.viewmodel.restoreItemSelectionByReqId(parentRow.reqId);
		},

		_replaceRequirement: function(rowId) {
			window.parent.ArasModules.MaximazableDialog.show('iframe', {
				aras: this.aras,
				type: 'SearchDialog',
				itemtypeName: 're_Requirement',
			}).promise.then(
				function(searchResult) {
					if (searchResult && searchResult.itemID) {
						this._replaceRequirementBySelected(searchResult.itemID, rowId, true);
					}
				}.bind(this)
			);
		},

		_replaceRequirementBySelected: function(requirementId, rowId, doReplacementInItem) {
			this._replaceRequirementImplementation(requirementId, rowId, doReplacementInItem, false);
		},

		_updateRequirementBySelected: function(requirementId, rowId) {
			this._replaceRequirementImplementation(requirementId, rowId, false, true);
		},

		_replaceRequirementImplementation: function(requirementId, rowId, doReplacementInItem, ignoreDuplicates) {
			const newReqItem = this._requirementsHelper.getExistingRequirementsFromServer({
				attributes: {
					'id': requirementId,
					'language': this.viewmodel.CurrentLanguageCode()
				}
			});
			if (newReqItem.isError()) {
				this.aras.AlertError(newReqItem.isEmpty() ?
					this.aras.getResource('../Solutions/RE', 'chaptertree_pick_newly_unsaved_req') : newReqItem);
				return;
			}

			if (!ignoreDuplicates && !this.chapterTreeHelper._requirementIsNotDuplicateValidation(newReqItem, this._rowsById)) {
				return;
			}

			var rowToReplace = this._tree.rows._store.get(rowId);
			var rowToReplaceReqId = rowToReplace.reqId;
			if (doReplacementInItem) {
				this.viewmodel.ReplaceRequirement(rowToReplaceReqId, newReqItem);
			}

			this._removeRowIndexById(rowToReplace.reqId);
			rowToReplace.reqId = this._requirementsHelper.getRequirementPropertyValue(newReqItem, 'config_id');
			this._setRowsById(rowToReplace.reqId, rowId);
			rowToReplace.requirement = this._requirementsHelper.getRequirementPropertyValue(newReqItem, 'req_title');
			this._setActiveRow(rowId);
			this._replaceExistElement(newReqItem, rowToReplaceReqId);
		},

		_addRowIndexToClipboard: function(rowIndex) {
			if (this._clipboard.rowIndex != rowIndex) {
				this._clipboard = {rowIndex: rowIndex, copy: 1};
			}
		},

		_pasteRequirement: function(parentRowIndex, isLastChild) {
			if (this._clipboard.rowIndex != undefined) {
				var reqIndexForCopy = this._clipboard.rowIndex;
				var rowForCopy = this._tree.rows.get(reqIndexForCopy);
				var parentRow = this._tree.rows._store.get(parentRowIndex);
				var newRequirement = this.viewmodel.AddCopyOfRequirementToRequirementDocument(rowForCopy.reqId, this._clipboard.copy);
				var sourceOrigin = this.viewmodel._getOriginByReqId(rowForCopy.reqId);

				const newReqId = this._requirementsHelper.getRequirementPropertyValue(newRequirement, 'config_id');
				const cloneNode = sourceOrigin.cloneNode(true);
				cloneNode.setAttribute('reqId', newReqId);

				const reqTitle = this._requirementsHelper.getRequirementPropertyValue(newRequirement, 'req_title');
				const requirementTitleNode = cloneNode.selectSingleNode('*[local-name()=\"Requirement-Info\"]/*[local-name()=\"Requirement-Title\"]');
				const requirementNumberNode = cloneNode.selectSingleNode('*[local-name()=\"Requirement-Info\"]/*[local-name()=\"Requirement-Number\"]');
				requirementTitleNode.firstChild.text = reqTitle;
				requirementNumberNode.firstChild.text = this.aras.getResource('../Solutions/RE', 'editor_item_number_server_assigned');

				var newRowIndex = this._getNewRowIndex();

				this._addNewElementToTree(parentRowIndex, parentRow, newReqId, newRowIndex, reqTitle, isLastChild).then(function() {
					this._setActiveRow(newRowIndex).then(function() {
						var action = this._actionsHelper.viewActions['appendexistingrequirement'];
						var selectedItem = this._getPreviousNode();
						action.handler.Execute({
							selectedItem: selectedItem,
							content: cloneNode,
							isNew: true
						});

						this._clipboard.copy++;
					}.bind(this));
				}.bind(this));
			}
		},

		_getMoveMenuState: function(rowIndex) {
			var parentRowIndex = this._getParentRowIndex(rowIndex);
			var parentRow = this._tree.rows.get(parentRowIndex);
			var sequence = parentRow.children;

			var parentIsRootCurrentIsSingle = parentRowIndex == 'root' && sequence.length === 1;
			var currentPosition = sequence.indexOf(rowIndex);
			var state = {
				up: currentPosition === 0 || parentIsRootCurrentIsSingle,
				down: currentPosition === (sequence.length - 1) || parentIsRootCurrentIsSingle,
				indent: currentPosition === 0 || parentIsRootCurrentIsSingle,
				unindent: parentRowIndex == 'root'
			};

			return state;
		},

		_moveUpDown: function(rowId, isUp) {
			var handlerArgs = {};
			var sectionInfo;
			var parentRowIndex = this._getParentRowIndex(rowId);
			var currentRow = this._tree.rows._store.get(rowId);
			var parentRow = this._tree.rows._store.get(parentRowIndex);
			var currentPosition = parentRow.children.indexOf(rowId);
			var newPosition = currentPosition + (isUp ? -1 : 1);

			parentRow.children.splice(currentPosition, 1);
			parentRow.children.splice(newPosition, 0, rowId);

			var getSectionInfo = (function(sectionNumber, up) {
				var fragmentedSection = sectionNumber.split('.');
				var lastSectionIndex = parseInt(fragmentedSection[fragmentedSection.length - 1]) + (up ? (-1) : 1);
				var lastSectionPart = fragmentedSection.slice(0, -1);
				var newSectionNumber = lastSectionPart.join('.') + (lastSectionPart.length ? '.' : '') + lastSectionIndex;
				var reqId = this.viewmodel.GetReqIdBySectionNumber(newSectionNumber);
				return {sectionNumber: newSectionNumber, reqId: reqId};
			}).bind(this);

			if (isUp) {
				var upSectionNumber = this.viewmodel.GetSectionNumberById(currentRow.reqId);
				var sectionInfo = getSectionInfo(upSectionNumber, true);
				handlerArgs.upItemId = currentRow.reqId;
				handlerArgs.downItemId = sectionInfo.reqId;
				handlerArgs.upSectionNumber = upSectionNumber;
				handlerArgs.direction = 'up';
			} else {
				var downSectionNumber = this.viewmodel.GetSectionNumberById(currentRow.reqId);
				sectionInfo = getSectionInfo(downSectionNumber, false);
				handlerArgs.upItemId = sectionInfo.reqId;
				handlerArgs.downItemId = currentRow.reqId;
				handlerArgs.upSectionNumber = sectionInfo.sectionNumber;
				handlerArgs.direction = 'down';
			}

			var action = this._actionsHelper.viewActions['shiftrequirements'];
			action.handler.Execute(handlerArgs);

			this._invalidateMetadata([{index: parentRowIndex, children: parentRow.children}]);
			this._expandParentsRecursively(parentRowIndex);

			this._invalidateSectionsAtRows();
		},

		_expandParentsRecursively: function(index) {
			this._collapse(index).then(function() {
				this._tree.expand(index).then(function() {
					var parentIndex = this._getParentRowIndex(index);
					// parentIndex can be 0
					if (parentIndex != undefined) {
						this._expandParentsRecursively(parentIndex);
					}
				}.bind(this));
			}.bind(this));
		},

		_invalidateMetadata: function(rowsToInvalidate) {
			for (var invalidateIndex = 0; invalidateIndex < rowsToInvalidate.length; invalidateIndex++) {
				var row = rowsToInvalidate[invalidateIndex];
				this._tree.settings.indexTreeRows[row.index] = row.children;
			}

			this._tree.metadata = this._tree.actions._calcRowsMetadata(this._tree.settings.indexTreeRows);
		},

		_moveRightLeft: function(rowId, isLeft) {
			var parentRowIndex = this._getParentRowIndex(rowId);
			return this._collapse(parentRowIndex).then(function() {
				var currentRow = this._tree.rows._store.get(rowId);
				var parentRow = this._tree.rows._store.get(parentRowIndex);
				var currentPosition = parentRow.children.indexOf(rowId);
				parentRow.children.splice(currentPosition, 1);

				var newParentIndex;
				var newParent;
				var action = this._actionsHelper.viewActions['shiftrequirements'];
				if (isLeft) {
					newParentIndex = this._getParentRowIndex(parentRowIndex);
					newParent = this._tree.rows._store.get(newParentIndex);
					var parentIndex = newParent.children.indexOf(parentRowIndex);
					newParent.children.splice(parentIndex + 1, 0, rowId);
					if (newParent.children.length === 0) {
						newParent.children = false;
					}

					var sectionNumber = this.viewmodel.GetSectionNumberById(currentRow.reqId);
					currentRow.parentIndex = newParentIndex;

					action.handler.Execute({
						unindentItemId: currentRow.reqId,
						unindentSectionNumber: sectionNumber,
						direction: 'unindent'
					});
				} else {
					newParentIndex = parentRow.children[currentPosition - 1];
					newParent = this._tree.rows._store.get(newParentIndex);
					if (!Array.isArray(newParent.children)) {
						newParent.children = [];
					}
					currentRow.parentIndex = newParentIndex;

					newParent.children.push(rowId);
					action.handler.Execute({
						direction: 'indent'
					});
				}

				// remove expand/collaps icon if there is no child items
				if (parentRow.children.length === 0) {
					parentRow.children = false;
				}

				this._invalidateMetadata([{index: parentRowIndex, children: parentRow.children}, {index: newParentIndex, children: newParent.children}]);
				this._tree.expand(parentRowIndex).then(function() {
					this._expandParentsRecursively(newParentIndex);
				}.bind(this));

				this._invalidateSectionsAtRows();
			}.bind(this));
		},

		// was created separate method because there is a necessity to make some actions after new requirement was added to viewmodel
		// now there is an opportunity to subscribe on this method with "aspect.after"
		_addRequirement: function(requirement) {
			var action = this._actionsHelper.viewActions['appendexistingrequirement'];
			var lastElement = this.viewmodel.getLastChildElementInRoot();
			const contentAsString = this._requirementsHelper.getRequirementPropertyValue(requirement, 'content', null, this.viewmodel.CurrentLanguageCode());
			var content = new XmlDocument();
			content.loadXML(contentAsString);
			action.handler.Execute({
				selectedItem: lastElement,
				content: content.firstChild
			});
		},

		_onReqDocContentChange: function(evnt) {
			const eventType = evnt.eventType;
			switch (eventType) {
				case 'update':
					const oldReqRowId = this._getRowIndexById(evnt.requirementToReplaceId);
					this._updateRequirementBySelected(evnt.requirementId, oldReqRowId);
					break;
				case 'delete':
					const reqId = evnt.reqsId.currentReq;
					const rowId = this._getRowIndexById(reqId);
					this._removeRequirement(rowId, false, true);
					break;
				default:
					break;
			}
		},

		ExecuteAction: function(menuItemId, e, rowId) {
			switch (menuItemId) {
				case 'new_requirement':
					// rowId can be equal to 0
					if (rowId != undefined) {
						this._newRequirement(rowId);
					} else {
						this._newRequirement('root', true);
					}
					break;
				case 'pick_requirement':
					// rowId can be equal to 0
					if (rowId != undefined) {
						this._pickRequirement(rowId);
					} else {
						this._pickRequirement('root', true);
					}
					break;
				case 'remove_current':
					this._removeRequirement(rowId, false);
					break;
				case 'remove_nested':
					this._removeRequirement(rowId, true);
					break;
				case 'view_requirement':
					var row = this._tree.rows._store.get(rowId);
					if (row) {
						this.viewmodel.ViewRequirementById(row.reqId);
					}
					break;
				case 'replace_requirement':
					this._replaceRequirement(rowId);
					break;
				case 'copy_requirement':
					this._addRowIndexToClipboard(rowId);
					break;
				case 'paste_requirement':
					// rowId can be equal to 0
					if (rowId != undefined) {
						this._pasteRequirement(rowId);
					} else {
						this._pasteRequirement('root', true);
					}
					break;
				case 'move_up':
					this._moveUpDown(rowId, true);
					break;
				case 'move_down':
					this._moveUpDown(rowId, false);
					break;
				case 'move_unindent':
					this._moveRightLeft(rowId, true);
					break;
				case 'move_indent':
					this._moveRightLeft(rowId, false);
					break;
				default:
					break;
			}
		},

		getActionByControlId: function(id) {
			return this.controlsActionMap[id];
		},

		ExecuteToolbarAction: function(controlId, params) {
			var selectedElements = this.viewmodel.GetSelectedItems();

			if (selectedElements.length) {
				var selectedElement = this.viewmodel._getClassifiedParentElement(selectedElements[0]);
				var elementId = selectedElement.origin.getAttribute('reqId');
				var rowId = this._getRowIndexById(elementId);
			}

			switch (controlId) {
				case 're_new':
					switch (params.relatedDropDownValue) {
						case 'Create Related':
							if (rowId >= 0) {
								this._newRequirement(rowId);
							} else {
								this._newRequirement('root', true);
							}
							break;
						case 'Pick Related':
							if (rowId >= 0) {
								this._pickRequirement(rowId);
							} else {
								this._pickRequirement('root', true);
							}
							break;
					}
					break;
				default:
					var action = this.getActionByControlId(controlId);
					this.ExecuteAction(action, null, rowId);
					break;
			}
		},

		_getPreviousNode: function() {
			var newRow = this._tree.settings.selectedRows[0];
			return this._tree.settings.indexTreeRows['root'].indexOf(newRow) != -1 ? this.viewmodel.getLastChildElementInRoot() :
				this.viewmodel.GetSelectedItems()[0];
		},

		_collapse: function(rowId) {
			return this._tree.collapse(rowId).then(function() {
				// "collapse" will not remove row number from "settings.expanded" if row doesn't have descendants
				// Need to be sure that "expanded" doesn't contain collapsed row number
				if (this._tree.settings.expanded.has(rowId)) {
					this._tree.settings.expanded.delete(rowId);
				}
			}.bind(this));
		}
	});
});
