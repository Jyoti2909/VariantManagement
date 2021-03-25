define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'ES/Scripts/Constants',
	'ES/Scripts/Classes/Utils'
], function (declare, lang, Constants, Utils) {
	return declare(null, {
		_utils: null,
		_constants: null,
		_pagination: null,
		_onPageChange: null,
		_pageSize: null,
		_tmpPageSize: undefined,
		_removeTmpEventListener: null,

		_pageSizeItemId: 'pagination_page_size',

		/**
		 * Pagination constructor
		 *
		 * @param {Object} args Pagination arguments
		 * @param {Function} args.onPageChange Callback that is called on page change
		 */
		constructor: function (args) {
			this._constants = new Constants();
			this._utils = new Utils({
				arasObj: aras
			});

			this._onPageChange = args.onPageChange;

			this._pagination = document.createElement('aras-pagination');
			this._pagination.getItem('pagination_max_results').hidden = true;
			this._pagination.getItem(this._pageSizeItemId).image =
				'../../../images/PageSize.svg';
			this._pagination.on('keyup', this._onKeyUp.bind(this));
			this._removeTmpEventListener = this._pagination.on(
				'input',
				this._addPageSizeBlurEventListener.bind(this)
			);
			this._pagination.on('input', this._onInput.bind(this));
			this._pagination.on('keydown', this._onKeyDown.bind(this));
			this._pagination.addEventListener(
				'runSearch',
				this._onButtonClick.bind(this)
			);
			this._pagination.pageSize = this._pageSize = this._constants.defaultPageSize;
			this._pagination.totalResults = 0;
		},

		/**
		 * Get page size number
		 *
		 * @returns {number} The number of rows per page
		 */
		getPageSize: function () {
			return this._pagination.pageSize;
		},

		/**
		 * Get pagination rows offset
		 *
		 * @returns {number} Number of rows to skip
		 */
		getOffset: function () {
			var pageSize = this._pagination.pageSize;
			return pageSize ? pageSize * (this._pagination.currentPageNumber - 1) : 0;
		},

		/**
		 * Attach pagination panel
		 *
		 * @param {HTMLElement} container parent element
		 */
		attach: function (container) {
			if (!this._utils.isNullOrUndefined(container)) {
				container.appendChild(this._pagination);
			}
		},

		/**
		 * Update pagination panel
		 *
		 * @param {number} total total number of results
		 * @param {number} [page] current page
		 */
		update: function (total, page) {
			if (page > 0) {
				this._pagination.currentPageNumber = page;
			}
			this._setPaginationItemsCount(total);
			this._pagination.totalResults = total;
			this._pagination.updateControlsState();
		},

		/**
		 * Set current items count
		 *
		 * @param {number} totalResults Total number of rows
		 * @private
		 */
		_setPaginationItemsCount: function (totalResults) {
			if (totalResults > 0) {
				var pageSize = this._pagination.pageSize;
				if (pageSize > 0) {
					var totalPages = pageSize ? Math.ceil(totalResults / pageSize) : 1;
					var isLastPage = this._pagination.currentPageNumber === totalPages;
					this._pagination.itemsCount = isLastPage
						? totalResults % pageSize || pageSize
						: pageSize;
				} else {
					this._pagination.itemsCount = totalResults;
				}
			} else {
				this._pagination.itemsCount = 0;
			}
		},

		/**
		 * Validate and apply page size value
		 *
		 * @private
		 */
		_applyPageSize: function () {
			if (!aras.isPositiveInteger(this._pagination.pageSize)) {
				aras.AlertError(
					this._utils.getResourceValueByKey(
						'message.page_size_should_be_positive'
					)
				);
				this._pagination.pageSize = this._pageSize;
			} else if (this._pagination.pageSize > this._constants.maxPageSize) {
				aras.AlertError(
					lang.replace(
						this._utils.getResourceValueByKey(
							'message.page_size_should_be_less'
						),
						[this._constants.maxPageSize]
					)
				);
				this._pagination.pageSize = this._constants.maxPageSize;
			}
			this._pageSize = this._pagination.pageSize;
		},

		/**
		 * Add blur event listener for page size input field
		 *
		 * @param {string} itemId target item id
		 * @param {Event} event input event object
		 * @private
		 */
		_addPageSizeBlurEventListener: function (itemId, event) {
			if (itemId === this._pageSizeItemId) {
				this._removeTmpEventListener();
				this._removeTmpEventListener = undefined;
				event.target.addEventListener('blur', this._onPageSizeBlur.bind(this));
			}
		},

		/**
		 * Pagination key up event handler
		 *
		 * @param {string} itemId target item id
		 * @param {Event} event keyup event object
		 * @private
		 */
		_onKeyUp: function (itemId, event) {
			if (itemId === this._pageSizeItemId && event.key === 'Enter') {
				this._tmpPageSize = this._pagination.pageSize;
				this._applyPageSize();
			}
		},

		/**
		 * Pagination key down event handler
		 *
		 * @param {string} itemId target item id
		 * @param {Event} event keydown event object
		 * @private
		 */
		_onKeyDown: function (itemId, event) {
			if (itemId.endsWith('button') && event.key === 'Enter') {
				event.preventDefault();
			}
		},

		/**
		 * Pagination input event handler
		 *
		 * @param {string} itemId target item id
		 * @private
		 */
		_onInput: function (itemId) {
			if (itemId === this._pageSizeItemId) {
				var pageSize = this._pagination.pageSize;
				var pageSizeItem = this._pagination.getItem(this._pageSizeItemId);
				if (
					!pageSizeItem.invalid &&
					(!pageSize || pageSize > this._constants.maxPageSize)
				) {
					this._pagination.data.set(
						this._pageSizeItemId,
						Object.assign({}, pageSizeItem, { invalid: true })
					);
					this._pagination.render();
				}
			}
		},

		/**
		 * Prev and next button click event handler
		 *
		 * @private
		 */
		_onButtonClick: function () {
			this._setPaginationItemsCount(this._pagination.totalResults);
			if (!this._utils.isNullOrUndefined(this._onPageChange)) {
				this._onPageChange();
			}
		},

		/**
		 * Page size blur event handler
		 *
		 * @private
		 */
		_onPageSizeBlur: function () {
			if (this._tmpPageSize !== this._pagination.pageSize) {
				this._applyPageSize();
				if (!this._utils.isNullOrUndefined(this._onPageChange)) {
					this._onPageChange();
				}
			}
			this._tmpPageSize = undefined;
		}
	});
});
