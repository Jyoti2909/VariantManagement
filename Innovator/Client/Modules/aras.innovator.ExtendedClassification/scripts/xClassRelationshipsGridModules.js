// override DragAndDrop functionality for using in xClassRelationshipsGrid
define(['Aras/Client/Controls/Experimental/GridModules'], function (
	GridModules
) {
	const basicDndFunc = GridModules.dnd;
	GridModules.dnd = function (gridContainer) {
		const dndModule = basicDndFunc(gridContainer);
		dndModule.dragDelay = 0;
		dndModule.drawAvatar = function () {};

		dndModule.init = function () {
			this.gridView = this.gridWidget.views.views[0];
			this.attachDnDEventListeners();
		};

		dndModule.beginDrag = function () {
			this.dragSourceRowNode.classList.add(
				'dnd-drag-row',
				'dojoxGridRowSelected'
			);
			connectMutationObserverToDragSource();

			this.targetIndex = this.onMouseDownRowIndex;

			this.isDragPending = false;
			this.dragStarted = true;

			this.placeholderRow.style.height = rowHeight + 'px';
			this.placeholderRow.style.width =
				this.getRowContentWidth(this.dragSourceRowNode) + 'px';
			this.dragSourceRowNode.parentNode.insertBefore(
				this.placeholderRow,
				this.dragSourceRowNode
			);

			dragSourceRowWidth =
				this.getRowContentWidth(this.dragSourceRowNode) + 'px';

			const rowCount = this.gridContainer.GetRowCount();
			for (i = 0; i < rowCount; i++) {
				if (this.gridView.rowNodes[i] != this.dragSourceRowNode) {
					this.gridView.rowNodes[i].classList.add('dnd-shiftable-row');
				}
				this.gridView.rowNodes[i].addEventListener(
					'mouseover',
					stopPropagation
				);
			}

			for (i = rowCount - 1; i > this.targetIndex; i--) {
				if (this.gridView.rowNodes[i] != this.dragSourceRowNode) {
					this.gridView.rowNodes[i].classList.add('dnd-shifted');
				}
			}
		};

		dndModule.endDrag = function (dropAllowed, e) {
			if (this.dragStarted) {
				mutationObserver.disconnect();
				this.dragSourceRowNode.classList.remove('dnd-drag-row');
				this.dragSourceRowNode.style.cssText = '';

				this.dragSourceRowNode.parentNode.removeChild(this.placeholderRow);

				const rowCount = this.gridContainer.GetRowCount();
				for (i = 0; i < rowCount; i++) {
					this.gridView.rowNodes[i].classList.toggle(
						'dnd-shiftable-row',
						false
					);
					this.gridView.rowNodes[i].classList.toggle('dnd-shifted', false);
					this.gridView.rowNodes[i].removeEventListener(
						'mouseover',
						stopPropagation
					);
				}

				this.dragStarted = false;
				if (dropAllowed) {
					if (this.gridContainer.onDragDrop_Experimental) {
						this.gridContainer.onDragDrop_Experimental(
							this.dragTargetRowId,
							this.ctrlKeyState
						);
					}
				}
			}
			this.isDragPending = false;
		};

		dndModule.searchDropTarget = function (e) {
			const rowCount = this.gridContainer.GetRowCount();
			const previousTargetIndex = this.targetIndex;
			const targetTop = rowHeight * this.targetIndex;
			const dragSourceTop = parseInt(this.dragSourceRowNode.style.top);

			if (dragSourceTop <= targetTop - rowHeight) {
				this.targetIndex = this.targetIndex - 1 >= 0 ? this.targetIndex - 1 : 0;
			} else if (dragSourceTop >= targetTop + rowHeight) {
				this.targetIndex =
					this.targetIndex + 1 <= rowCount - 1
						? this.targetIndex + 1
						: rowCount - 1;
			}

			this.dragTargetRowId = this.gridContainer.getRowId(this.targetIndex);

			const parentNode = this.dragSourceRowNode.parentNode;

			if (this.targetIndex < previousTargetIndex) {
				if (this.targetIndex < this.onMouseDownRowIndex) {
					this.gridView.rowNodes[this.targetIndex].classList.add('dnd-shifted');
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex]
					);
				} else if (this.targetIndex > this.onMouseDownRowIndex) {
					this.gridView.rowNodes[this.targetIndex + 1].classList.add(
						'dnd-shifted'
					);
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex + 1]
					);
				} else {
					this.gridView.rowNodes[this.targetIndex + 1].classList.add(
						'dnd-shifted'
					);
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex]
					);
				}
			} else if (this.targetIndex > previousTargetIndex) {
				if (this.targetIndex < this.onMouseDownRowIndex) {
					this.gridView.rowNodes[this.targetIndex - 1].classList.remove(
						'dnd-shifted'
					);
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex + 1]
					);
				} else if (this.targetIndex > this.onMouseDownRowIndex) {
					this.gridView.rowNodes[this.targetIndex].classList.remove(
						'dnd-shifted'
					);
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex + 2]
					);
				} else {
					this.gridView.rowNodes[this.targetIndex - 1].classList.remove(
						'dnd-shifted'
					);
					parentNode.insertBefore(
						this.placeholderRow,
						parentNode.children[this.targetIndex + 2]
					);
				}
			}
		};

		dndModule.repositionDragContainer = function (mouseX, mouseY) {
			const style = this.dragSourceRowNode.style;
			style.width = dragSourceRowWidth;
			style.left = mouseX - 10 + 'px';
			style.top = mouseY - 70 + 'px';
		};

		const createPlaceholderRow = function () {
			const placeholderNode = document.createElement('div');
			placeholderNode.classList.add('dnd-placeholder-node');
			const innerDiv = document.createElement('div');
			innerDiv.innerText = aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'insert_placeholder'
			);
			placeholderNode.appendChild(innerDiv);
			return placeholderNode;
		};

		const mutationObserver = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				mutationObserver.disconnect();
				dndModule.dragSourceRowNode.className = mutation.oldValue;
				connectMutationObserverToDragSource();
			});
		});

		const connectMutationObserverToDragSource = function () {
			mutationObserver.observe(dndModule.dragSourceRowNode, {
				attributes: true,
				attributeOldValue: true,
				attributeFilter: ['class']
			});
		};

		const stopPropagation = function (e) {
			e.stopImmediatePropagation();
		};

		dndModule.placeholderRow = createPlaceholderRow();
		dndModule.targetIndex = -1;
		const rowHeight = 26;
		let dragSourceRowWidth;

		dndModule.init();
		return dndModule;
	};

	return GridModules;
});
