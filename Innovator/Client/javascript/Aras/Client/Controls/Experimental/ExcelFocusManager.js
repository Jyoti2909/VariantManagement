define([
	'dojo/_base/declare',
	'dojox/grid/enhanced/_FocusManager',
	'dojo/_base/sniff',
	'dojo/_base/html',
	'dojo/keys',
	'dojo/_base/event',
	'dojox/grid/util'
], function (declare, _FocusManager, has, html, keys, event, util) {
	return declare(
		'Aras.Client.Controls.Experimental.ExcelFocusManager',
		_FocusManager,
		{
			_getView: function () {
				return this.grid.views.views[0];
			},
			_getCellNode: function (rowIndex, cellIndex) {
				return this._getView().getCellNode(rowIndex, cellIndex);
			},
			isFocusCell: function (inCell, inRowIndex) {
				throw "Shouldn't be used and overriden";
			},
			setFocusCell: function (inCell, inRowIndex) {
				throw "Shouldn't be used and overriden";
			},
			//Copy from dojo
			focusHeader: function () {
				var headerNodes = this._findHeaderCells();
				var saveColHeadFocusIdx = this._colHeadFocusIdx;
				if (this._isHeaderHidden()) {
					// grid header is hidden, focus a cell
					this.findAndFocusGridCell();
				} else if (!this._colHeadFocusIdx) {
					if (this.isNoFocusCell()) {
						this._colHeadFocusIdx = 0;
					} else {
						this._colHeadFocusIdx = this.cell.index;
					}
				}
				this._colHeadNode = headerNodes[this._colHeadFocusIdx];
				while (
					this._colHeadNode &&
					this._colHeadFocusIdx >= 0 &&
					this._colHeadFocusIdx < headerNodes.length &&
					this._colHeadNode.style.display == 'none'
				) {
					// skip over hidden column headers
					this._colHeadFocusIdx++;
					this._colHeadNode = headerNodes[this._colHeadFocusIdx];
				}
				if (this._colHeadNode && this._colHeadNode.style.display != 'none') {
					// Column header cells know longer receive actual focus.  So, for keyboard invocation of
					// contextMenu to work, the contextMenu must be bound to the grid.domNode rather than the viewsHeaderNode.
					// unbind the contextmenu from the viewsHeaderNode and to the grid when header cells are active.  Reset
					// the binding back to the viewsHeaderNode when header cells are no longer acive (in blurHeader) #10483
					if (
						this.headerMenu &&
						this._contextMenuBindNode != this.grid.domNode
					) {
						this.headerMenu.unBindDomNode(this.grid.viewsHeaderNode);
						this.headerMenu.bindDomNode(this.grid.domNode);
						this._contextMenuBindNode = this.grid.domNode;
					}
					this._setActiveColHeader(
						this._colHeadNode,
						this._colHeadFocusIdx,
						saveColHeadFocusIdx
					);
					this._scrollHeader(this._colHeadFocusIdx);
					this._focusifyCellNode(false);
				} else {
					// all col head nodes are hidden - focus the grid
					this.findAndFocusGridCell();
				}
			},
			setFocusIndex: function (inRowIndex, inCellIndex) {
				var cellNode = this._getCellNode(inRowIndex, inCellIndex);

				if (cellNode) {
					var columnIndex = parseInt(cellNode.getAttribute('col')),
						layoutCell = this.grid.layout.cells[columnIndex];

					if (layoutCell) {
						this.currentArea(
							this.grid.edit.isEditing() ? 'editableCell' : 'content',
							true
						);
						//This is very slow when selecting cells!
						//this.focusGridView();
						this._focusifyCellNode(false);
						//this.cell never use it in ExcelFocusManager. Use this.col instead.
						this.cell = layoutCell;
						this.cellIndex = inCellIndex;
						this.rowIndex = inRowIndex;
						this._focusifyCellNode(true);
					}
					this.grid.onCellFocusExcel(inRowIndex, inCellIndex);
				}
			},
			_focusifyCellNode: function (inBork) {
				var n =
					this.cellIndex !== undefined && this.rowIndex !== undefined
						? this._getCellNode(this.rowIndex, this.cellIndex)
						: undefined;
				if (n) {
					html.toggleClass(n, this.focusClass, inBork);
					if (inBork) {
						var sl = this.scrollIntoView();
						try {
							if (has('webkit') || !this.grid.edit.isEditing()) {
								util.fire(n, 'focus');
								if (sl) {
									this._getView().scrollboxNode.scrollLeft = sl;
								}
							}
						} catch (e) {}
					}
				}
			},
			isNoFocusCell: function () {
				return this.rowIndex < 0 || this.cellIndex === undefined;
			},
			scrollIntoView: function () {
				var cellNode = this._getCellNode(this.rowIndex, this.cellIndex);
				var info = this._scrollInfo(this.cell, cellNode);
				var rt = this.grid.scroller.findScrollTop(this.rowIndex);
				// place cell within horizontal view
				if (info.n && info.sr) {
					if (info.n.offsetLeft + info.n.offsetWidth > info.sr.l + info.sr.w) {
						info.s.scrollLeft =
							info.n.offsetLeft + info.n.offsetWidth - info.sr.w;
					} else if (info.n.offsetLeft < info.sr.l) {
						info.s.scrollLeft = info.n.offsetLeft;
					}
				}
				// place cell within vertical view
				if (info.r && info.sr) {
					if (rt + info.r.offsetHeight > info.sr.t + info.sr.h) {
						this.grid.setScrollTop(rt + info.r.offsetHeight - info.sr.h);
					} else if (rt < info.sr.t) {
						this.grid.setScrollTop(rt);
					}
				}
				return info.s.scrollLeft;
			},
			//Copy from dojo
			_scrollInfo: function (cell, domNode) {
				if (cell) {
					var view = cell.view.scrollboxNode ? cell.view : this.focusView;
					var sbn = view.scrollboxNode,
						sbnr = {
							w: sbn.clientWidth,
							l: sbn.scrollLeft,
							t: sbn.scrollTop,
							h: sbn.clientHeight
						},
						rn = view.getRowNode(this.rowIndex);
					return {
						c: cell,
						s: sbn,
						sr: sbnr,
						n: domNode ? domNode : cell.getNode(this.rowIndex),
						r: rn
					};
				}
				return null;
			},

			tab: function (step, evt) {
				if (step === 0) {
					return;
				}
				this[step == 1 ? 'nextKey' : 'previousKey'](event, evt);
			},

			nextKey: function (event, e) {
				var isEmpty = this.grid.rowCount === 0;
				if (e.target === this.grid.domNode && this._colHeadFocusIdx == null) {
					this.focusHeader();
					event.stop(e);
				} else if (this.isNavHeader()) {
					// if tabbing from col header, then go to grid proper.
					this.blurHeader();
					if (!this.findAndFocusGridCell()) {
						this.tabOut(this.grid.lastFocusNode);
					}
					this._colHeadNode = this._colHeadFocusIdx = null;
				} else {
					event.stop(e);
					this.next();
				}
			},
			previousKey: function (event, e) {
				event.stop(e);
				this.previous();
			},
			_allowToMoveFocus: function () {
				var editInProgress = this.grid.edit.isEditing(),
					inputValueIsInvalid;
				if (editInProgress) {
					inputValueIsInvalid = !this.grid.edit._isValidInput();
					if (inputValueIsInvalid) {
						return false;
					}
					this.grid.edit.apply();
				}
				return true;
			},
			next: function () {
				//Copy from origin next without if(this.grid.edit.isEditing())
				if (this._allowToMoveFocus() && this.cell) {
					var newRowIndex = this.rowIndex,
						newCellIndex = this.grid.focus.cellIndex + 1,
						newCellNode,
						newInCol,
						isGridReloaded = false;

					//search next editable cell
					while (true) {
						newCellNode = this._getCellNode(newRowIndex, newCellIndex);
						if (!newCellNode) {
							newCellIndex = 0;
							newRowIndex++;

							if (newRowIndex > this.grid.rowCount - 1) {
								if (grid.isEditMode) {
									grid.newDefaultRootRow = true;
									grid.addNewRootRow();
									isGridReloaded = true;
									//add new row and continue in order to skip not editable cells in the first row cell
									//possible issue here if all rows in grid not editable.
								} else {
									return;
								}
							}
							continue;
						}

						newColIndex = parseInt(newCellNode.getAttribute('col'));
						newInCol = this.grid.layout.cells[newColIndex];
						//stop on editable cells on tab, skip all not editable cells,
						//possible cases: 1. column is not editable at all 2. cell is hidden in grid definition
						if (!grid.isEditMode || (newInCol.editable && !newInCol.hidden)) {
							break;
						}

						newCellIndex++;
					}

					if (!isGridReloaded) {
						this.grid.selectCell(newRowIndex, newColIndex, newCellIndex);
						this.grid.edit.setEditCellExcel(newRowIndex, newCellIndex);
					}
				}
			},
			previous: function () {
				//Copy from origin next without if(this.grid.edit.isEditing())
				if (this._allowToMoveFocus() && this.cell) {
					var newRowIndex = this.rowIndex,
						newCellIndex = this.grid.focus.cellIndex - 1,
						newCellNode,
						newInCol;

					//search prev editable cell
					while (true) {
						newCellNode = this._getCellNode(newRowIndex, newCellIndex);

						if (!newCellNode) {
							newRowIndex--;
							if (newRowIndex < 0) {
								newRowIndex = 0;
								break;
							}

							var row = this._getView().getRowNode(newRowIndex);
							if (!row) {
								break;
							}
							var rowsInRows = row.getElementsByTagName('tr');
							if (rowsInRows) {
								var cellsInRow = rowsInRows[rowsInRows.length - 1].cells;
								var lastCellInRow = cellsInRow[cellsInRow.length - 1];
								newCellIndex = parseInt(lastCellInRow.getAttribute('idx'));
							}

							continue;
						}

						newColIndex = parseInt(newCellNode.getAttribute('col'));
						newInCol = this.grid.layout.cells[newColIndex];

						//stop on editable cells on tab, skip all not editable cells,
						//possible cases: 1. column is not editable at all 2. cell is hidden in grid definition
						if (newInCol.editable && !newInCol.hidden) {
							break;
						}

						newCellIndex--;
					}

					if (newRowIndex >= 0) {
						this.grid.selection.clear();
						this.grid.selection.setSelected(newRowIndex, true);
					}

					if (this.isFirstFocusCell()) {
						return;
					}
					//remove check editable cell
					this.grid.selectCell(newRowIndex, newColIndex, newCellIndex);
					this.grid.edit.setEditCellExcel(newRowIndex, newCellIndex);
				}
			},
			_onEditableCellMouseEvent: function (evt) {
				// this method not tested
				if (evt.type == 'click') {
					var col = this.cell || evt.cell;
					if (col && !col.editable && col.navigatable) {
						this._initNavigatableElems();
						if (this._navElems.lowest || this._navElems.first) {
							var target = has('ie') ? evt.srcElement : evt.target;
							var cellNode = this._getCellNode(this.rowIndex, this.colIndex);
							if (target != cellNode) {
								this._isNavigating = true;
								this.focusArea('editableCell', evt);
								html.setSelectable(cellNode, true);
								dijitFocus.focus(target);
								return false;
							}
						}
					} else if (this.grid.singleClickEdit) {
						this.currentArea('editableCell');
						return false;
					}
				}
				return true;
			},
			_onContentKeyDown: function (e, isBubble) {
				if (isBubble) {
					var dk = keys,
						s = this.grid.scroller;
					switch (e.keyCode) {
						/* commented base code. CG overrides behavior for this keys
					case dk.ENTER:
					case dk.SPACE:
						var g = this.grid;
						if(g.indirectSelection){ break; }
						g.selection.clickSelect(this.rowIndex, connect.isCopyKey(e), e.shiftKey);
						g.onRowClick(e);
						event.stop(e);
						break;
					*/
						case dk.PAGE_UP:
							if (this.rowIndex !== 0) {
								if (this.rowIndex != s.firstVisibleRow + 1) {
									this._navContent(s.firstVisibleRow - this.rowIndex, 0);
								} else {
									this.grid.setScrollTop(s.findScrollTop(this.rowIndex - 1));
									this._navContent(s.firstVisibleRow - s.lastVisibleRow + 1, 0);
								}
								event.stop(e);
							}
							break;
						case dk.PAGE_DOWN:
							if (this.rowIndex + 1 != this.grid.rowCount) {
								event.stop(e);
								if (this.rowIndex != s.lastVisibleRow - 1) {
									this._navContent(s.lastVisibleRow - this.rowIndex - 1, 0);
								} else {
									this.grid.setScrollTop(s.findScrollTop(this.rowIndex + 1));
									this._navContent(s.lastVisibleRow - s.firstVisibleRow - 1, 0);
								}
								event.stop(e);
							}
							break;
					}
				}
				return true;
			},
			_onEditableCellKeyDown: function (e, isBubble) {
				var dk = keys,
					g = this.grid,
					edit = g.edit,
					editApplied = false,
					toPropagate = true;

				switch (e.keyCode) {
					case dk.ENTER:
						if (isBubble) {
							if (edit.isEditing()) {
								this._applyEditableCell();
								editApplied = true;
							}

							var targetCell = e.shiftKey
								? this.grid.map.getCellAbove(this.rowIndex, this.cellIndex)
								: this.grid.map.getCellBelow(this.rowIndex, this.cellIndex);
							if (
								targetCell &&
								(targetCell.rowIndex !== this.rowIndex ||
									targetCell.cellIndex !== this.cellIndex)
							) {
								this.grid.selectCell(
									targetCell.rowIndex,
									targetCell.columnNumber,
									targetCell.cellIndex
								);
								this.grid.edit.setEditCellExcel(
									targetCell.rowIndex,
									targetCell.cellIndex
								);
							}

							event.stop(e);
						}
						break;
					case dk.SPACE:
						if (!isBubble && this._isNavigating) {
							toPropagate = false;
							break;
						}
						if (isBubble) {
							if (!this.cell.editable && this.cell.navigatable) {
								this._initNavigatableElems();
								var toFocus = this._navElems.lowest || this._navElems.first;
								if (toFocus) {
									this._isNavigating = true;
									html.setSelectable(
										this._getCellNode(this.rowIndex, this.cellIndex),
										true
									);
									dijitFocus.focus(toFocus);
									event.stop(e);
									this.currentArea('editableCell', true);
									break;
								}
							}
							if (
								!editApplied &&
								!edit.isEditing() &&
								!g.pluginMgr.isFixedCell(this.cell)
							) {
								edit.setEditCellExcel(this.rowIndex, this.cellIndex);
							}
							this.currentArea('content', true);
						}
						break;
					case dk.PAGE_UP:
					case dk.PAGE_DOWN:
						if (!isBubble && edit.isEditing()) {
							//prevent propagating to content area
							toPropagate = false;
						}
						break;
					case dk.ESCAPE:
						if (!isBubble) {
							edit.cancel();
							this.currentArea('content', true);
						}
						break;
					case dk.F2:
						if (!isBubble) {
							this.grid.edit.setEditCellExcel(this.rowIndex, this.cellIndex);
							this.currentArea('content', true);
							toPropagate = false;
						}
						break;
				}

				return toPropagate;
			},

			_navContent: function (rowStep, colStep, evt) {
				var actualRowId = this.grid.map.getRowIdByStoreRowIndexAndStoreCellIndex(
						this.rowIndex,
						this.cellIndex
					),
					actualRowIndex = this.grid.map.getRowIndexByRowId(actualRowId),
					actualRowCount = this.grid.map.getRowCount();

				if (
					(actualRowIndex === 0 && rowStep < 0) ||
					(actualRowIndex === actualRowCount - 1 && rowStep > 0)
				) {
					return;
				}
				this._colHeadNode = null;
				this.move(rowStep, colStep, evt);
				if (evt) {
					event.stop(evt);
				}
			},

			move: function (inRowDelta, inColDelta) {
				// summary:
				//		focus grid cell or  simulate focus to column header based on position relative to current focus
				// inRowDelta: int
				//		vertical distance from current focus
				// inColDelta: int
				//		horizontal distance from current focus

				var colDir = inColDelta < 0 ? -1 : 1;
				// Handle column headers.
				if (this.isNavHeader()) {
					var headers = this._findHeaderCells(),
						currentIdx = array.indexOf(headers, this._colHeadNode),
						savedIdx = currentIdx;

					currentIdx += inColDelta;
					while (
						currentIdx >= 0 &&
						currentIdx < headers.length &&
						headers[currentIdx].style.display == 'none'
					) {
						// skip over hidden column headers
						currentIdx += colDir;
					}
					if (currentIdx >= 0 && currentIdx < headers.length) {
						this._setActiveColHeader(headers[currentIdx], currentIdx, savedIdx);
					}
				} else {
					if (this.cell) {
						// Handle grid proper.
						var sc = this.grid.scroller,
							r = this.rowIndex,
							rc = this.grid.rowCount - 1,
							row = Math.min(rc, Math.max(0, r + inRowDelta));

						if (inRowDelta) {
							if (inRowDelta > 0) {
								if (row > sc.getLastPageRow(sc.page)) {
									//need to load additional data, let scroller do that
									this.grid.setScrollTop(
										this.grid.scrollTop +
											sc.findScrollTop(row) -
											sc.findScrollTop(r)
									);
								}
							} else if (inRowDelta < 0) {
								if (row <= sc.getPageRow(sc.page)) {
									//need to load additional data, let scroller do that
									this.grid.setScrollTop(
										this.grid.scrollTop -
											sc.findScrollTop(r) -
											sc.findScrollTop(row)
									);
								}
							}
						}

						var cc = this.grid.layout.cellCount - 1,
							i = this.cell.index,
							col = Math.min(cc, Math.max(0, i + inColDelta)),
							cell = this.grid.getCell(col);

						while (col >= 0 && col < cc && cell && cell.hidden === true) {
							// skip hidden cells
							col += colDir;
							cell = this.grid.getCell(col);
						}
						if (!cell || cell.hidden === true) {
							// don't change col if would move to hidden
							col = i;
						}
						//skip hidden row|cell
						var n = cell.getNode(row);
						if (!n && inRowDelta) {
							if (row + inRowDelta >= 0 && row + inRowDelta <= rc) {
								this.move(
									inRowDelta > 0 ? ++inRowDelta : --inRowDelta,
									inColDelta
								);
							}
							return;
						} else if (
							(!n || html.style(n, 'display') === 'none') &&
							inColDelta
						) {
							if (col + inColDelta >= 0 && col + inColDelta <= cc) {
								this.move(
									inRowDelta,
									inColDelta > 0 ? ++inColDelta : --inColDelta
								);
							}
							return;
						}

						var offsetCell;
						if (inRowDelta) {
							this.grid.updateRow(r);
							offsetCell =
								inRowDelta > 0
									? this.grid.map.getCellBelow(
											this.rowIndex,
											this.cellIndex,
											inRowDelta
									  )
									: this.grid.map.getCellAbove(
											this.rowIndex,
											this.cellIndex,
											Math.abs(inRowDelta)
									  );
						} else {
							offsetCell = {
								rowIndex: this.rowIndex,
								columnNumber: this.cell.index,
								cellIndex: this.cellIndex
							};
						}

						if (inColDelta) {
							var newColumnIndex = offsetCell.columnNumber + inColDelta;

							// bypass hidden cells
							while (
								this.grid.layout.cells[newColumnIndex] &&
								this.grid.layout.cells[newColumnIndex].hidden
							) {
								inColDelta += inColDelta > 0 ? 1 : -1;
								newColumnIndex = offsetCell.columnNumber + inColDelta;
							}

							if (this.grid.layout.cells[newColumnIndex]) {
								offsetCell = this.grid.map.getRowCellByColumnOffset(
									this.rowIndex,
									this.cellIndex,
									inColDelta
								);
							}
						}

						this.grid.selectCell(
							offsetCell.rowIndex,
							offsetCell.columnNumber,
							offsetCell.cellIndex
						);
					}
				}
			},

			isFirstFocusCell: function () {
				var rowIndex = this.rowIndex,
					cellIndex = this.grid.focus.cellIndex;

				if (rowIndex === 0 && cellIndex === 0) {
					return true;
				} else {
					return false;
				}
			}
			// need to override following methods, that marked with null value. All of them use 'this.cell',
			// also we should exclude 'this.cell' and 'cell.getNode(rowIndex)' and other method and properties that ExcelGrid doesn's support
			/*
		focusHeader: null,
		previous: null,
		next: null,
		isFirstFocusCell: null,
		isLastFocusCell: null,
		_initNavigatableElems: null,
		_blurEditableCell: null,
		_focusEditableCell: null,
		_focusContent: null
		*/
		}
	);
});
