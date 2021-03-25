define([
	'dojo/_base/declare',
	'dgrid/Keyboard',
	'dojo/on',
	'dojo/_base/lang',
	'put-selector/put',
	'dgrid/util/misc',
	'dojo/keys'
], function (declare, Keyboard, on, lang, put, miscUtil, keys) {
	var hasGridCellClass = /\bdgrid-cell\b/;
	var hasGridRowClass = /\bdgrid-row\b/;

	function removeItemsWithCellId(nodes, relatedCellId) {
		return nodes.filter(function (node) {
			return node.cellId !== relatedCellId;
		});
	}

	return declare(Keyboard, {
		// pageSkip: Number
		//		Number of rows to jump by when page up or page down is pressed.
		pageSkip: 10,

		_nodesWithSelectionRelatedStyle: [],

		postCreate: function () {
			this.inherited(arguments);
			this._debouncedEnsureScroll = miscUtil.debounce(this._ensureScroll, this);

			var grid = this;
			grid._listeners.push(
				on(grid.contentNode, 'keydown', function (event) {
					var cell;

					if (event.altKey && event.keyCode === keys.ENTER) {
						event.preventDefault();
						grid.qpGrid.openCellMenu(event.target);
						return;
					}

					if (event.keyCode === keys.ENTER) {
						event.preventDefault();
						cell = grid.cell(event);
						grid.editFocusedCell(cell);
					}

					//NOTE: dGrid has some code with a comment below. Don't know if we need this code, the code is removed from here for now.
					// Text boxes and other inputs that can use direction keys should be ignored
					// and not affect cell/row navigation
				})
			);

			this.keyMap[keys.UP_ARROW] = this.moveFocusUp;
			this.keyMap[keys.DOWN_ARROW] = this.moveFocusDown;
			this.keyMap[keys.LEFT_ARROW] = this.moveFocusLeft;
			this.keyMap[keys.TAB] = this.tabNavigation;
			this.keyMap[keys.RIGHT_ARROW] = this.moveFocusRight;
			this.keyMap[keys.PAGE_UP] = this.moveFocusPageUp;
			this.keyMap[keys.PAGE_DOWN] = this.moveFocusPageDown;
			this.keyMap[keys.END] = this.moveLastCell;
			this.keyMap[keys.HOME] = this.moveFirstCell;
		},

		_focusOnNode: function (
			element,
			isHeader,
			event,
			isMultiselect,
			isToUnselect
		) {
			var focusedNodeProperty =
				'_focused' + (isHeader ? 'Header' : '') + 'Node';
			var focusedNode = this[focusedNodeProperty];
			var cellOrRowType = this.cellNavigation ? 'cell' : 'row';
			var cell = this[cellOrRowType](element);
			var inputs;
			var input;
			var numInputs;
			var inputFocused;
			var i;
			var row;
			var rowId;
			var relatedCells;
			var relatedCell;

			element = cell && cell.element;
			if (!element) {
				return;
			}

			if (this.cellNavigation) {
				inputs = element.getElementsByTagName('input');
				for (i = 0, numInputs = inputs.length; i < numInputs; i++) {
					input = inputs[i];
					if (
						(input.tabIndex !== -1 || '_dgridLastValue' in input) &&
						!input.disabled
					) {
						input.focus();
						inputFocused = true;
						break;
					}
				}
			}

			// Set up event information for dgrid-cellfocusout/in events.
			// Note that these events are not fired for _restoreFocus.
			if (event !== null) {
				event = lang.mixin({ grid: this }, event);
				if (event.type) {
					event.parentType = event.type;
				}
				if (!event.bubbles) {
					// IE doesn't always have a bubbles property already true.
					// Opera throws if you try to set it to true if it is already true.
					event.bubbles = true;
				}
			}

			if (focusedNode) {
				// Clean up previously-focused element
				// Remove the class name and the tabIndex attribute
				var wasFocused = /\bdgrid-focus\b/.test(focusedNode.className);
				put(focusedNode, '!dgrid-focus[!tabIndex]');

				if (isMultiselect) {
					if (
						!isToUnselect ||
						(focusedNode.cellId !== element.cellId && wasFocused)
					) {
						put(focusedNode, '.dgrid-related-cell');
						this._nodesWithSelectionRelatedStyle.push(focusedNode);
					}

					if (isToUnselect) {
						row = this.row(element);
						rowId = row && row.id;
						relatedCells = this.cellsByNodeId(rowId, element.nodeId);
						for (i = 0; i < relatedCells.length; i++) {
							relatedCell = relatedCells[i];
							put(relatedCell, '!dgrid-related-cell');
							this._nodesWithSelectionRelatedStyle = removeItemsWithCellId(
								this._nodesWithSelectionRelatedStyle,
								relatedCell.cellId
							);
						}
						return;
					}
				} else {
					row = this.row(focusedNode);
					rowId = row && row.id;
					this._nodesWithSelectionRelatedStyle.map(function (node) {
						put(node, '!dgrid-related-cell');
					});
					this._nodesWithSelectionRelatedStyle.length = 0;
				}

				// Expose object representing focused cell or row losing focus, via
				// event.cell or event.row; which is set depends on cellNavigation.
				if (event) {
					event[cellOrRowType] = this[cellOrRowType](focusedNode);
					on.emit(focusedNode, 'dgrid-cellfocusout', event);
				}
			}
			focusedNode = this[focusedNodeProperty] = element;

			if (event) {
				// Expose object representing focused cell or row gaining focus, via
				// event.cell or event.row; which is set depends on cellNavigation.
				// Note that yes, the same event object is being reused; on.emit
				// performs a shallow copy of properties into a new event object.
				event[cellOrRowType] = cell;
			}

			var isFocusableClass = this.cellNavigation
				? hasGridCellClass
				: hasGridRowClass;
			if (!inputFocused && isFocusableClass.test(element.className)) {
				element.tabIndex = this.tabIndex;
				element.focus();
			}
			put(element, '.dgrid-focus');

			row = this.row(focusedNode);
			rowId = row && row.id;
			relatedCells = this.cellsByNodeId(rowId, element.nodeId);
			for (i = 0; i < relatedCells.length; i++) {
				relatedCell = relatedCells[i];
				if (element.cellId !== relatedCell.cellId) {
					put(relatedCell, '.dgrid-related-cell');
					this._nodesWithSelectionRelatedStyle.push(relatedCell);
				}
			}

			if (event) {
				on.emit(focusedNode, 'dgrid-cellfocusin', event);
			}

			if (isHeader) {
				this._debouncedEnsureScroll(cell, isHeader);
			}
		},

		_ensureColumnScroll: function (cellElement) {
			// summary:
			//		Ensures that the entire cell is visible in the viewport.
			//		Called in cases where the grid can scroll horizontally.

			var scrollX = this.getScrollPosition().x;
			var cellLeft = cellElement.offsetLeft;
			if (scrollX > cellLeft) {
				this.scrollTo({ x: cellLeft });
			} else {
				var bodyWidth = this.bodyNode.clientWidth;
				var cellWidth = cellElement.offsetWidth;
				var cellRight = cellLeft + cellWidth;
				if (scrollX + bodyWidth < cellRight) {
					// Adjust so that the right side of the cell and grid body align,
					// unless the cell is actually wider than the body - then align the left sides
					this.scrollTo({
						x: bodyWidth > cellWidth ? cellRight - bodyWidth : cellLeft
					});
				}
			}
		},

		_ensureScroll: function (cell, isHeader) {
			// summary:
			//		Corrects scroll based on the position of the newly-focused row/cell
			//		as necessary based on grid configuration and dimensions.

			if (!isHeader) {
				this._ensureRowScroll(cell.row.element);
			}
			if (this.bodyNode.clientWidth < this.contentNode.offsetWidth) {
				this._ensureColumnScroll(cell.element);
			}
		},

		//the function _ensureRowScroll can be removed after dgrid version later than 0.4.0.
		//The same for _debouncedEnsureScroll in postCreate and _ensureColumnScroll.
		//In _ensureScroll: this.columnSets, this.subRows in "if" was removed. We haven't columnSets but we override renderCell like we have it.
		_ensureRowScroll: function (rowElement) {
			// summary:
			//		Ensures that the entire row is visible within the viewport.
			//		Called for cell navigation in complex structures.

			var scrollY = this.getScrollPosition().y;
			if (scrollY > rowElement.offsetTop) {
				// Row starts above the viewport
				this.scrollTo({ y: rowElement.offsetTop });
			} else if (
				scrollY + this.contentNode.offsetHeight <
				rowElement.offsetTop + rowElement.offsetHeight
			) {
				// Row ends below the viewport
				this.scrollTo({
					y:
						rowElement.offsetTop -
						this.contentNode.offsetHeight +
						rowElement.offsetHeight
				});
			}
		},

		moveFocusUp: function (event) {
			this.moveFocusVertical(event, -1);
		},

		moveFocusDown: function (event) {
			this.moveFocusVertical(event, 1);
		},

		moveFocusLeft: function (event) {
			this.moveFocusHorizontal(event, true);
		},

		moveFocusRight: function (event) {
			this.moveFocusHorizontal(event, false);
		},

		tabNavigation: function (event) {
			if (event.shiftKey) {
				this.moveFocusHorizontal(event, true, true);
			} else {
				this.moveFocusHorizontal(event, false, true);
			}
		},

		moveFocusPageUp: function (event) {
			this.moveFocusVertical(event, -this.pageSkip);
		},

		moveFocusPageDown: function (event) {
			this.moveFocusVertical(event, this.pageSkip);
		},

		moveFocusVertical: function (event, steps) {
			var target = this.cell(event);
			var columnId = target.column.id;
			var focusedRow = this.row(this._focusedNode);
			var cellToFocus = {};
			var subRowIndex;
			var rowToFocus;

			if (steps === -1) {
				//up
				subRowIndex = this._focusedNode.subRowIndex;
				if (subRowIndex !== 0) {
					cellToFocus = this.cellBySubIndex(
						focusedRow,
						columnId,
						subRowIndex + steps
					);
				}
			}
			if (steps === 1) {
				//down
				//see comment in this.cell() to understand what's lastSubIndexOfSubRowIndex.
				var lastSubIndexOfSubRowIndex =
					this._focusedNode.subRowIndex + (this._focusedNode.rowSpan - 1);
				subRowIndex = lastSubIndexOfSubRowIndex + steps;
				cellToFocus = this.cellBySubIndex(focusedRow, columnId, subRowIndex);
			}

			if (!cellToFocus.element) {
				rowToFocus = this.down(this._focusedNode, steps, true);
				if (focusedRow.id !== rowToFocus.id) {
					cellToFocus = this.cellBySubIndex(
						rowToFocus,
						columnId,
						steps === -1 ? 'last' : 'first'
					);
					this._focusOnNode(cellToFocus, false, event);
				}
			} else {
				this._focusOnNode(cellToFocus, false, event);
			}

			event.preventDefault();
		},

		moveIndexColl: function (event, index) {
			var focusedRow;
			var cellToFocus;

			focusedRow = this.row(this._focusedNode);
			cellToFocus = this.cellBySubIndex(
				focusedRow,
				this.columnIdsOrdered[index],
				this._focusedNode.subRowIndex
			);

			if (cellToFocus.element) {
				this._focusOnNode(cellToFocus, false, event);
			}
		},

		moveFirstCell: function (event) {
			this.moveIndexColl(event, 0);
			event.preventDefault();
		},

		moveLastCell: function (event) {
			this.moveIndexColl(event, this.columnIdsOrdered.length - 1);
			event.preventDefault();
		},

		/**
		 *
		 * @param {event} event
		 * @param {boolean} isLeft -
		 * @param {boolean} isStop - stop tabulation after first and last cell
		 */
		moveFocusHorizontal: function (event, isLeft, isStop) {
			var focusedRow;
			var cellToFocus;
			var curColumnIndex = this.columnIdsOrdered.indexOf(
				this._focusedNode.columnId
			);
			var columnIdToFocus;

			if (isStop && event) {
				event.preventDefault();
			}

			if (isLeft) {
				if (curColumnIndex === 0) {
					return; //leftmost
				}
				columnIdToFocus = this.columnIdsOrdered[curColumnIndex - 1];
			} else {
				if (curColumnIndex === this.columnIdsOrdered.length - 1) {
					return; //rightmost
				}

				columnIdToFocus = this.columnIdsOrdered[curColumnIndex + 1];
			}

			focusedRow = this.row(this._focusedNode);
			cellToFocus = this.cellBySubIndex(
				focusedRow,
				columnIdToFocus,
				this._focusedNode.subRowIndex
			);

			if (cellToFocus.element) {
				this._focusOnNode(cellToFocus, false, event);
			}

			if (event) {
				event.preventDefault();
			}
		}
	});
});
