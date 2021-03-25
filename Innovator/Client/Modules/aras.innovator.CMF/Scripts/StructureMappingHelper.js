/* global define */
define([
	'dojo/_base/declare',
	'./PublicApi/PropertyItem',
	'./PublicApi/Element',
	'./DataModel',
	'./PublicApi/Factory',
	'./PublicApi/Tree'
], function (declare, PropertyItem, Element, DataModel, Factory, Tree) {
	return declare('StructureMappingHelper', [], {
		dataStore: null,

		constructor: function (dataStore) {
			this.dataStore = dataStore;
		},

		findElementInSmmResult: function (smmResult, typeId, elementId) {
			var res = smmResult[typeId].filter(function (element) {
				return element.sourceId === elementId;
			});
			if (res.length > 0) {
				return res[0];
			} else {
				return null;
			}
		},

		findElementsWithSortOrder: function (smmResult, typeId, parentId) {
			var allItems = smmResult[typeId].filter(function (element) {
				return (
					element.parentSourceId === parentId &&
					element.sortOrder !== undefined &&
					element.sortOrder !== null
				);
			});
			allItems.sort(function (a, b) {
				return a.sortOrder - b.sortOrder;
			});
			return allItems;
		},

		createFlaggedObject: function () {
			return {
				isBindingWrong: false,
				isBindingNotExist: false,
				isStructureWrong: false,
				isBadSortOrder: false,
				isBindingNeedRemove: false
			};
		},

		initFlaggedObject: function (element) {
			if (element && !element.flagged) {
				element.flagged = this.createFlaggedObject();
			}
		},

		setFlagIntoFlaggedObject: function (child, flag) {
			child.flagged.isBindingWrong = false;
			child.flagged.isBindingNotExist = false;
			child.flagged.isStructureWrong = false;
			child.flagged.isBindingNeedRemove = false;
			child.flagged.isBadSortOrder = false;
			child.flagged.correctSortOrder = undefined;

			switch (flag) {
				case 'isBindingWrong':
					child.flagged.isBindingWrong = true;
					break;
				case 'isBindingNotExist':
					child.flagged.isBindingNotExist = true;
					break;
				case 'isStructureWrong':
					child.flagged.isStructureWrong = true;
					break;
				case 'isBindingNeedRemove':
					child.flagged.isBindingNeedRemove = true;
					break;
				case 'isBadSortOrder':
					child.flagged.isBadSortOrder = true;
					break;
				default:
					break;
			}
		},

		isElementFlagged: function (element, withoutSortOrder) {
			if (element && element.flagged) {
				var res =
					element.flagged.isBindingWrong ||
					element.flagged.isBindingNotExist ||
					element.flagged.isStructureWrong ||
					element.flagged.isBindingNeedRemove;

				if (!withoutSortOrder) {
					return res || element.flagged.isBadSortOrder;
				} else {
					return res;
				}
			}
			return false;
		},

		updateFlaggedElement: function (element) {
			if (!this.isElementFlagged(element)) {
				element.flagged = undefined;
			}
		},

		getCopyOfFlagged: function (flagged) {
			var newFlagged = this.createFlaggedObject();
			newFlagged.isBindingWrong = flagged.isBindingWrong;
			newFlagged.isBindingNotExist = flagged.isBindingNotExist;
			newFlagged.isStructureWrong = flagged.isStructureWrong;
			newFlagged.isBadSortOrder = flagged.isBadSortOrder;
			newFlagged.isBindingNeedRemove = flagged.isBindingNeedRemove;
			newFlagged.smmRelatedId = flagged.smmRelatedId;
			newFlagged.correctSortOrder = flagged.correctSortOrder;
			return newFlagged;
		},

		// case when "structure mapping" found correspondence between "Document Element" and "Business Object"
		// and "Document Element" has already some binding
		// 1 1 1
		case1: function (child, smmChild, changed) {
			var changeObject;
			var wasFlagged;
			//if action is "no bind", we should offer to user to remove "binding"
			if (smmChild.action === 'no bind') {
				wasFlagged = child.flagged ? true : false;
				if (!wasFlagged) {
					this.initFlaggedObject(child);
				}
				if (!child.flagged.isBindingNeedRemove) {
					changeObject = {
						element: child,
						reason: 'became flagged',
						flagged: wasFlagged
							? this.getCopyOfFlagged(child.flagged)
							: undefined
					};
					this.setFlagIntoFlaggedObject(child, 'isBindingNeedRemove');
					changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
					changed.push(changeObject);
				}
				return;
			}

			if (child.boundItemId === smmChild.relatedId) {
				// it's normal
				if (this.isElementFlagged(child, true)) {
					changed.push({
						element: child,
						reason: 'was flagged',
						flagged: this.getCopyOfFlagged(child.flagged)
					});
					child.flagged = undefined;
				}
			} else {
				wasFlagged = child.flagged ? true : false;
				this.initFlaggedObject(child);
				if (!child.flagged.isBindingWrong) {
					changeObject = {
						element: child,
						reason: 'became flagged',
						flagged: wasFlagged
							? this.getCopyOfFlagged(child.flagged)
							: undefined
					};
					changed.push(changeObject);
				}
				this.setFlagIntoFlaggedObject(child, 'isBindingWrong'); // binding show on wrong business object
				child.flagged.smmRelatedId = smmChild.relatedId;
				if (changeObject) {
					changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
				}
			}
		},

		// case when "structure mapping" found correspondence between "Document Element" and "Business Object"
		// but "Document Element" hasn't any "binding"
		// 1 1 0
		case2: function (child, smmChild, changed) {
			//if action is "no bind", we should display item as normal
			if (smmChild.action === 'no bind') {
				if (this.isElementFlagged(child, true)) {
					changed.push({
						element: child,
						reason: 'was flagged',
						flagged: this.getCopyOfFlagged(child.flagged)
					});
					child.flagged = undefined;
				}
				return;
			}

			var wasFlagged = child.flagged ? true : false;
			this.initFlaggedObject(child);
			var changeObject;
			if (!child.flagged.isBindingNotExist) {
				changeObject = {
					element: child,
					reason: 'became flagged',
					flagged: wasFlagged ? this.getCopyOfFlagged(child.flagged) : undefined
				};
				changed.push(changeObject);
			}
			this.setFlagIntoFlaggedObject(child, 'isBindingNotExist'); // element and business object haven't binding
			child.flagged.smmRelatedId = smmChild.relatedId;
			if (changeObject) {
				changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
			}
		},

		// case when "structure mapping" found correspondence between "Document Element" and "Business Object"
		// but "Document Element" hasn't any "binding"
		// 1 0 1
		case3: function (child, smmChild, changed) {
			var wasFlagged;
			var changeObject;
			//if action is "no bind", we should display item as normal
			if (smmChild.action === 'no bind') {
				wasFlagged = child.flagged ? true : false;
				this.initFlaggedObject(child);
				if (!child.flagged.isBindingNeedRemove) {
					changeObject = {
						element: child,
						reason: 'became flagged',
						flagged: wasFlagged
							? this.getCopyOfFlagged(child.flagged)
							: undefined
					};
					changed.push(changeObject);
				}
				this.setFlagIntoFlaggedObject(child, 'isBindingNeedRemove');
				if (changeObject) {
					changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
				}
				return;
			}

			wasFlagged = child.flagged ? true : false;
			this.initFlaggedObject(child);
			if (!child.flagged.isStructureWrong) {
				changeObject = {
					element: child,
					reason: 'became flagged',
					flagged: wasFlagged ? this.getCopyOfFlagged(child.flagged) : undefined
				};
				changed.push(changeObject);
			}
			this.setFlagIntoFlaggedObject(child, 'isStructureWrong'); // element binding not exist in business object
			if (changeObject) {
				changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
			}
		},

		// case when "structure mapping" doesn't found correspondence between "Document Element" and "Business Object"
		// and "Document Element" hasn't any "binding"
		// 1 0 0
		case4: function (child, smmChild, changed) {
			if (smmChild.action === 'no bind') {
				if (this.isElementFlagged(child, true)) {
					changed.push({
						element: child,
						reason: 'was flagged',
						flagged: this.getCopyOfFlagged(child.flagged)
					});
					child.flagged = undefined;
				}
				return;
			}

			var wasFlagged = child.flagged ? true : false;
			this.initFlaggedObject(child);
			var changeObject;
			if (!child.flagged.isStructureWrong) {
				changeObject = {
					element: child,
					reason: 'became flagged',
					flagged: wasFlagged ? this.getCopyOfFlagged(child.flagged) : undefined
				};
				changed.push(changeObject);
			}
			this.setFlagIntoFlaggedObject(child, 'isStructureWrong'); // element binding not exist in business object
			if (changeObject) {
				changeObject.newFlagged = this.getCopyOfFlagged(child.flagged);
			}
		},

		checkOnFlagged: function (children, smmResult, curentType, changed) {
			for (var j = 0; j < children.length; j++) {
				var child = children[j];
				var smmChild = this.findElementInSmmResult(
					smmResult,
					curentType.id,
					child.id
				);
				if (smmChild && smmChild.action !== 'ignore') {
					if (smmChild.relatedId) {
						// 1 1
						if (child.boundItemId) {
							this.case1(child, smmChild, changed); // 1 1 1
						} else {
							this.case2(child, smmChild, changed); // 1 1 0
						}
					} else {
						// 1 0
						if (child.boundItemId) {
							this.case3(child, smmChild, changed); // 1 0 1
						} else {
							this.case4(child, smmChild, changed); // 1 0 0
						}
					}
				}
			}
		},

		fillBadSortOrderChild: function (badSortChild, changed, correctSortOrder) {
			var wasFlagged = badSortChild.flagged ? true : false;
			this.initFlaggedObject(badSortChild);
			if (!badSortChild.flagged.isBadSortOrder) {
				var alreadyChanged = changed.filter(function (change) {
					return (
						change.element.id === badSortChild.id &&
						change.reason === 'became flagged'
					);
				});
				var changeObject;
				if (alreadyChanged.length === 0) {
					changeObject = {
						element: badSortChild,
						reason: 'became flagged',
						flagged: wasFlagged
							? this.getCopyOfFlagged(badSortChild.flagged)
							: undefined
					};
					changed.push(changeObject);
				}
				this.setFlagIntoFlaggedObject(badSortChild, 'isBadSortOrder');
				badSortChild.flagged.correctSortOrder = correctSortOrder;
				if (changeObject) {
					changeObject.newFlagged = this.getCopyOfFlagged(badSortChild.flagged);
				}
			}
		},

		checkOnExistBadSortOrder: function (element, changed) {
			if (element.flagged && element.flagged.isBadSortOrder) {
				var flaggedCopy = this.getCopyOfFlagged(element.flagged);
				element.flagged.isBadSortOrder = false;
				this.updateFlaggedElement(element);
				var alreadyChanged = changed.filter(function (changedObject) {
					return changedObject.id === element.id;
				});
				if (alreadyChanged.length === 0) {
					changed.push({
						element: element,
						reason: 'was flagged',
						flagged: flaggedCopy
					});
				}
			}
		},

		getSmmElementWithoutCandidate: function (smmElements) {
			var resElements = [];
			for (var i = 0; i < smmElements.length; i++) {
				if (smmElements[i].sourceId) {
					resElements.push(smmElements[i]);
				}
			}
			return resElements;
		},

		checkOnBadSortOrder: function (
			children,
			smmResult,
			curentType,
			changed,
			smmElements
		) {
			var all = this.getSmmElementWithoutCandidate(smmElements);
			var childrenWithSmm = [];
			var childrenById = [];
			var checked = {};

			var childrenWithoutCandidates = children.filter(function (element) {
				return !element.isCandidate;
			});

			for (var j = 0; j < childrenWithoutCandidates.length; j++) {
				var child = childrenWithoutCandidates[j];
				childrenById[child.id] = child;
				var smmChild = this.findElementInSmmResult(
					smmResult,
					curentType.id,
					child.id
				);
				if (smmChild && smmChild.relatedId) {
					child.smmSortOrder = smmChild.sortOrder;
					childrenWithSmm.push(child);
				}
			}

			for (var i = 0; i < all.length; i++) {
				if (!all[i].sourceId) {
					continue;
				}

				if (childrenWithSmm.length <= i) {
					if (childrenById[all[i].sourceId]) {
						checked[all[i].sourceId] = true;
						this.fillBadSortOrderChild(childrenById[all[i].sourceId], changed);
					}
					continue;
				}

				if (all[i].sourceId === childrenWithSmm[i].id) {
					// normal
					checked[childrenWithSmm[i].id] = true;
					this.checkOnExistBadSortOrder(childrenWithSmm[i], changed);
				} else {
					if (childrenById[all[i].sourceId]) {
						checked[all[i].sourceId] = true;
						this.fillBadSortOrderChild(
							childrenById[all[i].sourceId],
							changed,
							i
						);
					}
				}
			}
			/* jshint ignore:start */
			for (var elementId in childrenById) {
				if (!checked[elementId]) {
					this.checkOnExistBadSortOrder(childrenById[elementId], changed);
				}
			}
			/* jshint ignore:end */
		},

		checkOnCandidateBadSortOrder: function (children, changed) {
			var candidateExist = false;
			for (var i = 0; i < children.length; i++) {
				if (children[i].isCandidate) {
					candidateExist = true;
				} else {
					if (
						candidateExist &&
						children[i].smmSortOrder !== undefined &&
						children[i].smmSortOrder !== null
					) {
						this.fillBadSortOrderChild(children[i], changed);
					}
				}
			}
		},

		tryFindInsertPlaceBetweenCandidates: function (candidate, children) {
			var lastCandidate = null;
			for (var i = 0; i < children.length; i++) {
				if (children[i].isCandidate) {
					if (children[i].smmSortOrder <= candidate.sortOrder) {
						lastCandidate = children[i];
						continue;
					}
				}
				break;
			}
			return lastCandidate;
		},

		findBeforeInsertElement: function (children, candidate, smmElements) {
			if (candidate.sortOrder === undefined || candidate.sortOrder === null) {
				return children.length > 0 ? children[children.length - 1] : null;
			}

			var parentId = null;
			for (var j = 0; j < smmElements.length; j++) {
				if (smmElements[j] === candidate) {
					for (var k = j - 1; k >= 0; k--) {
						if (smmElements[k].sourceId) {
							parentId = smmElements[k].sourceId;
							break;
						}
					}
					break;
				}
			}
			if (parentId === null) {
				return this.tryFindInsertPlaceBetweenCandidates(candidate, children);
			}

			for (var i = 0; i < children.length; i++) {
				if (children[i].id === parentId) {
					if (i + 1 === children.length) {
						return children[i];
					} else {
						var lastCandidate = null;
						for (var m = i + 1; m < children.length; m++) {
							if (children[m].isCandidate) {
								if (children[m].smmSortOrder <= candidate.sortOrder) {
									lastCandidate = children[m];
									continue;
								} else {
									return lastCandidate ? lastCandidate : children[i];
								}
							} else {
								return lastCandidate ? lastCandidate : children[i];
							}
						}
						return lastCandidate ? lastCandidate : children[i];
					}
				}
			}
			return children.length > 0 ? children[children.length - 1] : null;
		},

		clearDocElements: function (children) {
			for (var i = 0; i < children.length; i++) {
				if (!children[i].isCandidate) {
					children[i].smmSortOrder = undefined;
				}
			}
		},

		traversalTree: function (smmResult) {
			var stack = [];
			var rootElement = this.dataStore.getDocElement('root');
			stack.push(rootElement);
			var changed = [];
			while (stack.length > 0) {
				var currentRoot = stack.pop();
				var currentRootType = currentRoot.documentElementTypeId
					? this.dataStore.getDocElementTypeById(
							currentRoot.documentElementTypeId
					  )
					: null;
				var types = currentRootType
					? currentRootType.children
					: this.dataStore.getRootDocElementTypes();

				for (var i = 0; i < types.length; i++) {
					var curentType = types[i];
					var children = this.dataStore.getDocElementChildrenByType(
						currentRoot,
						curentType.id
					);

					if (smmResult[curentType.id]) {
						this.clearDocElements(children);
						this.parseSmmResult(
							smmResult,
							curentType,
							children,
							currentRoot,
							changed
						);
					}

					for (var j = 0; j < children.length; j++) {
						if (!children[j].isCandidate) {
							stack.push(children[j]);
						}
					}
				}
			}
			return changed;
		},

		insertCandidate: function (
			candidate,
			currentRoot,
			curentType,
			children,
			all
		) {
			var beforeInsertItem = this.findBeforeInsertElement(
				children,
				candidate,
				all
			);
			var parentElement = currentRoot;
			var newNode = this.dataStore.createDocElement(
				parentElement,
				candidate.relatedId,
				true,
				curentType.id,
				beforeInsertItem
			);
			var changedTreeItems;
			if (!newNode) {
				changedTreeItems = this.dataStore.recalculateSortOrder(
					parentElement,
					curentType.id
				);
				newNode = this.dataStore.createDocElement(
					parentElement,
					candidate.relatedId,
					true,
					curentType.id,
					beforeInsertItem
				);
				newNode.changedTreeItems = changedTreeItems;
			}

			newNode.isCandidate = true;
			newNode.smmSortOrder = candidate.sortOrder;
			var tableItems = this.dataStore.getPropertyElements(newNode);
			for (var j = 0; j < tableItems.length; j++) {
				tableItems[j].isCandidate = true;
			}

			this.dataStore.insertDocElement(parentElement, newNode);
			return newNode;
		},

		removeCandidate: function (arr, item) {
			for (var i = arr.length; i--; ) {
				if (arr[i] === item) {
					arr.splice(i, 1);
				}
			}
		},

		foundExistCandidates: function (existCandidates, currentCundidate) {
			return existCandidates.filter(function (element) {
				return element.boundItemId === currentCundidate.relatedId;
			});
		},

		parseCandidates: function (
			smmResult,
			curentType,
			currentRoot,
			children,
			changed,
			all
		) {
			var candidates = smmResult[curentType.id].filter(function (element) {
				if (currentRoot.isRootOfTree) {
					return element.parentSourceId === null && !element.sourceId;
				} else {
					return element.parentSourceId === currentRoot.id && !element.sourceId;
				}
			}); //!!!
			var existCandidates = children.filter(function (element) {
				return element.isCandidate;
			});
			var checkedExistCandidates = {};
			for (var i = 0; i < candidates.length; i++) {
				var foundExistCandidate = this.foundExistCandidates(
					existCandidates,
					candidates[i]
				);
				if (foundExistCandidate.length > 0) {
					checkedExistCandidates[foundExistCandidate[0].id] = true;
					if (candidates[i].sortOrder === undefined) {
						continue; // if candidate haven't sort order we won't do anything with it
					}
					changed.push({
						element: foundExistCandidate[0],
						reason: 'remove candidate'
					});
					this.dataStore.removeDocElement(currentRoot, foundExistCandidate[0]);
					this.removeCandidate(children, foundExistCandidate[0]);
				}

				var newNode = this.insertCandidate(
					candidates[i],
					currentRoot,
					curentType,
					children,
					all
				);
				var nextNode = this.dataStore.findNextElement(newNode);
				changed.push({
					element: newNode,
					parentElement: currentRoot,
					reason: 'add candidate',
					nextNodeId: nextNode ? nextNode.id : null
				});
				children.push(newNode);
				children.sort(function (a, b) {
					return a.sortOrder - b.sortOrder;
				});
			}

			for (var j = 0; j < existCandidates.length; j++) {
				if (!checkedExistCandidates[existCandidates[j].id]) {
					changed.push({
						element: existCandidates[j],
						reason: 'remove candidate'
					});
					this.dataStore.removeDocElement(currentRoot, existCandidates[j]);
					this.removeCandidate(children, existCandidates[j]);
				}
			}
		},

		parseSmmResult: function (
			smmResult,
			curentType,
			children,
			currentRoot,
			changed
		) {
			var smmElements = this.findElementsWithSortOrder(
				smmResult,
				curentType.id,
				currentRoot.isRootOfTree ? null : currentRoot.id
			);
			this.checkOnFlagged(children, smmResult, curentType, changed);
			this.checkOnBadSortOrder(
				children,
				smmResult,
				curentType,
				changed,
				smmElements
			);
			this.parseCandidates(
				smmResult,
				curentType,
				currentRoot,
				children,
				changed,
				smmElements
			);
			this.checkOnCandidateBadSortOrder(children, changed);
			for (var k = 0; k < children.length; k++) {
				var propertyItems = this.dataStore.getPropertyElements(children[k]);
				for (var m = 0; m < propertyItems.length; m++) {
					propertyItems[m].flagged = children[k].flagged;
				}
			}
		},

		run: function (docElementTypes) {
			var typesWithStuctureMapping = docElementTypes.filter(function (element) {
				return element.binding && element.binding.mappingMethod;
			});
			var smmResult = {};
			for (var i = 0; i < typesWithStuctureMapping.length; i++) {
				var elements = this.dataStore.getAllDocElementsByTypeId(
					typesWithStuctureMapping[i].id
				);
				var publicElements = [];
				for (var j = 0; j < elements.length; j++) {
					if (!elements[j].isCandidate) {
						publicElements.push(new Element(elements[j], this.dataStore));
					}
				}

				var factory = new Factory();
				var tree = new Tree(
					this.dataStore.getDocElement('root'),
					this.dataStore
				);
				var res = parent.aras.evalMethod(
					typesWithStuctureMapping[i].binding.mappingMethod,
					'',
					{ elements: publicElements, factory: factory, tree: tree }
				);
				smmResult[typesWithStuctureMapping[i].id] = res;
			}
			if (typesWithStuctureMapping.length > 0) {
				return this.traversalTree(smmResult);
			} else {
				return [];
			}
		}
	});
});
