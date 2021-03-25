define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		_promotionStarted: false,

		constructor: function (mediator) {
			this._textPlaceHolder = document.getElementById('statusText');
			this._mediator = mediator;
		},

		update: function (items, lifeCycleMap, targetState) {
			if (!this._promotionStarted) {
				this._updateStatusBeforePromotion(items, lifeCycleMap, targetState);
			} else {
				this._updateStatusDuringOfPromotion(items);
			}
		},

		onPromotionStarted: function () {
			this._promotionStarted = true;
		},

		getStatusOfPromotion: function () {
			return this._statusOfPromotion;
		},

		_setText: function (text) {
			this._textPlaceHolder.textContent = text;
		},

		_setBorderClass: function (className) {
			this._textPlaceHolder.parentNode.className = className;
		},

		_getNumberOfInvalidItems: function (items) {
			const invalidItems = items.filter(function (item) {
				return item.getProperty('mpo_isItemValid') === '0';
			});
			return invalidItems.length;
		},

		_updateStatusBeforePromotion: function (items, lifeCycleMap, targetState) {
			const areItemsValid = this._getNumberOfInvalidItems(items) === 0;

			if (areItemsValid && !lifeCycleMap) {
				this._setText('Select Life Cycle Map');
				this._setBorderClass('warningStatus');
				return;
			}

			if (areItemsValid && !targetState) {
				this._setText('Select Target State');
				this._setBorderClass('warningStatus');
				return;
			}

			this._setConflictStatus(items);
		},

		_setConflictStatus: function (items) {
			const invalidItemsNumber = this._getNumberOfInvalidItems(items);
			let status = '';
			if (invalidItemsNumber === 0) {
				status += this._mediator.getResource('ready_to_execute');
				status += '\n';
				status += this._mediator.getResource('all_items_valid');
				this._setText(status);
				this._setBorderClass('okStatus');
			} else {
				status += this._mediator.getResource('resolve_conflicts');
				status += '\n';
				status += invalidItemsNumber;
				status += this._mediator.getResource('invalid_items_found');
				this._setText(status);
				this._setBorderClass('errorStatus');
			}
		},

		_updateStatusDuringOfPromotion: function (items) {
			this._setBorderClass('executeStatus');
			this._statusOfPromotion = this._getStatusOfPromotion(items);
			const statusText = this._getStatusText(this._statusOfPromotion);
			this._setText(statusText);
		},

		_getStatusText: function (status) {
			let result = '';
			result += status.completedCount + ' Complete\n';
			result += status.pendingCount + ' Processing\n';
			result += status.failedCount + ' Failed';
			return result;
		},

		_getStatusOfPromotion: function (items) {
			const completeStatus = 'Complete'; // status from the server
			const processingStatus = 'Processing';
			const statusOfPromotion = {
				completedCount: 0,
				pendingCount: 0,
				failedCount: 0
			};

			return items.reduce(function (statusOfPromotion, currentItem) {
				const status = currentItem.getProperty('mpo_status');

				if (status === processingStatus) {
					statusOfPromotion.pendingCount += 1;
				} else if (status === completeStatus) {
					statusOfPromotion.completedCount += 1;
				} else {
					statusOfPromotion.failedCount += 1;
				}

				return statusOfPromotion;
			}, statusOfPromotion);
		}
	});
});
