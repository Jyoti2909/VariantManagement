define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		_aras: null,
		isDisabled: false,
		_schemaElement: null,
		_dialogControl: null,
		_containerNode: null,
		_fieldHtmlCache: null,
		_originAttributeDescriptors: null,
		_attributeFieldsCache: null,

		constructor: function (initialParameters) {
			this._aras = initialParameters.aras;
			this._containerNode =
				initialParameters.containerNode ||
				document.querySelector(
					'#' + document.fieldsTab.attrgroup + ' .sys_groupbox_content_vertical'
				);
			this._applyButtonNode =
				initialParameters.applyButtonNode ||
				document.getElementsByName('buttonApply')[0];
			this._originAttributeDescriptors = initialParameters.attrlist || [];
			this._dialogControl = initialParameters.dialog;
			this._schemaElement = initialParameters.wrappedObj;
			this.isDisabled = Boolean(initialParameters.isDisabled);
			this._attributeFieldsCache = {};
			this._fieldHtmlCache = {
				scriptRegExp: /<script[\s\S]*?>([\s\S]*?)<\/script>/gi,
				fieldIdRegExp: /%fieldId%/g,
				fieldNameRegExp: /%fieldName%/g
			};

			this._setupControls();
		},

		_setupControls: function () {
			let attributeDescriptors = this._originAttributeDescriptors;
			let currentAttributeDescriptor;
			let fieldContainerNode;
			let fieldDom;
			let fieldName;

			if (!this.isDisabled) {
				this._applyButtonNode.onclick = function () {
					this.apply();
				}.bind(this);
			} else {
				const btnInputNode = this._applyButtonNode.querySelector('.btn');

				btnInputNode.value = this._aras.getResource(
					'../Modules/aras.innovator.TDF',
					'attributesDialog.close'
				);

				this._applyButtonNode.onclick = function () {
					this._dialogControl.close();
				}.bind(this);
			}

			for (let i = 0; i < attributeDescriptors.length; i++) {
				currentAttributeDescriptor = this._normalizeAttributeDescriptor(
					attributeDescriptors[i]
				);
				fieldName = currentAttributeDescriptor.name;

				fieldContainerNode = document.createElement('div');
				fieldContainerNode.setAttribute('class', 'fieldContainer');
				this._containerNode.appendChild(fieldContainerNode);

				fieldDom = this._createAttributeField({
					containerNode: fieldContainerNode,
					attributeDescriptor: currentAttributeDescriptor
				});

				if (fieldDom) {
					this._attributeFieldsCache[fieldName] = {
						descriptor: currentAttributeDescriptor,
						dom: fieldDom,
						isValueValid: true
					};

					this._setupFieldEventHandlers(fieldName);
					this._setupFieldValue(
						fieldName,
						currentAttributeDescriptor.initialValue || ''
					);
					this._setupFieldReadonlyState(fieldName);
				} else {
					this._containerNode.removeChild(fieldContainerNode);
				}
			}
		},

		_createAttributeField: function (inputParameters) {
			const attributeDescriptor =
				inputParameters && inputParameters.attributeDescriptor;

			if (attributeDescriptor) {
				const containerNode = inputParameters.containerNode || document.body;
				const fieldHtmlData = this._getAttributeFieldHtml(attributeDescriptor);
				let tempContainerNode;
				let scriptNode;
				let formField;
				let fieldNode;
				let errorNode;
				let labelNode;

				// creation of attribute field DOM
				tempContainerNode = document.createElement('div');
				tempContainerNode.innerHTML = fieldHtmlData.html;
				fieldNode = tempContainerNode.querySelector(
					'div[name="' + attributeDescriptor.name + '"]'
				);

				scriptNode = document.createElement('script');
				scriptNode.textContent = fieldHtmlData.scripts;
				fieldNode.appendChild(scriptNode);
				containerNode.appendChild(fieldNode);

				// add title attribute for the list label
				labelNode = fieldNode.querySelector('.aras-field__label, .sys_f_label');
				labelNode.setAttribute('title', labelNode.textContent);

				// error node creation
				errorNode = document.createElement('div');
				errorNode.innerHTML = '<span class="errorMark"></span>';
				errorNode = errorNode.querySelector('.errorMark');
				containerNode.appendChild(errorNode);

				// after changes in form rendering dropdown field is rendered as component
				formField =
					getFieldComponentById(fieldHtmlData.id) ||
					document.getElementById(fieldHtmlData.id + 'span');

				return {
					containerNode: containerNode,
					formField: formField,
					inputNode: formField.component
						? formField.dom.querySelector('input')
						: formField.querySelector('input'),
					errorNode: errorNode
				};
			}
		},

		_getAttributeFieldHtml: function (attributeDescriptor) {
			const fieldCacheId = attributeDescriptor.fieldType;
			let fieldHtmlData = this._fieldHtmlCache[fieldCacheId];
			const fieldId = 'id' + this._aras.generateNewGUID();
			const fieldIdRegExp = this._fieldHtmlCache.fieldIdRegExp;
			const fieldNameRegExp = this._fieldHtmlCache.fieldNameRegExp;

			if (!fieldHtmlData) {
				const fieldAML =
					'' +
					'<Item type="Field" id="%fieldId%">' +
					'	<display_length>145</display_length>' +
					'	<display_length_unit>px</display_length_unit>' +
					'	<field_type>' +
					attributeDescriptor.fieldType +
					'</field_type>' +
					'	<font_size>12px</font_size>' +
					'	<is_visible>1</is_visible>' +
					'	<label>%fieldName%</label>' +
					'	<label_position>left</label_position>' +
					'	<positioning>relative</positioning>' +
					'	<tab_stop>1</tab_stop>' +
					'	<name>%fieldName%</name>' +
					'</Item>';
				const scriptRegExp = this._fieldHtmlCache.scriptRegExp;
				const fieldDom = this._aras.createXMLDocument();
				const scriptContent = [];
				let fieldHtml;
				let currentMatch;

				fieldDom.loadXML(fieldAML);
				fieldHtml = this._aras.uiDrawFieldEx(
					fieldDom.documentElement,
					null,
					'edit'
				);

				// searching for all script blocks in fieldHtml
				while ((currentMatch = scriptRegExp.exec(fieldHtml)) !== null) {
					scriptContent.push(currentMatch[1]);
				}

				// cutting off script blocks from fieldHtml
				fieldHtml = fieldHtml.replace(scriptRegExp, '');

				this._fieldHtmlCache[fieldCacheId] = fieldHtmlData = {
					html: fieldHtml,
					scripts: scriptContent.join('\n')
				};
			}

			return {
				id: fieldId,
				html: fieldHtmlData.html
					.replace(fieldIdRegExp, fieldId)
					.replace(fieldNameRegExp, attributeDescriptor.name),
				scripts: fieldHtmlData.scripts
					.replace(fieldIdRegExp, fieldId)
					.replace(fieldNameRegExp, attributeDescriptor.name)
			};
		},

		_setupFieldEventHandlers: function (fieldName) {
			const fieldInfo = this._attributeFieldsCache[fieldName];
			const formField = fieldInfo.dom.formField;

			if (!formField.component) {
				fieldInfo.dom.inputNode.addEventListener(
					'input',
					function () {
						this._validateFieldHandler(fieldName);
					}.bind(this)
				);
			} else {
				formField.component.format = this._dropDownFormatter;
				this._disableFieldManualEditing(formField);

				formField.component.addEventListener(
					'change',
					function () {
						this._validateFieldHandler(fieldName);
					}.bind(this)
				);
			}
		},

		_setupFieldValue: function (fieldName, fieldValue) {
			const fieldInfo = this._attributeFieldsCache[fieldName];
			const formField = fieldInfo.dom.formField;
			const attributeDescriptor = fieldInfo.descriptor;

			if (!formField.component) {
				switch (attributeDescriptor.valueType) {
					case 'boolean':
						fieldInfo.dom.inputNode.checked =
							fieldValue.toLowerCase() == 'true' ||
							fieldValue.toLowerCase() == '1';
						break;
					default:
						fieldInfo.dom.inputNode.value = fieldValue;
						break;
				}
			} else {
				switch (attributeDescriptor.fieldType) {
					case 'dropdown':
						const attributeRestrictions = attributeDescriptor.restrictions;

						if (attributeRestrictions.enumeration) {
							const optionDescriptors = [{ label: '', value: '' }];
							let enumerationValue;

							//populate highlighted first
							for (
								let i = 0;
								i < attributeRestrictions.enumeration.length;
								i++
							) {
								enumerationValue = attributeRestrictions.enumeration[i];

								optionDescriptors.push({
									label: enumerationValue,
									value: enumerationValue
								});
							}

							formField.component.setState({
								list: optionDescriptors
							});
						}
						break;
					default:
						break;
				}

				formField.setValue(fieldValue);
			}

			this._validateFieldHandler(fieldName);
		},

		_setupFieldReadonlyState: function (fieldName) {
			const fieldInfo = this._attributeFieldsCache[fieldName];
			const attributeDescriptor = (fieldInfo && fieldInfo.descriptor) || {};

			if (attributeDescriptor.isFixed || this.isDisabled) {
				const formField = fieldInfo.dom.formField;

				if (!formField.component) {
					fieldInfo.dom.inputNode.setAttribute('disabled', 'true');
				} else {
					formField.setDisabled(true);
				}
			}
		},

		_dropDownFormatter: function (format) {
			var dropDownFormat = format.children[3];
			var inputNode = this.state.refs.input;

			dropDownFormat.style.top = inputNode.offsetHeight - 1 + 'px';
			dropDownFormat.style.width = '130px';
			dropDownFormat.style.maxHeight = '100px';
		},

		_getManualEditDisabledTemplate: function () {
			// template is overriden in order to disable manual input (value can be changed only with dropdown)
			// current component implementation doesn't support such customization and this code can be remove if it happens
			const label = this._getCurrentInputValue();

			return {
				tag: 'span',
				className: 'aras-filter-list__input aras-form-input',
				attrs: {
					style: 'display:inline-flex;align-items:center;',
					tabindex: '1'
				},
				children: [label],
				events: {
					onblur: function (blurEvent) {
						this._onInputFocusoutHandler(blurEvent);
					}.bind(this),
					onmousedown: function (e) {
						if (!this.state.disabled) {
							this._onButtonClickHandler(e);
						}
					}.bind(this),
					onchange: function (e) {
						this.setState({
							value: this.state.predictedValue
						});
					}.bind(this)
				},
				ref: function (node) {
					this.state.refs.input = node;
				}.bind(this)
			};
		},

		_disableFieldManualEditing: function (targetFieldComponent) {
			if (targetFieldComponent && targetFieldComponent.component) {
				targetFieldComponent.component._getInputTemplate = this._getManualEditDisabledTemplate;
			}
		},

		_normalizeAttributeDescriptor: function (attributeDescriptor) {
			const normalizedRestrictionsList = {};
			const normalizedDescriptor = {
				name: attributeDescriptor.Name,
				valueType: attributeDescriptor.ValueType,
				typeCode: attributeDescriptor.TypeCode,
				isRequired:
					attributeDescriptor.Use &&
					attributeDescriptor.Use.toLowerCase() == 'required',
				isFixed: Boolean(attributeDescriptor.Fixed),
				fieldType:
					attributeDescriptor.ValueType == 'boolean' ? 'checkbox' : 'text',
				restrictions: normalizedRestrictionsList,
				defaultValue: attributeDescriptor.Default,
				initialValue:
					attributeDescriptor.Fixed ||
					this._schemaElement.Attribute(attributeDescriptor.Name) ||
					attributeDescriptor.Default
			};
			const valueRestrictions = attributeDescriptor.Restriction || [];

			if (valueRestrictions && valueRestrictions.length) {
				const enumFacets = valueRestrictions.filter(function (facetDescriptor) {
					return facetDescriptor.Type === 'enumeration';
				});
				let facetDescriptor;
				let i;

				if (enumFacets.length) {
					normalizedRestrictionsList.enumeration = enumFacets.map(function (
						facetDescriptor
					) {
						return facetDescriptor.Value;
					});

					normalizedDescriptor.fieldType = 'dropdown';
				} else {
					if (normalizedDescriptor.valueType === 'boolean') {
						normalizedDescriptor.fieldType = 'checkbox';
					}
				}

				for (i = 0; i < valueRestrictions.length; i++) {
					facetDescriptor = valueRestrictions[i];

					if (facetDescriptor.Type != 'enumeration') {
						normalizedRestrictionsList[facetDescriptor.Type] =
							facetDescriptor.Value;
					}
				}
			}

			return normalizedDescriptor;
		},

		_getFieldValue: function (attributeName) {
			const fieldInfo = this._attributeFieldsCache[attributeName];

			if (fieldInfo) {
				const formField = fieldInfo.dom.formField;
				let fieldValue;

				if (formField.component) {
					fieldValue = formField.getValue();
				} else {
					const inputNode = fieldInfo.dom.inputNode;

					fieldValue =
						fieldInfo.descriptor.valueType == 'boolean'
							? inputNode.checked.toString()
							: inputNode.value;
				}

				return fieldValue;
			}
		},

		_validateFieldValue: function (attributeName) {
			const fieldInfo = this._attributeFieldsCache[attributeName];
			let validationErrors = [];

			if (fieldInfo) {
				const valueRestrictions = fieldInfo.descriptor.restrictions;
				const valueType = fieldInfo.descriptor.valueType;
				let fieldValue = this._getFieldValue(attributeName);

				if (fieldValue) {
					fieldValue = valueRestrictions.whitespace
						? this._applyWhitespaceRestriction(
								valueRestrictions.whitespace,
								fieldValue
						  )
						: fieldValue;

					// common restrictions validations
					validationErrors = validationErrors.concat(
						this._checkPatternRestriction(valueRestrictions, fieldValue)
					);
					validationErrors = validationErrors.concat(
						this._checkEnumerationRestriction(valueRestrictions, fieldValue)
					);

					// type-specific restrictions validation
					switch (fieldInfo.descriptor.valueType) {
						case 'string':
						case 'string[]':
						case 'uri':
						case 'xmlqualifiedname':
							validationErrors = validationErrors.concat(
								this._checkStringRestrictions(
									valueRestrictions,
									fieldValue,
									valueType
								)
							);
							break;
						case 'byte':
						case 'sbyte':
						case 'int16':
						case 'uint16':
						case 'int32':
						case 'uint32':
						case 'int64':
						case 'uint64':
						case 'decimal':
						case 'single':
						case 'double':
						case 'datetime':
							validationErrors = validationErrors.concat(
								this._checkDecimalResctrictions(
									valueRestrictions,
									fieldValue,
									fieldInfo.descriptor.typeCode
								)
							);
							break;
						default:
							break;
					}
				}

				if (!fieldValue && fieldInfo.descriptor.isRequired) {
					validationErrors.push(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'attributeValidation.isRequired',
							attributeName
						)
					);
				}
			}

			return validationErrors;
		},

		_applyWhitespaceRestriction: function (whitespaceRestriction, targetValue) {
			targetValue = targetValue ? targetValue.toString() : '';

			switch (whitespaceRestriction) {
				case 'replace':
					// line feeds, tabs, spaces, and carriage returns are replaced with spaces
					targetValue = targetValue.replace(/\s/g, ' ');
					break;
				case 'collapse':
					// line feeds, tabs, spaces, carriage returns are replaced with spaces
					// leading and trailing spaces are removed, and multiple spaces are reduced to a single space
					targetValue = targetValue
						.replace(/\s/g, ' ')
						.replace(/(\s)+/g, ' ')
						.replace(/^\s+|\s+$/g, '');
					break;
				default:
					break;
			}

			return targetValue;
		},

		_checkStringRestrictions: function (
			valueRestrictions,
			stringValue,
			valueType
		) {
			const validationErrors = [];

			valueRestrictions = valueRestrictions || {};
			stringValue = stringValue.toString();

			if (valueRestrictions.length !== undefined) {
				if (stringValue.length !== parseInt(valueRestrictions.length, 10)) {
					validationErrors.push(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'attributeValidation.lengthRestriction',
							valueRestrictions.length,
							stringValue.length
						)
					);
				}
			} else {
				if (valueRestrictions.minlength) {
					const minLength = Math.max(
						parseInt(valueRestrictions.minlength, 10),
						0
					);

					if (stringValue.length < minLength) {
						validationErrors.push(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								'attributeValidation.minLengthRestriction',
								minLength
							)
						);
					}
				}

				if (valueRestrictions.maxlength) {
					const maxLength = Math.min(
						parseInt(valueRestrictions.maxlength, 10),
						Number.MAX_VALUE
					);

					if (stringValue.length > maxLength) {
						validationErrors.push(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								'attributeValidation.maxLengthRestriction',
								maxLength
							)
						);
					}
				}
			}

			return validationErrors;
		},

		_checkDecimalResctrictions: function (
			valueRestrictions,
			decimalValue,
			valueType
		) {
			const validationErrors = [];
			const isDate = valueType == 'datetime';

			decimalValue = isDate
				? Date.parse(decimalValue)
				: parseFloat(decimalValue);
			valueRestrictions = valueRestrictions || {};

			if (isNaN(decimalValue)) {
				validationErrors.push(
					this._aras.getResource(
						'../Modules/aras.innovator.TDF',
						'attributeValidation.notValidType',
						valueType
					)
				);
			} else {
				if (valueRestrictions.totaldigits !== undefined) {
					const valueDigits = Math.abs(decimalValue).toString().replace('.', '')
						.length;

					if (valueDigits > parseInt(valueRestrictions.totaldigits, 10)) {
						validationErrors.push(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								'attributeValidation.totalDigits',
								valueRestrictions.totaldigits,
								valueDigits
							)
						);
					}
				}

				if (valueRestrictions.fractiondigits !== undefined) {
					const stringifiedValue = Math.abs(decimalValue).toString();
					const separatorPosition = stringifiedValue.indexOf('.');

					if (separatorPosition > -1) {
						const fractionDigits =
							stringifiedValue.length - (separatorPosition + 1);

						if (
							fractionDigits > parseInt(valueRestrictions.fractiondigits, 10)
						) {
							validationErrors.push(
								this._aras.getResource(
									'../Modules/aras.innovator.TDF',
									'attributeValidation.fractionDigits',
									valueRestrictions.fractiondigits,
									fractionDigits
								)
							);
						}
					}
				}

				if (
					valueRestrictions.mininclusive !== undefined ||
					valueRestrictions.minexclusive !== undefined
				) {
					const isInclusive = valueRestrictions.mininclusive !== undefined;
					const restrictionValue = isInclusive
						? valueRestrictions.mininclusive
						: valueRestrictions.minexclusive;
					const minValue = isDate
						? Date.parse(restrictionValue)
						: parseFloat(restrictionValue);

					if (
						isInclusive ? decimalValue < minValue : decimalValue <= minValue
					) {
						validationErrors.push(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								isInclusive
									? 'attributeValidation.minInclusive'
									: 'attributeValidation.minExclusive',
								restrictionValue
							)
						);
					}
				}

				if (
					valueRestrictions.maxinclusive !== undefined ||
					valueRestrictions.maxexclusive !== undefined
				) {
					const isInclusive = valueRestrictions.maxinclusive !== undefined;
					const restrictionValue = isInclusive
						? valueRestrictions.maxinclusive
						: valueRestrictions.maxexclusive;
					const maxValue = isDate
						? Date.parse(restrictionValue)
						: parseFloat(restrictionValue);

					if (
						isInclusive ? decimalValue > maxValue : decimalValue >= maxValue
					) {
						validationErrors.push(
							this._aras.getResource(
								'../Modules/aras.innovator.TDF',
								isInclusive
									? 'attributeValidation.maxInclusive'
									: 'attributeValidation.maxExclusive',
								restrictionValue
							)
						);
					}
				}
			}

			return validationErrors;
		},

		_checkEnumerationRestriction: function (valueRestrictions, stringValue) {
			const validationErrors = [];

			if (valueRestrictions && valueRestrictions.enumeration) {
				if (valueRestrictions.enumeration.indexOf(stringValue) === -1) {
					validationErrors.push(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'attributeValidation.enumeration'
						)
					);
				}
			}

			return validationErrors;
		},

		_checkPatternRestriction: function (valueRestrictions, stringValue) {
			const validationErrors = [];

			if (valueRestrictions && valueRestrictions.pattern) {
				let restrictionPattern = valueRestrictions.pattern;
				let validationRegExp;

				restrictionPattern =
					(restrictionPattern.startsWith('^') ? '' : '^') +
					restrictionPattern +
					(restrictionPattern.endsWith('$') ? '' : '$');

				validationRegExp = new RegExp(restrictionPattern);

				if (!validationRegExp.test(stringValue)) {
					validationErrors.push(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'attributeValidation.pattern',
							valueRestrictions.pattern
						)
					);
				}
			}

			return validationErrors;
		},

		_validateFieldHandler: function (attributeName) {
			const fieldInfo = this._attributeFieldsCache[attributeName];
			const validationErrors = this._validateFieldValue(attributeName);
			const errorNode = fieldInfo.dom.errorNode;

			fieldInfo.isValueValid = !validationErrors.length;

			if (validationErrors.length) {
				errorNode.setAttribute(
					'title',
					validationErrors.join('\u000A').replace(/\\n/g, '\u000A')
				);
				fieldInfo.dom.containerNode.classList.add('invalidValue');
			} else {
				fieldInfo.dom.containerNode.classList.remove('invalidValue');
			}
		},

		apply: function () {
			const fieldsCache = this._attributeFieldsCache;
			const selectedValues = this._aras.newObject();
			let fieldInfo;
			let attributeName;
			let fieldValue;

			for (attributeName in fieldsCache) {
				fieldValue = this._getFieldValue(attributeName);
				fieldInfo = this._attributeFieldsCache[attributeName];

				if (fieldValue) {
					fieldValue = this._applyWhitespaceRestriction(
						fieldInfo.descriptor.restrictions.whitespace,
						fieldValue
					);
				}

				selectedValues[attributeName] =
					fieldValue || fieldInfo.descriptor.defaultValue;
			}

			this._dialogControl.close(selectedValues);
		}
	});
});
