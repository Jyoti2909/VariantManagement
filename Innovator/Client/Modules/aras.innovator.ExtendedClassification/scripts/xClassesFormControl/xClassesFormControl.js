(function (wnd) {
	var defaultTextWidth = 100;
	var defaultFieldWidth = 126;

	function XControlNav() {
		const self = ArasModules.utils.extendHTMLElement.call(this);
		this.init.call(self);
		return self;
	}

	XControlNav.prototype = {
		constructor: Nav.prototype.constructor,
		init: function () {
			this.dom = this;
			this._renderingPromise = null;
			this._lastAnimation = null;
			this.dataStore = {
				roots: null, // <Set>
				items: null // <Map>
			};
			this.selectedItemKey = null;
			this.expandedItemsKeys = new Set();
			this.templates = XControlTemplates(this);
			var self = this;
			this.dom.addEventListener('click', function (event) {
				if (
					!event.target.classList.contains(
						'aras-field-xclasses__delete-cross'
					) &&
					event.target.closest('li.aras-nav__parent > div')
				) {
					var itemKey = self._getKeyByDomElement(event.target);
					self._toggleItemExpansion(itemKey);
				}
			});
		}
	};

	var XClassesFormControl = function (domElement, itemTypeId) {
		this._domElement = domElement;
		this._fieldset = this._domElement.querySelector(
			'fieldset.aras-field-xclasses'
		);
		this._navContainer = this._fieldset.querySelector('.nav-container');
		this._expandArrow = this._fieldset.querySelector(
			'.aras-field-xclasses-expand-arrow'
		);
		this._ellipsesButton = this._fieldset.querySelector(
			'.aras-field-xclasses-ellipses'
		);
		this._isEditMode = false;
		this._isDisabled = false;
		this._fieldValues = {};
		this._fieldPermissions = {};
		this._itemTypeId = itemTypeId;
		this._removedXClasses = new Set();
		this._restrictedFields = new Set();
		this._fieldContextMenu = new ArasModules.ContextMenu();

		this._fieldContextMenu.on = function (event, callback) {
			const handler = function (e) {
				const node = e.target;
				const targetNode = node.closest('li[data-index]');
				const elementId = targetNode.dataset.index;
				callback(elementId, e, this.args);

				if (!targetNode.classList.contains('aras-list__parent')) {
					this.dom.classList.remove('aras-contextMenu_opened');
				}
			}.bind(this);
			this.dom.addEventListener(event, handler);
			return function () {
				this.dom.removeEventListener(event, handler);
			}.bind(this);
		};
	};

	XClassesFormControl.prototype = {
		init: function (classIDs, initialData) {
			this._componentsHash = this._componentsHash || {};
			this.initialData = initialData || {};
			this._xClassIds = new Set(classIDs);
			this._removedXClasses = new Set(this.initialData.removedXClasses);
			this._restrictedFields = new Set(this.initialData.restrictedFields);
			this._discoverOnlyFields = new Set(this.initialData.discoverOnlyFields);

			if (!this._nav) {
				this._isDisabled = this.initialData.isDisabled || false;
				this._isEditMode =
					(this.initialData.isEditMode && !this._isDisabled) || false;
				this._nav = new XControlNav();
				this._navContainer.appendChild(this._nav);

				var fieldContextMenuData = {
					reset: {
						label: aras.getResource(
							'../Modules/aras.innovator.ExtendedClassification/',
							'xClassesControl.field_context_menu.reset'
						)
					},
					permissions: {
						label: aras.getResource(
							'../Modules/aras.innovator.ExtendedClassification/',
							'xClassesControl.field_context_menu.permission'
						),
						children: {
							viewPermission: {
								label: aras.getResource(
									'../Modules/aras.innovator.ExtendedClassification/',
									'xClassesControl.field_context_menu.viewPermission'
								)
							},
							createPermission: {
								label: aras.getResource(
									'../Modules/aras.innovator.ExtendedClassification/',
									'xClassesControl.field_context_menu.createPermission'
								)
							},
							pickReplacePermission: {
								label: aras.getResource(
									'../Modules/aras.innovator.ExtendedClassification/',
									'xClassesControl.field_context_menu.pickReplacePermission'
								)
							}
						}
					}
				};

				this._fieldContextMenu.applyData(fieldContextMenuData);
				this._fieldContextMenu.on(
					'click',
					this._handlers.fieldContextMenuOnClick.bind(this)
				);

				this._setEventListeners();
			} else {
				this._nav.expandedItemsKeys.forEach(
					function (key) {
						if (!this._xClassIds.has(key)) {
							this._nav.expandedItemsKeys.delete(key);
						}
					}.bind(this)
				);
			}
			return this._fetchMetadata(classIDs)
				.then(
					function (metadata) {
						this._metadata = metadata;

						var data = this._prepareData(this._metadata, this.initialData);
						this._nav.dataStore.roots = data.roots;
						this._nav.dataStore.items = data.data;

						return this.setEditMode(this._isEditMode);
					}.bind(this)
				)
				.then(this._updateFieldsRestrictedState.bind(this))
				.then(this._updateFieldsDiscoverOnlyState.bind(this));
		},
		_showXClassSelectDialog: function () {
			var xClassIds = this._xClassIds;
			var xClassTrees = xPropertiesUtils.getXClassificationTreesForItemType(
				this._itemTypeId
			);
			var param = {};
			param.title = aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'xClassesControl.classificationDialogTitle'
			);
			param.dialogWidth = 670;
			param.dialogHeight = 400;
			var wnd = aras.getMostTopWindowWithAras(window);
			var dialog = wnd.ArasModules.MaximazableDialog.show('', param);
			classificationSelectionControl.attachTo(
				dialog.contentNode,
				dialog.close.bind(dialog)
			);
			classificationSelectionControl.init(
				xClassTrees,
				xClassIds,
				this._removedXClasses
			);
			return dialog.promise.then(function (res) {
				var selected = [];
				if (res) {
					res.forEach(function (row) {
						if (row.selected === true && !xClassIds.has(row.xClassId)) {
							selected.push(row.xClassId);
						}
					});
				}
				return selected;
			});
		},
		_xClassesListChangeHandler: function (newXClassIds, removedXClassIds) {
			newXClassIds = newXClassIds || [];
			removedXClassIds = removedXClassIds || [];

			if (newXClassIds.length || removedXClassIds.length) {
				var result = Promise.resolve();

				newXClassIds.forEach(
					function (id) {
						this._xClassIds.add(id);
						this._setXClassEnabledState(id, true);
					}.bind(this)
				);
				removedXClassIds.forEach(
					function (id) {
						this._removedXClasses.add(id);
						this._setXClassEnabledState(id, false);
					}.bind(this)
				);

				this._domElement.dispatchEvent(
					new CustomEvent('xclasses-list-change', {
						detail: {
							newXClasses: newXClassIds,
							removedXClasses: removedXClassIds,
							xClassList: this._xClassIds
						},
						bubbles: true,
						cancelable: false
					})
				);

				if (newXClassIds.length) {
					result = result.then(
						function () {
							return this._fetchMetadata(this._xClassIds).then(
								function (metadata) {
									this._metadata = metadata;
								}.bind(this)
							);
						}.bind(this)
					);
				}

				result = result
					.then(
						function () {
							var data = this._prepareData(this._metadata, this.initialData);
							this._nav.dataStore.roots = data.roots;
							this._nav.dataStore.items = data.data;
						}.bind(this)
					)
					.then(this.render.bind(this));

				return result;
			}
		},
		_fetchMetadata: function (classIDs) {
			return Promise.resolve(
				xPropertiesUtils.getMetadataForXClassesControl(classIDs)
			);
		},
		_showDateDialogAndProcessResult: function (item) {
			var pattern = aras.getDotNetDatePattern(item.field.data.pattern) || '';

			var param = {
				date: item.field.data.value,
				format: pattern,
				aras: aras,
				type: 'Date'
			};

			var topWin = aras.getMostTopWindowWithAras(window);
			return topWin.ArasModules.Dialog.show('iframe', param)
				.promise.then(
					function (result) {
						if (result) {
							this._handlePropChange(item, result);
						}
					}.bind(this)
				)
				.then(function () {
					return Promise.resolve('');
				});
		},
		_prepareData: function (metadata, initialData) {
			var commonData = Object.assign({}, initialData);
			commonData.textWidth = commonData.textWidth || defaultTextWidth;
			commonData.fieldWidth = commonData.fieldWidth || defaultFieldWidth;
			commonData.isEditMode = this._isEditMode;

			var roots = new Set();
			var data = new Map();
			var lastClassId;

			var linarizeXClasses = function (value) {
				var id;

				if (value.properties) {
					// root node
					id = value.id;
					value.removed = this._removedXClasses.has(id) ? true : undefined;
					lastClassId = id;
					value.children = value.properties.map(linarizeXClasses);
				} else {
					// field node
					id = lastClassId + '_' + value.name;
					var fieldValue =
						this._fieldValues[value.name] !== undefined
							? this._fieldValues[value.name]
							: value.default_value || '';
					let fieldPermissionId =
						this._fieldPermissions[value.name] !== undefined
							? this._fieldPermissions[value.name]
							: '';
					value = this.getFieldTemplateData(
						value,
						commonData,
						id,
						lastClassId,
						fieldValue,
						fieldPermissionId
					);
				}
				data.set(id, value);

				return id;
			}.bind(this);

			roots = metadata.map(linarizeXClasses);

			return {
				roots: roots,
				data: data
			};
		},
		setEditMode: function (isEditMode) {
			if (this._nav && !this._isDisabled) {
				this._isEditMode = isEditMode;
				this._fieldset.classList.toggle(
					'aras-field-xclasses_readonly',
					!isEditMode
				);
				this._nav.data.forEach(
					function (templateData) {
						if (!templateData.properties) {
							editMode = this._removedXClasses.has(
								templateData.field.data.xClassId
							)
								? false
								: isEditMode;
							templateData.setEditMode(editMode);
						}
					}.bind(this)
				);
			}
			return this.render();
		},
		_setEventListeners: function () {
			// click on expand arrow expands or collapses all list elements
			this._expandArrow.addEventListener(
				'click',
				function () {
					var promise = Promise.resolve();
					if (!this._fieldset.classList.contains('aras-field-xclasses_empty')) {
						if (
							this._fieldset.classList.toggle('aras-field-xclasses_expanded')
						) {
							this._nav.roots.forEach(
								function (key) {
									this._nav.expand(key);
								}.bind(this)
							);
						} else {
							this._nav.expandedItemsKeys.forEach(
								function (key) {
									this._nav.collapse(key);
								}.bind(this)
							);
						}
					}
				}.bind(this)
			);

			this._ellipsesButton.addEventListener(
				'click',
				function (e) {
					if (
						!this._fieldset.classList.contains('aras-field-xclasses_readonly')
					) {
						return this._showXClassSelectDialog().then(
							this._xClassesListChangeHandler.bind(this)
						);
					} else {
						return Promise.resolve();
					}
				}.bind(this)
			);

			// change expand row style according with expanded roots count
			this._nav.on(
				'click',
				function (key, e) {
					var propObj;
					var dialogParams;
					var topWin;

					if (
						e.target.matches(
							'.aras-nav__parent:not(.aras-field-xclasses__xclass-block_disabled) .aras-field-xclasses__delete-cross'
						)
					) {
						dialogParams = {
							buttons: {
								btnYes: aras.getResource('', 'common.yes'),
								btnCancel: aras.getResource('', 'common.cancel')
							},
							defaultButton: 'btnCancel',
							aras: aras,
							message: aras.getResource(
								'../Modules/aras.innovator.ExtendedClassification/',
								'xClassesControl.delete_class',
								this._nav.dataStore.items.get(key).label
							),
							dialogWidth: 400,
							dialogHeight: 200,
							center: true,
							content: 'groupChgsDialog.html'
						};

						topWin = aras.getMostTopWindowWithAras(window);
						topWin.ArasModules.Dialog.show('iframe', dialogParams).promise.then(
							function (res) {
								if (res == 'btnYes') {
									this._xClassesListChangeHandler(null, [key]);
								}
							}.bind(this)
						);
					} else if (
						e.target.matches(
							'.aras-nav__parent.aras-field-xclasses__xclass-block_disabled .aras-field-xclasses__delete-cross'
						)
					) {
						dialogParams = {
							buttons: {
								btnYes: aras.getResource('', 'common.yes'),
								btnCancel: aras.getResource('', 'common.cancel')
							},
							defaultButton: 'btnCancel',
							aras: aras,
							message: aras.getResource(
								'../Modules/aras.innovator.ExtendedClassification/',
								'xClassesControl.restore_deleted_class',
								this._nav.dataStore.items.get(key).label
							),
							dialogWidth: 400,
							dialogHeight: 200,
							center: true,
							content: 'groupChgsDialog.html'
						};

						topWin = aras.getMostTopWindowWithAras(window);
						topWin.ArasModules.Dialog.show('iframe', dialogParams).promise.then(
							function (res) {
								if (res == 'btnYes') {
									this._xClassesListChangeHandler([key], null);
								}
							}.bind(this)
						);
					} else if (
						e.target.matches(
							'.aras-field-xclasses:not(.aras-field-xclasses_readonly)' +
								' .aras-nav__parent:not(.aras-field-xclasses__xclass-block_disabled) .color-input'
						)
					) {
						propObj = this._nav.data.get(key);
						aras.showColorDialog(propObj.getValue()).then(
							function (result) {
								if (result) {
									this._handlePropChange(propObj, result);
								}
							}.bind(this)
						);
					} else if (
						e.target.matches(
							'.aras-field-xclasses:not(.aras-field-xclasses_readonly)' +
								' .aras-nav__parent:not(.aras-field-xclasses__xclass-block_disabled) .aras-form-date span'
						)
					) {
						propObj = this._nav.data.get(key);
						this._showDateDialogAndProcessResult(propObj);
					} else if (
						e.target.matches(
							'.aras-field-xclasses:not(.aras-field-xclasses_readonly)' +
								' .aras-nav__parent:not(.aras-field-xclasses__xclass-block_disabled) .aras-field-xclasses__restricted_field'
						)
					) {
						propObj = this._nav.data.get(key);
						this.setPropertyRestrictedState(propObj.field.data.name, false);
					} else if (e.target.closest('.aras-icon-vertical-ellipsis')) {
						this._showFieldContextMenu(key, e);
					} else if (
						e.target.matches(
							'.aras-filter-list__button.aras-btn.aras-filter-list__button_ellipsis'
						)
					) {
						propObj = this._nav.data.get(key);
						this._showItemSearchDialogAndProcessResult(propObj);
					} else if (
						e.target.matches('.sys_item_link.aras-field-xclasses__item_link')
					) {
						propObj = this._nav.data.get(key);
						this._handleItemLinkClick(propObj, window.document.item);
					} else {
						this._fieldset.classList.toggle(
							'aras-field-xclasses_expanded',
							this._nav.expandedItemsKeys.size > 0
						);
					}
				}.bind(this)
			);

			// need prevent default behavior od Enter key
			// to prevent showing dialogs on innovator form
			this._nav.on(
				'keydown',
				function (key, e) {
					if (e.key === 'Enter' && e.target.nodeName !== 'TEXTAREA') {
						e.preventDefault();
					}

					if (e.key === 'F2') {
						if (
							e.target.matches(
								'.aras-field-xclasses:not(.aras-field-xclasses_readonly) .aras-nav__parent .aras-form-date input'
							)
						) {
							propObj = this._nav.data.get(key);
							this._showDateDialogAndProcessResult(propObj);
						} else if (
							e.target.matches('.aras-filter-list__input.aras-form-input')
						) {
							propObj = this._nav.data.get(key);
							this._showItemSearchDialogAndProcessResult(propObj);
						}
					}
				}.bind(this)
			);

			this._nav.on(
				'change',
				function (nodeKey, e) {
					e.preventDefault();
					e.stopPropagation();

					if (
						e.target.matches('input[type=checkbox]') ||
						e.target.matches('.color-list') ||
						e.target.matches('select[multiple]')
					) {
						var propObj = this._nav.data.get(nodeKey);
						this._handlePropChange(propObj, propObj.getValue());
					}
				}.bind(this)
			);

			this._nav.on(
				'focusout',
				function (nodeKey, e) {
					e.preventDefault();
					e.stopPropagation();

					// ignore focusout on non-input elements
					// to prevent data losing in IE
					if (
						(e.target.nodeName !== 'INPUT' &&
							e.target.nodeName !== 'TEXTAREA') ||
						e.target.matches('.color-list') ||
						e.target.matches('select[multiple]')
					) {
						return;
					}

					var propObj = this._nav.data.get(nodeKey);
					this._handlePropChange(propObj, propObj.getValue());
				}.bind(this)
			);
		},
		_handlePropChange: function (propObj, newValue) {
			if (propObj.field.data.value === newValue) {
				return;
			}

			var myEvent = new CustomEvent('xproperty-change', {
				detail: {
					xPropertyId: propObj.field.data.id,
					data_type: propObj.field.data.type,
					dataSource: propObj.field.data.dataSource,
					dataSourceName: propObj.field.data.dataSourceName,
					xPropertyName: propObj.field.data.name,
					newValue: newValue,
					pattern:
						propObj.field.data.dotNetPattern || propObj.field.data.pattern,
					precision: propObj.field.data.precision,
					scale: propObj.field.data.scale,
					stored_length: propObj.field.data.stored_length,
					preValidationResult: true
				},
				bubbles: true,
				cancelable: false
			});

			if (propObj.field.data.type === 'list') {
				myEvent.detail.preValidationResult = propObj.validate();
			}

			this._domElement.dispatchEvent(myEvent);
			if (myEvent.detail.preValidationResult) {
				this._fieldValues[propObj.field.data.name] = newValue;
				this._nav.data.forEach(function (prop) {
					if (
						!prop.children &&
						prop.field.data.name === propObj.field.data.name
					) {
						prop.setValue(newValue);
					}
				});
			}
			return this.render();
		},
		_handleItemLinkClick: function (propObj, itemNd) {
			const itemId = aras.getItemProperty(itemNd, propObj.field.data.name);
			if (
				propObj.field.attrs.disabled &&
				itemId &&
				aras.getItemPropertyAttribute(
					itemNd,
					propObj.field.data.name,
					'discover_only'
				) !== '1'
			) {
				const itm = aras.getItemById(
					propObj.field.data.dataSourceName,
					itemId,
					0
				);
				if (itm) {
					aras.uiShowItemEx(itm, undefined);
				}
			}
		},
		_showItemSearchDialogAndProcessResult: function (propObj) {
			const input = document.getElementById(propObj.field.data.id);
			input.dialogIsShown = true;
			const params = {
				aras: window.aras,
				itemtypeName: propObj.field.data.dataSourceName
			};
			const callback = function (dlgRes) {
				input.dialogIsShown = false;
				if (dlgRes == undefined) {
					input.focus();
					return true;
				}

				this._handlePropChange(propObj, dlgRes.keyed_name);
				if (!dlgRes.keyed_name) {
					input.focus();
				}
			}.bind(this);
			const topWnd = aras.getMostTopWindowWithAras(window);
			params.type = 'SearchDialog';
			topWnd.ArasModules.MaximazableDialog.show('iframe', params).promise.then(
				callback
			);
		},
		getFieldTemplateData: function (
			metadata,
			commonData,
			id,
			parentXClassId,
			value,
			privatePermissionId
		) {
			if (this._nav && this._nav.data && this._nav.data.has(id)) {
				return this._nav.data.get(id);
			}

			var template = {
				field: {
					attrs: {
						disabled:
							metadata.isReadonly ||
							!this._isEditMode ||
							this._removedXClasses.has(parentXClassId),
						required: metadata.isRequired,
						id: id,
						'aria-labelledby': id + '_label'
					},
					data: {
						id: id,
						name: metadata.name,
						label: metadata.label,
						type: metadata.type,
						pattern: metadata.pattern,
						stored_length: metadata.stored_length,
						scale: metadata.scale,
						precision: metadata.prec,
						value: value,
						values: metadata.values,
						readonly: metadata.isReadonly,
						xClassId: parentXClassId,
						nativeType: metadata.type,
						dataSource: metadata.dataSource,
						privatePermissionBehavior: metadata.privatePermissionBehavior,
						privatePermissionId: privatePermissionId
					},
					refs: function (id, node) {
						this._componentsHash[id] = node;
					}.bind(this, id)
				},
				li: {
					attrs: {
						'data-key': id
					}
				},
				labelContainer: {
					attrs: {
						id: id + '_label',
						style: 'width: ' + commonData.textWidth + 'px;'
					}
				},
				fieldContainer: {
					attrs: {
						style: 'width: ' + commonData.fieldWidth + 'px;'
					}
				}
			};
			switch (metadata.type) {
				case 'date':
					template.field.data.dotNetPattern = aras.getDotNetDatePattern(
						metadata.pattern
					);
					template.field.data.value = template.field.attrs.defaultValue = aras.convertFromNeutral(
						value,
						'date',
						template.field.data.dotNetPattern
					);
					template.setValue = function (value) {
						template.field.data.value = template.field.attrs.value = aras.convertFromNeutral(
							value,
							'date',
							template.field.data.dotNetPattern
						);
					};
					break;
				case 'text':
					template.field.attrs.defaultValue = value;
					template.fieldContainer.attrs.style =
						'min-width: ' + commonData.fieldWidth + 'px;';
					template.li.attrs.style = 'height: auto;';
					template.li.className =
						'aras-field-xclasses__field-container_top-label';
					template.getValue = function () {
						var node = this._componentsHash[id];
						return node.value;
					}.bind(this);
					template.setValue = function (value) {
						template.field.attrs.value = value;
						template.field.data.value = value;
					}.bind(this);
					break;
				case 'list':
					if (!metadata.isRequired) {
						template.field.data.values.unshift({ value: '', label: '' });
					}
					template.field.refs = function (template, id, node) {
						if (node) {
							node.setState({
								list: template.field.data.values,
								value: template.field.data.value,
								disabled: !this._isEditMode
							});
							node.format = function (templ) {
								var input = templ.children[0];
								input.attrs = Object.assign(
									input.attrs || {},
									template.field.attrs
								);
								return templ;
							};
							this._componentsHash[id] = node;
						} else {
							delete this._componentsHash[id];
						}
					}.bind(this, template, id);
					template.getValue = function (id) {
						return (
							this._componentsHash[id].state.label ||
							this._componentsHash[id].state.value
						);
					}.bind(this, id);
					template.setValue = function (id, value) {
						if (this._componentsHash[id] && this._componentsHash[id].setState) {
							this._componentsHash[id].setState({
								value: value
							});
						}
						template.field.data.value = value;
					}.bind(this, id);
					template.validate = function () {
						return this._componentsHash[id].validate();
					}.bind(this);
					template.setEditMode = function (editMode) {
						template.field.attrs.disabled = !editMode;
						if (this._componentsHash[id]) {
							this._componentsHash[id].setState({
								disabled: !editMode
							});
						}
					}.bind(this);
					break;
				case 'color':
					if (value) {
						template.field.attrs.style = 'background-color: ' + value + ';';
					}
					template.getValue = function () {
						return template.field.data.value;
					};
					template.setValue = function (value) {
						template.field.data.value = value;
						template.field.attrs.style = 'background-color: ' + value + ';';
					};
					break;
				case 'boolean':
					template.field.attrs.defaultChecked = value === '1';
					template.getValue = function () {
						var node = this._componentsHash[id];
						return node.checked ? '1' : '0';
					}.bind(this);
					template.setValue = function (value) {
						template.field.attrs.checked = value === '1';
						template.field.data.value = value;
					}.bind(this);
					break;
				case 'color list':
					if (value) {
						template.field.attrs.defaultValue = value;
						template.field.attrs.style = 'background-color: ' + value + ';';
					}
					template.field.refs = function (template, id, node) {
						this._componentsHash[id] = node;
						if (node && !value) {
							node.selectedIndex = -1;
						}
					}.bind(this, template, id);
					if (!metadata.isRequired) {
						template.field.data.values.unshift({ value: '', label: '' });
					}
					template.getValue = function (id) {
						var node = this._componentsHash[id];
						return node.value;
					}.bind(this, id);
					template.setValue = function (id, value) {
						template.field.attrs.style = 'background-color: ' + value + ';';
						template.field.data.value = value;
					}.bind(this, id);
					break;
				case 'mv_list':
					template.field.attrs.size = 3;
					template.field.attrs.style = 'height: auto;';
					template.li.attrs.style = 'height: auto;';
					template.li.className =
						'aras-field-xclasses__field-container_top-label';
					var selectedOptions = value
						? aras.mvListPropertyValueToArray(value)
						: [];
					template.field.data.selectedOptions = new Set(selectedOptions);
					if (selectedOptions.length > 0) {
						template.field.attrs.className = 'multi-value-list_selected';
					}

					template.getValue = function (id) {
						var selectedValues = Array.prototype.filter
							.call(this._componentsHash[id].options, function (option) {
								return option.selected;
							})
							.map(function (option) {
								return option.value;
							});
						if (selectedValues.length > 0) {
							template.field.attrs.className = 'multi-value-list_selected';
						}
						return aras.arrayToMVListPropertyValue(selectedValues);
					}.bind(this, id);
					template.setValue = function (id, value) {
						var selectedOptions = value
							? aras.mvListPropertyValueToArray(value)
							: [];
						template.field.data.selectedOptions = new Set(selectedOptions);
						template.field.data.value = value;
					}.bind(this, id);
					break;
				case 'item':
					template.field.data.dataSourceName = aras.getItemTypeName(
						template.field.data.dataSource
					);
					if (value) {
						template.field.data.value = aras.getKeyedName(
							value,
							template.field.data.dataSourceName
						);
					}
					template.field.refs = function (template, id, node) {
						if (node) {
							node.setState({
								value: template.field.data.value,
								itemType: template.field.data.dataSourceName,
								disabled: template.field.attrs.disabled,
								validation: false
							});

							node.classList.toggle('aras-hide', !this._isEditMode);
							const itemLink = node.state.dom.ownerDocument.getElementById(
								template.field.data.id + '_span'
							);
							itemLink.classList.toggle('aras-hide', this._isEditMode);

							node.format = function (templ) {
								const input = templ.children[0];
								const button = templ.children[2];

								input.className += ' ' + template.field.data.name;
								input.attrs = Object.assign(input.attrs || {}, {
									id: template.field.data.id,
									name: template.field.data.name,
									required: template.field.attrs.required,
									'aria-labelledby': id + '_label'
								});

								button.attrs = Object.assign(button.attrs || {}, {
									id: template.field.data.id + '_img'
								});

								templ.style = Object.assign(input.style || {}, {
									width: 'inherit'
								});

								if (template.field.data.readonly) {
									templ.style.display = 'none';
									itemLink.style.display = 'inline';
								}

								return templ;
							};
							node.render();
							this._componentsHash[id] = node;
						} else {
							delete this._componentsHash[id];
						}
					}.bind(this, template, id);
					template.getValue = function (id) {
						return (
							this._componentsHash[id].state.label ||
							this._componentsHash[id].state.value
						);
					}.bind(this, id);
					template.setValue = function (id, value) {
						if (this._componentsHash[id] && this._componentsHash[id].setState) {
							this._componentsHash[id].setState({
								value: value
							});
						}
						template.field.data.value = value;
					}.bind(this, id);
					template.validate = function () {
						return this._componentsHash[id].validate();
					}.bind(this);
					template.setEditMode = function (editMode) {
						template.field.attrs.disabled = !editMode;
						const node = this._componentsHash[id];
						if (node) {
							node.setState({
								disabled: !editMode
							});
							node.classList.toggle('aras-hide', !this._isEditMode);
							const itemLink = node.state.dom.ownerDocument.getElementById(
								template.field.data.id + '_span'
							);
							itemLink.classList.toggle('aras-hide', this._isEditMode);
						}
					}.bind(this);
					break;
				default:
					if (metadata.type === 'decimal') {
						template.field.data.dotNetPattern = aras.getDecimalPattern(
							metadata.prec,
							metadata.scale
						);
					}
					template.field.attrs.defaultValue = value;
					template.getValue = function () {
						var node = this._componentsHash[id];
						return node.value;
					}.bind(this);
					template.setValue = function (value) {
						template.field.attrs.value = value;
						template.field.data.value = value;
					}.bind(this);
					break;
			}

			if (!template.setValue) {
				template.setValue = function (value) {
					template.field.attrs.value = value;
					template.field.data.value = value;
				}.bind(this);
			}
			if (!template.getValue) {
				template.getValue = function () {
					var node = this._componentsHash[id];
					return node.value;
				}.bind(this);
			}
			if (!template.setEditMode) {
				template.setEditMode = function (editMode) {
					template.field.attrs.disabled =
						!editMode || template.field.data.readonly;
				};
			}

			if (template.field.data.values) {
				template.field.data.values.forEach(function (listOptionData) {
					listOptionData.label = listOptionData.label || listOptionData.value;
				});
			}

			template.setPermission = function (permissionId) {
				template.field.data.privatePermissionId = permissionId;
			};

			return template;
		},
		focusToField: function (fieldId) {
			var fieldNode = this._domElement.ownerDocument.getElementById(fieldId);
			if (fieldNode) {
				fieldNode.focus();
			} else if (
				this._componentsHash[fieldId] &&
				this._componentsHash[fieldId].component
			) {
				this._componentsHash[fieldId].component.state.focus = true;
				this._componentsHash[fieldId].component.setFocus();
			}
		},
		setPropertyValue: function (propertyName, value) {
			this._fieldValues[propertyName] = value;
			if (this._nav) {
				this._nav.data.forEach(function (prop) {
					if (!prop.children && prop.field.data.name === propertyName) {
						const valueToSet = this._getValueToSet(prop.field, value);
						prop.setValue(valueToSet);
					}
				}, this);
			}
			return this.render();
		},
		setFieldsValues: function (valuesHash) {
			this._fieldValues = {};
			var properties = Object.keys(valuesHash);

			properties.forEach(
				function (propertyName) {
					this.setPropertyValue(propertyName, valuesHash[propertyName]);
				}.bind(this)
			);

			return this.render();
		},
		setPropertyPermission: function (propertyName, permissionId) {
			this._fieldPermissions[propertyName] = permissionId;
			if (this._nav) {
				this._nav.data.forEach(function (prop) {
					if (!prop.children && prop.field.data.name === propertyName) {
						prop.setPermission(permissionId);
					}
				});
			}
			return this.render();
		},
		setFieldsPermissions: function (permissionsHash) {
			this._fieldPermissions = {};
			var properties = Object.keys(permissionsHash);

			properties.forEach(
				function (propertyName) {
					this.setPropertyPermission(
						propertyName,
						permissionsHash[propertyName]
					);
				}.bind(this)
			);

			return this.render();
		},
		invalidateField: function (fieldId, oldValue) {
			if (this._nav) {
				this._nav.data.get(fieldId).field.data.value = oldValue;
				this.focusToField(fieldId);
			}
		},
		_getValueToSet: function (propInfo, value) {
			if (!value) {
				return value;
			}

			let valueToSet;
			switch (propInfo.data.type) {
				case 'item':
					valueToSet = aras.getKeyedName(value, propInfo.data.dataSourceName);
					break;
				default:
					valueToSet = aras.convertFromNeutral(
						value,
						propInfo.data.type,
						propInfo.data.dotNetPattern || propInfo.data.pattern
					);
			}
			return valueToSet;
		},
		_setXClassEnabledState: function (xClassId, isEnabled) {
			if (isEnabled) {
				this._removedXClasses.delete(xClassId);
			} else {
				this._removedXClasses.add(xClassId);
			}

			var xClassMetadata = this._metadata.find(function (metadataUnit) {
				return metadataUnit.id === xClassId;
			});
			if (xClassMetadata) {
				xClassMetadata.children.forEach(
					function (fieldId) {
						this._nav.data.get(fieldId).setEditMode(isEnabled);
					}.bind(this)
				);
			}
		},
		_updateFieldsRestrictedState: function () {
			this._nav.data.forEach(
				function (prop) {
					if (!prop.children) {
						prop.field.data.type = this._restrictedFields.has(
							prop.field.data.name
						)
							? 'restricted'
							: prop.field.data.nativeType;
					}
				}.bind(this)
			);

			return this.render();
		},
		_updateFieldsDiscoverOnlyState: function () {
			this._nav.data.forEach(
				function (prop) {
					if (!prop.children && prop.field.data.type === 'item') {
						const itemLink = window.document.getElementById(
							prop.field.data.id + '_span'
						);
						itemLink.classList.toggle(
							'aras-field-xclasses__item_link_discover',
							this._discoverOnlyFields.has(prop.field.data.name)
						);
					}
				}.bind(this)
			);

			return this.render();
		},
		setPropertyRestrictedState: function (propertyName, isResricted) {
			if (isResricted) {
				this._restrictedFields.add(propertyName);
			} else {
				this._restrictedFields.delete(propertyName);
			}
			this._nav.data.forEach(function (prop) {
				if (!prop.children && prop.field.data.name === propertyName) {
					prop.field.data.type = isResricted
						? 'restricted'
						: prop.field.data.nativeType;
				}
			});

			return this.render();
		},
		_showFieldContextMenu: function (key, e) {
			e.preventDefault();
			e.stopPropagation();

			const fieldData = this._nav.data.get(key);
			if (fieldData.field.data.privatePermissionBehavior === 'None') {
				this._fieldContextMenu.data.get('permissions').disabled = true;
			} else {
				this._fieldContextMenu.data.get('permissions').disabled = false;
				if (!fieldData.field.data.privatePermissionId) {
					this._fieldContextMenu.data.get('viewPermission').disabled = true;
				} else {
					this._fieldContextMenu.data.get('viewPermission').disabled = false;
				}
			}

			var targetRect = e.target
				.closest('.aras-icon-vertical-ellipsis')
				.getBoundingClientRect();
			this._fieldContextMenu.dom.style.visibility = 'hidden';
			this._fieldContextMenu.show({ x: 0, y: 0 }, key);
			var menuRect = this._fieldContextMenu.dom.getBoundingClientRect();
			var docSize = {
				width: document.documentElement.clientWidth,
				height: document.documentElement.clientHeight,
				scrollLeft: document.documentElement.scrollLeft,
				scrollTop: document.documentElement.scrollTop
			};

			this._fieldContextMenu.show(
				this._recalculateCoordinatesOfContextMenu(
					targetRect,
					menuRect,
					docSize
				),
				key
			);
			this._fieldContextMenu.dom.style.visibility = '';
			this._fieldContextMenu.dom.focus();
		},
		_recalculateCoordinatesOfContextMenu: function (
			ellipsesRect,
			menuRect,
			docSize
		) {
			var x = ellipsesRect.left + ellipsesRect.width + docSize.scrollLeft;
			if (x + menuRect.width > docSize.width + docSize.scrollLeft) {
				x = ellipsesRect.left - menuRect.width + docSize.scrollLeft;
			}
			var y = ellipsesRect.top + docSize.scrollTop;
			if (y + menuRect.height > docSize.height + docSize.scrollTop) {
				y = docSize.height + docSize.scrollTop - menuRect.height;
			} else if (y < docSize.scrollTop) {
				y = docSize.scrollTop;
			}

			return {
				x: x,
				y: y
			};
		},
		_handlers: {
			fieldContextMenuOnClick: function (menuItemId, e, fieldId) {
				let eventName;

				if (menuItemId === 'reset') {
					eventName = 'xproperty-reset';
				} else if (menuItemId === 'viewPermission') {
					eventName = 'xproperty-view-permission';
				} else if (menuItemId === 'createPermission') {
					eventName = 'xproperty-create-permission';
				} else if (menuItemId === 'pickReplacePermission') {
					eventName = 'xproperty-pickreplace-permission';
				}

				if (eventName !== 'undefined') {
					const fieldData = this._nav.data.get(fieldId);
					this._domElement.dispatchEvent(
						new CustomEvent(eventName, {
							detail: {
								xPropertyName: fieldData.field.data.name,
								xPropertyLabel: fieldData.field.data.label,
								xPropertyType: fieldData.field.data.type,
								xPropertyPermissionId: fieldData.field.data.privatePermissionId
							},
							bubbles: true,
							cancelable: false
						})
					);
				}
			}
		},
		render: function () {
			if (this._nav) {
				this._fieldset.classList.toggle(
					'aras-field-xclasses_expanded',
					this._nav.expandedItemsKeys.size !== 0
				);
				this._fieldset.classList.toggle(
					'aras-field-xclasses_empty',
					!this._nav.roots.length
				);
				return this._nav.render();
			}
			return Promise.resolve();
		}
	};

	wnd.XClassesFormControl = XClassesFormControl;
})(window);
