define(function () {
	const TgvTreeGridSort = {
		_tgvTreeGrid: null,
		_sortRows: null,
		_sortedCellTypes: ['text', 'number', 'date', 'color', 'item', 'boolean'],

		initSort: function (tgvTreeGrid) {
			this._tgvTreeGrid = tgvTreeGrid;
			this._sortRows = tgvTreeGrid._grid.actions._sortRows;
			const firstColumnName = 'col0';
			const self = this;
			const _getCellType = function (rowId, prop) {
				let cellIndex = self._tgvTreeGrid.getCellIndex(prop);
				let row = self._tgvTreeGrid.getRow(rowId);
				let cell = row.cells[cellIndex];
				let cellType = cell.viewType;
				if (cell.link) {
					return 'item';
				}
				if (!cellType) {
					return 'text';
				}
				if (
					cellType === 'decimal' ||
					cellType === 'float' ||
					cellType === 'integer'
				) {
					cellType = 'number';
				}
				return cellType;
			};

			tgvTreeGrid._grid.actions._sortRows = function (
				rowAId,
				rowBId,
				prop,
				reverse
			) {
				const rowA = self._tgvTreeGrid._grid.rows._store.get(rowAId);
				const rowB = self._tgvTreeGrid._grid.rows._store.get(rowBId);

				let cellIndex = self._tgvTreeGrid.getCellIndex(firstColumnName);
				let tgvGridRowA = self._tgvTreeGrid.getRow(rowAId);
				if (
					tgvGridRowA.cells[cellIndex].link ===
					self._tgvTreeGrid.showMoreLinkValue
				) {
					return 1;
				}
				let tgvGridRowB = self._tgvTreeGrid.getRow(rowBId);
				if (
					tgvGridRowB.cells[cellIndex].link ===
					self._tgvTreeGrid.showMoreLinkValue
				) {
					return -1;
				}
				const cellAType = _getCellType(rowAId, prop);
				const cellBType = _getCellType(rowBId, prop);

				const cellATypeIndex = self._sortedCellTypes.indexOf(cellAType);
				const cellBTypeIndex = self._sortedCellTypes.indexOf(cellBType);
				if (cellATypeIndex > cellBTypeIndex) {
					return reverse ? -1 : 1;
				}
				if (cellATypeIndex < cellBTypeIndex) {
					return reverse ? 1 : -1;
				}
				if (cellAType === 'number' && cellBType === 'number') {
					const rowAValue = parseFloat(rowA[prop]);
					const rowBValue = parseFloat(rowB[prop]);
					if (rowAValue < rowBValue) {
						return reverse ? 1 : -1;
					}
					if (rowAValue > rowBValue) {
						return reverse ? -1 : 1;
					}
				}
				return self._sortRows.call(
					{ grid: self._tgvTreeGrid._grid },
					rowAId,
					rowBId,
					prop,
					reverse
				);
			};
		}
	};
	return TgvTreeGridSort;
});
