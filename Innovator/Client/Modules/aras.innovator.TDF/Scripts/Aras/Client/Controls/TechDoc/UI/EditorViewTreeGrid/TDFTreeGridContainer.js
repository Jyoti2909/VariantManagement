// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
define([
	'dojo/_base/declare',
	'dojo/aspect',
	'Aras/Client/Controls/Public/TreeGridContainer',
	'dojox/html/metrics'
], function (declare, aspect, TreeGridContainer, metrics) {
	metrics.getScrollbar = function () {
		return { w: 17, h: 17 };
	};

	return declare(
		'Aras.Client.Controls.TDF.TreeGridContainer',
		TreeGridContainer,
		{
			constructor: function (initialArguments) {
				this._overrideScrollerMethods();
			},

			_overrideScrollerMethods: function () {
				const gridControl = this.grid_Experimental;
				const gridScroller = gridControl.scroller;

				if (gridScroller) {
					gridScroller.updateRowCount = this._updateRowCountModified;
					gridScroller.needPage = this._needPageModified;
				} else {
					aspect.after(
						this.grid_Experimental,
						'createScroller',
						function () {
							this._overrideScrollerMethods();
						}.bind(this)
					);
				}
			},

			_updateRowCountModified: function (inRowCount) {
				// modified version of dojox/grid/_Scroller: updateRowCount method
				// required to fix problem with grid width during vertical scroller appearing/disappearing
				this.invalidateNodes();
				this.rowCount = inRowCount;

				// update page count, adjust document height
				this.pageCount = this._getPageCount(this.rowCount, this.rowsPerPage);
				this.height = this.rowCount * this.defaultRowHeight || 1;

				// refresh pageHeights array data
				this.pageHeights.length = this.pageCount;
				this.pageHeights[this.pageCount - 1] = this.calcLastPageHeight();

				for (let i = 0; i < this.pageCount - 1; i++) {
					this.pageHeights[i] = this.defaultPageHeight;
				}

				this.resize();
			},

			_needPageModified: function (inPageIndex, inPos) {
				// internal method, used only in grid scroller object
				let h = this.getPageHeight(inPageIndex);

				if (!this.pageExists(inPageIndex)) {
					this.buildPage(
						inPageIndex,
						!this.grid._autoHeight &&
							this.keepPages &&
							this.stack.length >= this.keepPages,
						inPos
					);
					h = this.updatePageHeight(inPageIndex, true);
				} else {
					this.positionPage(inPageIndex, inPos);

					// this is new code, most likely can be removed after transition on the new grid version
					const stackIndex = this.stack.indexOf(inPageIndex);

					this.stack.splice(stackIndex, 1);
					this.pushPage(inPageIndex);
				}

				return h;
			},

			addXMLRows_Experimental: function () {
				this.inherited(arguments);

				if (!this._store) {
					this._store = this.grid_Experimental.store;
				}
			},

			decorateRowItemsBeforeAdd: function (
				rowItems,
				parentId,
				parentTreePath,
				additionalParameters
			) {
				const resultItems = [];

				additionalParameters = additionalParameters || {};
				rowItems = rowItems
					? Array.isArray(rowItems)
						? rowItems
						: [rowItems]
					: [];

				if (rowItems.length) {
					const expandosOpenStates = this.grid_Experimental.openedExpandos;
					let currentItem;
					let treePath;
					let decoratedItem;
					let childItems;
					let isRowExpanded;

					parentTreePath = parentTreePath ? parentTreePath + '/' : '';

					for (let i = 0; i < rowItems.length; i++) {
						currentItem = rowItems[i];

						treePath = parentTreePath + i;
						isRowExpanded =
							currentItem.expanded === 'true' ||
							additionalParameters.expandItems;

						decoratedItem = this._getRowItemFromJson_Experimental(
							currentItem,
							parentId,
							treePath
						);
						childItems = currentItem.children || [];

						if (childItems.length) {
							if (isRowExpanded) {
								expandosOpenStates[decoratedItem.uniqueId] = true;
							} else {
								delete expandosOpenStates[decoratedItem.uniqueId];
							}

							decoratedItem.children = this.decorateRowItemsBeforeAdd(
								childItems,
								decoratedItem.uniqueId,
								treePath,
								additionalParameters
							);
						}

						resultItems.push(decoratedItem);
					}
				}

				return resultItems;
			},

			updateRenderedRows: function (startRowIndex) {
				// updated version of dojox/grid/LazyTreeGrid._updateRenderedRows method
				const gridControl = this.grid_Experimental;

				startRowIndex = startRowIndex === undefined ? 0 : startRowIndex;

				if (gridControl._updateRenderedRows) {
					gridControl._updateRenderedRows(startRowIndex);
				} else {
					const renderedPages = gridControl.scroller.stack;
					const rowsPerPage = gridControl.rowsPerPage;
					let pageIndex;

					for (let i = 0; i < renderedPages.length; i++) {
						pageIndex = renderedPages[i];

						if (pageIndex * rowsPerPage >= startRowIndex) {
							gridControl.updateRows(pageIndex * rowsPerPage, rowsPerPage);
						} else if ((pageIndex + 1) * rowsPerPage >= startRowIndex) {
							gridControl.updateRows(
								startRowIndex,
								(pageIndex + 1) * rowsPerPage - startRowIndex + 1
							);
						}
					}
				}
			}
		}
	);
});
