function Keyboard(grid) {
	this.grid = grid;

	this.grid.dom.addEventListener('keydown', this._keydownHandler.bind(this));
}

Keyboard.prototype = {
	constructor: Keyboard,

	_dispatchFocusEvent: function (indexHead, indexRow, forceEdit) {
		this.grid.dom.dispatchEvent(
			new CustomEvent('focusCell', {
				detail: {
					indexRow: indexRow,
					indexHead: indexHead,
					forceEdit: forceEdit
				}
			})
		);
	},

	_dispatchSearchEvent: function () {
		this.grid.view.body.focus();
		this.grid.dom.dispatchEvent(new CustomEvent('focusCell'));
		this.grid.dom.dispatchEvent(new CustomEvent('search'));
	},

	_dispatchSelectEvent: function (indexRow, event) {
		const type = !this.grid.view.defaultSettings.multiSelect
			? 'single'
			: event.ctrlKey || event.metaKey
			? 'ctrl'
			: event.shiftKey
			? 'shift'
			: 'single';

		this.grid.dom.dispatchEvent(
			new CustomEvent('selectRow', {
				detail: {
					index: indexRow,
					type: type
				}
			})
		);
	},

	_dispatchSelectAllEvent: function (event) {
		if (!this.grid.view.defaultSettings.multiSelect) {
			return;
		}

		this.grid.dom.dispatchEvent(
			new CustomEvent('selectRow', {
				detail: {
					type: 'all'
				}
			})
		);
	},

	_dispatchCancelEditEvent: function () {
		this.grid.dom.dispatchEvent(new CustomEvent('cancelEdit'));
	},

	_keydownHandler: function (event) {
		const focusedCell = this.grid.settings.focusedCell;
		const pressedKey = this._getKeyDescription(event);

		if (!focusedCell || event.isComposing) {
			return;
		}

		const rowId = focusedCell.rowId;
		const headId = focusedCell.headId;
		let indexRow = this.grid.settings.indexRows.indexOf(rowId);
		let indexHead = this.grid.settings.indexHead.indexOf(headId);
		const rowsCount = this.grid.settings.indexRows.length - 1;

		const gridView = this.grid.view;
		const visibleRowCount =
			(gridView.bodyBoundary.clientHeight / gridView._realRowHeight) | 0;
		const firstRowIndex =
			(gridView.bodyBoundary.scrollTop / gridView._realRowHeight) | 0;

		const searchRowCell = event.target.closest('.aras-grid-search-row-cell');

		if (searchRowCell || rowId === 'searchRow') {
			switch (pressedKey) {
				case 'Enter': {
					this._dispatchSearchEvent();
					break;
				}
				case 'Tab': {
					if (
						(indexHead <= 1 && event.shiftKey) ||
						(rowsCount === -1 &&
							indexHead === this.grid.settings.indexHead.length - 1 &&
							!event.shiftKey)
					) {
						return;
					}

					event.preventDefault();

					const step = event.shiftKey ? -1 : 1;
					let nextHeadType;
					do {
						const nextHeadId = this.grid.settings.indexHead[indexHead + step];
						if (!nextHeadId) {
							this._dispatchFocusEvent(0, 0, true);
							return;
						}

						const nextHead = this.grid.head.get(nextHeadId);
						nextHeadType = nextHead.searchType;
						indexHead += step;
					} while (nextHeadType === 'disabled');

					if (
						indexHead < 0 ||
						indexHead === this.grid.settings.indexHead.length
					) {
						return;
					}
					this._dispatchFocusEvent(indexHead, 'searchRow');
					break;
				}
			}
			return;
		}

		switch (pressedKey) {
			case 'Enter': {
				this._dispatchFocusEvent(indexHead, indexRow);
				break;
			}
			case 'Tab': {
				const lastHead = indexHead === this.grid.settings.indexHead.length - 1;
				const firstHead = indexHead === 0;
				const lastRow = indexRow === this.grid.settings.indexRows.length - 1;
				const firstRow = indexRow === 0;

				if (lastHead && lastRow && !event.shiftKey) {
					return;
				}

				if (firstHead && firstRow && event.shiftKey) {
					this._dispatchFocusEvent(
						this.grid.settings.indexHead.length - 1,
						'searchRow'
					);
					event.preventDefault();
					break;
				}

				if (event.shiftKey) {
					indexRow = firstHead ? --indexRow : indexRow;
					indexHead = firstHead
						? this.grid.settings.indexHead.length - 1
						: --indexHead;
					if (firstHead) {
						this.grid.dom.dispatchEvent(
							new CustomEvent('selectRow', {
								detail: {
									index: indexRow,
									type: 'single'
								}
							})
						);
					}
				} else {
					indexRow = lastHead ? ++indexRow : indexRow;
					indexHead = lastHead ? 0 : ++indexHead;
					if (lastHead) {
						this._dispatchSelectEvent(indexRow, event);
					}
				}

				this._dispatchFocusEvent(indexHead, indexRow, true);
				event.preventDefault();
				break;
			}
			case 'Escape': {
				if (focusedCell.editing) {
					this._dispatchCancelEditEvent();
				}
				break;
			}
		}

		if (event.target.closest('.aras-grid-active-cell')) {
			return;
		}

		switch (pressedKey) {
			case 'Home': {
				if (event.ctrlKey || event.metaKey) {
					indexRow = 0;
				}
				indexHead = 0;
				this._dispatchFocusEvent(indexHead, indexRow);
				break;
			}
			case 'End': {
				if (event.ctrlKey || event.metaKey) {
					indexRow = rowsCount;
				}
				indexHead = this.grid.settings.indexHead.length - 1;
				this._dispatchFocusEvent(indexHead, indexRow);
				break;
			}
			case 'PageDown': {
				const nextFirstRow = firstRowIndex + visibleRowCount;
				const cellTopPosition = nextFirstRow * gridView._realRowHeight;
				gridView.bodyBoundary.scrollTop = cellTopPosition;

				if (indexRow < firstRowIndex || indexRow >= nextFirstRow) {
					indexRow = firstRowIndex;
				}
				const newFocusedIndexRow = indexRow + visibleRowCount;
				if (indexRow < rowsCount) {
					this._dispatchFocusEvent(
						indexHead,
						Math.min(newFocusedIndexRow, rowsCount)
					);
				}
				break;
			}
			case 'PageUp': {
				const nextFirstRow = firstRowIndex - visibleRowCount;
				const cellTopPosition = nextFirstRow * gridView._realRowHeight;
				gridView.bodyBoundary.scrollTop = cellTopPosition;

				const newFocusedIndexRow =
					indexRow > firstRowIndex + visibleRowCount
						? nextFirstRow
						: indexRow - visibleRowCount;

				if (indexRow > 0) {
					this._dispatchFocusEvent(indexHead, Math.max(0, newFocusedIndexRow));
				}
				break;
			}
			case 'ArrowUp': {
				if (indexRow > 0) {
					this._dispatchFocusEvent(indexHead, --indexRow);
				}
				break;
			}
			case 'ArrowDown': {
				if (indexRow < this.grid.settings.indexRows.length - 1) {
					this._dispatchFocusEvent(indexHead, ++indexRow);
				}
				break;
			}
			case 'ArrowLeft': {
				if (indexHead > 0) {
					this._dispatchFocusEvent(--indexHead, indexRow);
				}
				break;
			}
			case 'ArrowRight': {
				if (indexHead < this.grid.settings.indexHead.length - 1) {
					this._dispatchFocusEvent(++indexHead, indexRow);
				}
				break;
			}
			case 'Space': {
				this._dispatchSelectEvent(indexRow, event);
				break;
			}
			case 'KeyA': {
				if (event.ctrlKey || event.metaKey) {
					this._dispatchSelectAllEvent(event);
				}
				break;
			}
			default:
				return;
		}

		event.preventDefault();
	},

	_getKeyDescription(event) {
		const CODE_MAP = {
			NumpadEnter: 'Enter',
			Numpad7: 'Home',
			Numpad1: 'End',
			Numpad3: 'PageDown',
			Numpad9: 'PageUp',
			Numpad8: 'ArrowUp',
			Numpad2: 'ArrowDown',
			Numpad4: 'ArrowLeft',
			Numpad6: 'ArrowRight'
		};

		switch (event.key) {
			// This case bind the 'A' latin letter to the 'KeyA' value.
			// It is need because different keyboard layout can have the 'A' latin letter on different key.
			// Example: QWERTY keyboard has a 'KeyA' KeyboardEvent.code equal the 'A' latin letter but
			// AZERTY keyboard has a 'KeyQ' KeyboardEvent.code equal the 'A' latin letter.
			case 'A':
			case 'a': {
				return 'KeyA';
			}
		}

		return CODE_MAP[event.code] || event.code;
	}
};

export default Keyboard;
