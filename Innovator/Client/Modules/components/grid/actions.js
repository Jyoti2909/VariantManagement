class GridActions {
	handlers = [];
	constructor(grid) {
		this.grid = grid;
		this._addHandlers([
			{
				target: this.grid,
				action: 'resizeHead',
				handler: this._resizeHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'selectRow',
				handler: this._selectHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'focusCell',
				handler: this._focusHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'applyEdit',
				handler: this._applyEditHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'notValidEdit',
				handler: this._notValidEditHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'cancelEdit',
				handler: this._cancelEditHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'moveHead',
				handler: this._moveHeadHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'sort',
				handler: this._sortHandler.bind(this)
			},
			{
				target: this.grid,
				action: 'freezeColumns',
				handler: this._freezeColumnsHandler.bind(this)
			}
		]);
	}

	_addHandlers(handlers) {
		handlers.forEach(function (item) {
			this.handlers.push(item);
			item.target.addEventListener(item.action, item.handler);
		}, this);
	}

	_resizeHandler(e) {
		const headId = this.grid.settings.indexHead[e.detail.index];
		const head = this.grid.head.get(headId);
		if (head) {
			head.width = Math.max(
				head.width + e.detail.delta,
				this.grid.view.defaultSettings.headWidth
			);
			this.grid.head.set(headId, head);
		}
	}

	_focusHandler(e) {
		const grid = this.grid;
		const settings = grid.settings;
		const eventDetail = e.detail;
		if (!eventDetail) {
			grid.settings.focusedCell = null;
			grid.view.showMessageActiveCell();
			return;
		}

		const searchRowId = 'searchRow';
		const {
			indexHead,
			indexRow,
			headId = settings.indexHead[indexHead],
			rowId = settings.indexRows[indexRow] ?? searchRowId
		} = eventDetail;

		let editing = false;
		if (rowId !== searchRowId) {
			const prev = settings.focusedCell ?? {};
			const forceEdit = eventDetail.forceEdit;
			editing =
				forceEdit ||
				(prev.editing === false &&
					prev.rowId === rowId &&
					prev.headId === headId);
		}

		settings.focusedCell = {
			headId,
			rowId,
			editing
		};
	}

	_applyEditHandler(e) {
		const { dataId, value, propName } = e.detail;
		this.grid.rows.set(dataId, value, propName);
	}

	_notValidEditHandler(e) {
		const gridSettings = this.grid.settings;
		if (!gridSettings.focusedCell) {
			return;
		}

		gridSettings.focusedCell = Object.assign(gridSettings.focusedCell, {
			valid: false,
			toolTipMessage: e.detail.message
		});
	}

	_cancelEditHandler() {
		const grid = this.grid;
		grid.cancelEdit();
	}

	_selectHandler(e) {
		const grid = this.grid;
		const settings = grid.settings;
		const { index, rowId = settings.indexRows[index] } = e.detail;

		switch (e.detail.type) {
			case 'all': {
				settings.selectedRows = settings.indexRows.slice();
				break;
			}
			case 'single': {
				settings.selectedRows = [rowId];
				break;
			}
			case 'ctrl': {
				const indexInSelected = settings.selectedRows.indexOf(rowId);
				if (indexInSelected > -1) {
					settings.selectedRows.splice(indexInSelected, 1);
				} else {
					settings.selectedRows.unshift(rowId);
				}
				break;
			}
			case 'shift': {
				const lastSelectedRow =
					settings.selectedRows[0] || settings.indexRows[0];
				let indexOfLastSelectedRow = settings.indexRows.indexOf(
					lastSelectedRow
				);
				settings.selectedRows = [lastSelectedRow];
				const rowIndex = settings.indexRows.indexOf(rowId);
				const direction = indexOfLastSelectedRow > rowIndex ? -1 : 1;

				while (indexOfLastSelectedRow !== rowIndex) {
					indexOfLastSelectedRow += direction;
					settings.selectedRows.push(
						settings.indexRows[indexOfLastSelectedRow]
					);
				}
			}
		}

		grid.render();
	}

	_moveHeadHandler(e) {
		const grid = this.grid;

		const startIndex = e.detail.startIndex;
		const startHeadId = grid.settings.indexHead[startIndex];
		const endIndex = e.detail.endIndex;

		grid.settings.indexHead.splice(startIndex, 1);
		grid.settings.indexHead.splice(endIndex, 0, startHeadId);

		grid.render();
	}

	_sortHandler(e) {
		const settings = this.grid.settings;
		const { ctrlKey, index, headId = settings.indexHead[index] } = e.detail;
		const orderBy = settings.orderBy;
		const el = orderBy.find((order) => order.headId === headId);

		if (!ctrlKey) {
			settings.orderBy = [
				{
					headId: headId,
					desc: el ? !el.desc : false
				}
			];

			return;
		}

		if (el) {
			el.desc = !el.desc;
			settings.orderBy = orderBy;
			return;
		}

		settings.orderBy = [
			...orderBy,
			{
				headId: headId,
				desc: false
			}
		];
	}

	_freezeColumnsHandler(e) {
		const frozenColumns = e.detail.frozenColumns;
		this.grid.settings.frozenColumns = frozenColumns;

		this.grid.render();
	}
}

export default GridActions;
