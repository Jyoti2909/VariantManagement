define(['dojo/_base/declare', 'dojox/grid/_EditManager'], function (
	declare,
	_EditManager
) {
	return declare(
		'Aras.Client.Controls.Experimental.ExcelEditManager',
		_EditManager,
		{
			_getView: function () {
				return this.grid.views.views[0];
			},
			_getCellNode: function (rowIndex, cellIndex) {
				return this._getView().getCellNode(rowIndex, cellIndex);
			},
			_getCol: function (rowIndex, cellIndex) {
				return this.grid.layout.cells[this._getColIndex(rowIndex, cellIndex)];
			},
			_getColIndex: function (rowIndex, cellIndex) {
				var cellNode = this._getCellNode(rowIndex, cellIndex);
				return cellNode.getAttribute('col');
			},
			start: function (inCell, inRowIndex, inEditing) {
				throw "ExcelGrid doesn't support this method";
			},
			_focusEditor: function (inRowIndex, inCellIndex) {
				throw "ExcelGrid doesn't support this method";
			},
			startExcel: function (inRowIndex, inCellIndex, inEditing) {
				if (!this._isValidInput()) {
					return;
				}
				this.grid.beginUpdate();
				var inColIndex = this._getColIndex(inRowIndex, inCellIndex);
				if (inEditing && this.grid.doCanEditExcel(inRowIndex, inCellIndex)) {
					//need to set focus in new cell when we reload grid
					this.grid.focus.setFocusIndex(inRowIndex, inCellIndex);
					this.info = {
						cellIndex: inCellIndex,
						rowIndex: inRowIndex,
						cell: this.grid.layout.cells[inColIndex]
					};
					this.grid.updateRow(inRowIndex);
				} else {
					this.info = {};
				}
				this.grid.endUpdate();
				// make sure we don't utterly lose focus
				this.grid.focus.focusGrid();
				// let the editor focus itself as needed
				this._focusEditorExcel(inRowIndex, inCellIndex);
				// give ourselves a few ms to boomerang IE focus effects
				this._doCatchBoomerang();
			},
			apply: function () {
				if (this.isEditing() && this._isValidInput()) {
					this.grid.beginUpdate();
					this.editorApply();
					this.info = {};
					this.grid.endUpdate();
					this.grid.focus.focusGrid();
					this._doCatchBoomerang();
				}
			},
			setEditCell: function (inCell, inRowIndex) {
				throw "ExcelGrid doesn't support this method";
			},
			setEditCellExcel: function (inRowIndex, inCellIndex) {
				if (!this.isEditCell(inRowIndex, inCellIndex) && this.grid._canEdit) {
					var col = this._getCol(inRowIndex, inCellIndex),
						inEditing = this.isEditRow(inRowIndex) || col.editable;

					if (this.isEditing()) {
						this.apply();
					}
					this.startExcel(inRowIndex, inCellIndex, inEditing);
				}
			},
			applyCellEdit: function (inValue, inCell, inRowIndex) {
				this.grid.doApplyCellEditExcel(
					inValue,
					this.info.rowIndex,
					this.info.cellIndex
				);
			},
			applyRowEdit: function () {
				if (
					undefined !== this.info.rowIndex &&
					undefined !== this.info.cellIndex
				) {
					this.grid.doApplyEditExcel(this.info.rowIndex, this.info.cellIndex);
				}
			},
			isEditCell: function (inRowIndex, inCellIndex) {
				return (
					this.info.rowIndex === inRowIndex &&
					this.info.cellIndex == inCellIndex
				);
			},
			cellFocus: function (inRowIndex, inCellIndex) {
				var col = this._getCol(inRowIndex, inCellIndex);
				if (this.isEditing() || (col && col.editable && col.alwaysEditing)) {
					this._focusEditorExcel(inRowIndex, inCellIndex);
				}
			},
			focusEditor: function () {
				if (this.isEditing()) {
					this._focusEditorExcel(this.info.rowIndex, this.info.cellIndex);
				}
			},
			_focusEditorExcel: function (inRowIndex, inCellIndex) {
				var inCell = this._getCol(inRowIndex, inCellIndex);
				if (inCell && inCell.widget) {
					inCell.widget.focus();
				}
			}
		}
	);
});
