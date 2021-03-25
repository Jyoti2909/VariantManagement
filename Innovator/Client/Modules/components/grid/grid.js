import { HeadWrap, RowsWrap } from './utils';
import GridActions from './actions';
import GridView from './view';
import Keyboard from './keyboard';
import { getSorter } from './sorters';
import HTMLCustomElement from '../htmlCustomElement';
/**
 * Grid Component
 *
 * @class
 * @name Grid
 * @param {object}   dom Dom Element used as container
 * @param {object} options
 * @param {boolean} [options.multiSelect=true] options.multiSelect - enable/disable multi select
 * @param {boolean} [options.resizable=true] options.resizable - enable/disable resize of columns
 * @param {boolean} [options.search=false] options.search - show/hide simple search
 * @param {boolean} [options.editable=false] options.editable - enable/disable edit cell
 * @param {boolean} [options.sortable=true] options.sortable - enable/disable sort columns
 * @param {boolean} [options.freezableColumns=false] options.freezableColumns - enable/disable freeze of columns
 *
 * @property {Map<string, object>} head - Data of heads grid which store in Grid. Returns wrapper on Map on get method for calls render grid after any changes.
 * @property {string} key - unique column identificator.
 * @property {object} headObject
 * @property {string} headObject.name - link on property value from grid rows data.
 * @property {string} headObject.linkProperty - name of property that refers to data from grid rows.
 *
 * @property {Map} rows - Data of rows grid which store in Grid. Returns wrapper on Map on get method for calls render grid after any changes.
 *
 * @property {object} settings - grid state
 * @property {number} settings.frozenColumns - amount of frozen columns
 * @property {string[]} settings.selectedRows - ids of selected rows
 * @property {{headId: string, rowId: string, editing: boolean}} settings.focusedCell - focus cell object
 * @property {{headId: string, desc: boolean}[]} settings.orderBy - sortable heads array
 */

class Grid extends HTMLCustomElement {
	eventCallbacks = new WeakMap();
	constructor(dom, options) {
		const customElement = dom instanceof HTMLCustomElement;
		super(customElement ? dom : undefined);

		const self = this;
		this.dom = customElement ? null : dom;

		if (dom && !dom.appendChild) {
			this.dom = null;
			options = dom;
		}
		if (dom && dom.parentNode) {
			this.dom = this;
			dom.parentNode.replaceChild(this, dom);

			const id = dom.id;
			if (id) {
				this.id = id;
			}
			const className = dom.className;
			if (className) {
				this.className = className;
			}
			const style = dom.getAttribute('style');
			if (style) {
				this.setAttribute('style', style);
			}
		} else if (this.dom && this.dom.appendChild) {
			console.warn(
				"Container for the grid wasn't connected to DOM or doesn't have a parent."
			);
		}

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
		if (this.dom) {
			this.initialization(options);
		}
	}

	connectedCallback() {
		if (!this.dom) {
			this.dom = this;
			this.initialization(this.options);
			this.render();
		}
	}

	disconnectedCallback() {
		this.view.destroyEventHandlers();
	}

	/**
	 * The first initialization of Grid.
	 * Create view, action, keyboard classes and set options
	 *
	 * @protected
	 * @param {object} options Options object from Grid constructor
	 */
	initialization(options) {
		this.view = new GridView(this.dom, options);
		this.actions = new GridActions(this);
		this.keyboard = new Keyboard(this);
	}

	get head() {
		return this._head;
	}
	set head(value) {
		this._head = new HeadWrap(value, this);
		const array = [];
		value.forEach(function (val, id) {
			array.push(id);
		});
		this.settings.indexHead = array;
		this.render();
	}

	get rows() {
		return this._rows;
	}
	set rows(value) {
		this._rows = new RowsWrap(value, this);
		const array = [];
		value.forEach(function (val, id) {
			array.push(id);
		});
		this.settings.indexRows = array;
		this.render();
	}
	/**
	 * Private method of get cell type for formatter
	 *
	 * @private
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {*} value - Cell value
	 * @returns {string} - return a type of Cell
	 */
	_getNativeCellType(headId, itemId, value) {
		let type = 'text';

		if (typeof value === 'boolean') {
			type = 'boolean';
		}

		return type;
	}
	/**
	 * Method which calls public getCellType method or private if the return getCellType is empty
	 *
	 * @private
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {*} value - Cell value
	 * @param   {Grid} grid - Grid instance
	 * @param   {string} rowId - Id of a row (id of an item that is considered "main" for the row)
	 * @returns {string} - return a type of Cell
	 */
	_getCellType(headId, itemId, value, grid, rowId) {
		const nativeType = this._getNativeCellType(headId, itemId, value);

		return (
			this.getCellType(headId, itemId, value, nativeType, rowId) || nativeType
		);
	}
	/**
	 * Handler which get cell Type for call special formatter
	 *
	 * @public
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {*} value - Cell value
	 * @param   {string} type - a type which calculated by grid
	 * @param   {string} rowId - Id of a row (id of an item that is considered "main" for the row)
	 * @returns {string} - return a type of Cell
	 */
	getCellType(headId, itemId, value, type, rowId) {
		return type;
	}
	/**
	 * Handler which get cell Styles
	 *
	 * @public
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @returns {Object} - return a styles of Cell
	 */
	getCellStyles(headId, itemId) {
		return {};
	}
	/**
	 * Grid method which calculate a edit type cell for calls special editor
	 *
	 * @private
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {*} value - Cell value
	 * @param   {Grid} grid - Grid instance
	 * @param   {string} rowId - Id of a row (id of an item that is considered "main" for the row)
	 * @returns {string} - return a type of Cell
	 */
	_getEditorType(headId, itemId, value, grid, rowId) {
		const type = this._getCellType(headId, itemId, value, grid, rowId);
		if (type === 'boolean' || type === 'file') {
			return 'nonEditable';
		}

		return this.getEditorType(headId, itemId, value, type, rowId) || type;
	}
	/**
	 * Handler which get cell Type for call special editor
	 * By default calls getCellType
	 *
	 * @public
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {*} value - Cell value
	 * @param   {string} type - a type which calculated by grid
	 * @param   {string} rowId - Id of a row (id of an item that is considered "main" for the row)
	 * @returns {string} - return a type of Cell
	 */
	getEditorType(headId, itemId, value, type, rowId) {
		return type;
	}
	/**
	 * Handler which check a editable of a Cell
	 *
	 * @public
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {Grid} grid - instance of Grid
	 * @returns {boolean} - can a cell be edited or not
	 */
	checkEditAvailability(headId, itemId, grid) {
		return true;
	}
	/**
	 * Handler which calculating metadata for a cell
	 * By default returns null
	 *
	 * @public
	 * @param   {string} headId - Head id
	 * @param   {string} itemId - Id of an item which the cell belongs to. Is used as a key in rows store. Could be different from rowId, if item has a linkProperty pointing to another item
	 * @param   {string} type - Cell type which was calculated by grid
	 * @returns {?Object} - metadata object for editors or formatters
	 */
	getCellMetadata(headId, itemId, type) {
		return null;
	}
	/**
	 * Standard logic of sorting
	 *
	 * @private
	 * @param   {{string}[]} sortableArray - array of row ids
	 * @returns {Promise} - the end of operation
	 */
	async _sort(sortableArray) {
		const orderBy = this.settings.orderBy;
		const sortHandlers = orderBy.reduce((map, sortInfo) => {
			const headId = sortInfo.headId;
			const dataType = this.head.get(headId, 'dataType');
			const linkProperty = this.head.get(headId, 'linkProperty');
			const propertyName = this.head.get(headId, 'name') || headId;
			const valuesMap = sortableArray.reduce((map, rowId) => {
				if (linkProperty) {
					rowId = this.rows.get(rowId, linkProperty);
				}
				return map.set(rowId, this.rows.get(rowId, propertyName));
			}, new Map());

			const sorter = getSorter(dataType);
			const metadata = this.getCellMetadata(headId, sortableArray[0], dataType);

			return map.set(headId, sorter(headId, valuesMap, metadata, this));
		}, new Map());

		sortableArray.sort((a, b) => {
			let firstSortedRow;
			let secondSortedRow;
			for (let i = 0; i < orderBy.length; i++) {
				firstSortedRow = a;
				secondSortedRow = b;
				const headId = orderBy[i].headId;
				const reverse = orderBy[i].desc;
				const linkProperty = this.head.get(headId, 'linkProperty');
				if (linkProperty) {
					firstSortedRow = this.rows.get(a, linkProperty);
					secondSortedRow = this.rows.get(b, linkProperty);
				}
				const result = sortHandlers.get(headId)(
					firstSortedRow,
					secondSortedRow,
					reverse
				);
				if (result !== 0) {
					return result;
				}
			}
			return 0;
		});
	}
	/**
	 * Standard logic of sorting
	 *
	 * @public
	 * @returns {Promise} - the end of operation
	 */
	sort() {
		return this._sort(this.settings.indexRows);
	}
	/**
	 * Cancel edit operation
	 *
	 * @public
	 */
	cancelEdit() {
		if (!this.settings._focusedCell) {
			return;
		}

		this.settings._focusedCell = Object.assign({}, this.settings._focusedCell, {
			editing: false,
			valid: true,
			toolTipMessage: ''
		});
		this.view.showMessageActiveCell();
		this.render();
	}
	/**
	 * Handler which return a css class name of Row
	 *
	 * @public
	 * @param   {string} rowId - id of Row
	 * @returns {string} - CSS class name
	 */
	getRowClasses(rowId) {
		return '';
	}
	/**
	 * Start render of Grid
	 *
	 * @public
	 * @returns {Promise} - end of operation
	 */
	async render() {
		if (!this.view) {
			return;
		}
		return this.view.render(this);
	}

	/**
	 * Resize column event
	 *
	 * @event resizeHead
	 * @type {object}
	 * @property {number} index - index a head
	 */

	/**
	 * Select row event
	 *
	 * @event selectRow
	 * @type {object}
	 * @property {number} index - index a row
	 */

	/**
	 * Focus Cell event. If detail is null it is mean out focus
	 *
	 * @event focusCell
	 * @type {object}
	 * @property {number} indexHead - index a head
	 * @property {number} indexRow - index a row
	 */

	/**
	 * Apply editing value in Grid
	 *
	 * @event applyEdit
	 * @type {object}
	 * @property {string} rowId - row id
	 * @property {string} headId - head id
	 * @property {*} value - new value
	 */

	/**
	 * Cancel edit in Grid
	 *
	 * @event cancelEdit
	 * @type {object}
	 */

	/**
	 * Drag and drop column
	 *
	 * @event moveHead
	 * @type {object}
	 * @property {number} startIndex - index a head from
	 * @property {number} endIndex - index a head to
	 */

	/**
	 * Sorting event
	 *
	 * @event sort
	 * @type {object}
	 * @property {number} index - index a head
	 * @property {boolean} ctrlKey - ctrlKey is pressed for multi sorting
	 */

	/**
	 * Invaid value event
	 *
	 * @event notValidEdit
	 * @type {object}
	 * @property {string} message - the warning message provided by validation function
	 */

	/**
	 * Freeze columns event
	 *
	 * @event freezeColumns
	 * @type {object}
	 * @property {number} freeze - the index of the last frozen column
	 */

	/**
	 * Add listener for operation
	 *
	 * @public
	 * @param   {string} type - type of event
	 * @param   {function(headId, rowId, event)} callback - callback on event
	 * @param   {string} element  - 'row' or 'cell' or 'head' for native dom event only
	 */
	on(type, callback, element) {
		if (!element) {
			return this.dom.addEventListener(type, callback);
		}
		const callbackFunc = function (e) {
			const params = getCallbackParams(this, e.target, element);
			if (params && params.type === element) {
				callback.apply(this, params.ids.concat(e));
			}
		}.bind(this);

		this.eventCallbacks.set(callback, callbackFunc);
		this.dom.addEventListener(type, callbackFunc);
	}
	/**
	 * Remove listener for operation
	 *
	 * @public
	 * @param {string} type - event type
	 * @param {function(event, headId, rowId)} callback - callback function
	 */
	off(type, callback) {
		this.dom.removeEventListener(
			type,
			this.eventCallbacks.get(callback) || callback
		);
		if (this.eventCallbacks.has(callback)) {
			this.eventCallbacks.delete(callback);
		}
	}
}

function getCallbackParams(gridInstance, node, type) {
	let headId;
	const cell =
		node.closest('th.aras-grid-head-cell') ||
		node.closest('td.aras-grid-row-cell');

	const focusedCell = gridInstance.settings.focusedCell;
	if (
		focusedCell &&
		(node.closest('.aras-grid-active-cell') ||
			(type === 'cell' && focusedCell.rowId !== 'searchRow'))
	) {
		return {
			ids: [focusedCell.headId, focusedCell.rowId],
			type: 'cell'
		};
	}

	if (cell) {
		if (cell.dataset.index !== undefined) {
			headId = gridInstance.settings.indexHead[cell.dataset.index];
			return { ids: [headId], type: 'head' };
		}
		const frozen = cell.closest('.aras-grid-body-boundary_frozen');
		const frozenClassName = '.aras-grid-header-boundary_frozen';
		const selector = frozen
			? `${frozenClassName} `
			: `:not(${frozenClassName}) > `;
		const headGrid = gridInstance.dom.querySelector(
			selector + '.aras-grid-head'
		);
		const headCell = headGrid.children[0].children[cell.cellIndex];
		headId = gridInstance.settings.indexHead[headCell.dataset.index];
	}

	const row = node.closest('tr.aras-grid-row');
	if (!row) {
		return;
	}
	const rowId = gridInstance.settings.indexRows[row.dataset.index];
	const isRowAndCell = type !== 'row' && headId !== undefined;
	return {
		ids: isRowAndCell ? [headId, rowId] : [rowId],
		type: isRowAndCell ? 'cell' : 'row'
	};
}

export default Grid;
