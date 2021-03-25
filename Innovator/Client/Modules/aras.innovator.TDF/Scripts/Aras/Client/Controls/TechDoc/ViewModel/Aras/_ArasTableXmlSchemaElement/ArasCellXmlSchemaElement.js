define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElement, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.ArasCellXmlSchemaElement',
		XmlSchemaElement,
		{
			constructor: function (args) {
				this.registerType('ArasCellXmlSchemaElement');
			},

			GetTable: function () {
				return this.Parent && this.Parent.is('ArasRowXmlSchemaElement')
					? this.Parent.GetTable()
					: null;
			},

			registerDocumentElement: function () {
				var ownerTable;

				this.inherited(arguments);

				// trying to register cell in parent table
				if ((ownerTable = this.GetTable())) {
					ownerTable.RegisterChildElement(this);
				}
			},

			unregisterDocumentElement: function () {
				var ownerTable = this.GetTable();

				if (ownerTable) {
					ownerTable.UnregisterChildElement(this);
				}

				this.inherited(arguments);
			},

			isSelectable: function () {
				var aroundMatrix = this.getAroundMatrix();

				return !aroundMatrix.u && !aroundMatrix.l;
			},

			getAroundMatrix: function () {
				var parentTable = this.GetTable();
				var aroundMatrix;

				if (parentTable) {
					var parentRow = this.Parent;
					var rowIndex = parentTable._GetRowIndex(parentRow);
					var cellIndex = parentRow.ChildItems().index(this);

					aroundMatrix = parentTable
						._GetMergeMatrix()
						._BiuldArroundMatrix(rowIndex, cellIndex);
				} else {
					aroundMatrix = {
						u: 0,
						d: 0,
						l: 0,
						r: 0,
						h: 0,
						w: 0,
						rowdn: false,
						rowup: false
					};
				}

				return aroundMatrix;
			},

			getSelectableCell: function () {
				var parentTable = this.GetTable();

				if (parentTable) {
					var aroundMatrix = this.getAroundMatrix();

					if (aroundMatrix.l || aroundMatrix.u) {
						var rowIndex = parentTable._GetRowIndex(this.Parent);
						var cellIndex = this.Parent.ChildItems().index(this);

						return parentTable.getCell(
							rowIndex - aroundMatrix.u,
							cellIndex - aroundMatrix.l
						);
					}
				}

				return this;
			},

			getMergeCells: function () {
				var parentTable = this.GetTable();
				var mergeCells = [];

				if (parentTable) {
					var mergeMatrix = parentTable._GetMergeMatrix();
					var rowIndex = parentTable._GetRowIndex(this.Parent);
					var cellIndex = this.Parent.ChildItems().index(this);
					var aroundMatrix = mergeMatrix._BiuldArroundMatrix(
						rowIndex,
						cellIndex
					);
					var i;
					var j;

					for (
						i = rowIndex - aroundMatrix.u;
						i <= rowIndex + aroundMatrix.d;
						i++
					) {
						for (
							j = cellIndex - aroundMatrix.l;
							j <= cellIndex + aroundMatrix.r;
							j++
						) {
							mergeCells.push(parentTable.getCell(i, j));
						}
					}
				} else {
					mergeCells.push(this);
				}

				return mergeCells;
			},

			getNextCell: function (/*Enums.Directions*/ moveDirection) {
				var parentTable = this.GetTable();
				var rowCells = this.Parent.ChildItems();
				var nextCell;

				if (parentTable) {
					var mergeMatrix = parentTable._GetMergeMatrix();
					var rowIndex = parentTable._GetRowIndex(this.Parent);
					var cellIndex = rowCells.index(this);
					var cellCount = parentTable.ColsCount();
					var aroundMatrix = mergeMatrix._BiuldArroundMatrix(
						rowIndex,
						cellIndex
					);

					switch (moveDirection) {
						case Enums.Directions.Up:
							rowIndex -= aroundMatrix.u + 1;
							break;
						case Enums.Directions.Down:
							rowIndex += aroundMatrix.d + 1;
							break;
						case Enums.Directions.Left:
							cellIndex -= aroundMatrix.l + 1;
							break;
						case Enums.Directions.Right:
							cellIndex += aroundMatrix.r + 1;
							break;
					}

					if (cellIndex > cellCount - 1) {
						cellIndex = 0;
						rowIndex++;
					} else if (cellIndex < 0) {
						cellIndex = cellCount - 1;
						rowIndex--;
					}

					nextCell = parentTable.getCell(rowIndex, cellIndex);

					if (nextCell) {
						nextCell = parentTable.getSelectableCell(rowIndex, cellIndex);
					}
				} else if (
					moveDirection == Enums.Directions.Right ||
					moveDirection == Enums.Directions.Left
				) {
					nextCell = rowCells.get(
						rowCells.index(this) +
							(moveDirection == Enums.Directions.Right ? 1 : -1)
					);
				}

				return nextCell;
			},

			NotifyChanged: function () {
				if (this.isRegistered()) {
					var selectableCell = this.getSelectableCell();

					// if cell is not selectable, then invalidation of root cell should be forced
					if (selectableCell && this != selectableCell) {
						selectableCell.NotifyChanged();
						this.Parent.NotifyChanged();

						return;
					}
				}

				this.inherited(arguments);
			}
		}
	);
});
