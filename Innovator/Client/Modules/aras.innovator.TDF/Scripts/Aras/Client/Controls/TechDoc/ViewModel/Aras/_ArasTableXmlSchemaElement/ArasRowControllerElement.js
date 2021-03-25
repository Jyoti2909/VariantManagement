define(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.ArasRowControllerElement',
		null,
		{
			_viewmodel: null,
			_rowsList: null,
			_cellCount: 0,
			_aras: null,

			constructor: function (args) {
				this._viewmodel = args.viewmodel;
				this._rowsList = {};
				this._aras = this._viewmodel._aras;

				//aspect.after(this._viewmodel, "OnElementRegistered", this._OnElementRegistered.bind(this), true);
				aspect.after(
					this._viewmodel,
					'OnElementUnregistered',
					this._OnElementUnregistered.bind(this),
					true
				);
			},

			AddToControl: function (/*WrappedObject*/ rowWrappedObject) {
				var id = rowWrappedObject.Id();

				if (!this._rowsList[id]) {
					this._rowsList[id] = rowWrappedObject;
					rowWrappedObject.NotifyChanged = this.NotifyChanged;
					var cellCount =
						rowWrappedObject.ChildItems().length() || this.GetCellsCount();

					if (cellCount) {
						rowWrappedObject.cellOriginNodeName = this._getCellType();
						rowWrappedObject.PushEmptyCellsInRow(cellCount);
						this._cellCount = cellCount;
					}
				}
			},

			GetCellsCount: function () {
				if (!this._cellCount) {
					var rlist = this._rowsList;

					for (var key in rlist) {
						this._cellCount = rlist[key].ChildItems().length();
						break;
					}
				}

				return this._cellCount;
			},

			AppendRow: function (/*WrappedObject*/ row) {
				var typeRowName = this._getRowType();
				var typeCellName = this._getCellType();
				var newRow = this._viewmodel.CreateElement('element', {
					type: typeRowName
				});
				var cellCount = this.GetCellsCount();
				var rowSiblings = row.Parent.ChildItems();
				var rowIndex = rowSiblings.index(row);

				newRow.cellOriginNodeName = typeCellName;
				if (cellCount) {
					newRow.PushEmptyCellsInRow(cellCount);
				}

				rowSiblings.insertAt(rowIndex + 1, newRow);
			},

			RemoveRow: function (/*WrappedObject*/ row) {
				var parentItem = row.Parent;

				if (parentItem) {
					var childList = parentItem.ChildItems();
					var rowIndex = childList.index(row);

					childList.splice(rowIndex, 1);
				}
			},

			AppendCell: function (/*int*/ position) {
				var rowsList = this._rowsList;
				var row;
				var rowId;

				for (rowId in rowsList) {
					row = rowsList[rowId];
					row.SetCell(position);
				}
				this._cellCount++;
			},

			RemoveCell: function (/*int*/ position) {
				// check on last cell in row
				if (this.GetCellsCount() == 1) {
					this._aras.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.rowcannotbeempty'
						)
					);
					return;
				}

				var rowsList = this._rowsList;
				var row;
				var rowId;

				for (rowId in rowsList) {
					row = rowsList[rowId];
					row.DeleteCell(position);
				}
				this._cellCount--;
			},

			_getCellType: function () {
				if (!this._cellTypeName) {
					var row;
					var cell;
					var rowId;

					for (rowId in this._rowsList) {
						row = this._rowsList[rowId];
						cell = row.ChildItems().get(0);

						if (cell) {
							this._cellTypeName = cell.nodeName;
							break;
						}
					}
				}
				return this._cellTypeName || 'aras:tablecell';
			},

			_getRowType: function () {
				if (!this._rowTypeName) {
					var row;
					var rowId;

					for (rowId in this._rowsList) {
						row = this._rowsList[rowId];
						this._rowTypeName = row.nodeName;
						break;
					}
				}

				return this._rowTypeName || 'aras:tablerow';
			},

			_OnElementUnregistered: function (sender, earg) {
				var element = earg.unregisteredObject;
				var id = element.Id();

				if (this._rowsList[id]) {
					delete this._rowsList[id];
				}
			},

			NotifyChanged: function () {
				this.ownerDocument.Dom().NotifyChanged();
			}
		}
	);
});
