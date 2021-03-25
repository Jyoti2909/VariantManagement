define([
	'TreeGridView/Scripts/Configurator/Models/ViewDefinition/ReferenceTypeEnum'
], function (REFERENCE_TYPE_ENUM) {
	'use strict';
	var TreeRowReference = (function () {
		function TreeRowReference(item) {
			if (!item) {
				return;
			}
			this._id = item.getAttribute('id');
			this._childRefId = item.getProperty('child_ref_id');
			this._parentRefId = item.getProperty('parent_ref_id');
			var viewOrder = item.getProperty('view_order');
			if (viewOrder) {
				this._viewOrder = parseInt(viewOrder, 10);
			} else {
				this._viewOrder = 128;
			}
			var referenceType = item.getProperty('reference_type');
			if (referenceType) {
				referenceType = referenceType.toLowerCase();
				switch (referenceType) {
					case 'join':
						this._referenceType = REFERENCE_TYPE_ENUM.JOIN;
						break;
					default:
						this._referenceType = REFERENCE_TYPE_ENUM.CHILD;
				}
			} else {
				this._referenceType = REFERENCE_TYPE_ENUM.CHILD;
			}
		}
		Object.defineProperty(TreeRowReference.prototype, 'id', {
			get: function () {
				return this._id;
			},
			set: function (id) {
				this._id = id;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowReference.prototype, 'childRefId', {
			get: function () {
				return this._childRefId;
			},
			set: function (childRefId) {
				this._childRefId = childRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowReference.prototype, 'parentRefId', {
			get: function () {
				return this._parentRefId;
			},
			set: function (parentRefId) {
				this._parentRefId = parentRefId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowReference.prototype, 'referenceType', {
			get: function () {
				return this._referenceType;
			},
			set: function (referenceType) {
				this._referenceType = referenceType;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowReference.prototype, 'viewOrder', {
			get: function () {
				return this._viewOrder;
			},
			set: function (viewOrder) {
				this._viewOrder = viewOrder;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeRowReference.prototype, 'isRecursiveRef', {
			get: function () {
				return this._isRecursiveRef;
			},
			set: function (isRecursiveRef) {
				this._isRecursiveRef = isRecursiveRef;
			},
			enumerable: true,
			configurable: true
		});
		TreeRowReference.prototype.serializeToItem = function (item) {
			if (item) {
				item.setAttribute('id', this._id);
				item.setProperty('child_ref_id', this._childRefId);
				item.setProperty('parent_ref_id', this._parentRefId);
				item.setProperty('view_order', this.viewOrder.toString());
				item.setProperty('reference_type', this.referenceType);
			}
			return item;
		};
		return TreeRowReference;
	})();
	return TreeRowReference;
});
