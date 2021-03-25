/* global define, CMF */
define(['dojo/_base/declare'], function (declare) {
	var aras = parent.aras;

	return declare('ActionStore', [], {
		aras: null,
		dataStore: null,
		documentTypeId: null,
		actionStack: [],
		reduStack: [],

		constructor: function (itemObj, aras, dataStore) {
			this.aras = aras;
			var iomItem = aras.newIOMItem();
			iomItem.dom = itemObj.ownerDocument;
			iomItem.node = itemObj;
			this.currentItem = iomItem;
			this.dataStore = dataStore;
		},

		getDataStore: function () {
			return this.dataStore;
		},

		setDocumentTypeId: function (documentTypeId) {
			this.documentTypeId = documentTypeId;
		},

		createActionObject: function () {
			var actionObject = {
				itemXml: parent.item.xml,
				addedNode: undefined,
				updatedNodes: undefined,
				deletedNodes: undefined
			};
			return actionObject;
		},

		updateItemObj: function (itemObj) {
			// TODO i don't know why they are not equal
			var iomItem = aras.newIOMItem();
			if (itemObj === parent.item) {
				iomItem.dom = itemObj.ownerDocument;
				iomItem.node = itemObj;
				this.currentItem = iomItem;
			} else {
				iomItem.dom = parent.item.ownerDocument;
				iomItem.node = parent.item;
				this.currentItem = iomItem;
			}
		},

		addAction: function (action) {
			this.updateItemObj(this.currentItem);
			this.currentItem.setAttribute('isDirty', '1');
			switch (action.action) {
				case 'add':
					this.addItem(action);
					break;
				case 'update':
					this.updateTableItem(action);
					break;
				case 'delete':
					this.deleteItem(action);
					break;
				default:
					break;
			}
		},

		addItem: function (action) {
			if (action.type === 'docElementType') {
				var item = aras.IomInnovator.newItem(action.docType, 'add');
				item.setAttribute('id', action.itemId);
				item.setProperty('source_id', action.qpId);
				item.setProperty('reference_id', action.referenceId);
				item.setProperty('parent_reference_id', action.parentReferenceId);
				item.setProperty('sort_order', action.sortOrder);
				item.setProperty('bound_item_id', action.boundItemId);
				item.setProperty('bound_item_config_id', action.boundItemConfigId);
				item.setProperty('tracking_mode', action.trackingMode);
				item.setProperty('resolution_mode', action.resolutionMode);
				this.currentItem.addRelationship(item);
			} else {
				var property = aras.IomInnovator.newItem(action.docType, 'add');
				property.setAttribute('id', action.itemId);
				property.setAttribute('typeId', action.propertyTypeId);
				property.setProperty('source_id', action.qpId);
				if (action.value === undefined) {
					property.setProperty('value', '');
					property.setPropertyAttribute('value', 'is_null', '1');
				} else {
					property.setProperty('value', action.value);
				}
				property.setProperty('element_reference_id', action.elementReferenceId);
				property.setProperty('cmf_style', action.cmfStyleAml);
				this.currentItem.addRelationship(property);
			}
		},

		updateTableItem: function (action) {
			var result = this.currentItem.getItemsByXPath(
				'Relationships/Item[@id="' + action.itemId + '"]'
			);
			if (result.node === null) {
				var property = aras.IomInnovator.newItem(action.docType, 'update');
				property.setAttribute('id', action.itemId);
				//TODO: duplicated code after else, can be made as in updateTreeItemBindings.
				if (action.value === undefined) {
					property.setProperty('value', '');
					property.setPropertyAttribute('value', 'is_null', '1');
				} else {
					property.setProperty('value', action.value);
				}
				property.setProperty('element_reference_id', action.elementReferenceId);
				property.setProperty('cmf_style', action.cmfStyleAml);
				this.currentItem.addRelationship(property);
			} else {
				if (action.value === undefined) {
					result.setPropertyAttribute('value', 'is_null', '1');
				} else {
					result.removePropertyAttribute('value', 'is_null');
				}

				result.setProperty(
					'value',
					action.value === undefined ? null : action.value
				);
				result.setProperty('cmf_style', action.cmfStyleAml);
			}
		},

		updateTreeItemBindings: function (treeItem) {
			//TODO: it's better to do like in updateTableItem to improve perfomance, because for large amount of calls getItemByIndex and getID can hurt perfomance,
			//it's better to use getItemsByXPath and even better selectSingleNode.
			this.updateItemObj(this.currentItem);
			var relationships = this.currentItem.getRelationships(
				treeItem.documentElementType.name
			);
			var relationshipsCount = relationships.getItemCount();
			var relationship;
			var iomItem;

			for (var index = 0; index < relationshipsCount; index++) {
				relationship = relationships.getItemByIndex(index);

				if (relationship.getID() === treeItem.id) {
					iomItem = relationship;
					break;
				}
			}

			if (!iomItem) {
				iomItem = aras.IomInnovator.newItem(
					treeItem.documentElementType.name,
					'update'
				);
				iomItem.setID(treeItem.id);
				this.currentItem.addRelationship(iomItem);
			}

			//we do update the item, but aras.saveItemEx return a error on Save that reference_id is required, but isn't filled (perhaps bug of core of Innovator)
			//so it's a workaround. To remove the workaround if this is a bug and it'll be fixed.
			iomItem.setProperty('reference_id', treeItem.relatedId);

			iomItem.setProperty('bound_item_id', treeItem.boundItemId);
			iomItem.setProperty('bound_item_config_id', treeItem.boundItemConfigId);
			iomItem.setProperty('tracking_mode', treeItem.trackingMode);
			iomItem.setProperty('resolution_mode', treeItem.resolutionMode);
		},

		removeNodes: function (rootItemId) {
			var element = this.dataStore.getDocElement(rootItemId);
			if (!element) {
				return;
			}
			var stack = [];
			stack.push(element);

			while (stack.length > 0) {
				var currentElement = stack.pop();
				var elementNode = this.currentItem.node.selectSingleNode(
					"Relationships/Item[@id='" +
						currentElement.id +
						"' and @action='add']"
				);
				if (elementNode) {
					var tableItems = this.dataStore.getPropertyElements(currentElement);
					for (var i = 0; i < tableItems.length; i++) {
						var propertyNode = this.currentItem.node.selectSingleNode(
							"Relationships/Item[@id='" + tableItems[i].id + "']"
						);
						if (propertyNode) {
							propertyNode.parentNode.removeChild(propertyNode);
						}
					}
					elementNode.parentNode.removeChild(elementNode);
				}

				var children = this.dataStore.getDocElementChildren(
					currentElement,
					false,
					true
				);
				for (var j = 0; j < children.length; j++) {
					stack.push(children[j]);
				}
			}
		},

		deleteItem: function (action) {
			var justCreated = this.currentItem.node.selectSingleNode(
				"Relationships/Item[@id='" + action.itemId + "' and @action='add']"
			);
			if (justCreated) {
				this.removeNodes(action.itemId);
			} else {
				var item = aras.IomInnovator.newItem(action.docType, 'delete');
				item.setAttribute('id', action.itemId);
				item.removeAttribute('isNew');
				item.removeAttribute('isTemp');
				//we do delete the item, but aras.saveItemEx return a error on Save that reference_id is required, but isn't filled (perhaps bug of core of Innovator)
				//so it's a workaround. To remove the workaround if this is a bug and it'll be fixed.
				item.setProperty('reference_id', action.referenceId);
				this.currentItem.addRelationship(item);
			}
		},

		changeSortOrderForItems: function (cbangedTreeItems) {
			for (var i = 0; i < cbangedTreeItems.length; i++) {
				var currentItem = cbangedTreeItems[i];

				var result = this.currentItem.getItemsByXPath(
					'Relationships/Item[@id="' + currentItem.id + '"]'
				);
				if (result.node === null) {
					var docType = this.dataStore.getDocElementType(currentItem);
					var property = aras.IomInnovator.newItem(docType.name, 'update');
					property.setAttribute('id', currentItem.id);
					property.removeAttribute('isNew');
					property.removeAttribute('isTemp');
					property.setProperty('reference_id', currentItem.relatedId);
					property.setProperty('sort_order', currentItem.sortOrder);
					this.currentItem.addRelationship(property);
				} else {
					result.setProperty('sort_order', currentItem.sortOrder);
				}
			}
		},

		getCurrentItemObject: function () {
			return this.currentItem;
		},

		saveActionObject: function (actionObject) {
			this.actionStack.push(actionObject);
			this.reduStack = [];
		},

		getLastActionObject: function () {
			var lastAction = this.actionStack.pop();
			if (lastAction) {
				this.reduStack.push(lastAction);
			}
			return lastAction;
		},

		getLastReduAction: function () {
			var reduAction = this.reduStack.pop();
			if (reduAction) {
				this.actionStack.push(reduAction);
			}
			return reduAction;
		},

		clearActions: function () {
			this.reduStack = [];
			this.actionStack = [];
		},

		deleteElementWithoutChanges: function (
			tree,
			element,
			action,
			changes,
			controller
		) {
			var parentNode = this.dataStore.getDocElement(element.parentId);
			var rootNode = this.dataStore.getDocElement(element.rootItemId);

			this.dataStore.removeDocElement(parentNode, element);
			tree.updateChildrenNodes(parentNode);

			if (element.parentId === 'root') {
				tree.onRowNodeDeleted(element.id);
			} else {
				tree.onDeleteItem(rootNode);
			}
			if (action === 'undo') {
				tree.selectNodeByRootItem(parentNode.id, rootNode, parentNode);
				if (changes) {
					controller.rollbackSmmChanges(changes);
				}
			} else {
				controller.deleteDocElementInAml(element);
				tree.selectNodeByRootItem(
					parentNode.id,
					rootNode.id === 'root' ? parentNode : rootNode,
					parentNode
				);
				if (changes) {
					controller.applySmmChanges(changes);
				}
			}
		},

		addElementWithoutChanges: function (
			tree,
			element,
			action,
			changes,
			controller
		) {
			var parentNode = this.dataStore.getDocElement(element.parentId);
			var rootNode = this.dataStore.getDocElement(element.rootItemId);
			element.isRemoved = false;
			this.dataStore.insertDocElement(parentNode, element);
			tree.updateChildrenNodes(parentNode);

			if (element.parentId === 'root') {
				var nextElement = this.dataStore.findNextElement(element);
				tree.onRowNodeAdded(element, nextElement ? nextElement.id : null, true);
			} else {
				var changedRowNodes = {};
				changedRowNodes[rootNode.id] = rootNode;
				tree.onSimpleUpdate(changedRowNodes);
			}

			if (action === 'undo') {
				tree.selectNodeByRootItem(element.id, rootNode, element);
				if (changes) {
					controller.rollbackSmmChanges(changes);
				}
			} else {
				tree.selectNodeByRootItem(
					element.id,
					rootNode.id === 'root' ? element : rootNode,
					element
				);
				if (changes) {
					controller.applySmmChanges(changes);
				}
			}
		},

		updateElementsWithoutChanged: function (tree, lastAction, action) {
			var func = function (element) {
				return element.id === current.id;
			};
			for (
				var i = 0;
				i < lastAction.updatedNodes.changeTableItems.length;
				i++
			) {
				var current = lastAction.updatedNodes.changeTableItems[i];
				var realTableItem = this.dataStore.getPropertyElement(current.id);
				var realTreeItem = this.dataStore.getDocElement(current.treeItemId);
				if (action === 'undo') {
					//TODO: it looks that undo and redo became too complicated. We should try to re-write it and save only 5 last operation according to the spec.
					//Save entire Rows or even entire Store, instead of managing changedTableItems. But it need to consider memory for large documents.
					if (lastAction.updatedNodes.beforeChangedTableItems) {
						var before = lastAction.updatedNodes.beforeChangedTableItems.filter(
							func
						);
						if (before.length > 0) {
							realTableItem.value = before[0].value;
							realTableItem.cmfStyle = before[0].cmfStyle;
						}
					}
				} else {
					realTableItem.value = current.value;
					realTableItem.cmfStyle = current.cmfStyle;
				}
				realTreeItem.title = tree.getLabel(realTreeItem);
				tree.updateTreeLabel(realTreeItem);
			}
			var changedTableItems =
				action === 'redo' ? lastAction.updatedNodes.changeTableItems : null;
			tree.onSimpleUpdate(lastAction.updatedNodes.changedRowNodes);

			if (changedTableItems) {
				for (var j = 0; j < changedTableItems.length; j++) {
					var tableItem = changedTableItems[j];
					if (tableItem.readOnly) {
						continue;
					}
					this.addAction({
						action: 'update',
						type: 'docElementProperty',
						itemId: tableItem.id,
						docType: tableItem.propertyName,
						qpId: lastAction.cmfDocumentId,
						value: tableItem.value,
						elementReferenceId: tableItem.elementReferenceId,
						cmfStyleAml: CMF.Utils.getCmfStyleAml(tableItem.cmfStyle)
					});
				}
			}
			var selectedNode = lastAction.selectedItemId
				? this.dataStore.getDocElement(lastAction.selectedItemId)
				: null;
			if (selectedNode) {
				tree.selectNode(
					selectedNode.rootItemId,
					selectedNode.id,
					lastAction.selectedTableItemId,
					selectedNode.parentId
				);
			}
		},

		updateCandidate: function (actionObject, action, controller) {
			var node = this.dataStore.getDocElement(actionObject.selectedItemId);

			if (action === 'undo') {
				node.isCandidate = true;
				controller.rollbackCandidate(node, actionObject.changes);
			} else {
				node.isCandidate = false;
				controller.addDocElementToAml(node);
				controller.acceptCandidate(node, actionObject.changes);
			}
		},

		updateGlobalItem: function (lastAction) {
			function replaceRelationships(newItem, prevItem) {
				var prevNode;
				var prevRelationships = prevItem.selectSingleNode(
					"/Innovator/Items/Item[@id='" + newItem.getId() + "']/Relationships"
				);
				var newRelationships = newItem.node.selectSingleNode(
					"/Item[@id='" + newItem.getId() + "']/Relationships"
				);

				if (!prevRelationships && !newRelationships) {
					return;
				}

				if (!newRelationships) {
					prevRelationships.parentNode.removeChild(prevRelationships);
					return;
				}

				if (!prevRelationships) {
					prevNode = prevItem.selectSingleNode(
						"/Innovator/Items/Item[@id='" + newItem.getId() + "']"
					);
					prevNode.appendChild(
						prevNode.ownerDocument.createElement('Relationships')
					);
					prevRelationships = prevNode.selectSingleNode('Relationships');
				}

				prevRelationships.parentNode.replaceChild(
					newRelationships.cloneNode(true),
					prevRelationships
				);
			}

			var baseItem = aras.newIOMItem();
			baseItem.loadAML(lastAction.itemXml);

			replaceRelationships(baseItem, parent.item);
			replaceRelationships(
				baseItem,
				parent.document.querySelector('#formTab aras-form #instance')
					.contentWindow.document.item
			);
			replaceRelationships(baseItem, aras.itemsCache.getItem(baseItem.getId()));
		},

		updateReleasedElement: function (lastAction, action, controller) {
			var element = this.dataStore.getDocElement(lastAction.releasedObject.id);
			if (action === 'undo') {
				element.boundItemId = lastAction.releasedObject.boundItemId;
				element.boundItemConfigId = lastAction.releasedObject.boundItemConfigId;
				element.boundItem = lastAction.releasedObject.boundItem;
				element.trackingMode = lastAction.releasedObject.trackingMode;

				if (lastAction.changes) {
					controller.rollbackSmmChanges(lastAction.changes);
				}
			} else {
				element.boundItemId = null;
				element.boundItemConfigId = null;
				element.boundItem = null;
				element.trackingMode = null;
				if (lastAction.changes) {
					controller.applySmmChanges(lastAction.changes);
				}
			}
		},

		updateFlaggedElement: function (lastAction, action, controller) {
			var element = this.dataStore.getDocElement(lastAction.selectedItemId);
			if (action === 'undo') {
				element.flagged = lastAction.flagged;
				controller.rollbackItemAfterApplyBinding(element);
				if (lastAction.changes) {
					controller.rollbackSmmChanges(lastAction.changes);
				}
			} else {
				controller.updateItemAfterApplyBinding(element);
				if (lastAction.changes) {
					controller.applySmmChanges(lastAction.changes);
				}
			}
		},

		replaceBinding: function (lastAction, action, controller) {
			var element = this.dataStore.getDocElement(lastAction.selectedItemId);
			var tableItems;
			if (action === 'undo') {
				element.boundItemId = lastAction.oldBoundId;
				tableItems = this.dataStore.getPropertyElements(element);
				if (lastAction.flagged) {
					element.flagged = lastAction.flagged;
					for (var i = 0; i < tableItems.length; i++) {
						tableItems[i].flagged = lastAction.flagged;
					}
				}
				controller.rollbackReplaceBinding(element, tableItems);
				if (lastAction.changes) {
					controller.rollbackSmmChanges(lastAction.changes);
				}
			} else {
				element.boundItemId = lastAction.newBoundId;
				tableItems = this.dataStore.getPropertyElements(element);
				if (element.flagged) {
					element.flagged = undefined;
					for (var j = 0; j < tableItems.length; j++) {
						tableItems[j].flagged = undefined;
					}
				}
				controller.rollbackReplaceBinding(element, tableItems);
				if (lastAction.changes) {
					controller.applySmmChanges(lastAction.changes);
				}
			}
		},

		updateSortOrder: function (lastAction, action, controller) {
			var element = this.dataStore.getDocElement(lastAction.selectedItemId);
			if (action === 'undo') {
				if (lastAction.changedIds.length > 0) {
					var changedElements = [];
					for (var i = 0; i < lastAction.changedIds.length; i++) {
						changedElements.push(
							this.dataStore.getDocElement(lastAction.changedIds[i])
						);
					}
					for (var j = 0; j < changedElements.length; j++) {
						var oldSortOrder =
							lastAction.beforeResorting[changedElements[j].id];
						changedElements[j].sortOrder = oldSortOrder;
					}
					// update tree/grid
					var parentNode = this.dataStore.getDocElement(element.parentId);
					var children = this.dataStore.getDocElementChildren(parentNode);
					this.dataStore.resortDocElements(parentNode, children);
					controller.updateAfterResorting(changedElements, parentNode);

					if (lastAction.changes) {
						controller.rollbackSmmChanges(lastAction.changes);
					}
				}
			} else {
				controller.rollbackResorting(element, lastAction.changes);
			}
		},

		updateAcceptAllCandidates: function (lastAction, action, controller) {
			if (action === 'undo') {
				controller.rollbackAllCandidates(
					lastAction.candidateIds,
					lastAction.changes
				);
			} else {
				var allCandidates = [];
				for (var i = 0; i < lastAction.candidateIds.length; i++) {
					var element = this.dataStore.getDocElement(
						lastAction.candidateIds[i]
					);
					allCandidates.push(element);
				}
				controller.acceptAllCandidates(allCandidates);
				if (lastAction.changes) {
					controller.applySmmChanges(lastAction.changes);
				}
			}
		},

		undo: function (tree, controller) {
			var lastAction = this.getLastActionObject();
			if (!lastAction) {
				return;
			}

			var action = 'undo';
			this.updateGlobalItem(lastAction);

			if (lastAction.addedNode) {
				this.deleteElementWithoutChanges(
					tree,
					lastAction.addedNode.node,
					action,
					lastAction.changes,
					controller
				);
			}

			if (
				lastAction.updatedNodes &&
				lastAction.updatedNodes.changeTableItems.length > 0
			) {
				this.updateElementsWithoutChanged(tree, lastAction, action);
			}

			if (lastAction.deletedNodes) {
				this.addElementWithoutChanges(
					tree,
					lastAction.deletedNodes.deletedNode,
					action,
					lastAction.changes,
					controller
				);
			}

			if (lastAction.isAcceptCandidate) {
				this.updateCandidate(lastAction, action, controller);
			}

			if (lastAction.releasedObject) {
				this.updateReleasedElement(lastAction, action, controller);
			}

			if (lastAction.isApplyBinding) {
				this.updateFlaggedElement(lastAction, action, controller);
			}

			if (lastAction.isReplaceBinding) {
				this.replaceBinding(lastAction, action, controller);
			}

			if (lastAction.updateSortOrder) {
				this.updateSortOrder(lastAction, action, controller);
			}

			if (lastAction.acceptAllCandidates) {
				this.updateAcceptAllCandidates(lastAction, action, controller);
			}
		},

		redu: function (tree, controller) {
			var lastAction = this.getLastReduAction();
			if (!lastAction) {
				return;
			}
			var action = 'redo';
			this.updateGlobalItem(lastAction);

			if (lastAction.addedNode) {
				this.addElementWithoutChanges(tree, lastAction.addedNode.node, action);
			}

			if (lastAction.updatedNodes) {
				this.updateElementsWithoutChanged(tree, lastAction, action);
			}

			if (lastAction.deletedNodes) {
				this.deleteElementWithoutChanges(
					tree,
					lastAction.deletedNodes.deletedNode,
					action,
					lastAction.changes,
					controller
				);
			}

			if (lastAction.isAcceptCandidate) {
				this.updateCandidate(lastAction, action, controller);
			}

			if (lastAction.releasedObject) {
				this.updateReleasedElement(lastAction, action, controller);
			}

			if (lastAction.isApplyBinding) {
				this.updateFlaggedElement(lastAction, action, controller);
			}

			if (lastAction.isReplaceBinding) {
				this.replaceBinding(lastAction, action, controller);
			}

			if (lastAction.updateSortOrder) {
				this.updateSortOrder(lastAction, action, controller);
			}

			if (lastAction.acceptAllCandidates) {
				this.updateAcceptAllCandidates(lastAction, action, controller);
			}
		},

		setAllowedPermission: function (cellId, permission) {
			this.updateItemObj(this.currentItem);
			var result = this.currentItem.getItemsByXPath(
				'Relationships/Item[@id="' + cellId + '"]'
			);
			var tableItemModel = this.dataStore.getPropertyElement(cellId);
			var newPermissionId = '';
			if (!permission) {
				var propertyType = this.dataStore.getPropertyType(
					tableItemModel.propertyId
				);
				newPermissionId = propertyType.defaultPermission;
			} else {
				newPermissionId = permission['related_id'];
			}

			if (result.node === null) {
				var property = aras.IomInnovator.newItem(
					tableItemModel.propertyName,
					'update'
				);
				property.setAttribute('id', tableItemModel.id);
				property.setProperty('permission_id', newPermissionId);
				property.setProperty('source_id', this.currentItem.getId());
				property.setProperty(
					'element_reference_id',
					tableItemModel.elementReferenceId
				);
				this.currentItem.addRelationship(property);
			} else {
				result.setProperty('permission_id', newPermissionId);
			}

			tableItemModel.permissionId = newPermissionId;
		}
	});
});
