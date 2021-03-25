define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.RM.Action.ShiftRequirementsAction', ActionBase, {
		_arasBlockNode: null,

		constructor: function(args) {
		},

		Execute: function(args) {
			// need to keep _arasBlockNode in actual state
			this._arasBlockNode = this._viewmodel.Dom().origin;

			this._viewmodel.SuspendInvalidation();
			var focusElement;
			switch (args.direction) {
				case 'up':
				case 'down':
					focusElement = this._shiftVertical(args);
					break;
				case 'unindent':
					focusElement = this._shiftHorizontal(args);
					break;
				default:
					break;
			}

			if (focusElement) {
				this._viewmodel.focusElement(focusElement, true);
			}
			this._viewmodel.ResumeInvalidation();
		},

		_shiftVertical: function(args) {
			var moveUpItemId = args.upItemId;
			var moveDownItemId = args.downItemId;
			var moveUpSectionNumber = args.upSectionNumber;
			var direction = args.direction;

			var moveDownElement = this._getElementById(moveDownItemId);
			var moveUpElement = this._getElementById(moveUpItemId);

			var nextSectionReqId = this._getNextSectionReqId(moveUpSectionNumber);
			if (!nextSectionReqId) {
				nextSectionReqId = this._findReqIdClosestToParent(moveUpSectionNumber);
			}

			var nextIndex = this._getIndexOfNextNode(nextSectionReqId);
			nextIndex = nextIndex || this._arasBlockNode.childNodes.length;
			this._changeElementsOrder(moveDownElement, nextIndex, moveUpElement, true);

			return direction == 'up' ? moveUpElement : moveDownElement;
		},

		_shiftHorizontal: function(args) {
			var unindentItemId = args.unindentItemId;
			var unindentSectionNumber = args.unindentSectionNumber;
			var unindentElement = this._getElementById(unindentItemId);

			var nextSectionReqId = this._getNextSectionReqId(unindentSectionNumber);
			if (!nextSectionReqId) {
				return unindentElement;
			}

			var nextOrigin = this._getOriginById(nextSectionReqId);
			var nextIndex = this._blockNodeIndexOf(nextOrigin);

			// If there is no item after parent on current level, it not means that there are no items at all.
			// Need go up recursively to find node before which should be inserted unindent node with child's.
			var elementAfterParent;
			var closestToParentReqId = this._findReqIdClosestToParent(unindentSectionNumber);
			if (closestToParentReqId) {
				elementAfterParent = this._getElementById(closestToParentReqId);
			}

			this._changeElementsOrder(elementAfterParent, nextIndex, unindentElement, false);

			return unindentElement;
		},

		_changeElementsOrder: function(insertBeforeElement, nextIndex, startElement, isVertical) {
			var elementsToMove = this._getElementsToMove(nextIndex, startElement);
			var childList = startElement.Parent.ChildItems();
			var insertAtIndex = this._getInsertAtInitialValue(insertBeforeElement, childList, isVertical);

			for (var elementIndex = 0; elementIndex < elementsToMove.length; elementIndex++) {
				var element = elementsToMove[elementIndex];
				var originalElementIndex = childList.index(element);
				childList.splice(originalElementIndex, 1);
				if (!isVertical) {
					childList.insertAt(insertAtIndex, element);
				} else {
					childList.insertAt(insertAtIndex + elementIndex, element);
				}
			}
		},

		_getInsertAtInitialValue: function(insertBeforeElement, childList, isVertical) {
			return isVertical ? childList.index(insertBeforeElement)
				: (insertBeforeElement ? childList.index(insertBeforeElement) : childList.length()) - 1;
		},

		_getElementsToMove: function(nextIndex, startElement) {
			var elementsToMove = [startElement];
			var startIndex = this._blockNodeIndexOf(startElement.origin) + 1;

			for (var originIndex = startIndex; originIndex < nextIndex; originIndex++) {
				var childElement = this._getElementByOriginIndex(originIndex);
				elementsToMove.push(childElement);
			}

			return elementsToMove;
		},

		_getElementByOriginIndex: function(index) {
			var origin = this._arasBlockNode.childNodes[index];
			return this._viewmodel.GetElementsByOrigin(origin)[0];
		},

		_getElementById: function(id) {
			var origin = this._getOriginById(id);
			return this._viewmodel.GetElementsByOrigin(origin)[0];
		},

		_getOriginById: function(id) {
			return this._arasBlockNode.selectSingleNode('*[@reqId="' + id + '"]');
		},

		_getNextSectionReqId: function(sectionNumber) {
			// example of section number calculation: sectionNumber = '3.2.1', nextSectionNumber = '3.2.2'
			var fragmentedSection = sectionNumber.split('.');
			var indexPosition = fragmentedSection.length - 1;
			var nextSectionLastIndex = parseInt(fragmentedSection[indexPosition]) + 1;
			var nextSectionPart = fragmentedSection.slice(0, -1);
			var nextSectionNumber = nextSectionPart.join('.') + (nextSectionPart.length ? '.' : '') + nextSectionLastIndex;

			return this._viewmodel.GetReqIdBySectionNumber(nextSectionNumber);
		},

		_getParentSectionNumber: function(sectionNumber) {
			var fragmentedSection = sectionNumber.split('.');
			return fragmentedSection.slice(0, -1).join('.');
		},

		_findReqIdClosestToParent: function(sectionNumber) {
			var afterParentReqId;
			var parentSectionNumber = this._getParentSectionNumber(sectionNumber);
			if (parentSectionNumber) {
				afterParentReqId = this._getNextSectionReqId(parentSectionNumber);
				if (!afterParentReqId) {
					return this._findReqIdClosestToParent(parentSectionNumber);
				}
			}

			return afterParentReqId;
		},

		_blockNodeIndexOf: function(node) {
			return Array.prototype.indexOf.call(this._arasBlockNode.childNodes, node);
		},

		_getIndexOfNextNode: function(nextOriginReqId) {
			if (nextOriginReqId) {
				var nextOrigin = this._getOriginById(nextOriginReqId);
				return this._blockNodeIndexOf(nextOrigin);
			}

			return this._arasBlockNode.childNodes.length;
		}
	});
});
