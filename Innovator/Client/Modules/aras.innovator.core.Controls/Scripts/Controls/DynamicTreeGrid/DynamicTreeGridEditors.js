(function (window, utils) {
	'use strict';

	window.Grid.editors.dynamicTreeGrid_calendar = function (
		dom,
		columnName,
		rowId,
		value,
		grid,
		metadata
	) {
		let inputField;
		let calendarButton;

		const format = (metadata && metadata.format) || '';
		const arasDateFormat =
			format.replace(/[A-Z]/g, function (match) {
				return '_' + match[0].toLowerCase();
			}) || 'short_date';

		const validationMessage = (metadata && metadata.validationMessage) || '';
		const arasObj = window.aras;

		const isDateValid = function (value) {
			const propertyDefinition = {
				data_type: 'date',
				pattern: arasDateFormat
			};

			return arasObj.isPropertyValueValid(propertyDefinition, value);
		};

		const checkInputValidity = function () {
			if (isDateValid(inputField.value)) {
				grid.settings.focusedCell = Object.assign(grid.settings.focusedCell, {
					valid: true,
					toolTipMessage: ''
				});
			} else {
				utils.dispatchEvent(grid.dom, 'notValidEdit', {
					message: validationMessage
				});
			}
		};

		if (metadata) {
			let isDateDialogOpen = false;
			metadata.willValidate = function (value) {
				//prevent loss of edit state when focusCell event is dispatched because of opening ArasModules.Dialog
				if (isDateDialogOpen) {
					const errorMessage =
						grid.settings.focusedCell.valid === false
							? grid.settings.focusedCell.toolTipMessage
							: '';
					return Promise.reject(errorMessage);
				}

				value = value.trim();

				if (isDateValid(value)) {
					const neutralDate = arasObj.convertToNeutral(
						value,
						'date',
						arasDateFormat
					);
					return Promise.resolve(neutralDate);
				} else {
					return Promise.reject(validationMessage);
				}
			};

			const uiDatePattern = arasObj.getDotNetDatePattern(arasDateFormat);
			metadata.editorClickHandler = function () {
				const currentDate = inputField.value.trim();
				const defaultDate = isDateValid(currentDate) ? currentDate : '';
				isDateDialogOpen = true;

				const dateDialog = ArasModules.Dialog.show('iframe', {
					date: defaultDate,
					format: uiDatePattern,
					aras: arasObj,
					type: 'Date'
				});

				const dialogWidth = dateDialog.dialogNode.offsetWidth;
				const dialogHeight = dateDialog.dialogNode.offsetHeight;
				const iconHeight = 25;
				const rectangle = calendarButton.getBoundingClientRect();
				const calendarButtonPosition = {
					top: Math.round(rectangle.top),
					left: Math.round(rectangle.left)
				};
				const leftPosition = calendarButtonPosition.left - dialogWidth - 3;
				const topPosition =
					calendarButtonPosition.top > dialogHeight
						? calendarButtonPosition.top - dialogHeight
						: calendarButtonPosition.top + iconHeight;
				dateDialog.move(leftPosition, topPosition);

				dateDialog.promise.then(function (newDate) {
					isDateDialogOpen = false;
					// allow empty string to reset date from dialog
					if (newDate || newDate === '') {
						inputField.value = newDate;
						checkInputValidity();
					}
					inputField.focus();
				});
			};
		}

		const editor = window.Grid.editors.calendar(
			dom,
			columnName,
			rowId,
			value,
			grid,
			metadata
		);

		if (metadata) {
			inputField = dom.querySelector('input');
			calendarButton = dom.querySelector('.date__button');

			if (metadata.checkInputValidity !== false) {
				inputField.addEventListener('input', checkInputValidity);
			}
		}

		return editor;
	};
})(window, window.DynamicTreeGridUtils);
