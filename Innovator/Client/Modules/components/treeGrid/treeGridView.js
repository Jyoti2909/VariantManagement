import GridView from '../grid/view';
import treeGridTemplates from './treeGridTemplates';

class TreeGridView extends GridView {
	constructor(dom, options) {
		super(dom, options);
		this.defaultSettings.levelPaddingMultiplier = 18;
		this.handlers.push({
			target: this.body,
			action: 'animationend',
			handler: this._animationEnd.bind(this)
		});
	}
	initialization() {
		this.templates = treeGridTemplates();
	}
	_animationEnd(e) {
		if (this.debounceTimeout) {
			return;
		}
		this.debounceTimeout = setTimeout(
			function () {
				this._render();
				this.debounceTimeout = false;
			}.bind(this),
			0
		);
	}
	_mouseDownHandler(e) {
		const targetClasslist = e.target.classList;
		if (
			targetClasslist.contains('aras-treegrid-expand-button') &&
			!targetClasslist.contains('aras-icon-loading')
		) {
			const row = e.target.closest('.aras-grid-row');
			const toggledRowIdx = +row.dataset.index;
			const expandEvent = new CustomEvent('expand', {
				detail: {
					index: toggledRowIdx
				}
			});

			this.toggledRange = {
				startId: this.data.settings.indexRows[toggledRowIdx],
				startIdx: toggledRowIdx,
				indexRowsLength: this.data.settings.indexRows.length
			};
			this.dom.dispatchEvent(expandEvent);
			return;
		}
		const parentMethod = GridView.prototype._mouseDownHandler;
		parentMethod.call(this, e);
	}
	_getRowsForRender(firstRow, rowsCount) {
		const parentMethod = GridView.prototype._getRowsForRender;
		const rowsForRender = parentMethod.call(this, firstRow, rowsCount);
		let startAnimationIdx;
		let endAnimationIdx;
		let lengthDiff;
		if (
			this.toggledRange &&
			this.data.settings.indexRows[this.toggledRange.startIdx] ===
				this.toggledRange.startId
		) {
			lengthDiff = Math.abs(
				this.data.settings.indexRows.length - this.toggledRange.indexRowsLength
			);
			startAnimationIdx = this.toggledRange.startIdx;
			endAnimationIdx = this.toggledRange.startIdx + lengthDiff;
		} else {
			this.toggledRange = null;
		}
		rowsForRender.forEach(function (rowData, idx) {
			const rowId = this.data.settings.indexRows[rowData.index];
			Object.assign(rowData, this.data.metadata[rowId]);
			if (
				this.toggledRange &&
				rowData.index > startAnimationIdx &&
				rowData.index <= endAnimationIdx
			) {
				rowData.animations = 'aras-grid-row-animated-toggle';
			}
			if (
				rowData.data.children === true &&
				this.data.settings.expanded.has(rowId)
			) {
				rowData.loading = 'loading';
			}
			rowData.expanded = this.data.settings.expanded.has(rowId);
		}, this);
		if (this.toggledRange && lengthDiff) {
			this.toggledRange = null;
		}
		return rowsForRender;
	}
	_getHeadForRender(firstHead, headCount) {
		const headForRender = GridView.prototype._getHeadForRender.call(
			this,
			firstHead,
			headCount
		);
		const treeHeadView = this.data.settings.treeHeadView;
		if (this.data.head.get(treeHeadView)) {
			headForRender.find(function (head) {
				if (head.id === this.data.settings.treeHeadView) {
					head.treeHeadView = true;
					return true;
				}
			}, this);
		} else if (this.data.settings.indexHead[0] === headForRender[0].id) {
			headForRender[0].treeHeadView = true;
		}

		return headForRender;
	}
}

export default TreeGridView;
