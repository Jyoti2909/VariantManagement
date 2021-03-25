import Grid from '../grid';

// Special workaround for CE Application
// This is a copy-paste of the grid constructor without inheritance from the custom HTML element

function GridCE(dom, options) {
	const self = this;
	this.eventCallbacks = new WeakMap();
	this.dom = dom;
	this.settings = {
		frozenColumns: 0,
		indexHead: [],
		indexRows: [],
		selectedRows: [],
		get focusedCell() {
			return this._focusedCell;
		},
		set focusedCell(next) {
			const prev = this._focusedCell;

			if (prev === next) {
				self.view.showMessageActiveCell();
				return;
			}
			const setNextFocusedCell = () => {
				this._focusedCell = next;
				if (next && next.editing) {
					this._focusedCell.editing = false;
					const rowId = next.rowId;
					const headId = next.headId;
					const value = self.rows.get(rowId)[headId];
					const type = self._getEditorType(headId, rowId, value, self);

					next.editing =
						self.view.defaultSettings.editable &&
						self.checkEditAvailability(next.headId, next.rowId, self) &&
						type !== 'nonEditable';
				}
			};

			if (prev && prev.editing) {
				const applyEdit = function (value) {
					const linkProperty = self.head.get(prev.headId, 'linkProperty');
					const propName = self.head.get(prev.headId, 'name') || prev.headId;
					const dataId =
						(linkProperty && self.rows.get(prev.rowId, linkProperty)) ||
						prev.rowId;

					self.dom.dispatchEvent(
						new CustomEvent('applyEdit', {
							detail: {
								headId: prev.headId,
								rowId: prev.rowId,
								value: value,
								dataId: dataId,
								propName: propName
							}
						})
					);
					setNextFocusedCell();
				};
				const validatorResult = self.view.validator();
				if (!validatorResult.willValidate) {
					applyEdit(validatorResult.value);
				} else {
					validatorResult
						.willValidate(validatorResult.value)
						.then(applyEdit)
						.catch(function (error) {
							const showTooltip =
								!error.name || error.name !== 'ComponentValidationError';
							self.dom.dispatchEvent(
								new CustomEvent('notValidEdit', {
									detail: {
										headId: prev.headId,
										rowId: prev.rowId,
										message: showTooltip && error,
										value: self.view.validator().value
									}
								})
							);
						});
				}
				return;
			}

			setNextFocusedCell();
			self.render();
		},
		get orderBy() {
			return this._orderBy ? this._orderBy.slice() : [];
		},
		set orderBy(next) {
			this._orderBy = next;
			self.sort().then(self.render.bind(self));
		}
	};
	this.initialization(options);
}

GridCE.prototype = Grid.prototype;

export default GridCE;
