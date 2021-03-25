import utils from '../../core/utils';

function HeadWrap(Map, grid) {
	this._store = Map;
	this._grid = grid;
	this._array = 'indexHead';
}

HeadWrap.prototype = {
	constructor: HeadWrap,

	get: function (key, prop) {
		const v = this._store.get(key);
		if (v) {
			if (prop) {
				return v[prop];
			}
			return utils.mixin({}, v);
		}
	},
	set: function (key, value, prop) {
		if (!this._store.has(key)) {
			this._grid.settings[this._array].push(key);
			this._store.set(key, value);
		} else if (prop !== undefined) {
			const head = this._store.get(key);
			head[prop] = value;
		} else {
			this._store.set(key, value);
		}
		this._grid.render();
	},
	has: function (key) {
		return this._store.has(key);
	},
	delete: function (key) {
		const array = this._grid.settings[this._array];
		const index = array.indexOf(key);
		if (index > -1) {
			array.splice(index, 1);
			this._grid.render();
		}

		const selectIndex = this._grid.settings.selectedRows.indexOf(key);
		if (selectIndex > -1) {
			this._grid.settings.selectedRows.splice(selectIndex, 1);
			this._grid.render();
		}

		const focusedCell = this._grid.settings.focusedCell;
		if (
			focusedCell &&
			focusedCell.editing &&
			(focusedCell.rowId === key || focusedCell.headId === key)
		) {
			this._grid.cancelEdit();
		}

		this._store.delete(key);
	}
};

function RowsWrap(Map, grid) {
	this._store = Map;
	this._grid = grid;
	this._array = 'indexRows';
}

RowsWrap.prototype = Object.assign(Object.create(HeadWrap.prototype), {
	constructor: RowsWrap
});

export { HeadWrap, RowsWrap };
