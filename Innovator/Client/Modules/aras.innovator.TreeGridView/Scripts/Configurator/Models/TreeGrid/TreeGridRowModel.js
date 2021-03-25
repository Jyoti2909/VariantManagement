define(function () {
	'use strict';
	var TreeGridRowModel = (function () {
		function TreeGridRowModel(rowItem) {
			if (rowItem) {
				this.parseFromRowItem(rowItem);
			}
		}
		Object.defineProperty(TreeGridRowModel.prototype, 'uniqueId', {
			get: function () {
				return this._uniqueId;
			},
			set: function (uniqueId) {
				this._uniqueId = uniqueId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'parentUniqueId', {
			get: function () {
				return this._parentUniqueId;
			},
			set: function (parentUniqueId) {
				this._parentUniqueId = parentUniqueId;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'icon', {
			get: function () {
				return this._icon;
			},
			set: function (icon) {
				this._icon = icon;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'itemTypeName', {
			get: function () {
				return this._itemTypeName;
			},
			set: function (itemTypeName) {
				this._itemTypeName = itemTypeName;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'isCandidate', {
			get: function () {
				return this._isCandidate;
			},
			set: function (isCandidate) {
				this._isCandidate = isCandidate;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'isRecursiveNode', {
			get: function () {
				return this._isRecursiveNode;
			},
			set: function (isRecursiveNode) {
				this._isRecursiveNode = isRecursiveNode;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'columnMappings', {
			get: function () {
				return this._columnMappings;
			},
			set: function (columnMappings) {
				this._columnMappings = columnMappings;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'hasJoinedNodes', {
			get: function () {
				return this._hasJoinedNodes;
			},
			set: function (hasJoinedNodes) {
				this._hasJoinedNodes = hasJoinedNodes;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(TreeGridRowModel.prototype, 'validTemplates', {
			get: function () {
				return this._validTemplates;
			},
			set: function (validTemplates) {
				this._validTemplates = validTemplates;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(
			TreeGridRowModel.prototype,
			'isReferencingTreeGridRow',
			{
				get: function () {
					return this._isReferencingTreeGridRow;
				},
				set: function (isReferencingTreeGridRow) {
					this._isReferencingTreeGridRow = isReferencingTreeGridRow;
				},
				enumerable: true,
				configurable: true
			}
		);
		TreeGridRowModel.prototype.hasAnyCellTemplate = function () {
			var res = false;
			if (this.columnMappings) {
				var isNotValuableColumnMappings = this.columnMappings.every(function (
					mapping
				) {
					return !mapping.template;
				});
				return !isNotValuableColumnMappings;
			}
			return res;
		};
		TreeGridRowModel.prototype.parseFromRowItem = function (item) {
			this.uniqueId = item.uniqueId ? item.uniqueId[0] : undefined;
			this.columnMappings = item.columnMappings
				? item.columnMappings
				: undefined;
			this.hasJoinedNodes = item.hasJoinedNodes
				? item.hasJoinedNodes[0]
				: undefined;
			this.icon = item.icon ? item.icon[0] : undefined;
			this.isCandidate = item.isCandidate ? item.isCandidate[0] : undefined;
			this.isRecursiveNode = item.isRecursiveNode
				? item.isRecursiveNode[0]
				: undefined;
			this.itemTypeName = item.itemTypeName ? item.itemTypeName[0] : undefined;
			this.parentUniqueId = item.parentUniqueId
				? item.parentUniqueId[0]
				: undefined;
			this.validTemplates = item.validTemplates
				? item.validTemplates
				: undefined;
			this.isReferencingTreeGridRow = item.isReferencingTreeGridRow
				? item.isReferencingTreeGridRow[0]
				: undefined;
		};
		return TreeGridRowModel;
	})();
	return TreeGridRowModel;
});
