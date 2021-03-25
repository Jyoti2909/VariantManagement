function PropertyOverrideModule(columns) {
	const OverridePropertyNames = function (
		defaultProperty,
		isOverrideProperty,
		overrideProperty
	) {
		this.defaultProperty = defaultProperty + '_R';
		this.isOverrideProperty = isOverrideProperty
			? isOverrideProperty
			: 'override_' + defaultProperty + '_D';
		this.overrideProperty = overrideProperty
			? overrideProperty
			: defaultProperty + '_D';
	};

	this.grid = null;
	this._overrideCells = [];
	this._overrideColumns = [];

	columns.forEach(
		function (column) {
			this._overrideColumns.push(new OverridePropertyNames(column));
		}.bind(this)
	);
}

PropertyOverrideModule.prototype._getColumnIndexFromGrid = function (name) {
	const columns = this.grid.grid_Experimental.nameColumns;
	return this.grid.grid_Experimental.order.indexOf(columns.indexOf(name));
};

PropertyOverrideModule.prototype._getOverrideColumnIndex = function (name) {
	let index = -1;
	for (let i = 0; i < this._overrideColumns.length; i++) {
		const overrideColumn = this._overrideColumns[i];
		if (overrideColumn.defaultProperty === name) {
			index = i;
			break;
		}
	}
	return index;
};

PropertyOverrideModule.prototype._createOverrideCell = function (
	defaultCell,
	isOverrideCell,
	overrideCell
) {
	const self = this;
	defaultCell.SetValue = isOverrideCell.SetValue = overrideCell.SetValue = function (
		value,
		setInProperty
	) {
		this.setValue(value);
		if (setInProperty) {
			const rowId = this.GetRowId();
			const index = this.getColumnIndex();
			currSelCell = this;
			currSelCol = self.grid.grid_Experimental.order.indexOf(index);
			currSelRowId = rowId;
			self.grid.onApplyEdit_Experimental(
				rowId,
				self.grid.getColumnName(index),
				value
			);
		}
	};

	const newOverrideCell = {
		defaultCell: defaultCell,
		isOverrideCell: isOverrideCell,
		overrideCell: overrideCell
	};

	Object.defineProperties(newOverrideCell, {
		value: {
			get: function () {
				let value;
				if (this.isOverride) {
					value = this.overrideCell.GetValue();
					if (
						typeof this.defaultCell.GetValue() === 'boolean' &&
						typeof value !== 'boolean'
					) {
						value = false;
					}
				} else {
					value = this.defaultCell.GetValue();
				}
				return value;
			}
		},
		isOverride: {
			get: function () {
				return !!this.isOverrideCell.GetValue();
			},
			set: function (value) {
				this.isOverrideCell.SetValue(!!value, true);
			}
		}
	});

	return newOverrideCell;
};

PropertyOverrideModule.prototype.getCell = function (rowId, columnName) {
	const row = this._overrideCells[rowId];
	const columnIndex = this._getOverrideColumnIndex(columnName);
	if (!row && columnIndex > -1) {
		return;
	}
	columnName = this._overrideColumns[columnIndex].defaultProperty;
	return this._overrideCells[rowId][columnName];
};

PropertyOverrideModule.prototype.isOverrideCell = function (columnName) {
	return this._getOverrideColumnIndex(columnName) > -1;
};

PropertyOverrideModule.prototype.hideColumns = function () {
	const self = this;
	this._overrideColumns.forEach(function (overrideCell) {
		let index = self._getColumnIndexFromGrid(overrideCell.isOverrideProperty);
		if (index > -1) {
			hideColumn(self.grid.grid_Experimental.order[index]);
		}
		index = self._getColumnIndexFromGrid(overrideCell.overrideProperty);
		if (index > -1) {
			hideColumn(self.grid.grid_Experimental.order[index]);
		}
	});
};

PropertyOverrideModule.prototype.afterAddingRowToGrid = function (id) {
	const self = this;
	const rowOverrideCells = {};
	this._overrideColumns.forEach(function (overrideColumn) {
		const defaultColumnIndex = self._getColumnIndexFromGrid(
			overrideColumn.defaultProperty
		);
		const isOverrideColumnIndex = self._getColumnIndexFromGrid(
			overrideColumn.isOverrideProperty
		);
		const overrideColumnIndex = self._getColumnIndexFromGrid(
			overrideColumn.overrideProperty
		);
		const defaultCell = self.grid.Cells(id, defaultColumnIndex);
		const isOverrideCell = self.grid.Cells(id, isOverrideColumnIndex);
		const overrideCell = self.grid.Cells(id, overrideColumnIndex);
		rowOverrideCells[overrideColumn.defaultProperty] = self._createOverrideCell(
			defaultCell,
			isOverrideCell,
			overrideCell
		);
	});
	this._overrideCells[id] = rowOverrideCells;
};
