var onItemDelete = function(e) {
	var grid = this._grid;
	var selectedRows = grid.settings.selectedRows;
	grid.settings.selectedRows = [];
	var indexTreeRows = grid.settings.indexTreeRows;
	var self = this;
	var recursiveDelete = function(itemIds, indexTreeRows) {
		itemIds.forEach(function(rowId) {
			if (!grid.rows.has(rowId)) {
				return;
			}

			var rowChildren = grid.rows.get(rowId, 'children');
			grid.rows.delete(rowId);
			if (rowChildren && rowChildren.length) {
				recursiveDelete(rowChildren, indexTreeRows);
			}

			if (indexTreeRows[rowId]) {
				grid.settings.expanded.delete(rowId);
				delete indexTreeRows[rowId];
			}

			var parentId = self.getParentId(rowId);
			var parentIndexTreeRow = indexTreeRows[parentId];
			if (parentIndexTreeRow) {
				if (parentIndexTreeRow.length > 1) {
					parentIndexTreeRow.splice(parentIndexTreeRow.indexOf(rowId), 1);
				} else {
					delete indexTreeRows[parentId];
					grid.settings.expanded.delete(parentId);
				}
			}

			var parentRow = grid.rows.get(parentId);
			var parentChildren = parentRow && parentRow.children;
			if (parentChildren) {
				if (parentChildren.length > 1) {
					parentChildren.splice(parentChildren.indexOf(rowId), 1);
				} else {
					delete parentRow.children;
					grid.rows.set(parentId, parentRow);
				}
			}
		});
	};

	recursiveDelete(selectedRows, indexTreeRows);
	grid.metadata = grid.actions._calcRowsMetadata(indexTreeRows);
	grid.render();
};

const onItemPaste = function(e) {
	const pastedItems = e.detail.items;
	const action = e.detail.action;
	const grid = this._grid;

	if (action === 'cut') {
		this._cutSelectedItemsBuffer.clear();
	} else {
		pastedItems.forEach(function(itemId) {
			addNewRow(itemId, grid);
		});
	}

	const targetId = e.detail.targetId || grid.settings.selectedRows[0];
	const rowChildren = grid.rows.get(pastedItems[0], 'children');
	const expandedItem = grid.settings.expanded.has(targetId) || grid.rows.get(targetId, 'children') === undefined;
	const rootItem = grid.roots.indexOf(targetId) >= 0;
	const notSameLevel = (expandedItem && rowChildren === false) || rootItem;
	grid.settings.selectedRows = pastedItems;
	this.scrollToRow(pastedItems[pastedItems.length - 1]);
	grid.actions._moveRowHandler(targetId, pastedItems, !notSameLevel);
};

var onMoveUpOrDown = function(e) {
	var grid = this._grid;
	var selectedRows = grid.settings.selectedRows;
	var rowId = selectedRows[0];
	var parentId = this.getParentId(rowId);
	var parentRow = grid.rows.get(parentId);
	var parentRowChildren = parentRow.children;
	var rowIndex = parentRowChildren.indexOf(rowId);
	var moveDown = e.detail.moveDown;
	var targetId = moveDown ? parentRowChildren[rowIndex + 1] : rowIndex - 2 > -1 ? parentRowChildren[rowIndex - 2] : parentId;
	var sameLevel = targetId !== parentId;
	grid.actions._moveRowHandler(targetId, selectedRows, sameLevel);
};

var onItemOutdent = function(e) {
	var grid = this._grid;
	var selectedRows = grid.settings.selectedRows;
	var rowId = selectedRows[0];
	var parentId = this.getParentId(rowId);
	grid.actions._moveRowHandler(parentId, selectedRows, true);
};

const onItemIndent = function(e) {
	const grid = this._grid;
	const selectedRows = grid.settings.selectedRows;
	const rowId = selectedRows[0];
	let targetId = canIndentItem(rowId);
	if (!targetId) {
		return;
	}

	grid.settings.expanded.add(targetId);
	grid.render();

	const promise = grid.rows.get(targetId, 'children') === true ? grid._buildBranchData(targetId) : Promise.resolve();
	promise.then(function() {
		let sameLevel;
		const targetChidlren = grid.rows.get(targetId, 'children');
		if (targetChidlren) {
			targetId = targetChidlren[targetChidlren.length - 1];
			sameLevel = true;
		} else {
			sameLevel = false;
		}

		grid.actions._moveRowHandler(targetId, selectedRows, sameLevel);
		indentItem(rowId);
	});
};

var onItemDragAndDrop = function(e) {
	if (this.canCut()) {
		var grid = this._grid;
		var targetId = e.detail.targetId;
		var ctrlKey = e.detail.ctrlKey;
		var selectedRows = grid.settings.selectedRows;
		var rowChildren = grid.rows.get(selectedRows[0], 'children');
		var targetChildren = grid.rows.get(targetId, 'children');
		var expandedWBS = targetChildren === undefined || grid.settings.expanded.has(targetId);
		var rootItem = grid.roots.indexOf(targetId) >= 0;
		var notSameLevel = (rowChildren === false && expandedWBS) || rootItem;
		this.onDragDrop(targetId, ctrlKey, notSameLevel);
	}
};

var addNewRow = function(rowId, grid) {
	var itemNode = viewShare.functions.getItemNodeById(rowId);
	var itemType = itemNode.getAttribute('type');
	var isActivity = itemType === 'Activity2';
	var isMilestone = isActivity ? aras.getItemProperty(itemNode, 'is_milestone') === '1' : false;
	var rowChildren = false;

	if (!isActivity) {
		rowChildren = ArasModules.xml.selectNodes(itemNode, './Relationships/Item[@type="Sub WBS" or @type="WBS Activity2"]/related_id/Item')
			.map(function(item) {
				return item.getAttribute('id');
			});

		if (rowChildren.length) {
			if (grid.settings.orderBy.length) {
				rowChildren.sort(grid.actions._sortFn.bind(grid));
			}

			grid.settings.indexTreeRows[rowId] = rowChildren.slice();
			rowChildren.forEach(function(itemId) {
				addNewRow(itemId, grid);
			});
		} else {
			rowChildren = undefined;
		}
	}

	var newRow = {
		children: rowChildren,
		isMilestone: isMilestone,
		style: {},
		type: itemType,
		uniqueId: rowId
	};

	updateGridRowFromItem(rowId);
	newRow = Object.assign(grid.rows.get(rowId), newRow);
	grid.rows.set(rowId, newRow);

	return newRow;
};

var onItemAdd = function(e) {
	var grid = this._grid;
	var rowId = e.detail.itemId;
	var headId = e.detail.headId;
	var row = addNewRow(rowId, grid);
	var targetId = grid.settings.selectedRows[0];
	var targetChildren = grid.rows.get(targetId, 'children');
	var notSameLevel = (row.children === false && (targetChildren === undefined || grid.settings.expanded.has(targetId))) || grid.roots.indexOf(targetId) >= 0;
	grid.actions._moveRowHandler(targetId, [rowId], !notSameLevel);
	grid.settings.selectedRows = [rowId];
	grid.settings.focusedCell = {
		rowId: rowId,
		headId: headId,
		editing: true
	};
};

var gridItemEvents = [
	{
		action: 'deleteItem',
		handler: onItemDelete
	},
	{
		action: 'pasteItem',
		handler: onItemPaste
	},
	{
		action: 'moveDownOrUp',
		handler: onMoveUpOrDown
	},
	{
		action: 'outdentItem',
		handler: onItemOutdent
	},
	{
		action: 'indentItem',
		handler: onItemIndent
	},
	{
		action: 'moveRow',
		handler: onItemDragAndDrop
	},
	{
		action: 'addItem',
		handler: onItemAdd
	}
];
