/* global define, CMF */
define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'./StructureMappingHelper',
	'./StoreFormatTransformer',
	'./ComputedMethodHelper',
	'./PublicApi/Element'
], function (
	declare,
	lang,
	StructureMappingHelper,
	StoreFormatTransformer,
	ComputedMethodHelper,
	ApiElement
) {
	return declare('Controller', [], {
		dataStore: null,
		actionStore: null,
		tree: null,
		grid: null,
		transformer: null,
		stuctureMapping: null,
		qpDocumentId: null,
		findControl: null,
		collectedRows: {},

		constructor: function (
			dataStore,
			actionStore,
			tree,
			grid,
			qpDocumentId,
			findControl
		) {
			this.dataStore = dataStore;
			this.actionStore = actionStore;
			this.tree = tree;
			this.grid = grid;
			this.findControl = findControl;
			this.qpDocumentId = qpDocumentId;

			this.computedMethodHelper = new ComputedMethodHelper(dataStore);
			this.stuctureMapping = new StructureMappingHelper(dataStore);
			this.transformer = new StoreFormatTransformer();
		},

		onChange: function (action, changeObject) {
			if (action) {
				switch (action) {
					case 'add':
						return this.onDocumentElementAdd(changeObject);
					case 'remove':
						return this.deleteDocumentElement(
							changeObject.nodeId,
							changeObject.parentNodeId
						);
					case 'update':
						return this.updateDocElementProperty(changeObject);
					case 'release reference':
						this.onReleaseReference(changeObject);
						break;
					case 'permission changed':
						this.onPermissionChanged(changeObject);
						break;
					case 'accept candidate':
						this.onAcceptCandidate(changeObject.element, changeObject.changes);
						break;
					case 'update copy elements':
						this.updateCollectedGridRows();
						break;
					case 'on apply binding':
						this.onApplyBinding(changeObject.element);
						break;
					case 'on apply wrong binding':
						this.onReplaceBinding(changeObject.element, changeObject.relatedId);
						break;
					case 'bind':
						this.onReplaceBinding(changeObject.element, changeObject.relatedId);
						break;
					case 'resort':
						this.onResortItems(changeObject.element);
						break;
					case 'accept all candidates':
						this.onAcceptAllCandidates(changeObject.allCandidates);
						break;
					default:
						break;
				}
			}
			return null;
		},

		onDocumentElementAdd: function (changeObject) {
			return this.createDocumentElement(
				changeObject.parentNodeId,
				changeObject.docElemTypeId,
				changeObject.rootItemId,
				changeObject.beforeInsertItem,
				changeObject.boundItemId,
				changeObject.isValidateExistence,
				changeObject.copy,
				changeObject.isToSelectForEdit
			);
		},

		filterChangedTableItems: function (changedByComputedMethods, newNode) {
			if (changedByComputedMethods.changeTableItems.length > 0) {
				var realChanged = [];
				for (
					var i = 0;
					i < changedByComputedMethods.changeTableItems.length;
					i++
				) {
					var current = changedByComputedMethods.changeTableItems[i];
					if (newNode.tableItemIds.indexOf(current.id) < 0) {
						realChanged.push(current);
					}
				}
				changedByComputedMethods.changeTableItems = realChanged;
			}
		},

		generateChangedRowNodes: function (
			action,
			rootItem,
			changedTableItemsObject
		) {
			var changedRowNodes = {};
			if (action === 'add') {
				changedRowNodes[rootItem.id] = rootItem;
			} else if (action === 'delete') {
				if (rootItem && rootItem.id !== 'root') {
					changedRowNodes[rootItem.id] = rootItem;
				}
			}

			for (var changedRowId in changedTableItemsObject.changeRowIds) {
				// jshint ignore:line
				if (!changedRowNodes[changedRowId]) {
					var changed = this.dataStore.getDocElement(changedRowId);
					if (changed) {
						changedRowNodes[changedRowId] = changed;
					}
				}
			}

			return changedRowNodes;
		},

		getCopyOfTableItems: function (items) {
			var res = [];
			for (var i = 0; i < items.length; i++) {
				res.push(items[i].getCopy());
			}
			return res;
		},

		fillActionObjectForNodeAdd: function (
			actionObject,
			newNode,
			rootNode,
			beforeInsertItem,
			changeTableItems,
			changedRowNodes
		) {
			var currentSelectedNode = this.tree.getSelectedNode();
			actionObject.addedNode = {
				node: newNode,
				rootNode: rootNode,
				beforeId: beforeInsertItem ? beforeInsertItem.id : null
			};
			actionObject.updatedNodes = {
				changedRowNodes: changedRowNodes,
				changeTableItems: this.getCopyOfTableItems(changeTableItems)
			};
			actionObject.selectedItemId = currentSelectedNode
				? currentSelectedNode.id
				: null;
			actionObject.selectedTableItemId = this.tree.lastSelectedTableId; /// !!!!!
			actionObject.cmfDocumentId = this.qpDocumentId;
			return actionObject;
		},

		fillActionObjectForNodeDelete: function (
			actionObject,
			deletedNode,
			rootNode,
			changedItemsObject,
			changedRowNodes
		) {
			var changeTableItems = changedItemsObject.changeTableItems;
			var currentSelectedNode = this.tree.getSelectedNode();
			actionObject.deletedNodes = {
				deletedNode: deletedNode,
				rootNode: rootNode
			};
			actionObject.updatedNodes = {
				changedRowNodes: changedRowNodes,
				changeTableItems: this.getCopyOfTableItems(changeTableItems),
				beforeChangedTableItems: changedItemsObject.beforeChangedTableItems
			};
			actionObject.selectedItemId = currentSelectedNode
				? currentSelectedNode.id
				: null;
			actionObject.selectedTableItemId = this.tree.lastSelectedTableId;
			actionObject.cmfDocumentId = this.qpDocumentId;
			return actionObject;
		},

		fillActionObjectForNodeUpdate: function (
			actionObject,
			changedItemsObject,
			changedRowNodes
		) {
			var currentSelectedNode = this.tree.getSelectedNode();
			if (!actionObject.updatedNodes) {
				actionObject.updatedNodes = {
					changedRowNodes: changedRowNodes,
					changeTableItems: this.getCopyOfTableItems(
						changedItemsObject.changeTableItems
					),
					beforeChangedTableItems: changedItemsObject.beforeChangedTableItems
				};
			} else {
				var updatedNodes = actionObject.updatedNodes;
				updatedNodes.changeTableItems = updatedNodes.changeTableItems.concat(
					this.getCopyOfTableItems(changedItemsObject.changeTableItems)
				);
				updatedNodes.beforeChangedTableItems = updatedNodes.beforeChangedTableItems.concat(
					changedItemsObject.beforeChangedTableItems
				);
				lang.mixin(updatedNodes.changedRowNodes, changedRowNodes);
			}
			actionObject.selectedItemId = currentSelectedNode
				? currentSelectedNode.id
				: null;
			actionObject.selectedTableItemId = this.tree.lastSelectedTableId;
			actionObject.cmfDocumentId = this.qpDocumentId;
			return actionObject;
		},

		createChangedObject: function (tableItem, beforeChanged, rootNode) {
			var changedTableItemsObject = {
				changeTableItems: [],
				beforeChangedTableItems: [],
				changeRowIds: {}
			};

			changedTableItemsObject.changeTableItems.push(tableItem);
			changedTableItemsObject.beforeChangedTableItems.push(beforeChanged);
			changedTableItemsObject.changeRowIds[rootNode.id] = true;
			return changedTableItemsObject;
		},

		updateItemInGrid: function (element, flagged) {
			var rootItem = this.dataStore.getDocElement(element.rootItemId);
			var tableItems = this.dataStore.getPropertyElements(element);

			element.flagged = flagged ? flagged : undefined;

			for (var i = 0; i < tableItems.length; i++) {
				tableItems[i].isCandidate = element.isCandidate;
				tableItems[i].flagged = element.flagged;
				if (tableItems[i].visible) {
					this.grid.updateCell(rootItem, tableItems[i]);
				}
			}

			// re-render row, because empty cells styles should be updated
			const currrentRow = this._getGridRow(rootItem);
			this.grid.redrawRow(currrentRow);
		},

		rollbackCandidatesInGrid: function (changedObject) {
			if (changedObject.reason === 'remove candidate') {
				if (changedObject.element.isRootItem) {
					var nextElement = this.dataStore.findNextElement(
						changedObject.element,
						true
					);
					var newNode = this._getGridRow(changedObject.element);
					this.grid.addRow(newNode, nextElement ? nextElement.id : null);
					return;
				}
			}

			if (changedObject.reason === 'add candidate') {
				if (changedObject.element.isRootItem) {
					this.grid.deleteRow(changedObject.element.id);
					return;
				}
			}

			var rootItem = this.dataStore.getDocElement(
				changedObject.element.rootItemId
			);
			var updatedRow = this._getGridRow(rootItem);
			this.grid.insertCells(updatedRow);
		},

		updateCandidatesInTree: function (changedElement) {
			var parentElement = this.dataStore.getDocElement(changedElement.parentId);
			if (changedElement.reason === 'remove candidate') {
				this.tree.updateElementInTree(parentElement, null);
			} else {
				this.tree.updateElementInTree(parentElement, changedElement);
			}
		},

		rollbackCandidatesInTree: function (changedObject) {
			var parentElement = this.dataStore.getDocElement(
				changedObject.element.parentId
			);
			if (changedObject.reason === 'remove candidate') {
				this.tree.updateElementInTree(parentElement, changedObject.element);
			} else {
				this.tree.updateElementInTree(parentElement, null);
			}
		},

		updateCandidatesInGrid: function (changedObject) {
			if (changedObject.reason === 'remove candidate') {
				if (changedObject.element.isRootItem) {
					this.grid.deleteRow(changedObject.element.id);
					return;
				}
			}

			if (changedObject.reason === 'add candidate') {
				if (changedObject.element.isRootItem) {
					var newNode = this._getGridRow(changedObject.element);
					this.grid.addRow(newNode, changedObject.nextNodeId);
					return;
				}
			}

			var rootItem = this.dataStore.getDocElement(
				changedObject.element.rootItemId
			);
			var updatedRow = this._getGridRow(rootItem);
			this.grid.insertCells(updatedRow);
		},

		rollbackCandidate: function (element, changes) {
			this.updateItemInGrid(element, element.flagged);

			var parentNode = this.dataStore.getDocElement(element.parentId);
			this.tree.updateElementInTree(parentNode, element);

			this.rollbackSmmChanges(changes);

			var tableItems = this.dataStore.getPropertyElements(element, true);
			if (tableItems.length > 0) {
				this.grid.selectCell(
					this.dataStore.getDocElement(element.rootItemId),
					tableItems[0].id
				);
			}
		},

		acceptCandidate: function (element, changes) {
			this.updateItemInGrid(element, element.flagged);
			element.title = this.tree.getLabel(element);
			var parentNode = this.dataStore.getDocElement(element.parentId);
			this.tree.updateElementInTree(parentNode, element);
			this.applySmmChanges(changes);
			var tableItems = this.dataStore.getPropertyElements(element, true);
			if (tableItems.length > 0) {
				this.grid.selectCell(
					this.dataStore.getDocElement(element.rootItemId),
					tableItems[0].id
				);
			}
		},

		rollbackSmmChanges: function (changes) {
			for (var i = changes.length - 1; i >= 0; i--) {
				var changedObject = changes[i];

				if (
					changedObject.reason === 'became flagged' ||
					changedObject.reason === 'was flagged'
				) {
					this.updateItemInGrid(changedObject.element, changedObject.flagged);
					var parentNode = this.dataStore.getDocElement(
						changedObject.element.parentId
					);
					this.tree.updateElementInTree(parentNode, changedObject.element);
				}

				if (
					changedObject.reason === 'remove candidate' ||
					changedObject.reason === 'add candidate'
				) {
					var parentElement = this.dataStore.getDocElement(
						changedObject.element.parentId
					);
					if (changedObject.reason === 'remove candidate') {
						changedObject.element.isRemoved = false;
						this.dataStore.insertDocElement(
							parentElement,
							changedObject.element
						);
					} else {
						this.dataStore.removeDocElement(
							parentElement,
							changedObject.element
						);
					}

					this.rollbackCandidatesInTree(changedObject);
					this.rollbackCandidatesInGrid(changedObject);
				}
			}
		},

		applySmmChanges: function (changes) {
			for (var i = 0; i < changes.length; i++) {
				var changedObject = changes[i];
				if (
					changedObject.reason === 'became flagged' ||
					changedObject.reason === 'was flagged'
				) {
					this.updateItemInGrid(
						changedObject.element,
						changedObject.reason === 'was flagged'
							? null
							: changedObject.newFlagged
					);
					var parentNode = this.dataStore.getDocElement(
						changedObject.element.parentId
					);
					this.tree.updateElementInTree(parentNode, changedObject.element);
				}

				if (
					changedObject.reason === 'remove candidate' ||
					changedObject.reason === 'add candidate'
				) {
					var parentElement = this.dataStore.getDocElement(
						changedObject.element.parentId
					);
					if (changedObject.reason === 'remove candidate') {
						this.dataStore.removeDocElement(
							parentElement,
							changedObject.element
						);
					} else {
						if (changedObject.element.isRemoved) {
							this.dataStore.insertDocElement(
								parentElement,
								changedObject.element
							);
						}
					}

					this.updateCandidatesInTree(changedObject.element);
					this.updateCandidatesInGrid(changedObject);
				}
			}
		},

		addDocElementToAml: function (newItem) {
			this.actionStore.addAction({
				action: 'add',
				type: 'docElementType',
				itemId: newItem.id,
				docType: newItem.documentElementType.name,
				referenceId: newItem.relatedId,
				parentReferenceId: newItem.parentRelId,
				qpId: this.qpDocumentId,
				sortOrder: newItem.sortOrder,
				boundItemId: newItem.boundItemId,
				boundItemConfigId: newItem.boundItemConfigId,
				trackingMode: newItem.trackingMode,
				resolutionMode: newItem.resolutionMode
			});

			var tableItems = this.dataStore.getPropertyElements(newItem);
			for (var i = 0; i < tableItems.length; i++) {
				var tableItem = tableItems[i];
				this.actionStore.addAction({
					action: 'add',
					type: 'docElementProperty',
					itemId: tableItem.id,
					docType: tableItem.propertyName,
					qpId: this.qpDocumentId,
					value: tableItem.value,
					elementReferenceId: tableItem.elementReferenceId,
					propertyTypeId: tableItem.propertyTypeId,
					cmfStyleAml: CMF.Utils.getCmfStyleAml(tableItem.cmfStyle)
				});
			}
		},

		deleteDocElementInAml: function (item) {
			this.actionStore.addAction({
				action: 'delete',
				type: 'docElementType',
				itemId: item.id,
				docType: item.documentElementType.name,
				referenceId: item.relatedId,
				parentReferenceId: item.parentRelId,
				qpId: this.qpDocumentId
			});
		},

		onSpecificCellUpdated: function (
			rows,
			changedTableItems,
			action,
			isToUpdateLater,
			ignoreReadOnly,
			isSkipUpdateCell
		) {
			if (isToUpdateLater) {
				for (var changedRowId in rows) {
					// jshint ignore:line
					var changedRow = rows[changedRowId];
					if (changedRow.isRootOfTree) {
						continue;
					}
					if (!this.collectedRows[changedRowId]) {
						this.collectedRows[changedRowId] = changedRow;
					}
				}
			} else {
				var groupByTreeItem = {};
				changedTableItems.map(function (element) {
					if (!groupByTreeItem[element.treeItemId]) {
						groupByTreeItem[element.treeItemId] = [];
					}
					groupByTreeItem[element.treeItemId].push(element);
				});

				for (var treeItemId in groupByTreeItem) {
					// jshint ignore:line
					var treeItem = this.dataStore.getDocElement(treeItemId);
					this.transformer.manageBindingInfo(
						treeItem,
						groupByTreeItem[treeItemId]
					);
				}

				for (var i = 0; i < changedTableItems.length; i++) {
					var changed = changedTableItems[i];
					var changedTreeItem = this.dataStore.getDocElement(
						changed.treeItemId
					);
					var rootChangedTreeItem = rows[changedTreeItem.rootItemId];
					if (!isSkipUpdateCell) {
						this.grid.updateCell(rootChangedTreeItem, changed);
					}
				}
			}

			for (var j = 0; j < changedTableItems.length; j++) {
				var tableItem = changedTableItems[j];

				if (tableItem.readOnly && action === 'update' && !ignoreReadOnly) {
					continue;
				}
				this.actionStore.addAction({
					action: action,
					type: 'docElementProperty',
					itemId: tableItem.id,
					docType: tableItem.propertyName,
					qpId: this.qpDocumentId,
					value: tableItem.value,
					elementReferenceId: tableItem.elementReferenceId,
					cmfStyleAml: CMF.Utils.getCmfStyleAml(tableItem.cmfStyle)
				});
			}
		},

		applyStructureMapping: function (docElemTypeId, actionObject) {
			if (docElemTypeId) {
				var docElementType = this.dataStore.getDocElementTypeById(
					docElemTypeId
				);
				if (!docElementType.binding || !docElementType.binding.mappingMethod) {
					return;
				}
			}

			var changes = this.stuctureMapping.run(
				this.dataStore.getAllDocumentTypes()
			);
			actionObject.changes = changes.length > 0 ? changes : undefined;
			this.applySmmChanges(changes);
		},

		updateCollectedGridRows: function () {
			// clone collectedRows because tree.onSimpleUpdate is async
			/* jshint ignore:start */
			var obj = {};
			for (var property in this.collectedRows) {
				obj[property] = this.collectedRows[property];
			}
			this.tree.onSimpleUpdate(obj);
			this.collectedRows = {};
			/* jshint ignore:end */
		},

		createDocumentElement: function (
			parentNodeId,
			docElemTypeId,
			rootItemId,
			beforeInsertItem,
			boundItemId,
			isValidateExistence,
			copy,
			isToSelectForEdit
		) {
			var rootItem = this.dataStore.getDocElement(rootItemId);
			var parentNode = this.dataStore.getDocElement(parentNodeId);

			var newNode = this.dataStore.createDocElement(
				parentNode,
				boundItemId,
				isValidateExistence,
				docElemTypeId,
				beforeInsertItem,
				copy
			);
			if (!newNode) {
				var changedTreeItems = this.dataStore.recalculateSortOrder(
					parentNode,
					docElemTypeId
				);
				this.actionStore.changeSortOrderForItems(changedTreeItems); // TODO
				newNode = this.dataStore.createDocElement(
					parentNode,
					boundItemId,
					isValidateExistence,
					docElemTypeId,
					beforeInsertItem,
					copy
				);
			}
			this.dataStore.insertDocElement(parentNode, newNode);

			var changedByComputedMethods = this.computedMethodHelper.executeFromDocElement(
				newNode
			);
			this.filterChangedTableItems(changedByComputedMethods, newNode);
			var changedRowNodes = this.generateChangedRowNodes(
				'add',
				rootItem,
				changedByComputedMethods
			);
			if (parentNode.isRootOfTree) {
				var nextChild = this.dataStore.findNextElement(newNode);
				this.tree.addRootNode(
					newNode,
					parentNode,
					nextChild ? nextChild.id : null
				);
			} else {
				this.tree.insertNode(
					rootItem,
					newNode,
					copy && copy.isToUpdateGridLater,
					true,
					parentNode
				);
			}

			var actionObject = this.actionStore.createActionObject();
			this.addDocElementToAml(newNode);
			if (changedByComputedMethods.changeTableItems.length > 0) {
				this.onSpecificCellUpdated(
					changedRowNodes,
					changedByComputedMethods.changeTableItems,
					'update',
					copy && copy.isToUpdateGridLater
				);
			}

			this.fillActionObjectForNodeAdd(
				actionObject,
				newNode,
				rootItem,
				beforeInsertItem,
				changedByComputedMethods.changeTableItems,
				changedRowNodes
			);

			if (copy) {
				if (copy.isMain) {
					copy.argsToSelect = {
						nodeId: newNode.id,
						rootItem: parentNode.isRootOfTree ? newNode : rootItem,
						currentNode: newNode,
						isToSelectForEdit: isToSelectForEdit
					};
				}
			} else {
				var self = this;
				setTimeout(function () {
					self.tree.selectNodeByRootItem(
						newNode.id,
						parentNode.isRootOfTree ? newNode : rootItem,
						newNode,
						isToSelectForEdit
					);
				}, 0);
			}

			this.applyStructureMapping(docElemTypeId, actionObject);
			this.actionStore.saveActionObject(actionObject);
			this.findControl.findAll(true);
			return newNode;
		},

		deleteDocumentElement: function (nodeId, parentNodeId) {
			var parentNode = this.dataStore.getDocElement(parentNodeId);
			if (parentNode) {
				var rootNode = this.dataStore.getDocElement(parentNode.rootItemId);
				var deletedNode = this.dataStore.getDocElement(nodeId);
				this.dataStore.removeDocElement(parentNode, deletedNode);

				if (!deletedNode) {
					return false;
				}

				var changedByComputedMethods = this.computedMethodHelper.executeFromDocElement(
					deletedNode
				);
				var changedRowNodes = this.generateChangedRowNodes(
					'delete',
					rootNode,
					changedByComputedMethods
				);
				var actionObject = this.actionStore.createActionObject();
				this.tree.deleteNode(
					nodeId,
					rootNode,
					parentNode,
					parentNode.isRootOfTree
				);
				if (parentNode.isRootOfTree) {
					if (rootNode) {
						changedRowNodes[rootNode.id] = undefined;
					}
					this.tree.selectRootNode();
				} else {
					this.tree.selectNodeByRootItem(parentNodeId, rootNode, parentNode);
				}
				this.deleteDocElementInAml(deletedNode);

				if (changedByComputedMethods.changeTableItems.length > 0) {
					this.onSpecificCellUpdated(
						changedRowNodes,
						changedByComputedMethods.changeTableItems,
						'update',
						null
					);
				}

				actionObject = this.fillActionObjectForNodeDelete(
					actionObject,
					deletedNode,
					rootNode,
					changedByComputedMethods,
					changedRowNodes
				);
				this.applyStructureMapping(
					deletedNode.documentElementTypeId,
					actionObject
				);

				this.actionStore.saveActionObject(actionObject);
				this.findControl.findAll(true);
			}
			return true;
		},

		updateDocElementProperty: function (changeObject) {
			//note that some code is duplicated in forceFieldUpdate. TODO: try to combine the code, not to repeat.
			var rootNode = this.dataStore.getDocElement(changeObject.rowId);
			if (rootNode) {
				var treeItem = this.dataStore.getDocElement(changeObject.nodeId);
				if (treeItem) {
					var tableItem = this.dataStore.getPropertyElement(
						changeObject.cellId
					);
					if (!tableItem || tableItem.treeItemId !== treeItem.id) {
						return;
					}

					var beforeChanged = tableItem.getCopy();
					tableItem.value = changeObject.value;

					var changedItemsObject = this.createChangedObject(
						tableItem,
						beforeChanged,
						rootNode
					);
					this.computedMethodHelper.executeFromPropertyElement(
						tableItem,
						changedItemsObject
					);
					var changedRowNodes = this.generateChangedRowNodes(
						'update',
						rootNode,
						changedItemsObject
					);
					var actionObject = this.actionStore.createActionObject();
					this.onSpecificCellUpdated(
						changedRowNodes,
						changedItemsObject.changeTableItems,
						'update',
						null,
						changeObject.ignoreReadOnly
					);
					actionObject = this.fillActionObjectForNodeUpdate(
						actionObject,
						changedItemsObject,
						changedRowNodes
					);
					this.tree.updateNode(
						treeItem,
						changeObject.rowId,
						changeObject.cellId
					);
					this.actionStore.saveActionObject(actionObject);
					this.findControl.findAll(true);
				}
			}
		},

		forceFieldUpdate: function (changeObject, actionObject, allTableItems) {
			if (!changeObject.length) {
				return;
			}
			var self = this;
			function isTableItemsEqual(first, second) {
				if (
					first.value === second.value &&
					self.computedMethodHelper.isStylesEqual(
						first.cmfStyle,
						second.cmfStyle
					)
				) {
					return true;
				}
				return false;
			}

			function removeUnchangedTableItems(changeObject) {
				var changeTableItemsResult = [];
				var beforeChangedTableItems = [];
				var changeRowIds = {};
				var beforeChangedIdMap = changeObject.beforeChangedTableItems.reduce(
					function (acc, item) {
						acc[item.id] = item;
						return acc;
					},
					{}
				);
				for (var i = 0; i < changeObject.changedTableItems.length; i++) {
					var changedItem = changeObject.changedTableItems[i];
					var beforeChangeItem = beforeChangedIdMap[changedItem.id];
					if (
						!beforeChangeItem ||
						isTableItemsEqual(changedItem, beforeChangeItem)
					) {
						continue;
					}
					changeTableItemsResult.push(changedItem);
					beforeChangedTableItems.push(beforeChangeItem);
					var rowId = self.dataStore.getPropertyRootItemId(changedItem);
					changeRowIds[rowId] = true;
				}
				return {
					changeTableItems: changeTableItemsResult,
					beforeChangedTableItems: beforeChangedTableItems,
					changeRowIds: changeRowIds
				};
			}

			var changedItemsObject = this.computedMethodHelper.executeComputedMethodWrapper(
				changeObject,
				allTableItems
			);
			changedItemsObject = removeUnchangedTableItems(changedItemsObject);
			var changedRowNodes = this.generateChangedRowNodes(
				'update',
				null,
				changedItemsObject
			);

			this.onSpecificCellUpdated(
				changedRowNodes,
				changedItemsObject.changeTableItems,
				'update',
				false,
				false,
				true
			);
			this.fillActionObjectForNodeUpdate(
				actionObject,
				changedItemsObject,
				changedRowNodes
			);
		},

		onReleaseReference: function (changeObject) {
			var element = changeObject.releasedElement;

			var actionObject = this.actionStore.createActionObject();
			actionObject.releasedObject = {
				id: element.id,
				boundItemId: element.boundItemId,
				boundItemConfigId: element.boundItemConfigId,
				boundItem: element.boundItem,
				trackingMode: element.trackingMode
			};

			element.boundItemId = null;
			element.boundItemConfigId = null;
			element.boundItem = null;
			element.trackingMode = null;

			var rootNode = this.dataStore.getDocElement(element.rootItemId);
			var selectedCellId = this.grid.selectedCellId;
			var updatedRow = this._getGridRow(rootNode);
			this.grid.updateRow(updatedRow);
			this.tree.onNodeSelected(element.rootItemId, selectedCellId);

			var docElementType = this.dataStore.getDocElementTypeById(
				element.documentElementTypeId
			);
			if (docElementType.binding && docElementType.binding.mappingMethod) {
				var changes = this.stuctureMapping.run(
					this.dataStore.getAllDocumentTypes()
				);
				actionObject.changes = changes.length > 0 ? changes : undefined;
				this.applySmmChanges(changes);
			}

			this.actionStore.updateTreeItemBindings(element);
			this.actionStore.saveActionObject(actionObject);
		},

		onAcceptCandidate: function (element, changes) {
			var actionObject = {
				itemXml: parent.item.xml,
				isAcceptCandidate: true,
				selectedItemId: element.id,
				changes: changes
			};
			this.addDocElementToAml(element);
			this.actionStore.saveActionObject(actionObject);
			this.acceptCandidate(element, changes);
		},

		onPermissionChanged: function (changeObject) {
			var selectedTreeItem = changeObject.selectedTreeItem;
			var cellId = changeObject.cellId;
			var permission = changeObject.permission;

			this.actionStore.setAllowedPermission(cellId, permission);
			var rootNode = this.tree.getRootNodeById(selectedTreeItem.rootItemId);
			var changedRowNodes = {};
			changedRowNodes[rootNode.id] = rootNode;
			this.tree.onSimpleUpdate(changedRowNodes);
		},

		onApplyBinding: function (treeItem) {
			var resolveMethod = treeItem.documentElementType.binding.onApplyBinding;
			if (resolveMethod) {
				// call resolve method
				var resolveArgs = {
					element: treeItem,
					document: parent.item,
					parentElement: new ApiElement(
						this.dataStore.getDocElement(treeItem.parentId),
						this.dataStore
					)
				};
				var success = parent.aras.evalMethod(resolveMethod, '', resolveArgs);

				// update document
				if (success) {
					this.onAfterApplyBinding(treeItem);
				}
			} else {
				parent.aras.AlertError(CMF.Utils.getResource('accept_flagged_null'));
			}
		},

		onAfterApplyBinding: function (element) {
			var actionObject = {
				itemXml: parent.item.xml,
				isApplyBinding: true,
				selectedItemId: element.id,
				changes: undefined
			};

			actionObject.flagged = this.stuctureMapping.getCopyOfFlagged(
				element.flagged
			);
			this.updateItemAfterApplyBinding(element);
			this.applyStructureMapping(element.documentElementTypeId, actionObject);
			this.actionStore.saveActionObject(actionObject);
		},

		updateItemAfterApplyBinding: function (element) {
			element.flagged = undefined;
			var tableItems = this.dataStore.getPropertyElements(element);
			for (var i = 0; i < tableItems.length; i++) {
				tableItems[i].flagged = undefined;
			}

			var parentNode = this.dataStore.getDocElement(element.parentId);
			this.tree.updateChildrenNodes(parentNode, true);
			var rootItem = this.dataStore.getDocElement(element.rootItemId);
			this.tree.onRowNodeUpdated(rootItem);
		},

		rollbackItemAfterApplyBinding: function (element) {
			var tableItems = this.dataStore.getPropertyElements(element);
			for (var i = 0; i < tableItems.length; i++) {
				tableItems[i].flagged = element.flagged;
			}

			var parentNode = this.dataStore.getDocElement(element.parentId);
			this.tree.updateChildrenNodes(parentNode, true);
			var rootItem = this.dataStore.getDocElement(element.rootItemId);
			this.tree.onRowNodeUpdated(rootItem);
		},

		rollbackReplaceBinding: function (treeItem, tableItems) {
			if (!treeItem.boundItemId) {
				treeItem.boundItem = null;
				treeItem.boundItemId = null;
				treeItem.boundItemConfigId = null;
				treeItem.trackingMode = null;
				treeItem.resolutionMode = null;
			} else {
				CMF.Utils.fillBindings(
					treeItem,
					treeItem.boundItemId,
					true,
					false,
					false,
					tableItems
				);
			}

			// update Tree
			var parentNode = this.dataStore.getDocElement(treeItem.parentId);
			this.tree.updateElementInTree(parentNode, treeItem);

			var firstTableItem = null;
			var rootNode = this.dataStore.getDocElement(treeItem.rootItemId);
			for (var i = 0; i < tableItems.length; i++) {
				if (tableItems[i].visible) {
					if (!firstTableItem) {
						firstTableItem = tableItems[i];
					}
					this.grid.updateCell(rootNode, tableItems[i]);
				}
			}

			if (firstTableItem) {
				this.grid.selectCell(rootNode.id, firstTableItem.id);
			}
		},

		onReplaceBinding: function (element, boundItemId) {
			var actionObject = {
				itemXml: parent.item.xml,
				isReplaceBinding: true,
				selectedItemId: element.id,
				changes: undefined
			};
			actionObject.oldBoundId = element.boundItemId;
			actionObject.newBoundId = boundItemId;
			element.boundItemId = boundItemId;
			actionObject.flagged = element.flagged
				? this.stuctureMapping.getCopyOfFlagged(element.flagged)
				: undefined;

			var tableItems = this.dataStore.getPropertyElements(element);
			if (element.flagged) {
				element.flagged = undefined;
				for (var i = 0; i < tableItems.length; i++) {
					tableItems[i].flagged = undefined;
				}
			}
			this.updateRefDocumentElement(element, tableItems, actionObject);
			this.applyStructureMapping(element.documentElementTypeId, actionObject);
			this.actionStore.saveActionObject(actionObject);
		},

		fillBeforeResortingActionObject: function (
			resortingElements,
			actionObject
		) {
			var beforeResorting = {};
			for (var j = 0; j < resortingElements.length; j++) {
				beforeResorting[resortingElements[j].id] =
					resortingElements[j].sortOrder;
			}
			actionObject.beforeResorting = beforeResorting;
		},

		fillChangedElementsByResort: function (changedElements, actionObject) {
			var changedIds = [];
			for (var k = 0; k < changedElements.length; k++) {
				changedIds.push(changedElements[k].id);
			}
			actionObject.changedIds = changedIds;
		},

		onResortItems: function (element) {
			var actionObject = {
				itemXml: parent.item.xml,
				updateSortOrder: true,
				selectedItemId: element.id,
				changes: undefined
			};

			this.resortItems(element, actionObject);
			// call smm
			this.applyStructureMapping(element.documentElementTypeId, actionObject);
			this.actionStore.saveActionObject(actionObject);

			if (!element.isRootOfTree) {
				var properties = this.dataStore.getPropertyElements(element, true);
				if (properties.length > 0) {
					this.grid.selectCell(element.rootItemId, properties[0].id);
				}
			}
		},

		rollbackResorting: function (element, changes) {
			this.resortItems(element, {});
			this.applySmmChanges(changes);

			if (!element.isRootOfTree) {
				var properties = this.dataStore.getPropertyElements(element, true);
				if (properties.length > 0) {
					this.grid.selectCell(element.rootItemId, properties[0].id);
				}
			}
		},

		resortItems: function (element, actionObject) {
			var parentNode = this.dataStore.getDocElement(element.parentId);
			var allElementsByType = this.dataStore.getDocElementChildrenByType(
				parentNode,
				element.documentElementTypeId
			);
			var resortingElements = allElementsByType.filter(function (elem) {
				return (
					elem.flagged &&
					elem.flagged.isBadSortOrder &&
					elem.flagged.correctSortOrder !== undefined &&
					elem.flagged.correctSortOrder !== null
				);
			});

			this.fillBeforeResortingActionObject(resortingElements, actionObject);
			var changedElements = this.resortLogic(resortingElements);
			this.fillChangedElementsByResort(changedElements, actionObject);

			this.actionStore.changeSortOrderForItems(changedElements);
			var children = this.dataStore.getDocElementChildren(parentNode);
			this.dataStore.resortDocElements(parentNode, children);

			// update tree/ grid
			this.updateAfterResorting(changedElements, parentNode, element);
		},

		resortLogic: function (resortingElements) {
			var elementsByCorrectSortOrder = resortingElements.slice();
			elementsByCorrectSortOrder.sort(function (a, b) {
				return a.flagged.correctSortOrder - b.flagged.correctSortOrder;
			});
			var changedElementsObject = {};
			for (var i = 0; i < elementsByCorrectSortOrder.length; i++) {
				var smmElement = elementsByCorrectSortOrder[i];
				var currentElement = resortingElements[i];
				if (smmElement !== currentElement) {
					var oldSortOrder = smmElement.sortOrder;
					smmElement.sortOrder = currentElement.sortOrder;
					currentElement.sortOrder = oldSortOrder;
					changedElementsObject[currentElement.id] = currentElement;
					changedElementsObject[smmElement.id] = smmElement;
					resortingElements.sort(function (a, b) {
						return a.sortOrder - b.sortOrder;
					});
				}
			}

			var changedElements = [];
			for (var id in changedElementsObject) {
				// jshint ignore:line
				changedElements.push(changedElementsObject[id]);
			}
			return changedElements;
		},

		updateAfterResorting: function (changedElements, parentNode) {
			var updatedRow;
			if (changedElements.length > 0) {
				if (parentNode.isRootOfTree) {
					for (var i = 0; i < changedElements.length; i++) {
						this.grid.deleteRow(changedElements[i].id);
					}

					for (var m = 0; m < changedElements.length; m++) {
						var nextElementId = this.getNextElementInGrid(
							parentNode,
							changedElements[m]
						);
						var newNode = this._getGridRow(changedElements[m]);
						this.grid.addRow(newNode, nextElementId);
					}
				} else {
					var rootItem = this.dataStore.getDocElement(parentNode.rootItemId);
					updatedRow = this._getGridRow(rootItem);
					this.grid.updateRow(updatedRow);
				}
			}
		},

		getNextElementInGrid: function (parentNode, element) {
			var nextElementId = null;
			var children = this.dataStore.getDocElementChildren(parentNode, true);
			for (var j = 0; j < children.length; j++) {
				if (children[j].id === element.id) {
					if (j + 1 >= children.length) {
						break;
					} else {
						for (var k = j + 1; k < children.length; k++) {
							if (this.grid.isRowExist(children[k].id)) {
								nextElementId = children[k].id;
								break;
							}
						}
					}
				}
			}
			return nextElementId;
		},

		updateRefDocumentElement: function (treeItem, tableItems, actionObject) {
			var old = {};
			for (var j = 0; j < tableItems.length; j++) {
				old[tableItems[j].id] = tableItems[j].getCopy();
			}

			CMF.Utils.fillBindings(
				treeItem,
				treeItem.boundItemId,
				true,
				false,
				false,
				tableItems
			);

			// update Tree
			var parentNode = this.dataStore.getDocElement(treeItem.parentId);
			this.tree.updateElementInTree(parentNode, treeItem);

			// update grid
			var rootNode = this.dataStore.getDocElement(treeItem.rootItemId);
			for (var i = 0; i < tableItems.length; i++) {
				var tableItem = tableItems[i];
				var changedItemsObject = this.createChangedObject(
					tableItem,
					old[tableItem.id],
					rootNode
				);
				this.computedMethodHelper.executeFromPropertyElement(
					tableItem,
					changedItemsObject
				);
				var changedRowNodes = this.generateChangedRowNodes(
					'update',
					rootNode,
					changedItemsObject
				);
				this.onSpecificCellUpdated(
					changedRowNodes,
					changedItemsObject.changeTableItems,
					'update'
				);
				actionObject = this.fillActionObjectForNodeUpdate(
					actionObject,
					changedItemsObject,
					changedRowNodes
				);
				this.grid.updateCell(rootNode, tableItem);
			}

			// update aml
			this.actionStore.updateTreeItemBindings(treeItem);
		},

		onAcceptAllCandidates: function (allCandidates) {
			var actionObject = {
				itemXml: parent.item.xml,
				acceptAllCandidates: true,
				selectedItemId: 'root'
			};

			actionObject.candidateIds = this.acceptAllCandidates(allCandidates);
			this.applyStructureMapping(null, actionObject);
			this.actionStore.saveActionObject(actionObject);
		},

		rollbackAllCandidates: function (candidateIds, changes) {
			for (var i = 0; i < candidateIds.length; i++) {
				var element = this.dataStore.getDocElement(candidateIds[i]);
				element.isCandidate = true;

				// update ui
				this.updateItemInGrid(element, undefined);
				var parentNode = this.dataStore.getDocElement(element.parentId);
				this.tree.updateElementInTree(parentNode, element);
			}

			if (changes) {
				this.rollbackSmmChanges(changes);
			}
			this.tree.selectRootNode();
		},

		acceptAllCandidates: function (allCandidates) {
			var candidateIds = [];
			for (var i = 0; i < allCandidates.length; i++) {
				var element = allCandidates[i];
				element.isCandidate = false;
				this.addDocElementToAml(element);

				// update ui
				this.updateItemInGrid(element, undefined);
				var parentNode = this.dataStore.getDocElement(element.parentId);
				this.tree.updateElementInTree(parentNode, element);
				candidateIds.push(allCandidates[i].id);
			}
			return candidateIds;
		},

		recalculateComputedColumnValues: function () {
			var changeObjects = this.computedMethodHelper.getChangeObjectsForFullRecalculation();
			var actionObject = this.actionStore.createActionObject();
			for (var i = 0; i < changeObjects.propertyCalculationOrder.length; i++) {
				var propertyName = changeObjects.propertyCalculationOrder[i];
				this.forceFieldUpdate(
					changeObjects.propertyItems[propertyName],
					actionObject,
					changeObjects.allTableItems
				);
			}
			this.actionStore.saveActionObject(actionObject);
			this.grid._grid.refresh();
			this.findControl.findAll(true);
		},

		_getGridRow: function (documentElement) {
			const columnGroups = this.grid.getColumnGroupCollection();
			const docElemTypes = this.tree.getDocElemTypes();
			return this.transformer.transformToGridRow(
				documentElement,
				columnGroups,
				docElemTypes,
				this.dataStore
			);
		},

		refreshTreeItemAfterBindingChanges: function (treeItem) {
			var selectedCellId = this.grid.selectedCellId;
			var rootNode = this.dataStore.getDocElement(treeItem.rootItemId);

			this.tree.onRowNodeUpdated(rootNode, null, null);
			this.tree.onNodeSelected(treeItem.rootItemId, selectedCellId);

			this.actionStore.updateTreeItemBindings(treeItem);
		},

		onIgnoreConflictClicked: function (treeItem) {
			treeItem.trackingMode = 'NonTracking';
			this.refreshTreeItemAfterBindingChanges(treeItem);
		},

		onIgnoreAllConflictClicked: function (selectedTreeItem) {
			const elements = this.dataStore.getDocElements();
			let element;

			for (let elementId in elements) {
				element = elements[elementId];
				const isSameType =
					element.documentElementTypeId ===
					selectedTreeItem.documentElementTypeId;
				const isSameConfigId =
					element.boundItemConfigId === selectedTreeItem.boundItemConfigId;
				if (isSameType && isSameConfigId) {
					//used boundItemConfigId because, e.g. when we update all the same BOs, e.g., BO = Part1,
					//but boundItemId can be different, because it can be different
					//version of the part
					this.onIgnoreConflictClicked(element);
				}
			}
		},

		_validateBoundItem: function (itemIdToBind) {
			//validation on isTempID, e.g., is Item Delete Behavior is Check Constaint, not to have troubles if user will not Save the Item, but Save a QP Document.
			//no validation on isDirty, because it's very often if user has dirty item, e.g., user have locked Item, and, e.g.,
			//user just leave a form Element, or add a relationship.
			//it seems OK for now if we will allow to select dirty items, but select property values from DB (e.g., on load QP Document, we always take values from DB).
			if (parent.aras.isTempID(itemIdToBind)) {
				parent.aras.AlertWarning(CMF.Utils.getResource('new_item_selected'));
				return false;
			}

			return true;
		},

		pickBindItem: function (
			documentElementType,
			pickCallback,
			multiselect = false
		) {
			var itemtypeId = documentElementType.binding.elemReferenceType;
			var itemtypeName = aras.getItemTypeName(itemtypeId);
			var param = {
				itemtypeID: itemtypeId,
				multiselect: multiselect
			};
			param.type = 'SearchDialog';

			var pickDialog = window.parent.ArasModules.MaximazableDialog.show(
				'iframe',
				param
			);
			pickDialog.promise.then(
				function (res) {
					if (multiselect) {
						if (!res || res.length == 0) {
							return;
						}
						for (let i = 0; i < res.length; i++) {
							if (!this._validateBoundItem(res[i])) {
								return;
							}
						}
						for (let i = 0; i < res.length; i++) {
							if (pickCallback) {
								pickCallback(res[i]);
							}
						}
					} else {
						var boundItemId =
							res &&
							res.itemID &&
							this._validateBoundItem(res.itemID) &&
							res.itemID;
						if (!boundItemId) {
							return;
						}
						if (pickCallback) {
							pickCallback(boundItemId);
						}
					}
				}.bind(this)
			);
		},

		updateRefDocumentElementAfterUpdate: function (treeItem, ignoreReadOnly) {
			//updateBinding;

			var tableItems = this.dataStore.getPropertyElements(treeItem);
			CMF.Utils.fillBindings(
				treeItem,
				treeItem.boundItemId,
				true,
				true,
				false,
				tableItems
			);
			this.refreshTreeItemAfterBindingChanges(treeItem);

			//updateCellValues;
			var tableItem;
			var currentBind;
			var boundValue;

			for (var i = 0; i < tableItems.length; i++) {
				tableItem = tableItems[i];
				if (tableItem.discoverOnly === '1' || !tableItem.visible) {
					continue;
				}
				currentBind =
					treeItem.documentElementType.binding.binds[tableItem.propertyId];
				if (!currentBind) {
					continue;
				}

				boundValue =
					treeItem.boundItem.propertyNames[currentBind.itemPropertyName].value;
				this.grid.onCellUpdated(
					treeItem.rootItemId,
					tableItem.treeItemId,
					tableItem.tableItemId,
					boundValue,
					ignoreReadOnly
				);
			}
		},

		onPickReplaceClick: function (selectedTreeItem) {
			this.pickBindItem(
				selectedTreeItem.documentElementType,
				function (boundItemId) {
					if (selectedTreeItem.documentElementType.binding.onAfterPick) {
						var onAfterPickArgs = {
							boundItemId: boundItemId,
							parentElement: new ApiElement(
								this.dataStore.getDocElement(selectedTreeItem.parentId),
								this.dataStore
							),
							insteadElement: new ApiElement(selectedTreeItem, this.dataStore)
						};
						parent.aras.evalMethod(
							selectedTreeItem.documentElementType.binding.onAfterPick,
							'',
							onAfterPickArgs
						);
					}

					var tableItems = this.dataStore.getPropertyElements(selectedTreeItem);
					CMF.Utils.fillBindings(
						selectedTreeItem,
						boundItemId,
						true,
						false,
						false,
						tableItems
					);
					this.refreshTreeItemAfterBindingChanges(selectedTreeItem);
					this.updateRefDocumentElementAfterUpdate(selectedTreeItem, true);
				}.bind(this)
			);
		},

		onUpdateDocumentClick: function (selectedTreeItem) {
			var selectedCellId = this.grid.selectedCellId;
			this.updateRefDocumentElementAfterUpdate(selectedTreeItem, true);
			this.tree.onNodeSelected(selectedTreeItem.rootItemId, selectedCellId);
		},

		onUpdateDocumentAllClick: function (selectedTreeItem) {
			var selectedCellId = this.grid.selectedCellId;
			const elements = this.dataStore.getDocElements();
			let element;
			for (let k in elements) {
				element = elements[k];
				//used boundItemConfigId because, e.g. when we update all the same BOs, e.g., BO = Part1,
				//but boundItemId can be different, because it can be different
				//version of the part
				if (
					element.documentElementTypeId ===
						selectedTreeItem.documentElementTypeId &&
					element.boundItemConfigId === selectedTreeItem.boundItemConfigId
				) {
					this.updateRefDocumentElementAfterUpdate(elements[k], true);
				}
			}

			this.tree.onNodeSelected(selectedTreeItem.rootItemId, selectedCellId);
		},

		viewReference: function (selectedTreeItem) {
			var itemTypeName = parent.aras.getItemTypeName(
				selectedTreeItem.documentElementType.binding.elemReferenceType
			);
			parent.aras.uiShowItem(
				itemTypeName,
				selectedTreeItem.boundItem.idAccordingToBehav
			);
		}
	});
});
