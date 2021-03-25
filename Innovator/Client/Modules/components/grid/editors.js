import intl from '../../core/intl';
import validators from './validators';
class ComponentValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ComponentValidationError';
	}
}

const setCursorToEnd = (input, value) => {
	const length = value.length;
	input.setSelectionRange(length, length);
};

const convertFloatToNeutral = (value) =>
	value ? intl.number.toString(intl.number.parseFloat(value)) : value;

const convertNeutralToFloat = (value, options) =>
	value ? intl.number.format(intl.number.parseFloat(value), options) : value;

const getValidationMethod = (validatorType, headId, grid, metadata) => {
	return (value) => validators[validatorType](value, metadata);
};

const createSingularWithTypeAHead = (
	componentName,
	initialState,
	dom,
	metadata
) => {
	const component = document.createElement(componentName);
	const validation = !initialState.validation;

	component.setState(initialState);
	dom.appendChild(component);
	dom.classList.add('aras-grid-active-cell__singular');

	if (metadata && metadata.editorClickHandler) {
		component.showDialogHandler = metadata.editorClickHandler;
	}

	return function () {
		return {
			value: component.state.value,
			willValidate:
				validation ||
				(component.state.invalid
					? () =>
							Promise.reject(
								new ComponentValidationError(
									`The invalid state of component: ${componentName}`
								)
							)
					: () => Promise.resolve(component.state.value))
		};
	};
};

const startInputValidation = (inputField, checkValidity, grid) => {
	inputField.addEventListener('input', () => {
		const validationResult = checkValidity(inputField.value);
		if (validationResult.valid) {
			grid.settings.focusedCell = Object.assign(grid.settings.focusedCell, {
				valid: true,
				toolTipMessage: ''
			});
		} else {
			grid.dom.dispatchEvent(
				new CustomEvent('notValidEdit', {
					detail: { message: validationResult.validationMessage }
				})
			);
		}
	});
};

const getWillValidate = (inputField, metadata) => {
	let validate = metadata && metadata.willValidate;
	if (metadata && metadata.checkValidity) {
		const validationResult = metadata.checkValidity(inputField.value);
		validate = validationResult.valid
			? validate
			: () => Promise.reject(validationResult.validationMessage);
	}
	return validate;
};

const createInputField = (dom, headId, rowId, value, grid, metadata) => {
	const inputField = HyperHTMLElement.hyper`<input class="aras-form-input" type="text" value="${
		value || value === 0 ? value : ''
	}">`;
	const inputWrapper = HyperHTMLElement.hyper`
		<div class="aras-form-input__wrapper">
			${inputField}
			<span class="aras-filter-list-icon aras-icon-error" />
		</div>
	`;

	dom.classList.add('aras-grid-active-cell__input', 'aras-form');
	dom.appendChild(inputWrapper);

	const checkValidity = metadata && metadata.checkValidity;
	if (checkValidity) {
		startInputValidation(inputField, checkValidity, grid);
	}
	inputField.focus();

	// set cursor to end input, need only IE11 specific
	setCursorToEnd(inputField, inputField.value);

	return inputField;
};

const commonEditors = {
	text: function (dom, headId, rowId, value, grid, metadata) {
		const inputField = createInputField(
			dom,
			headId,
			rowId,
			value,
			grid,
			metadata
		);
		return function () {
			return {
				value: inputField.value,
				willValidate: getWillValidate(inputField, metadata)
			};
		};
	},
	link: function (dom, headId, rowId, value, grid, metadata) {
		const inputField = document.createElement('input');
		inputField.type = 'text';
		inputField.value = value || '';

		const inputWrapper = document.createElement('div');
		inputWrapper.classList.add(
			'aras-form-singular',
			'aras-form-singular_light'
		);
		const errorSpan = document.createElement('span');
		errorSpan.classList.add('aras-filter-list-icon');
		errorSpan.classList.add('aras-icon-error');
		const span = document.createElement('span');
		span.classList.add('singular__button');
		if (metadata && metadata.editorClickHandler) {
			span.addEventListener('click', metadata.editorClickHandler);
			inputField.addEventListener('keydown', function (e) {
				if (e.key === 'F2') {
					metadata.editorClickHandler();
				}
			});
		}
		inputWrapper.appendChild(inputField);
		inputWrapper.appendChild(errorSpan);
		inputWrapper.appendChild(span);

		dom.classList.add('aras-grid-active-cell__singular', 'aras-form');
		dom.appendChild(inputWrapper);
		inputField.focus();

		return function () {
			return {
				value: inputField.value,
				willValidate: metadata && metadata.willValidate
			};
		};
	},
	calendar: function (dom, headId, rowId, value, grid, metadata = {}) {
		const inputField = document.createElement('input');
		inputField.type = 'text';

		let format = metadata.format || 'short_date';
		format = format.replace(/[A-Z]/g, function (match) {
			return '_' + match[0].toLowerCase();
		});
		const dateFormat = aras.getDateFormatByPattern(format);
		const dotNetPattern = aras.getDotNetDatePattern(dateFormat);

		const formattedDate = aras.convertFromNeutral(value, 'date', dotNetPattern);
		inputField.value = formattedDate || '';

		const inputWrapper = document.createElement('div');
		inputWrapper.classList.add('aras-form-date');
		const errorSpan = document.createElement('span');
		errorSpan.classList.add('aras-filter-list-icon');
		errorSpan.classList.add('aras-icon-error');
		const span = document.createElement('span');
		span.classList.add('date__button');
		if (metadata && metadata.editorClickHandler) {
			span.addEventListener('click', metadata.editorClickHandler);
			inputField.addEventListener('keydown', function (e) {
				if (e.key === 'F2') {
					metadata.editorClickHandler();
				}
			});
		}
		inputWrapper.appendChild(inputField);
		inputWrapper.appendChild(errorSpan);
		inputWrapper.appendChild(span);

		dom.classList.add('aras-grid-active-cell__calendar', 'aras-form');
		dom.appendChild(inputWrapper);
		inputField.focus();

		// set cursor to end input, need only IE11 specific
		setCursorToEnd(inputField, inputField.value);

		const checkValidity = metadata && metadata.checkValidity;
		if (checkValidity) {
			startInputValidation(inputField, checkValidity, grid);
		}

		return function () {
			return {
				value: aras.convertToNeutral(inputField.value, 'date', dotNetPattern),
				willValidate: getWillValidate(inputField, metadata)
			};
		};
	},
	select: function (dom, headId, rowId, value, grid, metadata) {
		const filterList = document.createElement('aras-filter-list');
		const validation = metadata && metadata.willValidate;
		let options = metadata && (metadata.options || metadata.list);

		const isEmptyExist = options.some(
			(item) => item.value === '' && item.label === ''
		);

		options = options.filter(
			(option) => !(option.inactive && option.value !== value)
		);

		const list = isEmptyExist
			? options
			: [
					{
						value: '',
						label: '',
						filter: ''
					},
					...options
			  ];

		filterList.setState({
			list,
			value: value,
			validation: !validation,
			focus: true
		});

		dom.classList.add('aras-grid-active-cell__select');
		dom.appendChild(filterList);

		return function () {
			const currentValue = filterList.state.value;
			return {
				value: currentValue,
				willValidate:
					validation ||
					(filterList.state.invalid
						? () =>
								Promise.reject(
									new ComponentValidationError(
										'State of filter list is invalid'
									)
								)
						: () => Promise.resolve(currentValue))
			};
		};
	}
};

const gridEditors = {
	text: commonEditors.text,
	select: commonEditors.select,
	link: commonEditors.link,
	calendar: commonEditors.calendar,
	string(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = { ...metadata };
		clonedMetadata.checkValidity = (value) => {
			const maxLength = metadata.maxLength;
			const pattern = metadata.format;
			let isValidPattern = true;
			let isValidLength = true;

			if (maxLength) {
				isValidLength = value.length <= maxLength;
			}

			if (pattern) {
				const regExp = new RegExp(pattern);
				isValidPattern = !value || regExp.test(value);
			}

			if (!isValidLength || !isValidPattern) {
				const patternValidationMessage = aras.getResource(
					'',
					'aras_object.value_property_invalid_must_correspond_with_pattern',
					pattern
				);
				const lengthValidationMessage = aras.getResource(
					'',
					'aras_object.length_properties_value_canot_be_larger',
					maxLength
				);
				return {
					valid: false,
					validationMessage: isValidLength
						? patternValidationMessage
						: lengthValidationMessage
				};
			}

			return {
				valid: true
			};
		};
		return commonEditors.text(dom, headId, rowId, value, grid, clonedMetadata);
	},
	classification(dom, headId, rowId, value, grid, metadata) {
		const validation = metadata && metadata.willValidate;
		const initialState = {
			list: metadata && (metadata.options || metadata.list),
			validation: !validation,
			value: value,
			focus: true
		};

		return createSingularWithTypeAHead(
			'aras-classification-property',
			initialState,
			dom,
			metadata
		);
	},
	date(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = {
			...metadata,
			checkValidity: getValidationMethod('date', headId, grid, metadata)
		};
		return commonEditors.calendar(
			dom,
			headId,
			rowId,
			value,
			grid,
			clonedMetadata
		);
	},
	list: commonEditors.select,
	'filter list'(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = { ...metadata };
		const propertyName = grid.head.get(headId, 'pattern');
		const columnName = grid.settings.indexHead.find((columnName) =>
			columnName.startsWith(propertyName)
		);
		const filterValue = grid.rows.get(rowId, propertyName || columnName);

		if (filterValue) {
			clonedMetadata.list = clonedMetadata.list.filter(
				(option) => option.filter === filterValue
			);
		}

		return commonEditors.select(
			dom,
			headId,
			rowId,
			value,
			grid,
			clonedMetadata
		);
	},
	'color list': commonEditors.select,
	decimal(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = {
			...metadata,
			checkValidity: getValidationMethod('float', headId, grid, metadata)
		};
		const inputField = createInputField(
			dom,
			headId,
			rowId,
			convertNeutralToFloat(value, {
				minimumFractionDigits: clonedMetadata.scale
			}),
			grid,
			clonedMetadata
		);
		return function () {
			return {
				value: convertFloatToNeutral(inputField.value),
				willValidate: getWillValidate(inputField, clonedMetadata)
			};
		};
	},
	float(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = {
			...metadata,
			checkValidity: getValidationMethod('float', headId, grid)
		};
		const inputField = createInputField(
			dom,
			headId,
			rowId,
			convertNeutralToFloat(value),
			grid,
			clonedMetadata
		);
		return function () {
			return {
				value: convertFloatToNeutral(inputField.value),
				willValidate: getWillValidate(inputField, clonedMetadata)
			};
		};
	},
	integer(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = {
			...metadata,
			checkValidity: getValidationMethod('integer', headId, grid)
		};

		const inputField = createInputField(
			dom,
			headId,
			rowId,
			value,
			grid,
			clonedMetadata
		);
		return function () {
			return {
				value: intl.number.toString(inputField.value),
				willValidate: getWillValidate(inputField, clonedMetadata)
			};
		};
	},
	ubigint(dom, headId, rowId, value, grid, metadata) {
		const clonedMetadata = {
			...metadata,
			checkValidity: getValidationMethod('ubigint', headId, grid)
		};
		const inputField = createInputField(
			dom,
			headId,
			rowId,
			value,
			grid,
			clonedMetadata
		);
		return function () {
			return {
				value: inputField.value.trim(),
				willValidate: getWillValidate(inputField, clonedMetadata)
			};
		};
	},
	md5(dom, headId, rowId, value, grid, metadata) {
		return commonEditors.text(dom, headId, rowId, '***', grid, metadata);
	},
	federated: commonEditors.text,
	ml_string(dom, headId, rowId, value, grid, metadata) {
		const inputField = createInputField(
			dom,
			headId,
			rowId,
			value,
			grid,
			metadata
		);

		inputField.addEventListener('keydown', (e) => {
			if (e.key === 'F2') {
				metadata.editorClickHandler();
			}
		});

		return function () {
			return {
				value: inputField.value
			};
		};
	},
	item(dom, headId, rowId, value, grid, metadata) {
		const propertyName = grid.head.get(headId, 'name') || headId;
		const itemName =
			grid.rows.get(rowId, `${propertyName}@aras.keyed_name`) || value;

		const validation = metadata && metadata.willValidate;
		const initialState = {
			itemType: metadata && metadata.itemType,
			validation: !validation,
			value: itemName,
			focus: true
		};

		return createSingularWithTypeAHead(
			'aras-item-property',
			initialState,
			dom,
			metadata
		);
	},
	mv_list(dom, headId, rowId, value, grid, metadata) {
		const checkedValues = value ? value.split(',') : [];
		let dropdownNode;
		const selectValue = (e) => {
			e.preventDefault();
			const listNode = e.target.closest('.aras-list-item');
			if (!listNode) {
				return;
			}

			const selectedValue = listNode.dataset.value;
			const indexInCheckedList = checkedValues.indexOf(selectedValue);

			if (indexInCheckedList === -1) {
				checkedValues.push(selectedValue);
			} else {
				checkedValues.splice(indexInCheckedList, 1);
			}
			render();
		};

		const options = (metadata.options || metadata.list || []).filter(
			(option) => !(option.inactive && !checkedValues.includes(option.value))
		);

		const render = () => {
			const items = options.map(function (item) {
				const isOptionChecked = checkedValues.indexOf(item.value) !== -1;
				return HyperHTMLElement.hyper(item, `:id:${item.value}`)`
					<li class="aras-list-item aras-list-item_shown" data-value="${item.value}">
						<label class="aras-checkbox">
							<input type="checkbox" checked="${isOptionChecked}" class="aras-checkbox__input"></input>
							<span class="aras-checkbox__check-button"></span>
							${item.label}
						</label>
					</li>`;
			});
			const inputField = HyperHTMLElement.hyper(
				dom,
				`:id:${checkedValues.length}`
			)`
				<span class="aras-filter-list__input aras-form-input aras-grid-row-cell__mv-list-input">
					${aras.getResource('', 'common.items_selected', checkedValues.length)}
				</span>
			`;

			const listNode = HyperHTMLElement.hyper(items)`
				<ul class="aras-list" onclick=${selectValue}>
					${items}
				</ul>
			`;
			dropdownNode = HyperHTMLElement.hyper(checkedValues)`
				<aras-dropdown class="aras-filter-list aras-dropdown-container aras-grid-multi-list" position="bottom-left" >
					${inputField}
					<button dropdown-button="" class="aras-filter-list__button aras-btn aras-icon-arrow aras-icon-arrow_down" />
					<div class="aras-filter-list__dropdown aras-dropdown">
						${listNode}
					</div>
				</aras-dropdown>`;
		};

		render();
		dom.appendChild(dropdownNode);

		return function () {
			return {
				value: checkedValues.join(',')
			};
		};
	}
};

export default gridEditors;
