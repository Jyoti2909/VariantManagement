import GridView from '../view';

// Special workaround for CE Application
// This is a copy-paste of the GridView constructor as function instead of ES6 class

function GridViewCE(dom, options) {
	this.delayForDragDetection = 200;

	this._resizeWindowHandler = () => {
		this._checkRowHeight();
		this.render(this.data);
	};

	this.dom = dom;
	this.defaultSettings = {
		rowHeight: 32,
		headWidth: 18,
		multiSelect: true,
		resizable: true,
		search: false,
		editable: false,
		sortable: true,
		freezableColumns: false,
		draggableColumns: true
	};
	Object.assign(this.defaultSettings, options || {});

	this.readerIds = {};

	this.initialization();
	this._createLayout();
	this.handlers = [
		{
			target: this.bodyBoundary,
			action: 'scroll',
			handler: this._scrollHandler.bind(this)
		},
		{
			target: this.header,
			action: 'mousedown',
			handler: this._resizeHandler.bind(this)
		},
		{
			target: this.header,
			action: 'click',
			handler: this._sortHandler.bind(this)
		},
		{
			target: this.header,
			action: 'focusin',
			handler: this._focusInHeadHandler.bind(this)
		},
		{
			target: this.body,
			action: 'mousedown',
			handler: this._mouseDownHandler.bind(this)
		},
		{
			target: this.dom,
			action: 'focusout',
			handler: this._focusoutHandler.bind(this)
		},
		{
			target: window,
			action: 'resize',
			handler: this._resizeWindowHandler
		}
	];

	if (this.defaultSettings.draggableColumns) {
		this.handlers.push({
			target: this.header,
			action: 'mousedown',
			handler: this._detectColumnDragAction.bind(this)
		});
	}

	if (this.defaultSettings.freezableColumns) {
		this.handlers = this.handlers.concat([
			{
				target: this.dom,
				action: 'mousedown',
				handler: this._freezeColumnsHandler.bind(this)
			},
			{
				target: this.frozenBodyBoundary,
				action: 'wheel',
				handler: this._frozenScrollHandler.bind(this)
			},
			{
				target: this.body,
				action: 'mouseover',
				handler: this._hoverRow.bind(this)
			},
			{
				target: this.body,
				action: 'mouseleave',
				handler: this._hoverRow.bind(this)
			}
		]);
	}
}

GridViewCE.prototype = GridView.prototype;

export default GridViewCE;
