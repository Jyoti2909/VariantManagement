import GridActions from '../actions';

// Special workaround for CE Application
// This is a copy-paste of the GridActions constructor as function instead of ES6 class

function GridActionsCE(grid) {
	this.handlers = [];

	this.grid = grid;

	this._addHandlers([
		{
			target: this.grid.dom,
			action: 'resizeHead',
			handler: this._resizeHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'selectRow',
			handler: this._selectHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'focusCell',
			handler: this._focusHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'applyEdit',
			handler: this._applyEditHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'notValidEdit',
			handler: this._notValidEditHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'cancelEdit',
			handler: this._cancelEditHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'moveHead',
			handler: this._moveHeadHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'sort',
			handler: this._sortHandler.bind(this)
		},
		{
			target: this.grid.dom,
			action: 'freezeColumns',
			handler: this._freezeColumnsHandler.bind(this)
		}
	]);
}

GridActionsCE.prototype = GridActions.prototype;

export default GridActionsCE;
