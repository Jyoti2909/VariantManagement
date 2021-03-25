TreeGridView.prototype._clickHandler = function(e) {
	window.clearTimeout(this._dragTimeout);
	if (e.target.classList && e.target.classList.contains('aras-treegrid-expand-button')) {
		var row = e.target.closest('.aras-grid-row');
		var toggledRowIdx = +row.dataset.index;
		var expandEvent = new CustomEvent('expand', {
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
	var parentMethod = GridView.prototype._mouseDownHandler;
	parentMethod.call(this, e);
};

TreeGridView.prototype._mouseDownHandler = function(e) {};

GridView.prototype._rowDragHandler = function(e) {
	var rowCell = e.target.closest('.aras-grid-row');
	var dataSettings = this.data.settings;
	var selectedRows = dataSettings.selectedRows;
	if (!rowCell || selectedRows.length === 0) {
		return;
	}

	var indexRows = dataSettings.indexRows;
	var startIndex = +rowCell.dataset.index;
	var startId = indexRows[startIndex];
	var selectedRowsSet = new Set(selectedRows);
	if (!selectedRowsSet.has(startId)) {
		return;
	}

	var firstSelectedRow = selectedRows[0];
	var selectedRowIndex = indexRows.indexOf(firstSelectedRow);

	if (selectedRowsSet.size !== 1) {
		var selectedRowsCount = 1;
		selectedRowsCount += countSelectedRowsInArea(selectedRowIndex, selectedRowsSet, indexRows);
		if (selectedRowsCount !== selectedRowsSet.size) {
			return;
		}
	}

	this._dragTimeout = null;
	var scrollTimeout;
	var scrollSpeed;
	var scrollDirection;
	var scrollHeight = this.defaultSettings.rowHeight;
	var ddcontainer = this.ddcontainer;
	var ddline = this.ddline;
	var endIndex = startIndex;
	var rowOffset = rowCell.getBoundingClientRect();
	var containerOffset = this.bodyBoundary.getBoundingClientRect();
	var startOffset = rowOffset.top - containerOffset.top;

	const domOffset = this.dom.offsetTop - this.dom.scrollTop;
	const correctionOffset = e.pageY - startOffset + domOffset;
	dragContainerClass = 'aras-grid-ddcontainer_draggable-row';
	dragLineClass = 'aras-grid-ddline_draggable-row';
	selectedRowsSet = countRowsToshow(dataSettings);
	var startScroll = function() {
		scrollTimeout = setTimeout(function() {
				var s = scrollSpeed / scrollHeight;
				var baseSpeed = 3;
				this.bodyBoundary.scrollTop += scrollDirection * (s * s * scrollSpeed + baseSpeed);
				startScroll();
			}.bind(this), 0);
	}.bind(this);
	var stopScroll = function() {
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
			scrollTimeout = false;
		}
	};
	var targetId;
	var mouseMoveHandler = function(e) {
		var botPosition = e.pageY - (containerOffset.top + this.bodyBoundary.clientHeight - scrollHeight);
		var topPosition = scrollHeight - (e.pageY - containerOffset.top);
		var inBotScroll = botPosition >= 0 && botPosition <= scrollHeight;
		var inTopScroll = topPosition >= 0 && topPosition <= scrollHeight;
		if (inBotScroll || inTopScroll) {
			scrollSpeed = inBotScroll ? botPosition : topPosition;
			scrollDirection = inBotScroll ? 1 : -1;
			if (!scrollTimeout) {
				startScroll();
			}
		} else {
			stopScroll();
		}
		endIndex = this._findFirstRow();
		var positionY = e.pageY - containerOffset.top - (endIndex * scrollHeight - this.bodyBoundary.scrollTop);
		while (positionY >= scrollHeight) {
			positionY -= scrollHeight;
			endIndex++;
		}
		ddcontainer.style.transform = 'translateY(' + (e.pageY - (correctionOffset - containerOffset.top)) + 'px)';
		targetId = indexRows[endIndex];
		isValid = targetId && !selectedRowsSet.has(targetId);
		if (isValid) {
			ddline.classList.add(dragLineClass);
			var endRowCell = this.scroller.querySelector('.aras-grid-row[data-index="' + endIndex + '"]');
			if (!endRowCell) {
				return;
			}
			var endRowCellOffset = endRowCell.getBoundingClientRect();
			var ddLinePosition = endRowCellOffset.top + scrollHeight - domOffset;
			ddline.style.transform = 'translateY(' + ddLinePosition + 'px)';
		} else {
			ddline.classList.remove(dragLineClass);
		}
	}.bind(this);
	var mouseWheelHandler = function(e) {
		this._frozenScrollHandler(e);
	}.bind(this);
	var mouseUpHandler = function(e) {
		stopScroll();
		ddline.classList.remove(dragLineClass);
		ddcontainer.classList.remove(dragContainerClass);
		document.removeEventListener('mousemove', mouseMoveHandler);
		document.removeEventListener('mouseup', mouseUpHandler);
		document.removeEventListener('wheel', mouseWheelHandler);
		if (!e.target || !e.target.closest || !e.target.closest('.aras-grid') || startIndex === endIndex || !isValid) {
			return;
		}
		this.dom.dispatchEvent(
			new CustomEvent('moveRow', {
				detail: {
					targetId: targetId,
					ctrlKey: e.ctrlKey
				}
			})
		);
	}.bind(this);
	document.addEventListener('mousemove', mouseMoveHandler);
	document.addEventListener('mouseup', mouseUpHandler);
	document.addEventListener('wheel', mouseWheelHandler);

	ddcontainer.classList.add(dragContainerClass);
	ddcontainer.style.height = scrollHeight * selectedRowsSet.size + 'px';
	ddcontainer.style.transform = 'translateY(' + (rowOffset.top - domOffset) + 'px)';
	e.stopPropagation();
};

var countSelectedRowsInArea = function(selectedRowIndex, selectedRowsSet, indexRows) {
	var selectedRowsCount = 0;
	var countRowsByDirection = function(direction) {
		var newIndex = selectedRowIndex + direction;
		while (selectedRowsSet.has(indexRows[newIndex])) {
			selectedRowsCount++;
			newIndex += direction;
		}
	};
	countRowsByDirection(-1);
	countRowsByDirection(1);
	return selectedRowsCount;
};

var countRowsToshow = function(dataSettings) {
	var selectedRows = dataSettings.selectedRows;
	var expanded = dataSettings.expanded;
	var indexTreeRows = dataSettings.indexTreeRows;
	var rowsToShow = new Set();
	var countRow = function(selectedRow) {
		selectedRow.forEach(function(rowId) {
			rowsToShow.add(rowId);
			if (expanded.has(rowId) && indexTreeRows[rowId]) {
				countRow(indexTreeRows[rowId]);
			}
		});
	};
	countRow(selectedRows);
	return rowsToShow;
};
