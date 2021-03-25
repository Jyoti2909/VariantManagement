define(['dojo/_base/declare', 'dojox/uuid/generateRandomUuid'], function (
	declare,
	generateRandomUuid
) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.MergeMatrix',
		null,
		{
			_matrix: null,
			_rowsIds: null,
			_extRowsIds: null,
			brokenRows: null,

			constructor: function (args) {
				this.Init(0);
			},

			Init: function (nCols) {
				this._matrix = { length: 0, count: nCols };
				this._rowsIds = [];
				this._extRowsIds = {};
				this.brokenRows = {};
			},

			InitByObj: function (obj) {
				this._matrix = obj;
				this._rowsIds = obj.array;
			},

			ValidateMerge: function (rowIndex, columnIndex, mergeDirection) {
				var m = this._matrix;
				var currentMatrix = this._BiuldArroundMatrix(rowIndex, columnIndex);
				var nextMatrix;
				var nextCellIndex;

				switch (mergeDirection) {
					case 'left':
					case 'right':
						nextCellIndex = this._getNextColumnIndex(
							rowIndex,
							columnIndex,
							mergeDirection == 'right'
						);

						if (nextCellIndex > -1) {
							nextMatrix = this._BiuldArroundMatrix(rowIndex, nextCellIndex);

							if (
								nextMatrix.h == currentMatrix.h &&
								nextMatrix.u == currentMatrix.u &&
								nextMatrix.d == currentMatrix.d
							) {
								return true;
							}
						}

						break;
					case 'top':
					case 'bot':
						var isNextRowExists =
							mergeDirection == 'bot'
								? currentMatrix.rowdn
								: currentMatrix.rowup;

						if (isNextRowExists) {
							nextCellIndex = this._getNextRowIndex(
								rowIndex,
								columnIndex,
								mergeDirection == 'bot'
							);
							nextMatrix = this._BiuldArroundMatrix(nextCellIndex, columnIndex);

							if (
								nextMatrix.w == currentMatrix.w &&
								nextMatrix.l == currentMatrix.l &&
								nextMatrix.r == currentMatrix.r
							) {
								return true;
							}
						}

						break;
				}

				return false;
			},

			ValidateMergeDraw: function (rowIndex, columnIndex) {
				var m = this._matrix;
				var rowUid = this._rowsIds[rowIndex];
				var rowRealUp = this._getRealRowByDirection(rowIndex, 'u');

				if (
					(rowRealUp &&
						rowRealUp &&
						rowRealUp[columnIndex] == m[rowUid][columnIndex]) ||
					m[rowUid][columnIndex] == m[rowUid][columnIndex - 1]
				) {
					return true;
				}
				return false;
			},

			ExecuteUnmerge: function (rowIndex, columnIndex) {
				var rowList = this._rowsIds;
				var aroundMatrix = this._BiuldArroundMatrix(rowIndex, columnIndex);
				var leftBound = columnIndex - aroundMatrix.l;
				var rightBound = columnIndex + aroundMatrix.r;
				var upperBound = rowIndex - aroundMatrix.u;
				var bottomBound = rowIndex + aroundMatrix.d;
				var rowId;
				var cellIds;
				var i;
				var j;

				for (i = upperBound; i <= bottomBound; i++) {
					rowId = rowList[i];
					cellIds = this._matrix[rowId];

					for (j = leftBound; j <= rightBound; j++) {
						cellIds[j] = this.GenerateUID();
					}
				}
			},

			ExecuteMerge: function (rowIndex, columnIndex, mergeDirection) {
				var currentUid = this.Get(rowIndex, columnIndex);
				var targetRowIndex = rowIndex;
				var targetColumnIndex = columnIndex;
				var targetUid;

				switch (mergeDirection) {
					case 'left':
					case 'right':
						targetColumnIndex = this._getNextColumnIndex(
							rowIndex,
							columnIndex,
							mergeDirection == 'right'
						);
						break;
					case 'top':
					case 'bot':
						targetRowIndex = this._getNextRowIndex(
							rowIndex,
							columnIndex,
							mergeDirection == 'bot'
						);
						break;
				}

				targetUid = this.Get(targetRowIndex, targetColumnIndex);
				this._Replace(currentUid, targetUid);
			},

			ValidateExternalRows: function () {
				for (var rowUid in this._extRowsIds) {
					return true;
				}
				return false;
			},

			ValidateBrokenRows: function () {
				for (var rowUid in this.brokenRows) {
					return true;
				}
				return false;
			},

			_getRealRowByDirection: function (index, direction) {
				// go up to search nonexternal row
				var inc = direction == 'u' ? -1 : 1;
				var rowList = this._rowsIds;
				var extList = this._extRowsIds;
				var brokeList = this.brokenRows;
				var maxLength = rowList.length;
				var rowId;
				var isExist;

				do {
					index += inc;
					rowId = rowList[index];
					isExist = extList[rowId];

					if (brokeList[rowId]) {
						return null;
					}
				} while (index > -1 && isExist && index < maxLength);

				return index > -1 && index < maxLength ? this._matrix[rowId] : null;
			},

			_getNextColumnIndex: function (rowIndex, columnIndex, isAscending) {
				var rowUid = this._rowsIds[rowIndex];
				var columnsCount = this.GetCollsCount();
				var nextIndex = -1;

				if (rowUid) {
					var columnList = this._matrix[rowUid];
					var startColumnUid = columnList[columnIndex];
					var offset = isAscending ? 1 : -1;
					var i = columnIndex;

					while (i > -1 && i < columnsCount) {
						if (columnList[i] !== startColumnUid) {
							nextIndex = i;
							break;
						}

						i += offset;
					}
				}

				return nextIndex;
			},

			_getNextRowIndex: function (rowIndex, columnIndex, isAscending) {
				var rowList = this._rowsIds;
				var columnsCount = this.GetCollsCount();
				var nextIndex = -1;

				if (
					rowList[rowIndex] &&
					columnIndex > -1 &&
					columnIndex < columnsCount
				) {
					var startRowUid = this._rowsIds[rowIndex];
					var startCellId = this._matrix[startRowUid][columnIndex];
					var offset = isAscending ? 1 : -1;
					var i = rowIndex + offset;
					var rowUid;
					var columnList;

					while (i > -1 && i < rowList.length) {
						rowUid = rowList[i];

						if (!this.brokenRows[rowUid] && !this._extRowsIds[rowUid]) {
							columnList = this._matrix[rowUid];

							if (columnList[columnIndex] !== startCellId) {
								nextIndex = i;
								break;
							}
						} else {
							nextIndex = -1;
							break;
						}

						i += offset;
					}
				}

				return nextIndex;
			},

			_getNextRealIndex: function (index, isDecrement) {
				var rowList = this._rowsIds;
				var extList = this._extRowsIds;
				var brokenList = this.brokenRows;
				var count = rowList.length;
				var i = index;
				var offset = isDecrement ? -1 : 1;
				var rowUid;

				while (i > -1 && i < count) {
					i += offset;
					rowUid = rowList[i];

					if (brokenList[rowUid]) {
						return -1;
					}

					if (!extList[rowUid]) {
						break;
					}
				}

				return i < count && i != index ? i : -1;
			},

			_BiuldArroundMatrix: function (rowIndex, columnIndex) {
				// Check same id with arround cells
				var resultMatrix = {
					u: 0,
					d: 0,
					l: 0,
					r: 0,
					h: 0,
					w: 0,
					rowdn: false,
					rowup: false
				};
				var rowsList = this._rowsIds;
				var columnCount = this.GetCollsCount();
				var rowUid = rowsList[rowIndex];

				if (rowUid && columnIndex > -1 && columnIndex < columnCount) {
					var cellList = this._matrix[rowUid];
					var cellId = cellList[columnIndex];
					var nextIndex;
					var currentIndex;
					var nextCellList;
					var nextRowUid;

					resultMatrix.w = 1;
					resultMatrix.h = 1;

					currentIndex = columnIndex + 1;
					while (
						currentIndex < columnCount &&
						cellList[currentIndex] == cellId
					) {
						resultMatrix.r += 1;
						resultMatrix.w += 1;
						currentIndex += 1;
					}

					currentIndex = columnIndex - 1;
					while (currentIndex > -1 && cellList[currentIndex] == cellId) {
						resultMatrix.l += 1;
						resultMatrix.w += 1;
						currentIndex -= 1;
					}

					currentIndex = rowIndex + 1;
					while (currentIndex < rowsList.length) {
						nextRowUid = rowsList[currentIndex];
						nextCellList = this._matrix[nextRowUid];

						if (nextCellList[columnIndex] == cellId) {
							resultMatrix.d += 1;
							resultMatrix.h += 1;
							currentIndex += 1;
						} else {
							resultMatrix.rowdn =
								!this._extRowsIds[nextRowUid] && !this.brokenRows[nextRowUid];
							break;
						}
					}

					currentIndex = rowIndex - 1;
					while (currentIndex > -1) {
						nextRowUid = rowsList[currentIndex];
						nextCellList = this._matrix[nextRowUid];

						if (nextCellList[columnIndex] == cellId) {
							resultMatrix.u += 1;
							resultMatrix.h += 1;
							currentIndex -= 1;
						} else {
							resultMatrix.rowup =
								!this._extRowsIds[nextRowUid] && !this.brokenRows[nextRowUid];
							break;
						}
					}
				}

				return resultMatrix;
			},

			GetMatrix: function () {
				var mm = this._matrix;

				mm.length = this._rowsIds.length;
				mm.array = this._rowsIds;
				return mm;
			},

			GetMatrixForSave: function () {
				var mm = this._matrix;
				var smatrix = { array: [] };
				var brokeList = this.brokenRows;
				var extList = this._extRowsIds;

				smatrix.count = mm.count;
				this._rowsIds.forEach(function (rowUid) {
					if (!extList[rowUid] && !brokeList[rowUid]) {
						smatrix[rowUid] = mm[rowUid];
						smatrix.array.push(rowUid);
					}
				});

				smatrix.length = smatrix.array.length;
				return smatrix;
			},

			GetCollsCount: function () {
				return this._matrix.count;
			},

			GetRowsCount: function () {
				return this._rowsIds.length;
			},

			GetRowsIds: function () {
				return this._rowsIds;
			},

			Get: function (rowIndex, columnIndex) {
				var rowUid = this._rowsIds[rowIndex];

				if (rowUid) {
					return this._matrix[rowUid][columnIndex];
				}
			},

			FindIndexOfRow: function (rowUid) {
				var rows = this._rowsIds;
				var i;

				for (i = 0; i < rows.length; i++) {
					if (rowUid == rows[i]) {
						return i;
					}
				}

				return -1;
			},

			SetRow: function (rowUid, rowIndex, isExternal, isWrongCount) {
				var matrix = this._matrix;
				var isAlreadyExist = matrix[rowUid];

				if (!isAlreadyExist) {
					var arr = this.GenerateNewRow(rowIndex, isWrongCount);

					matrix[rowUid] = arr;
					this._rowsIds.splice(rowIndex, 0, rowUid);
					matrix.length = this._rowsIds.length;

					if (isExternal) {
						this._extRowsIds[rowUid] = true;
					}

					if (isWrongCount) {
						this.brokenRows[rowUid] = true;
					}

					return isExternal || isWrongCount ? false : true;
				} else if (isExternal) {
					if (!this._extRowsIds[rowUid]) {
						this._extRowsIds[rowUid] = true;
						return true;
					} else {
						return false;
					}
				} else {
					return false;
				}
			},

			SetCol: function (columnIndex, arr) {
				var m = this._matrix;
				var rowList = this._rowsIds;
				var count = this.GetRowsCount();
				var rowUid;
				var i;

				for (i = 0; i < count; i++) {
					rowUid = rowList[i];

					if (!m[rowUid]) {
						m[rowUid] = [];
					}

					m[rowUid].splice(columnIndex, 0, arr[i]);
				}

				this._matrix.count++;
			},

			_killRow: function (rowUid) {
				delete this._matrix[rowUid];

				var index = this.FindIndexOfRow(rowUid);

				this._rowsIds.splice(index, 1);
				this._matrix.length = this._rowsIds.length;
				delete this.brokenRows[rowUid];
				delete this._extRowsIds[rowUid];
			},

			CheckAndDelete: function (rowUid) {
				if (rowUid && this._matrix[rowUid]) {
					this._checkOnMerged(rowUid);
					this._killRow(rowUid);
				}
			},

			KillCol: function (columnIndex) {
				var i;
				var m = this._matrix;
				var rowList = this._rowsIds;
				var count = this.GetRowsCount();

				for (i = 0; i < count; i++) {
					var uid = rowList[i];
					m[uid].splice(columnIndex, 1);
				}

				this._matrix.count--;
			},

			_checkOnMerged: function (rowUid) {
				// Method auto unmerge external rows
				// if it just don't placed between internal rows
				if (this._extRowsIds[rowUid]) {
					return; //  if row is external do nothing
				}

				var index = this.FindIndexOfRow(rowUid);
				var rowList = this._rowsIds;
				var extList = this._extRowsIds;
				var rowIdBelow = rowList[index + 1];
				var rowIdAbove = rowList[index - 1];
				var mergedUid = {};
				var i;
				var cellUid;
				var isThroughMerged = {};
				var mm = this._matrix;
				var gRow = mm[rowUid];
				var count = gRow.length;

				if (mm[rowIdAbove]) {
					var rowUp = mm[rowIdAbove];

					for (i = 0; i < count; i++) {
						cellUid = gRow[i];

						if (rowUp[i] == cellUid && !isThroughMerged[cellUid]) {
							if (extList[rowIdAbove]) {
								mergedUid[cellUid] = 'up';
							} else {
								isThroughMerged[cellUid] = true; // Deleting row is placed between merged rows
								delete mergedUid[cellUid];
							}
						}
					}
				}

				if (mm[rowIdBelow]) {
					var rowDn = mm[rowIdBelow];

					for (i = 0; i < count; i++) {
						cellUid = gRow[i];

						if (rowDn[i] == cellUid && !isThroughMerged[cellUid]) {
							if (extList[rowIdBelow] && !mergedUid[cellUid]) {
								mergedUid[cellUid] = 'dn';
							} else {
								isThroughMerged[cellUid] = true; // Deleting row is placed between merged rows
								delete mergedUid[cellUid];
							}
						}
					}
				}

				for (var key in mergedUid) {
					// only if mergedUid contains something
					this._ReplaceExternal(mergedUid);
					break;
				}
			},

			GenerateUID: function () {
				return generateRandomUuid();
			},

			CkeckRowOnBroke: function (rowUid) {
				return this.brokenRows[rowUid];
			},

			GenerateNewRow: function (rowIndex, isBrokenRow) {
				var i;
				var m = this._matrix;
				var arr = [];
				var rowList = this._rowsIds;
				var rowUid = rowList[rowIndex];
				var rowIdAbove = rowList[rowIndex - 1];
				var topRow = m[rowIdAbove];
				var botRow = m[rowUid];
				var count = this.GetCollsCount();

				if (topRow && botRow && !isBrokenRow) {
					for (i = 0; i < count; i++) {
						arr[i] =
							topRow[i] == botRow[i]
								? (arr[i] = topRow[i])
								: this.GenerateUID();
					}
				} else {
					for (i = 0; i < count; i++) {
						arr.push(this.GenerateUID());
					}
				}

				return arr;
			},

			GenerateNewCol: function (columnIndex) {
				var m = this._matrix;
				var arr = [];
				var row;
				var gUid;
				var count = this.GetRowsCount();
				var rowList = this._rowsIds;
				var rowUid;
				var i;

				if (columnIndex !== 0 || columnIndex !== this.GetCollsCount()) {
					for (i = 0; i < count; i++) {
						rowUid = rowList[i];

						row = m[rowUid];
						gUid =
							row[columnIndex] == row[columnIndex - 1]
								? row[columnIndex]
								: this.GenerateUID();
						arr.push(gUid);
					}
				} else {
					for (i = 0; i < count; i++) {
						arr.push(this.GenerateUID());
					}
				}

				return arr;
			},

			Regenerate: function (table) {
				var list = [];
				var newRowsIds = [];
				var childrens = table.ChildItems().List();
				var oldId;
				var newId;
				var oldHash;
				var i;

				this._ResearchRows(childrens, list);

				for (i = 0, count = list.length; i < count; i++) {
					oldId = this._rowsIds[i];
					newId = list[i];
					oldHash = this._matrix[oldId];

					delete this._matrix[oldId];

					if (oldHash) {
						this._matrix[newId] = oldHash;
						newRowsIds.push(newId);
					}
				}

				this._rowsIds = newRowsIds;
			},

			_ResearchRows: function (childList, rowList) {
				var self = this;

				childList.forEach(function (child) {
					if (child.is('ArasRowXmlSchemaElement')) {
						rowList.push(child.Uid());
					} else {
						var childs = child.ChildItems().List();

						self._ResearchRows(childs, rowList);
					}
				});
			},

			_ReplaceExternal: function (oldHash) {
				var rowUid;
				var extRow;
				var i;

				for (rowUid in this._extRowsIds) {
					extRow = this._matrix[rowUid];

					for (i = 0; i < extRow.length; i++) {
						if (oldHash[extRow[i]]) {
							extRow[i] = this.GenerateUID();
						}
					}
				}
			},

			_Replace: function (oldId, newId) {
				var m = this._matrix;
				var rowList = this._rowsIds;
				var rowCount = this.GetRowsCount();
				var cellCount = this.GetCollsCount();
				var row;
				var rowUid;
				var i;
				var j;

				for (i = 0; i < rowCount; i++) {
					rowUid = rowList[i];
					row = m[rowUid];

					for (j = 0; j < cellCount; j++) {
						if (row[j] == oldId) {
							row[j] = newId;
						}
					}
				}
			}
		}
	);
});
