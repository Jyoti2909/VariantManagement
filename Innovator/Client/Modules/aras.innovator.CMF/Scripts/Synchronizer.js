/* global define */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'./StoreFormatTransformer',
	'./StructureMappingHelper'
], function (declare, connect, StoreFormatTransformer) {
	return declare(null, {
		_tree: null,
		_grid: null,
		_transformer: null,
		dataStore: null,
		_collectedRows: {},

		constructor: function (grid, tree, dataStore) {
			var transformer = new StoreFormatTransformer();
			var self = this;

			this._transformer = transformer;
			this._grid = grid;
			this._tree = tree;
			this.dataStore = dataStore;

			connect.connect(grid, 'onCellSelected', function (rowId, nodeId, cellId) {
				tree.selectNode(rowId, nodeId, cellId);
			});

			connect.connect(tree, 'onNodeSelected', function (
				rootNodeId,
				tableItemId,
				isSelectedForEdit,
				isMultiselect,
				isToUnselect
			) {
				grid.selectCell(rootNodeId, tableItemId, isMultiselect, isToUnselect);
				if (isSelectedForEdit) {
					grid.editFocusedCell();
				}
			});

			// update treeItem (not root item)
			connect.connect(tree, 'onRowNodeUpdated', function (
				row,
				node,
				isToUpdateLater,
				isToSkipGridUpdate
			) {
				var updatedRow;

				if (isToUpdateLater) {
					if (!self._collectedRows[row.id]) {
						self._collectedRows[row.id] = row;
					}
				} else {
					if (!isToSkipGridUpdate) {
						updatedRow = transformer.transformToGridRow(
							row,
							grid.getColumnGroupCollection(),
							tree.getDocElemTypes(),
							dataStore
						);
						grid.updateRow(updatedRow);
					}
				}
			});

			connect.connect(tree, 'onInsertItem', function (rootItem) {
				var updatedRow = transformer.transformToGridRow(
					rootItem,
					grid.getColumnGroupCollection(),
					tree.getDocElemTypes(),
					dataStore
				);
				grid.insertCells(updatedRow);
			});

			connect.connect(tree, 'onSimpleUpdate', function (rows) {
				var updatedRow;
				for (var changedRowId in rows) {
					// jshint ignore:line
					var changedRow = rows[changedRowId];
					if (changedRow.isRootOfTree) {
						continue;
					}

					updatedRow = transformer.transformToGridRow(
						changedRow,
						grid.getColumnGroupCollection(),
						tree.getDocElemTypes(),
						dataStore
					);
					grid.updateRow(updatedRow);
				}
			});

			// delete root item node
			connect.connect(tree, 'onRowNodeDeleted', function (id) {
				grid.deleteRow(id);
			});

			// delete not root item node
			connect.connect(tree, 'onDeleteItem', function (rootItem) {
				if (rootItem) {
					var updatedRow = transformer.transformToGridRow(
						rootItem,
						grid.getColumnGroupCollection(),
						tree.getDocElemTypes(),
						dataStore
					);
					grid.insertCells(updatedRow);
				}
			});

			connect.connect(tree, 'onRowNodeAdded', function (newItem, sourceId) {
				var newNode = transformer.transformToGridRow(
					newItem,
					grid.getColumnGroupCollection(),
					tree.getDocElemTypes(),
					dataStore
				);
				grid.addRow(newNode, sourceId);
			});
		}
	});
});
