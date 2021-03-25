(function (window) {
	'use strict';

	const beforeSortHandler = function (e) {
		if (e.target !== this.treeGrid.dom) {
			return;
		}

		const columnName = this.getColumnName(e.detail.index);
		const isColumnSortable = this.getColumnSettings(columnName).sortable;

		if (!isColumnSortable) {
			e.stopPropagation();
		}
	};

	const beforeResizeHeadHandler = function (e) {
		if (e.target !== this.treeGrid.dom) {
			return;
		}

		const columnName = this.getColumnName(e.detail.index);
		e.detail.oldWidth = this.getColumnWidth(columnName);
	};

	const afterApplyEditHandler = function (e) {
		const detail = e.detail;
		const row = this._rowsMap.get(detail.rowId);
		this._updateUserRowObject(row, detail.headId, detail.value);
	};

	window.DynamicTreeGridActions = {
		getHandlers: function () {
			return [
				{
					type: 'before',
					action: 'sort',
					handler: beforeSortHandler
				},
				{
					type: 'before',
					action: 'resizeHead',
					handler: beforeResizeHeadHandler
				},
				{
					type: 'after',
					action: 'applyEdit',
					handler: afterApplyEditHandler
				}
			];
		}
	};
})(window);
