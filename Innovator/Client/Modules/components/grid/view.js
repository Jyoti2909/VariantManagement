import gridTemplates from './templates';
import gridEditors from './editors';

import getTooltipPosition, { getTextWidth } from '../tooltipUtils';
const TDBorderHeight = 1; // 1 is a TD border height, that cannot be calculated via getcomputedStyle or something

class GridView {
	delayForDragDetection = 200;
	_oldDevicePixelRatio;
	_tooltipParams;

	_resizeWindowHandler = () => {
		this._checkRowHeight();
		this.render(this.data);
	};

	constructor(dom, options) {
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
			draggableColumns: true,
			tooltipDelay: 1000
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
			},
			{
				target: this.body,
				action: 'mouseover',
				handler: this._hoverRow.bind(this)
			},
			{
				target: this.body,
				action: 'mouseleave',
				handler: this._mouseleaveHandler.bind(this)
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
					handler: this._frozenScrollHandler.bind(this),
					options: { passive: true }
				}
			]);
		}
	}

	get scrollableElement() {
		return this.bodyBoundary;
	}

	destroyEventHandlers() {
		window.removeEventListener('resize', this._resizeWindowHandler);
	}

	initialization() {
		this.templates = gridTemplates();
	}

	_createLayout() {
		this.dom.classList.add('aras-grid');
		this.dom.setAttribute('role', 'grid');

		this.reader = HyperHTMLElement.wire()`<div style="width: 0; height: 0; position: absolute; top: 50%; left: 50%;" />`;

		this.header = document.createElement('div');
		this.header.className = 'aras-grid-header';

		this.headerBoundary = document.createElement('div');
		this.headerBoundary.className = 'aras-grid-header-boundary';

		this.body = document.createElement('div');
		this.body.className = 'aras-grid-body';
		this.body.tabIndex = 0;

		this.tooltip = document.createElement('div');
		this.tooltip.className = 'aras-tooltip-block aras-grid-tooltip';

		this.bodyBoundary = document.createElement('div');
		this.bodyBoundary.className = 'aras-grid-body-boundary';

		this.scroller = document.createElement('div');
		this.scroller.className = 'aras-grid-scroller';

		this.activeCell = document.createElement('div');
		this.activeCell.className = 'aras-grid-active-cell';

		this.resizeLine = document.createElement('div');
		this.resizeLine.className = 'aras-grid-resize-line';

		this.ddline = document.createElement('div');
		this.ddline.className = 'aras-grid-ddline';

		this.ddcontainer = document.createElement('div');
		this.ddcontainer.className = 'aras-grid-ddcontainer';

		if (this.defaultSettings.freezableColumns) {
			this.frozenHeaderBoundary = document.createElement('div');
			this.frozenHeaderBoundary.className =
				'aras-grid-header-boundary aras-grid-header-boundary_frozen';

			this.frozenBodyBoundary = document.createElement('div');
			this.frozenBodyBoundary.className =
				'aras-grid-body-boundary aras-grid-body-boundary_frozen';

			this.frozenScroller = document.createElement('div');
			this.frozenScroller.className = 'aras-grid-scroller';

			this.freezer = document.createElement('div');
			this.freezer.className = 'aras-grid-freezer';

			this.header.appendChild(this.frozenHeaderBoundary);

			this.body.appendChild(this.frozenBodyBoundary);
			this.frozenBodyBoundary.appendChild(this.frozenScroller);
		}

		this.header.appendChild(this.headerBoundary);

		this.body.appendChild(this.bodyBoundary);
		this.body.appendChild(this.reader);
		this.body.appendChild(this.tooltip);

		this.bodyBoundary.appendChild(this.scroller);
	}
	_addHandlers() {
		this.handlers.forEach(function (item) {
			item.target.addEventListener(item.action, item.handler, item.options);
		});
	}
	_setScrollSize() {
		const settings = this.data.settings;
		const commonWidth = this._getHeadRangeWidth(
			settings.frozenColumns,
			settings.indexHead.length
		);

		const scrollerHeight = Math.max(
			settings.indexRows.length * this._realRowHeight + TDBorderHeight,
			TDBorderHeight
		);
		this.scroller.style.height = scrollerHeight + 'px';
		this.scroller.style.width = commonWidth + 'px';

		if (this.defaultSettings.freezableColumns) {
			const frozenWidth = this._getHeadRangeWidth(0, settings.frozenColumns);

			this.frozenScroller.style.height = scrollerHeight + 'px';
			this.frozenScroller.style.width = frozenWidth + 'px';
			this.frozenHeaderBoundary.style.width = frozenWidth + 'px';
		}
	}
	_getRowsCount() {
		return Math.ceil(this.bodyBoundary.clientHeight / this._realRowHeight) + 1;
	}
	_getHeadCount(firstHead) {
		const length = this.data.settings.indexHead.length;
		const frozenViewportWidth = this._getHeadRangeWidth(
			0,
			this.data.settings.frozenColumns
		);
		let neededWidth =
			this.dom.clientWidth -
			frozenViewportWidth +
			this._getHeadWidth(firstHead);
		let i;
		for (i = firstHead; i < length; i++) {
			if (neededWidth <= 0) {
				break;
			}
			neededWidth -= this._getHeadWidth(i);
		}
		return i - firstHead;
	}
	_findFirstRow() {
		let firstRow = (this.bodyBoundary.scrollTop / this._realRowHeight) | 0;
		firstRow = firstRow % 2 ? firstRow - 1 : firstRow;
		return firstRow;
	}
	_findFirstHead() {
		let i = this.data.settings.frozenColumns;
		let width = 0;
		while (width <= this.bodyBoundary.scrollLeft) {
			width += this._getHeadWidth(i);
			i++;
		}
		return i - 1;
	}
	_correctCacheAfterScroll(cache) {
		let delta = this.bodyBoundary.scrollLeft - cache.viewportTranslateX;
		let firstHeadWidth = this._getHeadWidth(cache.firstHead);

		if (delta > 0) {
			while (delta > firstHeadWidth) {
				delta -= firstHeadWidth;
				cache.firstHead++;
				firstHeadWidth = this._getHeadWidth(cache.firstHead);
			}
		} else {
			while (delta < 0) {
				cache.firstHead--;
				firstHeadWidth = this._getHeadWidth(cache.firstHead);
				delta += firstHeadWidth;
			}
		}

		cache.viewportTranslateX = this.bodyBoundary.scrollLeft - delta;
		cache.prevScrollLeftPosition = this.bodyBoundary.scrollLeft;
	}
	_getRowsForRender(firstRow, rowsCount) {
		const rowsForRender = [];
		const maxRowsCount = Math.min(
			firstRow + rowsCount,
			this.data.settings.indexRows.length
		);
		const selectedRows = new Set(this.data.settings.selectedRows);
		for (let i = firstRow; i < maxRowsCount; i++) {
			const id = this.data.settings.indexRows[i];
			const row = this.data.rows._store.get(id);
			rowsForRender.push({
				index: i,
				id: id,
				selected: selectedRows.has(id),
				data: row || {},
				hovered: this.defaultSettings.freezableColumns
					? i === this._hoveredIndex
					: null
			});
		}
		return rowsForRender;
	}
	_getHeadForRender(firstHead, headCount) {
		const headForRender = [];
		const length = Math.min(
			firstHead + headCount,
			this.data.settings.indexHead.length
		);
		for (let i = firstHead; i < length; i++) {
			const id = this.data.settings.indexHead[i];
			const sortIndex = this.data.settings.orderBy.findIndex(
				(order) => order.headId === id
			);
			const sort =
				sortIndex === -1
					? null
					: {
							index: sortIndex + 1,
							desc: this.data.settings.orderBy[sortIndex].desc
					  };
			const head = {
				index: i,
				id: id,
				sort,
				data: this.data.head._store.get(id) || {}
			};
			headForRender.push(head);
		}
		return headForRender;
	}
	_getHeadRangeWidth(from, to) {
		let width = 0;
		for (let i = from; i < to; i++) {
			width += this._getHeadWidth(i);
		}

		return width;
	}
	_getHeadWidth(index) {
		const settings = this.data.settings;
		const head = this.data.head._store.get(settings.indexHead[index]);
		return head && head.width ? head.width : this.defaultSettings.headWidth;
	}
	_getViewportStyle(viewportTranslateX, viewportTranslateY, viewportWidth) {
		return {
			width:
				typeof viewportWidth === 'string'
					? viewportWidth
					: `${viewportWidth}px`,
			transform:
				'translate3d(' +
				viewportTranslateX +
				'px, ' +
				viewportTranslateY +
				'px, 0)'
		};
	}
	_getHeadStyle(viewportTranslateX, viewportWidth) {
		return {
			width: `${viewportWidth}px`,
			transform:
				'translate3d(' +
				(viewportTranslateX - this.bodyBoundary.scrollLeft) +
				'px, 0, 0)'
		};
	}
	_scrollToHead(indexHead) {
		if (indexHead < this.data.settings.frozenColumns) {
			return;
		}

		const cellLeftPosition = this._getHeadRangeWidth(
			this.data.settings.frozenColumns,
			indexHead
		);
		const cellRightPosition =
			cellLeftPosition +
			this._getHeadWidth(indexHead) -
			this.bodyBoundary.clientWidth;
		const result = (this.bodyBoundary.scrollLeft = Math.max(
			cellRightPosition,
			Math.min(cellLeftPosition, this.bodyBoundary.scrollLeft)
		));
		return result;
	}
	_scrollToRow(indexRow) {
		const cellTopPosition = indexRow * this._realRowHeight;
		if (
			cellTopPosition > this.bodyBoundary.scrollTop &&
			cellTopPosition <
				this.bodyBoundary.scrollTop + this.bodyBoundary.clientHeight
		) {
			return;
		}

		this.bodyBoundary.scrollTop = cellTopPosition;
	}
	_getCellFromEvent(event) {
		const targetRow = event.target.closest('.aras-grid-row');
		const targetCell = event.target.closest('.aras-grid-row > td');

		if (!targetRow || !targetCell) {
			return;
		}

		const cellNumber = Array.prototype.indexOf.call(
			targetRow.children,
			targetCell
		);
		const inFrozenArea = event.target.closest(
			'.aras-grid-body-boundary_frozen'
		);
		const settings = this.data.settings;
		let firstHead = inFrozenArea ? 0 : this.cache.firstHead;
		let lastHead = inFrozenArea
			? settings.frozenColumns
			: this._getHeadCount(firstHead);
		if (this.defaultSettings.disableXLazyRendering && !inFrozenArea) {
			firstHead = settings.frozenColumns;
			lastHead = settings.indexHead.length;
		}
		const headForRender = this._getHeadForRender(firstHead, lastHead);
		const indexHead = headForRender[cellNumber].index;
		const headId = headForRender[cellNumber].id;
		const indexRow = +targetRow.dataset.index;
		let rowId = targetRow.dataset.rowId;
		// In Innovator 12 SP7 grid component stops support of numeric ids in store of grid.
		// This caused issues in RE application, which still uses this approach.
		// This "if" should be removed in next major release, and RE should be updated to use strings for ids.
		if (!this.data.rows.has(rowId) && this.data.rows.has(+rowId)) {
			rowId = +rowId;
		}

		return {
			headId,
			indexHead,
			indexRow,
			rowId
		};
	}
	_renderActiveCell(prev) {
		const defaultClass = 'aras-grid-active-cell';
		const showedClass = 'aras-grid-active-cell_showed';
		const editingClass = 'aras-grid-active-cell_editing';
		const notAnimatedClass = 'aras-grid-active-cell_notanimated';

		const next = this.cache.focusedCell;

		if (!next) {
			this.activeCell.className = defaultClass;
			return;
		}

		const headId = next.headId;
		const rowId = next.rowId;
		const indexHead = this.data.settings.indexHead.indexOf(headId);
		const indexRow = this.data.settings.indexRows.indexOf(rowId);

		if (indexHead < 0 || indexRow < 0) {
			this.activeCell.classList.remove(showedClass);
			return;
		}

		const { frozenColumns } = this.data.settings;
		const currentScroller = this.activeCell.parentElement;
		let newScroller;
		let firstColumnIndex;

		if (indexHead < frozenColumns) {
			firstColumnIndex = 0;
			newScroller = this.frozenScroller;
		} else {
			firstColumnIndex = frozenColumns;
			newScroller = this.scroller;
		}

		const scrollerChanged = currentScroller !== newScroller;

		if (scrollerChanged) {
			newScroller.append(this.activeCell);
		}

		const leftPosition = this._getHeadRangeWidth(firstColumnIndex, indexHead);
		const topPosition = indexRow * this._realRowHeight;
		if (next.editing) {
			this.activeCell.style.left = leftPosition + 'px';
			this.activeCell.style.top = topPosition + 'px';
			this.activeCell.style.transform = 'translate3d(0, 0, 0)';
		} else {
			this.activeCell.style.left = '0';
			this.activeCell.style.top = '0';
			this.activeCell.style.transform =
				'translate3d(' + leftPosition + 'px, ' + topPosition + 'px, 0)';
		}

		const isLastFrozen = indexHead === frozenColumns - 1;
		const widthUnderRightBorder = isLastFrozen ? 0 : 1;

		this.activeCell.style.width =
			this._getHeadWidth(indexHead) + widthUnderRightBorder + 'px';
		this.activeCell.style.height = this._realRowHeight + 1 + 'px';

		this.activeCell.classList.add(showedClass);

		if (scrollerChanged) {
			const activeElement = document.activeElement;
			const isActiveCellFocused = this.activeCell.contains(activeElement);
			const oldFocusedCell = this.data.settings.focusedCell;
			this.data.settings.focusedCell = oldFocusedCell;
			isActiveCellFocused && activeElement.focus();
		}

		if (prev === next) {
			return;
		}

		// required to keep focus inside grid control when content of this.activeCell is dropped (this.activeCell.innerHTML = '')
		// and it has focus before this
		this.body.focus({ preventScroll: true });

		this.activeCell.innerHTML = '';
		this.activeCell.classList.toggle(notAnimatedClass, next.editing);
		this.activeCell.classList.toggle(editingClass, next.editing);

		this._setupReader(indexHead, indexRow);

		if (!next.editing) {
			this.activeCell.className = defaultClass + ' ' + showedClass;
			return;
		}

		const propertyName = this.data.head.get(headId, 'name') || headId;
		const linkProperty = this.data.head.get(headId, 'linkProperty');
		const itemId = linkProperty
			? this.data.rows.get(rowId, linkProperty)
			: rowId;
		const value = this.data.rows.get(itemId, propertyName);
		const editorType = this.data._getEditorType(
			headId,
			itemId,
			value,
			this.data,
			rowId
		);
		const cellMetadata = this.data.getCellMetadata(headId, itemId, editorType);
		if (cellMetadata) {
			Object.assign(cellMetadata, { rowId });
		}
		this.validator = gridEditors[editorType](
			this.activeCell,
			headId,
			itemId,
			value,
			this.data,
			cellMetadata
		);
	}

	_setupReader(indexHead, indexRow) {
		if (!this.readerIds.readerId) {
			const postfix = Date.now();
			this.readerIds = {
				readerId: 'reader' + postfix,
				edgeReader: 'edgeReader' + postfix,
				dataNode1: 'dataNode1' + postfix,
				dataNode2: 'dataNode2' + postfix,
				activeReader: this.readerIds.dataNode1
			};
		}
		const reader = this.reader;
		const { headId, rowId } = this.cache.focusedCell;
		const head = this.data.head;
		const headLabel = head.get(headId, 'label') || indexHead + 1;
		const headName = head.get(headId, 'name');
		const cellData = this.data.rows.get(rowId, headName || headId);
		const cellValue =
			cellData || cellData === false
				? cellData
				: aras.getResource('', 'grid_reader.empty');

		const message = `${cellValue}.${headLabel} ${indexRow + 1} .`;

		// Edge and Firefox not support alert role with NVDA
		if (/Edge\/(\d+)|Firefox\/(\S+)/.test(window.navigator.userAgent)) {
			const { edgeReader, dataNode1, dataNode2 } = this.readerIds;
			this.readerIds.activeReader =
				this.readerIds.activeReader === dataNode1 ? dataNode2 : dataNode1;
			const ariaOwns = `${dataNode1} ${dataNode2}`;
			const edgeReaderNode = HyperHTMLElement.hyper`
				<div
					id="${edgeReader}"
					class="aras-grid-reader"
					tabindex="-1"
					role="textbox"
					aria-activedescendant="${this.readerIds.activeReader}"
					aria-owns="${ariaOwns}"
				></div>
			`;
			HyperHTMLElement.hyper(reader)`
				${edgeReaderNode}
				<div id="${dataNode1}" aria-label="${message}" />
				<div id="${dataNode2}" aria-label="${message}" />
			`;
			edgeReaderNode.focus();
		} else {
			HyperHTMLElement.hyper(reader)`
				<p
					id="${this.readerIds.readerId}"
					class="aras-grid-reader"
					role="alert"
					aria-atomic="true"
				>${message}</p>
			`;
		}
	}

	_scrollHandler() {
		if (
			this.cache &&
			this.cache.prevScrollLeftPosition !== this.bodyBoundary.scrollLeft
		) {
			if (!this.defaultSettings.disableXLazyRendering) {
				this._correctCacheAfterScroll(this.cache);
			}
			const activeElem = document.activeElement;
			if (
				activeElem &&
				activeElem.closest &&
				activeElem.closest('.aras-grid-search-row-cell')
			) {
				this.body.focus();
			}
		}

		this._render();

		if (this.defaultSettings.freezableColumns) {
			this._hoverRow();
		}
	}
	_frozenScrollHandler(e) {
		const scrollTime = 468; // This is the average animation scroll time in browsers, and it is also used in polyfill
		let scrollDistance = 100;

		if (this._scrollAnimationTimeout) {
			scrollDistance = 120;
			clearTimeout(this._scrollAnimationTimeout);
		} else {
			this._scrollTopPosition = this.bodyBoundary.scrollTop;
		}

		this._scrollTopPosition = Math.max(
			this._scrollTopPosition +
				(e.deltaY > 0 ? scrollDistance : -scrollDistance),
			0
		);

		if (!this._scrollTimeout) {
			this._scrollTimeout = setTimeout(() => {
				this.bodyBoundary.scroll({
					top: this._scrollTopPosition,
					behavior: 'smooth'
				});

				this._scrollTimeout = null;
			}, 0);
		}

		this._scrollAnimationTimeout = setTimeout(() => {
			this._scrollAnimationTimeout = null;
		}, scrollTime);
	}
	_mouseleaveHandler() {
		if (this.defaultSettings.freezableColumns && this._hoveredIndex !== null) {
			this._hoveredIndex = null;
			this._render();
		}
		if (this._hoveredCell !== null) {
			this._hoveredCell = null;
			this._toggleTooltip();
		}
	}
	_hoverRow() {
		const hoverRow = this.dom.querySelector('.aras-grid-row:hover');
		const hoveredCell = this.dom.querySelector('.aras-grid-row-cell:hover');

		const index = hoverRow ? +hoverRow.dataset.index : null;
		if (this.defaultSettings.freezableColumns && this._hoveredIndex !== index) {
			this._hoveredIndex = index;
			this._render();
		}

		if (this._hoveredCell !== hoveredCell) {
			this._hoveredCell = hoveredCell;
			this._toggleTooltip();
		}
	}
	_resizeHandler(e) {
		if (
			!e.target.classList ||
			!e.target.classList.contains('aras-grid-head-cell-resize')
		) {
			return;
		}

		const resizeZoneOffset = e.target.getBoundingClientRect();
		const containerOffset = this.dom.getBoundingClientRect();
		const startOffset = resizeZoneOffset.left - containerOffset.left;
		const correctionOffset = e.pageX - startOffset;
		const resizeClass = 'aras-grid-resize-line_draggable';

		const startPosition = e.pageX;
		const targetCell = e.target.closest('.aras-grid-head-cell');
		const indexHead = targetCell.dataset.index;

		const resizeLine = this.resizeLine;
		resizeLine.classList.add(resizeClass);
		resizeLine.style.transform = 'translateX(' + startOffset + 'px)';

		const mouseMoveHandler = function (e) {
			resizeLine.style.transform =
				'translateX(' + (e.pageX - correctionOffset) + 'px)';
		};
		const mouseUpHandler = function (e) {
			let delta = e.pageX - startPosition;
			delta *= document.documentElement.dir === 'rtl' ? -1 : 1;
			const resizeEvent = new CustomEvent('resizeHead', {
				detail: {
					index: indexHead,
					delta: delta
				}
			});
			this.dom.dispatchEvent(resizeEvent);
			resizeLine.classList.remove(resizeClass);
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
		}.bind(this);

		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);
		e.stopPropagation();
	}
	_columnDragHandler(e) {
		if (
			!e.target.classList ||
			e.target.classList.contains('aras-grid-head-cell-resize') ||
			!e.target.closest('.aras-grid-head-cell')
		) {
			return;
		}

		this._dragTimeout = null;
		const headCell = e.target.closest('.aras-grid-head-cell');
		let scrollTimeout;
		let scrollSpeed;
		let scrollDirection;
		const scrollWidth = 100;
		const ddcontainer = this.ddcontainer;
		const ddline = this.ddline;
		const startIndex = +headCell.dataset.index;
		const frozenColumns = this.data.settings.frozenColumns;
		if (startIndex < frozenColumns) {
			return;
		}

		let endIndex = startIndex;
		const headOffset = headCell.getBoundingClientRect();
		const containerOffset = this.dom.getBoundingClientRect();
		const startOffset = headOffset.left - containerOffset.left;
		const correctionOffset = e.pageX - startOffset;
		const dragColumnClass = 'aras-grid-ddcontainer_draggable-column';
		const dragLineClass = 'aras-grid-ddline_draggable-column';
		const bodyBoundaryOffset = this.bodyBoundary.getBoundingClientRect();
		const startScroll = function () {
			scrollTimeout = setTimeout(
				function () {
					const s = scrollSpeed / scrollWidth;
					const baseSpeed = 2;
					this.bodyBoundary.scrollLeft +=
						scrollDirection * (s * s * scrollSpeed + baseSpeed);
					startScroll();
				}.bind(this),
				0
			);
		}.bind(this);

		const stopScroll = function () {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
				scrollTimeout = false;
			}
		};

		const mouseMoveHandler = function (e) {
			let positionX =
				e.pageX -
				(this.cache.viewportTranslateX -
					this.bodyBoundary.scrollLeft +
					bodyBoundaryOffset.left);
			const rPosition =
				e.pageX - (containerOffset.left + this.dom.clientWidth - scrollWidth);
			const lPosition =
				scrollWidth -
				(e.pageX - containerOffset.left - bodyBoundaryOffset.left);
			const inRightScroll = rPosition >= 0 && rPosition <= scrollWidth;
			const inLeftScroll = lPosition >= 0 && lPosition <= scrollWidth;

			if (inRightScroll || inLeftScroll) {
				scrollSpeed = inRightScroll ? rPosition : lPosition;
				scrollDirection = inRightScroll ? 1 : -1;
				if (!scrollTimeout) {
					startScroll();
				}
			} else {
				stopScroll();
			}

			endIndex = this.cache.firstHead;
			while (positionX >= this._getHeadWidth(endIndex)) {
				positionX -= this._getHeadWidth(endIndex);
				endIndex++;
			}

			ddline.classList.add(dragLineClass);
			ddcontainer.style.transform =
				'translateX(' + (e.pageX - correctionOffset) + 'px)';
			const endHeadCell = this.headerBoundary.querySelector(
				'.aras-grid-head-cell[data-index="' + endIndex + '"]'
			);
			if (!endHeadCell) {
				return;
			}
			const endHeadCellOffset = endHeadCell.getBoundingClientRect();
			const ddLinePosition =
				endHeadCellOffset.left -
				containerOffset.left +
				(startIndex <= endIndex ? endHeadCell.clientWidth : 0);
			ddline.style.transform = 'translateX(' + ddLinePosition + 'px)';
		}.bind(this);

		const mouseUpHandler = function (e) {
			stopScroll();
			ddline.classList.remove(dragLineClass);
			ddcontainer.classList.remove(dragColumnClass);
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
			if (
				!e.target ||
				!e.target.closest ||
				!e.target.closest('.aras-grid') ||
				startIndex === endIndex ||
				endIndex < frozenColumns
			) {
				return;
			}
			this.dom.dispatchEvent(
				new CustomEvent('moveHead', {
					detail: {
						startIndex: startIndex,
						endIndex: endIndex
					}
				})
			);
		}.bind(this);
		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);

		ddcontainer.classList.add(dragColumnClass);
		ddcontainer.style.width = headCell.clientWidth + 'px';
		ddcontainer.style.transform = 'translateX(' + startOffset + 'px)';
		e.stopPropagation();
	}
	_detectColumnDragAction(event) {
		if (event.button === 2) {
			return;
		}
		this._dragTimeout = window.setTimeout(
			this._columnDragHandler.bind(this, event),
			this.delayForDragDetection
		);
	}
	_sortHandler(e) {
		if (!this.defaultSettings.sortable) {
			window.clearTimeout(this._dragTimeout);
			this._dragTimeout = null;
			return;
		}
		const headCell = e.target.closest('.aras-grid-head-cell');
		if (!headCell || this._dragTimeout === null) {
			return;
		}
		window.clearTimeout(this._dragTimeout);

		const index = +headCell.dataset.index;
		const headId = headCell.dataset.headId;

		this.dom.dispatchEvent(
			new CustomEvent('sort', {
				detail: {
					index,
					ctrlKey: e.ctrlKey || e.metaKey,
					headId
				}
			})
		);
	}
	_mouseDownHandler(e) {
		const clickedCell = this._getCellFromEvent(e);

		if (!clickedCell) {
			return;
		}

		const isCtrl = e.ctrlKey || e.metaKey;
		const isShift = e.shiftKey;
		const settings = this.data.settings;
		const { headId, rowId } = clickedCell;
		const isRowIncludesFocusCell = settings.selectedRows.includes(rowId);
		const isClickOnLeftButton = e.button === 0;
		const isClickOnRightButton = e.button === 2;
		const prevFocusedCell = settings.focusedCell;
		const isClickAnotherCell =
			!prevFocusedCell ||
			prevFocusedCell.headId !== headId ||
			prevFocusedCell.rowId !== rowId;

		if (isClickAnotherCell || (isClickOnLeftButton && !isCtrl && !isShift)) {
			const focusEvent = new CustomEvent('focusCell', {
				detail: {
					...clickedCell,
					forceEdit:
						!(
							isClickAnotherCell &&
							(isCtrl || isShift || isClickOnRightButton)
						) &&
						this.defaultSettings.editable &&
						isRowIncludesFocusCell
				}
			});
			this.dom.dispatchEvent(focusEvent);
		}
		if (isClickOnLeftButton || (e.button === 2 && !isRowIncludesFocusCell)) {
			const type = !this.defaultSettings.multiSelect
				? 'single'
				: isCtrl
				? 'ctrl'
				: isShift
				? 'shift'
				: 'single';

			const selectEvent = new CustomEvent('selectRow', {
				detail: {
					index: clickedCell.indexRow,
					rowId,
					type
				}
			});
			this.dom.dispatchEvent(selectEvent);
		}
	}
	_focusInHeadHandler(e) {
		const headCell = e.target.closest('.aras-grid-search-row-cell');
		if (!headCell) {
			return;
		}

		const indexHead = +headCell.dataset.index;
		const headId = headCell.dataset.headId;
		const rowId = 'searchRow';
		const options = { detail: { headId, indexHead, indexRow: rowId, rowId } };
		const focusEvent = new CustomEvent('focusCell', options);
		this.dom.dispatchEvent(focusEvent);
	}
	_checkRowHeight() {
		if (
			this._oldDevicePixelRatio === window.devicePixelRatio ||
			this.dom.offsetParent === null
		) {
			return;
		}
		this._oldDevicePixelRatio = window.devicePixelRatio;

		const container = this.scroller;
		const testTable = HyperHTMLElement.wire()`
			<table class="aras-grid-viewport" style="opacity:0; ponter-event: none;">
				<tr class="aras-grid-row">
					<td class="aras-grid-row-cell">Example</td>
				</tr>
			</table>
		`;
		container.appendChild(testTable);
		const row = container.querySelector('.aras-grid-row');
		this._realRowHeight = row.getBoundingClientRect().height;
		container.removeChild(testTable);
	}
	_focusoutHandler(e) {
		if (
			!e.relatedTarget ||
			e.relatedTarget.closest('.aras-grid') !== this.dom
		) {
			this.dom.dispatchEvent(new CustomEvent('focusCell'));
		}
	}
	_freezeColumnsHandler(e) {
		if (
			!e.target.classList ||
			!e.target.classList.contains('aras-grid-freezer')
		) {
			return;
		}

		const ddline = this.ddline;
		const ddcontainer = this.ddcontainer;
		const startIndex = this.data.settings.frozenColumns;
		const freezerOffset = this.freezer.getBoundingClientRect();
		const containerOffset = this.dom.getBoundingClientRect();
		const startOffset = freezerOffset.left;
		const correctionOffset = e.pageX - startOffset;
		const dragLineClass = 'aras-grid-ddline_draggable-freezer';
		const dragFreezerClass = 'aras-grid-ddcontainer_draggable-freezer';
		let endIndex = startIndex;
		let ddLinePosition = freezerOffset.left;

		const mouseMoveHandler = function (e) {
			endIndex = 0;
			this.bodyBoundary.scrollLeft = 0;
			const positionX = e.pageX;
			const isRtlDirection = document.documentElement.dir === 'rtl';
			const offsetProperty = isRtlDirection ? 'right' : 'left';
			const nextEndIndex = (isRtlDirection, positionX, containerOffset) => {
				let distanceFreezer = positionX - containerOffset.left;
				distanceFreezer = isRtlDirection
					? this.dom.clientWidth - distanceFreezer
					: distanceFreezer;
				while (distanceFreezer >= this._getHeadWidth(endIndex) / 2) {
					distanceFreezer -= this._getHeadWidth(endIndex);
					endIndex++;
				}
			};
			nextEndIndex(isRtlDirection, positionX, containerOffset);
			ddline.classList.add(dragLineClass);
			ddcontainer.style.transform =
				'translateX(' +
				(e.pageX - containerOffset[offsetProperty] - correctionOffset) +
				'px)';
			const endHeadCell = this.header.querySelector(
				'.aras-grid-head-cell[data-index="' + endIndex + '"]'
			);
			if (!endHeadCell) {
				return;
			}
			const endHeadCellOffset = endHeadCell.getBoundingClientRect();
			if (isRtlDirection) {
				ddLinePosition =
					-(
						this.dom.clientWidth +
						containerOffset.left -
						endHeadCellOffset.left -
						this._getHeadWidth(endIndex)
					) + 1;
			} else {
				ddLinePosition =
					endHeadCellOffset.left -
					containerOffset.left -
					2 -
					(this.data.settings.frozenColumns === endIndex ? 3 : 0);
			}
			ddline.style.transform = 'translateX(' + (ddLinePosition - 1) + 'px)';
		}.bind(this);

		const mouseUpHandler = function (e) {
			ddline.classList.remove(dragLineClass);
			ddcontainer.classList.remove(dragFreezerClass);
			document.removeEventListener('mousemove', mouseMoveHandler);
			document.removeEventListener('mouseup', mouseUpHandler);
			ddcontainer.style.transform =
				'translateX(' + ddLinePosition - containerOffset.left + 'px)';
			if (
				!e.target ||
				!e.target.closest ||
				!e.target.closest('.aras-grid') ||
				startIndex === endIndex
			) {
				this.render(this.data);
				return;
			}
			this.dom.dispatchEvent(
				new CustomEvent('freezeColumns', {
					detail: {
						frozenColumns: Math.min(
							this.data.settings.indexHead.length,
							endIndex
						)
					}
				})
			);
		}.bind(this);
		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);

		ddcontainer.classList.add(dragFreezerClass);
		ddcontainer.style.width = '6px';
		ddcontainer.style.transform =
			'translateX(' + (startOffset - containerOffset.left) + 'px)';
		e.preventDefault();
		e.stopPropagation();
	}
	_focusSearchCell() {
		const focusedCell = this.cache.focusedCell;

		if (!focusedCell || focusedCell.rowId !== 'searchRow') {
			return;
		}
		const headId = focusedCell.headId;
		const indexHead = this.data.settings.indexHead.indexOf(headId);

		if (this.focusTimeout) {
			clearTimeout(this.focusTimeout);
			this.focusTimeout = null;
		}

		this.focusTimeout = setTimeout(
			function () {
				const input = this.header.querySelector(
					`.aras-grid-search-row-cell[data-index="${indexHead}"] input`
				);

				if (input) {
					const inputBoundingBox = input.getBoundingClientRect();
					if (
						inputBoundingBox.left >= 0 &&
						inputBoundingBox.right <= window.innerWidth
					) {
						input.focus();
					}
				}

				this.focusTimeout = null;
			}.bind(this),
			100
		);
	}
	_render() {
		const frozenColumns = this.data.settings.frozenColumns;
		if (!this.cache) {
			const foundFirstHead = this._findFirstHead();
			this.cache = {
				firstHead: foundFirstHead,
				viewportTranslateX: this._getHeadRangeWidth(
					frozenColumns,
					foundFirstHead
				),
				prevScrollLeftPosition: this.bodyBoundary.scrollLeft,
				focusedCell: this.data.settings.focusedCell
			};
		}
		const disableXLazyRendering = this.defaultSettings.disableXLazyRendering;
		const firstRow = this._findFirstRow();
		const firstHead = disableXLazyRendering
			? this.data.settings.frozenColumns
			: this.cache.firstHead;
		const rowsCount = this._getRowsCount();
		const headCount = this._getHeadCount(firstHead);
		const viewportTranslateX = disableXLazyRendering
			? 0
			: this.cache.viewportTranslateX;
		const viewportTranslateY = firstRow * this._realRowHeight;
		const viewportWidth = this._getHeadRangeWidth(
			firstHead,
			firstHead + headCount
		);
		const headForRender = this._getHeadForRender(
			firstHead,
			disableXLazyRendering ? this.data.settings.indexHead.length : headCount
		);
		const rowsForRender = this._getRowsForRender(firstRow, rowsCount);

		Inferno.render(
			this.templates.buildViewport(
				rowsForRender,
				headForRender,
				this._getViewportStyle(
					viewportTranslateX,
					viewportTranslateY,
					viewportWidth
				),
				this.defaultSettings,
				this.data
			),
			this.scroller
		);

		Inferno.render(
			this.templates.buildHead(
				headForRender,
				this._getHeadStyle(viewportTranslateX, viewportWidth),
				this.defaultSettings,
				this.data
			),
			this.headerBoundary
		);

		if (this.defaultSettings.freezableColumns) {
			const frozenViewportWidth = this._getHeadRangeWidth(0, frozenColumns);
			const frozenHeadForRender = this._getHeadForRender(0, frozenColumns);
			const bodyBoundary = this.bodyBoundary;

			Inferno.render(
				this.templates.buildViewport(
					frozenColumns ? rowsForRender : [],
					frozenHeadForRender,
					this._getViewportStyle(0, viewportTranslateY, frozenViewportWidth),
					this.defaultSettings,
					this.data
				),
				this.frozenScroller
			);

			Inferno.render(
				this.templates.buildHead(
					frozenHeadForRender,
					this._getHeadStyle(bodyBoundary.scrollLeft, frozenViewportWidth),
					this.defaultSettings,
					this.data
				),
				this.frozenHeaderBoundary
			);

			this.frozenBodyBoundary.scrollTop = bodyBoundary.scrollTop;
			this.frozenBodyBoundary.style.height = bodyBoundary.clientHeight + 'px';
			const viewportWidth =
				document.documentElement.dir === 'rtl'
					? -frozenViewportWidth
					: frozenViewportWidth;
			this.freezer.style.transform =
				'translate3d(' + viewportWidth + 'px, 0, 0)';
		}
	}
	render(grid) {
		if (this.debounceTimeout) {
			return this.debounceTimeout;
		}

		this.debounceTimeout = new Promise(
			function (resolve) {
				setTimeout(
					function () {
						this.data = grid;
						const prevFocusedCell = this.cache && this.cache.focusedCell;
						this.cache = null;
						const freezableColumns = this.defaultSettings.freezableColumns;

						if (!this.data.head || !this.data.head._store.size) {
							this.debounceTimeout = false;
							return resolve();
						}
						if (!this.body.parentNode) {
							this.dom.appendChild(this.header);
							this.dom.appendChild(this.body);
							this.dom.appendChild(this.resizeLine);
							this.dom.appendChild(this.ddcontainer);
							this.dom.appendChild(this.ddline);
							this.dom.appendChild(this.tooltip);

							if (freezableColumns) {
								this.dom.appendChild(this.freezer);
							}

							this._addHandlers();
						}
						this._checkRowHeight();
						this._setScrollSize();
						this._render();
						if (!this.activeCell.parentNode) {
							this.scroller.appendChild(this.activeCell);
						}

						const focusedCell = this.cache.focusedCell;
						if (focusedCell && prevFocusedCell !== focusedCell) {
							if (this.data.settings.indexHead.length > 1) {
								const indexHead = this.data.settings.indexHead.indexOf(
									focusedCell.headId
								);
								this._scrollToHead(indexHead);
							}
							if (focusedCell.rowId !== 'searchRow') {
								const indexRow = this.data.settings.indexRows.indexOf(
									focusedCell.rowId
								);
								this._scrollToRow(indexRow);
							}
						}

						this._renderActiveCell(prevFocusedCell || {});
						this._focusSearchCell();
						this.showMessageActiveCell();
						this.debounceTimeout = false;
						resolve();
					}.bind(this),
					0
				);
			}.bind(this)
		);

		return this.debounceTimeout;
	}
	showMessageActiveCell() {
		const message = this.data.settings.focusedCell
			? this.data.settings.focusedCell.toolTipMessage
			: '';
		const activeCell = this.activeCell;

		if (!message) {
			const dataShowtoolTip = activeCell.getAttribute('data-tooltip-show');
			if (dataShowtoolTip !== 'true') {
				return;
			}

			if (activeCell.firstChild) {
				activeCell.firstChild.classList.remove('aras-form-input_invalid');
			}
			activeCell.classList.remove(
				'aras-grid-active-cell_alert',
				'aras-tooltip'
			);
			activeCell.setAttribute('data-tooltip-show', false);
			return;
		}

		const activeBoundary = activeCell.parentElement.parentElement;
		const tooltipPosition = getTooltipPosition(
			activeCell,
			activeBoundary,
			message
		);

		if (activeCell.firstChild) {
			activeCell.firstChild.classList.add('aras-form-input_invalid');
		}
		activeCell.classList.add('aras-grid-active-cell_alert', 'aras-tooltip');
		activeCell.setAttribute('data-tooltip-show', true);
		activeCell.setAttribute('data-tooltip', message);
		activeCell.setAttribute('data-tooltip-pos', tooltipPosition);
	}

	_shouldShowTooltip(cell) {
		const text = cell.textContent;
		const container =
			Array.from(cell.querySelectorAll(':not(:empty)'))
				.reverse()
				.find(({ textContent }) => textContent === text) || cell;

		const containerStyle = getComputedStyle(container);
		const { paddingLeft, paddingRight } = containerStyle;
		const font =
			containerStyle.font ||
			`${containerStyle.fontSize} ${containerStyle.fontFamily}`;

		let showTooltip;
		if (container.clientWidth) {
			const paddings = parseFloat(paddingLeft) + parseFloat(paddingRight);
			const availableSpace = container.getBoundingClientRect().width - paddings;
			const textWidth = getTextWidth(text, font).toFixed(1);
			showTooltip = textWidth - availableSpace.toFixed(1) > 0;
		} else {
			const { paddingRight: cellPaddingRight } = getComputedStyle(cell);
			const cellRight = cell.getBoundingClientRect().right;
			const containerRight = container.getBoundingClientRect().right;
			showTooltip = containerRight > cellRight - parseFloat(cellPaddingRight);
		}

		return {
			container,
			showTooltip,
			containerPaddingLeft: paddingLeft
		};
	}

	_positionTooltip(container, containerPaddingLeft) {
		const { x: gridX, y: gridY } = this.dom.getBoundingClientRect();
		const { x, y, height } = container.getBoundingClientRect();
		const { paddingLeft, translate } = this._tooltipParams;
		const paddingDiff =
			parseFloat(paddingLeft) - parseFloat(containerPaddingLeft);

		const translateY = y - gridY + height / 2 - translate;
		const translateX = x - gridX - paddingDiff;
		this.tooltip.style.transform = `translate(${translateX}px, ${translateY}px)`;
	}

	_setTooltipParams() {
		const {
			lineHeight,
			borderTopWidth,
			paddingTop,
			paddingLeft
		} = getComputedStyle(this.tooltip);
		// alligns start of tooltip text with cell text
		this._tooltipParams = {
			translate:
				parseFloat(lineHeight) / 2 +
				parseFloat(borderTopWidth) +
				parseFloat(paddingTop),
			paddingLeft
		};
	}

	_toggleTooltip() {
		const cell = this._hoveredCell;
		const showTooltipClass = 'aras-tooltip-block_shown';

		clearTimeout(this._showTooltipTimeout);

		if (!cell) {
			this.tooltip.classList.remove(showTooltipClass);
			return;
		}

		const delay = this.defaultSettings.tooltipDelay;
		this._showTooltipTimeout = setTimeout(
			() => {
				const {
					container,
					showTooltip,
					containerPaddingLeft
				} = this._shouldShowTooltip(cell);

				if (showTooltip) {
					this.tooltip.classList.add('aras-tooltip-block_shown');
					this.tooltip.innerText = container.textContent;

					if (!this._tooltipParams) {
						this._setTooltipParams();
					}

					this._positionTooltip(container, containerPaddingLeft);
				} else {
					this.tooltip.classList.remove(showTooltipClass);
				}
			},
			this.tooltip.classList.contains(showTooltipClass) ? 0 : delay
		);
	}
}

export default GridView;
