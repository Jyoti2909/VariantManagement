import Grid from '../grid/grid';
import TreeGridView from './treeGridView';
import TreeGridActions from './treeGridActions';
import Keyboard from '../grid/keyboard';

/**
 * TreeGrid Commonent
 *
 * @class
 * @name TreeGrid
 * @extends Grid
 * @param {object}   dom Dom Element used as container
 * @param {object} options
 * @param {boolean} [options.multiSelect=true] options.multiSelect - enable/disable multi select
 * @param {boolean} [options.resizable=true] options.resizable - enable/disable resize of columns
 * @param {boolean} [options.search=true] options.search - show/hide simple search
 * @param {boolean} [options.editable=false] options.editable - enable/disable edit cell
 * @param {boolean} [options.sortable=true] options.sortable - enable/disable sort columns
 *
 * @property {Map} head - Data of heads grid which store in Grid. Returns wrapper on Map on get method for calls render grid after any changes.
 * @property {Map} rows - Data of rows grid which store in Grid. Returns wrapper on Map on get method for calls render grid after any changes.
 * @property {Set} roots - Roots ids
 *
 * @property {object} settings - grid state
 * @property {string[]} settings.selectedRows - ids of selected rows
 * @property {{headId: string, rowId: string, editing: boolean}} settings.focusedCell - focus cell object
 * @property {{headId: string, desc: boolean}[]} settings.orderBy - sortable heads array
 */
class TreeGrid extends Grid {
	metadata = {};
	constructor(dom, options) {
		super(dom, options);
		this.settings.indexTreeRows = {};
		this.settings.expanded = new Set();
		const self = this;
		Object.defineProperty(this.settings, 'treeHeadView', {
			get: function () {
				return this._treeHeadView;
			},
			set: function (treeHeadView) {
				this._treeHeadView = treeHeadView;
				self.render();
			}
		});
		Object.freeze(this.settings.expanded);
		this.actions = new TreeGridActions(this);
	}
	/**
	 * The first initialization of Grid. Create view, action, keyboard classes and set options
	 *
	 * @memberof TreeGrid.prototype
	 * @override
	 */
	initialization(options) {
		this.view = new TreeGridView(this, options);
		this.keyboard = new Keyboard(this);
	}
	get roots() {
		return this.settings.indexTreeRows.roots || [];
	}
	set roots(value) {
		this.settings.indexTreeRows = { roots: value };
		const indexTreeRows = this.settings.indexTreeRows;
		if (this.rows) {
			this.rows._store.forEach(function (child, key) {
				if (child.children && child.children !== true) {
					indexTreeRows[key] = child.children.slice();
				}
			});

			if (this.settings.orderBy.length) {
				this.sort();
			} else {
				this.metadata = this.actions._calcRowsMetadata(indexTreeRows);
			}
		}
		this.settings.indexRows = value.slice();
		this.render();
	}
	/**
	 * Implementation of lazy loading branches
	 *
	 * @private
	 * @param   {string} rowId - row id
	 * @returns {Promise.<boolean>}  - end of operation. Promise(true) means that row has no children.
	 */
	async _buildBranchData(rowId) {
		const loadedItems = await this.loadBranchDataHandler(rowId);
		if (!loadedItems) {
			const row = this.rows.get(rowId);
			delete row.children;
			this.rows.set(rowId, row);
			delete this.settings.indexTreeRows[rowId];
			return true;
		}

		const parentRow = this.rows._store.get(rowId);
		parentRow.children = [];
		loadedItems.forEach((item, key) => {
			parentRow.children.push(key);
			this.rows._store.set(key, item);
		});
		this.settings.indexTreeRows[rowId] = parentRow.children.slice();
		if (this.settings.orderBy.length) {
			this.settings.indexTreeRows[rowId].sort(this.actions._sortFn.bind(this));
		}
		const branchMetadata = this.actions._calcRowsMetadata(
			this.settings.indexTreeRows,
			rowId
		);

		Object.assign(this.metadata, branchMetadata);
		return false;
	}
	/**
	 * Handler which implement logic of lazy loading branches
	 *
	 * @memberof TreeGrid.prototype
	 * @returns {Promise.<Map>} - end of operation with data.
	 */
	loadBranchDataHandler() {
		return Promise.resolve();
	}
	/**
	 * Expand branch
	 *
	 * @memberof TreeGrid.prototype
	 * @param   {string} rowId - row id
	 * @returns {Promise}  - end of operation
	 */
	async expand(rowId) {
		if (rowId !== undefined && !this.settings.expanded.has(rowId)) {
			return await this.actions._toggleExpanded(rowId);
		}
	}
	/**
	 * Expand multiple branches
	 *
	 * @memberof TreeGrid.prototype
	 * @param    {Array} rowIds - an array of row ids
	 * @returns  {Promise} - end of operation
	 */
	async expandBranches(rowIds = [...this.rows._store.keys()]) {
		const settings = this.settings;

		for (const rowId of rowIds) {
			const row = this.rows.get(rowId) || {};
			if (
				settings.expanded.has(rowId) ||
				!row.children ||
				row.children === true
			) {
				continue;
			}

			settings.expanded.add(rowId);
		}

		settings.indexRows = this.actions._calcIndexRows();
		await this.render();
	}
	/**
	 * Collapse branch
	 *
	 * @memberof TreeGrid.prototype
	 * @param   {string} rowId - row id
	 * @returns {Promise} - end of operation
	 */
	async collapse(rowId) {
		if (rowId !== undefined && this.settings.expanded.has(rowId)) {
			return await this.actions._toggleExpanded(rowId);
		}
	}
	/**
	 * Standard logic of sorting
	 *
	 * @private
	 * @returns {Promise} - the end of operation
	 */
	_sort() {
		const sortFn = this.actions._sortFn.bind(this);
		const indexTreeRows = this.settings.indexTreeRows;
		Object.values(indexTreeRows).forEach((row) => row.sort(sortFn));
		this.settings.indexRows = this.actions._calcIndexRows(
			this.settings.indexRows
		);
		this.metadata = this.actions._calcRowsMetadata(indexTreeRows);
		return Promise.resolve();
	}
}

export default TreeGrid;
