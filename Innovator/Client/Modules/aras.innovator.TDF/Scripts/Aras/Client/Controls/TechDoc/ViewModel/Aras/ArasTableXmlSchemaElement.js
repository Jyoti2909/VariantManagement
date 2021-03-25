define([
	'dojo/_base/declare',
	'dojo/aspect',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/MergeMatrix'
], function (declare, aspect, XmlSchemaElement, MergeMatrix) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasTableXmlSchemaElement',
		XmlSchemaElement,
		{
			_mm: null,
			_onInvalidateElementsIds: null,
			_cWidths: null,
			_aras: null,

			constructor: function (args) {
				this._aras = this.ownerDocument._aras;
				this._ClearTableCache();

				this.registerType('ArasTableXmlSchemaElement');
			},

			_parseOriginInternal: function () {
				this._ClearTableCache();

				this.inherited(arguments);

				var colsWidth = this.Attribute('ColWidth');
				if (colsWidth) {
					this._cWidths = colsWidth.split('|');
				} else {
					this._GenerateCollsWidth();
				}
			},

			_OnCloned: function () {
				this.inherited(arguments);

				//regenerate MergeMatrix
				this._GetMergeMatrix().Regenerate(this);
				this._SetMergeMatrixAttr();
				this._ClearTableCache();
			},

			/* PUBLIC API */
			GenerateTableBody: function (nCols, nRows) {
				this.ownerDocument.SuspendInvalidation();
				this._cellCount = nCols;
				this._GetMergeMatrix().Init(nCols);

				for (var i = 0; i < nRows; i++) {
					this.AddRow(i);
				}

				this._GenerateCollsWidth();
				this.ownerDocument.ResumeInvalidation();
			},

			GetRowsList: function () {
				var mm = this._GetMergeMatrix();
				var rowList = [];

				if (mm) {
					var thisAllList = this._onInvalidateElementsIds;
					var rowIdsList = mm.GetRowsIds();
					var rowId;
					var row;
					var i;

					for (i = 0; i < rowIdsList.length; i++) {
						rowId = rowIdsList[i];
						row = thisAllList[rowId];

						if (row) {
							rowList.push(row);
						}
					}
				}

				return rowList;
			},

			isRowRegistered: function (rowElement) {
				var uid = rowElement.Uid();

				return Boolean(this._onInvalidateElementsIds[uid]);
			},

			AddRow: function (element) {
				// Note: start position from 0.
				this.ownerDocument.SuspendInvalidation();

				var newRow = this.ownerDocument.CreateElement('element', {
					type: this._GetRowOriginNodeName()
				});
				var isNumber = typeof element == 'number';
				var parent;
				var noRowToSet;

				if (isNumber) {
					var row = this._onInvalidateElementsIds[element];

					if (row) {
						parent = row.Parent;
						noRowToSet = parent.ChildItems().index(row);
					} else {
						parent = this;
						noRowToSet = element;
					}
				} else {
					parent = element.Parent;
					noRowToSet = parent.ChildItems().index(element) + 1;
				}

				parent.ChildItems().insertAt(noRowToSet, newRow);

				this.ownerDocument.ResumeInvalidation();
				return newRow;
			},

			RemoveRow: function (element) {
				var isNumber = typeof element == 'number';
				var rowIndex;
				var parent;

				if (this.RowCount() === 1) {
					this.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.tablecannotbeempty'
						)
					);
					return;
				}

				this.ownerDocument.SuspendInvalidation();

				if (isNumber) {
					var row = this._onInvalidateElementsIds[element];

					if (row) {
						parent = row.Parent;
						rowIndex = parent.ChildItems().index(row);
					} else {
						this.AlertError(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								'viewmodel.indexoutofrange'
							)
						);
						return;
					}
				} else {
					parent = element.Parent;
					rowIndex = parent.ChildItems().index(element);
				}

				parent.ChildItems().splice(rowIndex, 1);

				this.ownerDocument.ResumeInvalidation();
			},

			AddColumn: function (columnIndex) {
				var mm = this._GetMergeMatrix();

				if (!mm.ValidateExternalRows()) {
					var rowList = this.GetRowsList();
					var position =
						columnIndex !== undefined ? columnIndex : rowList.length;
					var columnCellIds;
					var row;
					var i;

					this.ownerDocument.SuspendInvalidation();

					for (i = 0; i < rowList.length; i++) {
						row = rowList[i];
						row.SetCell(position);
					}

					columnCellIds = mm.GenerateNewCol(columnIndex);
					mm.SetCol(columnIndex, columnCellIds);
					this._SetMergeMatrixAttr();

					this._GenerateCollsWidth(columnIndex);
					this.ownerDocument.ResumeInvalidation();
				} else {
					this.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.tablecontainsrowsfromexternalblock'
						)
					);
					return;
				}
			},

			RemoveColumn: function (columnIndex) {
				var mm = this._GetMergeMatrix();

				if (!mm.ValidateExternalRows()) {
					// check on last cell in row
					if (this.ColsCount() != 1) {
						var rowList = this.GetRowsList();
						var i;

						this.ownerDocument.SuspendInvalidation();

						for (i = 0; i < rowList.length; i++) {
							rowList[i].DeleteCell(columnIndex);
						}

						mm.KillCol(columnIndex);
						this._SetMergeMatrixAttr();
						this._GenerateCollsWidth(columnIndex, true);

						this.ownerDocument.ResumeInvalidation();
					} else {
						this.AlertError(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								'viewmodel.rowcannotbeempty'
							)
						);
						return;
					}
				} else {
					this.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.tablecontainsrowsfromexternalblock'
						)
					);
					return;
				}
			},

			/* ++ Merging --*/
			ExecuteCellsMerge: function (rowIndex, columnIndex, direct) {
				var mm = this._GetMergeMatrix();

				if (mm.ValidateMerge(rowIndex, columnIndex, direct)) {
					mm.ExecuteMerge(rowIndex, columnIndex, direct);
					this._SetMergeMatrixAttr();

					return true;
				} else {
					return false;
				}
			},

			UnmergeCells: function (rowIndex, columnIndex) {
				var mm = this._GetMergeMatrix();

				mm.ExecuteUnmerge(rowIndex, columnIndex);
				this._SetMergeMatrixAttr();
			},

			GetChildsOfCellForDrawing: function (cellObj) {
				var rowObj = cellObj.Parent;
				var cellList = rowObj.ChildItems();
				var rowList = this.GetRowsList();
				var rowIndex = this._GetRowIndex(rowObj); // Y
				var cellIndex = cellList.index(cellObj); // X
				var childList = [];
				var width = 0;
				var height = 0;

				if (rowIndex !== null) {
					var mm = this._GetMergeMatrix();
					var cellUid = mm.Get(rowIndex, cellIndex);
					var rightDistance = mm.GetCollsCount();
					var botDistance = mm.GetRowsCount();
					var tmpUid;
					var bOffset;

					outBreak: for (bOffset = rowIndex; bOffset < botDistance; bOffset++) {
						var counter = 0;
						var rOffset;
						var cellItem;

						if (
							rowList[bOffset] === undefined ||
							rowList[bOffset].IsRowHidden()
						) {
							continue;
						}

						for (rOffset = cellIndex; rOffset < rightDistance; rOffset++) {
							tmpUid = mm.Get(bOffset, rOffset);

							if (tmpUid == cellUid) {
								counter++;
								cellItem = rowList[bOffset].ChildItems().get(rOffset);

								if (cellItem) {
									childList = childList.concat(cellItem.ChildItems().List());
								}
							} else {
								if (counter) {
									width = counter;
									break;
								} else {
									break outBreak;
								}
							}
						}
						if (rOffset == rightDistance) {
							width = counter;
						}

						height++;
					}
				}
				return { width: width, height: height, list: childList };
			},

			IsBrokenCellsCount: function (row) {
				return this._GetMergeMatrix().CkeckRowOnBroke(row.Uid());
			},

			ColsWidth: function (value) {
				if (value) {
					this._cWidths = value;
					this.Attribute('ColWidth', value.join('|'));

					this.NotifyChanged();
				} else {
					return this._cWidths || [];
				}
			},

			ColsCount: function () {
				return this._GetMergeMatrix().GetCollsCount();
			},

			RowCount: function () {
				return this._GetMergeMatrix().GetRowsCount();
			},

			/* Private Methods */
			_GetRowOriginNodeName: function () {
				if (!this._rowOriginNodeName) {
					this._rowOriginNodeName = this.ownerDocument.tableHelper.GetNodeOriginNameForStructure(
						this
					);
				}

				return this._rowOriginNodeName.row;
			},

			_GetCellOriginNodeName: function () {
				if (!this._rowOriginNodeName) {
					this._rowOriginNodeName = this.ownerDocument.tableHelper.GetNodeOriginNameForStructure(
						this
					);
				}

				return this._rowOriginNodeName.cell;
			},

			RegisterChildElement: function (targetElement) {
				if (targetElement) {
					var elementIsRow = targetElement.is('ArasRowXmlSchemaElement');
					var elementUid = targetElement.Uid();

					if (
						(elementIsRow || targetElement.is('ArasCellXmlSchemaElement')) &&
						targetElement.GetTable() == this &&
						!this._onInvalidateElementsIds[elementUid]
					) {
						this._onInvalidateElementsIds[elementUid] = targetElement;

						if (elementIsRow) {
							var parentElement = targetElement.Parent;
							var parentUid = parentElement.Uid();
							var rowIndex = this._CalculateIndexOfRowInTable(targetElement);
							var expectedCount = this._GetMergeMatrix().GetCollsCount();
							var cellsCount = targetElement.ChildItems().length();
							var isWrongColsNumber = cellsCount != expectedCount;

							while (
								parentElement.is('ArasBlockXmlSchemaElement') &&
								!this._onInvalidateElementsIds[parentUid]
							) {
								this._onInvalidateElementsIds[parentUid] = parentElement;

								parentElement = parentElement.Parent;
								parentUid = parentElement.Uid();
							}

							// "1" - because new row also has one cell.
							if (
								isWrongColsNumber &&
								cellsCount == 1 &&
								!this._checkRowBelongExternal(targetElement)
							) {
								targetElement.PushEmptyCellsInRow(expectedCount);
								this._AddRowToList(targetElement, rowIndex);
								isWrongColsNumber = false; // drop for new rows
							}

							this._AddRowToList(targetElement, rowIndex, isWrongColsNumber);
						}
					}
				}
			},

			UnregisterChildElement: function (/*WrappedObject*/ targetElement) {
				var elementIsRow = targetElement.is('ArasRowXmlSchemaElement');

				if (elementIsRow || targetElement.is('ArasCellXmlSchemaElement')) {
					// OnUnregistered can be called in two following cases:
					// 1. targetElement is removed from parent and due to that it is unregistered.
					// 2. targetElement is not removed from table, but table itslef is unregestired from it's parent, in this case we don't have to deal with Table metadata
					if (
						this._IsParentTableCanBeReached(targetElement) &&
						this.isRegistered()
					) {
						var elementId = targetElement.Uid();

						if (this._onInvalidateElementsIds[elementId]) {
							delete this._onInvalidateElementsIds[elementId];

							if (elementIsRow) {
								var parentElement = targetElement.Parent;
								var parentUid = parentElement.Uid();

								this._GetMergeMatrix().CheckAndDelete(elementId);
								this._SetMergeMatrixAttr();

								while (
									parentElement.is('ArasBlockXmlSchemaElement') &&
									this._onInvalidateElementsIds[parentUid]
								) {
									delete this._onInvalidateElementsIds[parentUid];

									parentElement = parentElement.Parent;
									parentUid = parentElement.Uid();
								}
							}
						}
					} else if (
						elementIsRow &&
						this._checkRowBelongExternal(targetElement) &&
						!this._checkRowBelongExternal(this)
					) {
						// Only for real table
						if (this.ownerDocument.GetElementById(this.Id())) {
							// Fix: wrapped block with rows set as external but table don't (MakeExternal action)
							var index = this._GetRowIndex(targetElement);

							if (index != -1) {
								this._AddRowToList(targetElement, index, false);
							}
						}
					}
				}
			},

			_AddRowToList: function (row, index, isWrongColsNumber) {
				// Fix: when table set as external - the rows don't 'external', but if row don't in external block, row musn't add in MM
				var mm = this._GetMergeMatrix();
				var uid = row.Uid();
				var isExternalBelong;

				if (this._checkRowBelongExternal(this)) {
					var isInMM = mm.GetMatrixForSave()[uid];
					isExternalBelong = isInMM ? false : true;
				} else {
					isExternalBelong = this._checkRowBelongExternal(row);
				}

				if (mm.SetRow(uid, index, isExternalBelong, isWrongColsNumber)) {
					this._SetMergeMatrixAttr();
				}
			},

			_IsParentTableCanBeReached: function (element) {
				if (
					!element.is('ArasBlockXmlSchemaElement') &&
					!element.is('ArasRowXmlSchemaElement') &&
					!element.is('ArasCellXmlSchemaElement')
				) {
					throw new Error(
						'Invalid argument for function: _IsParentTableCanBeReached'
					);
				}

				var currentElement = element;
				while (
					currentElement &&
					!currentElement.is('ArasTableXmlSchemaElement')
				) {
					currentElement = currentElement.Parent;
				}

				return currentElement !== null;
			},

			_checkRowBelongExternal: function (row) {
				return this.ownerDocument
					.ExternalBlockHelper()
					.isExternalBlockContains(row);
			},

			_SetMergeMatrixAttr: function () {
				if (this.ownerDocument.IsEditable()) {
					var value = this._mm.GetMatrixForSave();
					var valueStr = JSON.stringify(value);

					if (this._savedMMAtributeValue != valueStr) {
						this._savedMMAtributeValue = valueStr;
						this.Attribute('MergeMatrix', valueStr);
					}
				}
			},

			_CalculateIndexOfRowInTable: function (element) {
				function _getAllRowsOnDepth(parent) {
					var i;
					var childs = parent.ChildItems();
					var count = childs.length();

					for (i = 0; i < count; i++) {
						var child = childs.get(i);

						if (child.is('ArasRowXmlSchemaElement')) {
							if (element == child) {
								retvalue = rowCount;
								return;
							}

							rowCount++;
						} else {
							_getAllRowsOnDepth(child);

							if (retvalue) {
								return;
							}
						}
					}
				}

				var rowCount = 0;
				var retvalue;

				_getAllRowsOnDepth(this);
				return retvalue;
			},

			_GetRowIndex: function (row) {
				var mm = this._GetMergeMatrix();

				if (mm) {
					return mm.FindIndexOfRow(row.Uid());
				}
				return -1;
			},

			_GenerateCollsWidth: function (columnIndex, isDelete) {
				var widthList = [];
				var colsCount = this._GetMergeMatrix().GetCollsCount();

				if (!colsCount && !isDelete) {
					return;
				}

				if (columnIndex === undefined) {
					var widthpc = (100 / colsCount) | 0;
					var i;

					for (i = 0; i < colsCount - 1; i++) {
						widthList[i] = widthpc;
					}
					widthList[colsCount - 1] = 100 - widthpc * (colsCount - 1);
					this._cWidths = widthList;
				} else {
					widthList = this._cWidths;

					if (isDelete) {
						var valueToJoin1;
						var valueToJoin2;
						var valueToJoin;

						if (columnIndex === 0) {
							if (widthList[1]) {
								valueToJoin1 = +widthList[1];
								valueToJoin2 = +widthList[0];
								valueToJoin = valueToJoin1 + valueToJoin2;

								widthList[1] = valueToJoin;
								widthList.splice(0, 1);
							} else {
								widthList.length = 0;
							}
						} else {
							var joinColumnIndex = columnIndex - 1;

							valueToJoin1 = +widthList[joinColumnIndex];
							valueToJoin2 = +widthList[columnIndex];
							valueToJoin = valueToJoin1 + valueToJoin2;

							widthList[joinColumnIndex] = valueToJoin;
							widthList.splice(columnIndex, 1);
						}
					} else {
						if (widthList && widthList.length > 0) {
							var splitColumnIndex =
								columnIndex === 0 ? (colsCount > 1 ? 1 : 0) : columnIndex - 1;
							var valueWidth = widthList[splitColumnIndex];
							var splittedValue = (valueWidth / 2) | 0;
							var isMultiple = valueWidth / 2 > splittedValue;
							var oldValueWidth = isMultiple
								? splittedValue + 1
								: splittedValue;
							var newValueWidth = splittedValue;

							widthList[splitColumnIndex] = oldValueWidth;
							widthList.splice(columnIndex, 0, newValueWidth);
						} else {
							widthList[0] = '100';
						}
					}
				}

				if (this.ownerDocument.IsEditable()) {
					this.Attribute('ColWidth', widthList.join('|'));
				}
			},

			_ClearTableCache: function () {
				// clear cache
				this._mm = null;
				this._onInvalidateElementsIds = {};
				this._onInvalidateElementsIds[this.Uid()] = this;
			},

			_GetMergeMatrix: function () {
				if (!this._mm) {
					var mergeMatrixAttribute = this.Attribute('MergeMatrix');
					var matrix;

					this._mm = new MergeMatrix();
					matrix = JSON.parse(mergeMatrixAttribute);

					if (matrix) {
						// if table placed in external block, then we need to fix mergeMatrix Uids
						var parentUidPrefix = this.internal.uidParentPrefix;

						if (parentUidPrefix) {
							var rowUid;
							var prefixUid;
							var i;

							for (i = 0; i < matrix.array.length; i++) {
								rowUid = matrix.array[i];

								if (rowUid.indexOf(parentUidPrefix) !== 0) {
									prefixUid = parentUidPrefix + rowUid;

									matrix.array[i] = prefixUid;
									matrix[prefixUid] = matrix[rowUid];
									delete matrix[rowUid];
								}
							}
						}

						this._mm.InitByObj(matrix);
					}
				}

				return this._mm;
			},

			getCell: function (rowIndex, columnIndex) {
				if (rowIndex !== undefined && columnIndex !== undefined) {
					var rowList = this.GetRowsList();
					var rowElement = rowList[rowIndex];

					if (rowElement) {
						return rowElement.ChildItems().get(columnIndex);
					}
				}
			},

			getSelectableCell: function (rowIndex, columnIndex) {
				var mergeMatrix = this._GetMergeMatrix();
				var aroundMatrix = mergeMatrix._BiuldArroundMatrix(
					rowIndex,
					columnIndex
				);

				return this.getCell(
					rowIndex - aroundMatrix.u,
					columnIndex - aroundMatrix.l
				);
			},

			getLastCell: function () {
				var mergeMatrix = this._GetMergeMatrix();

				return this.getCell(
					mergeMatrix.GetRowsCount() - 1,
					mergeMatrix.GetCollsCount() - 1
				);
			}
		}
	);
});
