define([
	'dojo/_base/declare',
	'ES/Scripts/Classes/Utils',
	'ES/Scripts/Constants',
	'dojo/domReady!'
], function (declare, Utils, Constants) {
	return declare('AddPropertiesDialog', null, {
		_aras: null,
		_utils: null,
		_dialog: null,
		_grid: null,
		_gridToolbar: null,
		_systemProps: null,
		_systemPropsSet: new Set(),
		_systemPropsStr: null,
		_indexedTypeItem: null,
		_indexedTypeName: '',
		_columns: new Map(),
		_buttonIds: {
			runSearch: 'run_search',
			clearSearch: 'clear_search',
			addProps: 'add_properties'
		},
		_propGroups: {
			property: 'property',
			system: 'system',
			xProperty: 'xProperty'
		},
		_propGroupLabels: null,
		_propGroupLabelNameMap: {},
		_curPropsMap: {},
		_selectedPropsMap: new Map(),
		_propsContainer: null,
		_okButton: null,

		/**
		 * Add Properties dialog constructor
		 *
		 * @param {Object} args Arguments
		 * @param {Object} args.aras Aras object
		 * @param {Dialog} args.dialog Dialog object
		 * @param {Object} args.item Indexed Type IOM item
		 */
		constructor: function (args) {
			this._aras = args.aras;
			this._dialog = args.dialog;
			this._indexedTypeItem = args.item;
			this._indexedTypeName = this._indexedTypeItem.getPropertyAttribute(
				'indexed_type',
				'name'
			);

			this._utils = new Utils({
				arasObj: this._aras
			});

			var constants = new Constants();
			this._systemProps = constants.systemProperties;
			this._systemProps.forEach(
				function (propName) {
					this._systemPropsSet.add(propName);
				}.bind(this)
			);

			this._dialog.setTitle(
				this._utils.getResourceValueByKey('dialog.add_props.title')
			);
			this._propGroupLabels = {
				property: this._utils.getResourceValueByKey(
					'dialog.add_props.prop_group.property'
				),
				system: this._utils.getResourceValueByKey(
					'dialog.add_props.prop_group.system'
				),
				xProperty: this._utils.getResourceValueByKey(
					'dialog.add_props.prop_group.x_property'
				)
			};
			for (var groupName in this._propGroupLabels) {
				this._propGroupLabelNameMap[
					this._propGroupLabels[groupName]
				] = groupName;
			}
			[
				[
					'name',
					{
						label: this._utils.getResourceValueByKey(
							'dialog.add_props.prop_name'
						),
						width: 155
					}
				],
				[
					'prop_group',
					{
						label: this._utils.getResourceValueByKey(
							'dialog.add_props.prop_group'
						),
						width: 125,
						searchType: 'filterList',
						metadata: {
							list: [
								{
									value: this._propGroups.property,
									label: this._propGroupLabels.property
								},
								{
									value: this._propGroups.system,
									label: this._propGroupLabels.system
								},
								{
									value: this._propGroups.xProperty,
									label: this._propGroupLabels.xProperty
								}
							]
						}
					}
				],
				[
					'label',
					{
						label: this._utils.getResourceValueByKey(
							'dialog.add_props.prop_label'
						),
						width: 155
					}
				],
				[
					'data_type',
					{
						label: this._utils.getResourceValueByKey(
							'dialog.add_props.prop_type'
						),
						width: 120
					}
				]
			].forEach(function (entry) {
				this._columns.set.apply(this._columns, entry);
			}, this);

			this._propsContainer = document.querySelector('#propsContainer');
			this._okButton = document.querySelector('#okButton');
			var cancelButton = document.querySelector('#cancelButton');

			this._okButton.addEventListener('click', this.close.bind(this, true));
			cancelButton.addEventListener('click', this.close.bind(this, false));

			this._initGrid();
			this._initGridToolbar();
			this._utils.processMultilingualNodes(document);

			var curPropItems = this._indexedTypeItem.getRelationships();
			var curPropItemCount = curPropItems.getItemCount();
			for (var i = 0; i < curPropItemCount; i++) {
				var propItem = curPropItems.getItemByIndex(i);
				var name = propItem.getProperty('property_name');

				this._curPropsMap[name] = propItem;
			}

			this._runSearch();
		},

		/**
		 * Init properties grid
		 */
		_initGrid: function () {
			var gridContainer = document.querySelector('#gridContainer');

			this._grid = new Grid(gridContainer, {
				resizable: false,
				search: true,
				sortable: true,
				draggableColumns: false
			});
			this._grid.head = new Map();
			this._grid.rows = new Map();
			this._grid.on('selectRow', this._onSelectRow.bind(this));
			this._grid.on('dblclick', this._onDblClickRow.bind(this), 'row');
			this._grid.on('search', this._onSearch.bind(this));
			this._grid.getCellMetadata = function (headId) {
				return this._columns.get(headId).metadata;
			}.bind(this);

			this._columns.forEach(function (col, colId) {
				this._grid.head.set(colId, {
					label: col.label,
					searchType: col.searchType,
					width: col.width,
					editable: false,
					resize: false
				});
			}, this);
		},

		/**
		 * Init grid toolbar
		 */
		_initGridToolbar: function () {
			var toolbarItems = [
				{
					id: this._buttonIds.runSearch,
					type: 'button',
					image: '../../../../images/ExecuteSearch.svg',
					tooltip_template: this._utils.getResourceValueByKey('hint.run_search')
				},
				{
					id: this._buttonIds.clearSearch,
					type: 'button',
					image: '../../../../images/ClearSearchCriteria.svg',
					tooltip_template: this._utils.getResourceValueByKey(
						'hint.clear_search_criteria'
					)
				},
				{
					id: 'separator',
					type: 'separator'
				},
				{
					id: this._buttonIds.addProps,
					type: 'button',
					disabled: true,
					image: '../../../../images/Checkmark.svg',
					tooltip_template: this._utils.getResourceValueByKey(
						'hint.select_properties'
					)
				}
			];
			var toolbarData = new Map();

			toolbarItems.forEach(function (item) {
				toolbarData.set(item.id, item);
			});
			this._gridToolbar = document.querySelector('#gridToolbar');
			this._gridToolbar.data = toolbarData;
			this._gridToolbar.on('click', this._onToolbarControlClick.bind(this));
		},

		/**
		 * Run available properties search
		 *
		 * @param {Object} criteria Search criteria
		 */
		_runSearch: function (criteria) {
			this._utils.toggleSpinner(
				true,
				function () {
					try {
						this._fetchAvailableProps(criteria);
					} catch (ex) {
						this._aras.AlertError(ex.message);
					} finally {
						this._utils.toggleSpinner(false);
					}
				}.bind(this)
			);
		},

		/**
		 * Fetch Properties and xProperties related to the current ItemType
		 *
		 * @param {Object} criteria Search criteria
		 */
		_fetchAvailableProps: function (criteria) {
			var rows = new Map();
			var requiredPropFields = ['name', 'label', 'data_type'];
			var itemTypeId = this._indexedTypeItem.getProperty('indexed_type');
			var itemTypeQry = this._aras.newIOMItem('ItemType', 'get');
			var xTreeQry;
			var qryPropItems = [];

			criteria = criteria || {};
			var isAnyGroup = !criteria.prop_group;
			var isPropGroup = criteria.prop_group === this._propGroups.property;
			var isSysGroup = criteria.prop_group === this._propGroups.system;
			var isXPropGroup = criteria.prop_group === this._propGroups.xProperty;
			var isPropsQueryRequired = isAnyGroup || isPropGroup || isSysGroup;
			var isXPropsQueryRequired = isAnyGroup || isXPropGroup;

			itemTypeQry.setID(itemTypeId);
			itemTypeQry.setAttribute('select', 'id');
			if (isPropsQueryRequired) {
				var propRelationship = itemTypeQry.createRelationship(
					'Property',
					'get'
				);

				if (isPropGroup || isSysGroup) {
					propRelationship.setAttribute(
						'where',
						'Property.name ' +
							(isPropGroup ? 'not ' : '') +
							'in (' +
							this._getSystemPropsString() +
							')'
					);
				}
				propRelationship.setAttribute('select', requiredPropFields.join(','));
				qryPropItems.push(propRelationship);
			}
			if (isXPropsQueryRequired) {
				// ItemType xProperties
				var xPropRelationship = itemTypeQry.createRelationship(
					'ItemType_xPropertyDefinition',
					'get'
				);
				var xPropRelatedItem = xPropRelationship.createRelatedItem(
					'xPropertyDefinition',
					'get'
				);

				xPropRelationship.setAttribute('select', 'related_id');
				xPropRelatedItem.setAttribute('select', requiredPropFields.join(','));
				qryPropItems.push(xPropRelatedItem);

				// xClass xProperties
				xTreeQry = this._aras.newIOMItem('xClassificationTree', 'get');
				var xTreeItemTypeRelationship = xTreeQry.createRelationship(
					'xClassificationTree_ItemType',
					'get'
				);
				var xTreeItemTypeRelatedItem = xTreeItemTypeRelationship.createRelatedItem(
					'ItemType',
					'get'
				);
				var xTreeXClassRelationship = xTreeQry.createRelationship(
					'xClass',
					'get'
				);
				var xClassXPropRelationship = xTreeXClassRelationship.createRelationship(
					'xClass_xPropertyDefinition',
					'get'
				);
				var xClassXPropRelatedItem = xClassXPropRelationship.createRelatedItem(
					'xPropertyDefinition',
					'get'
				);

				xTreeQry.setAttribute('select', 'id');
				xTreeItemTypeRelationship.setAttribute('select', 'related_id');
				xTreeItemTypeRelatedItem.setID(itemTypeId);
				xTreeItemTypeRelatedItem.setAttribute('select', 'id');
				xTreeXClassRelationship.setAttribute('select', 'id');
				xClassXPropRelationship.setAttribute('select', 'related_id');
				xClassXPropRelatedItem.setAttribute(
					'select',
					requiredPropFields.join(',')
				);
				qryPropItems.push(xClassXPropRelatedItem);
			}
			qryPropItems.forEach(function (qryPropItem) {
				requiredPropFields.forEach(function (propName) {
					if (criteria[propName]) {
						qryPropItem.setProperty(propName, criteria[propName]);
						qryPropItem.setPropertyAttribute(propName, 'condition', 'like');
					}
				});
			});

			var itemTypeItem = itemTypeQry.apply();

			if (itemTypeItem.isError()) {
				throw new Error(itemTypeItem.getErrorString());
			}

			var itemTypePropItems = itemTypeItem.getRelationships();

			var xTreeItems;
			if (isXPropsQueryRequired) {
				xTreeItems = xTreeQry.apply();

				if (xTreeItems.isError() && !xTreeItems.isEmpty()) {
					throw new Error(xTreeItems.getErrorString());
				}
			}

			// Add ItemType Properties and xProperties
			var i;
			var name;
			var label;
			var dataType;
			var itemTypePropItemCount = itemTypePropItems.getItemCount();
			for (i = 0; i < itemTypePropItemCount; i++) {
				var propItem = itemTypePropItems.getItemByIndex(i);
				var propItemType = propItem.getType();
				var propGroup = this._propGroupLabels.property;

				if (propItemType === 'ItemType_xPropertyDefinition') {
					propItem = propItem.getRelatedItem();
					propItemType = propItem.getType();
					propGroup = this._propGroupLabels.xProperty;
				}

				name = propItem.getProperty('name');
				label = propItem.getProperty('label') || '';
				dataType = propItem.getProperty('data_type');

				if (this._systemPropsSet.has(name)) {
					propGroup = this._propGroupLabels.system;
				}

				if (
					!this._curPropsMap.hasOwnProperty(name) &&
					!this._selectedPropsMap.has(name)
				) {
					rows.set(name, {
						name: name,
						label: label,
						data_type: dataType,
						prop_group: propGroup
					});
				}
			}

			// Add xClass xProperties
			if (!this._utils.isNullOrUndefined(xTreeItems)) {
				var xPropItems = xTreeItems.getItemsByXPath(
					'//Result/Item[@type="xClassificationTree"]/Relationships/' +
						'Item[@type="xClass"]/Relationships/Item[@type="xClass_xPropertyDefinition"]/related_id/Item'
				);
				var xPropItemCount = xPropItems.getItemCount();
				for (i = 0; i < xPropItemCount; i++) {
					var xPropItem = xPropItems.getItemByIndex(i);

					name = xPropItem.getProperty('name');
					label = xPropItem.getProperty('label');
					dataType = xPropItem.getProperty('data_type');

					if (
						!this._curPropsMap.hasOwnProperty(name) &&
						!this._selectedPropsMap.has(name)
					) {
						rows.set(name, {
							name: name,
							label: label,
							data_type: dataType,
							prop_group: this._propGroupLabels.xProperty
						});
					}
				}
			}

			// We need to remove non existing rows from selection
			var tmpSelectedRows = this._grid.settings.selectedRows.slice(0);
			tmpSelectedRows.forEach(
				function (selectedRowName) {
					if (!rows.has(selectedRowName)) {
						var indexToDelete = this._grid.settings.selectedRows.indexOf(
							selectedRowName
						);

						if (indexToDelete !== -1) {
							this._grid.settings.selectedRows.splice(indexToDelete, 1);
						}
					}
				}.bind(this)
			);

			// update Add Properties button state
			this._onSelectRow();

			this._grid.rows = rows;
		},

		/**
		 * Get comma-separated single-quoted system properties string
		 *
		 * @returns {string} System properties string
		 */
		_getSystemPropsString: function () {
			if (this._systemPropsStr === null) {
				this._systemPropsStr = this._systemProps.reduce(function (acc, val) {
					return acc + (acc ? ',' : '') + "'" + val + "'";
				}, '');
			}

			return this._systemPropsStr;
		},

		/**
		 * Set Add Properties button enabled or disabled state
		 *
		 * @param {boolean} isDisabled Button disabled state
		 */
		_setAddPropsButtonState: function (isDisabled) {
			var addPropsButton = this._gridToolbar.data.get(this._buttonIds.addProps);

			this._gridToolbar.data.set(
				this._buttonIds.addProps,
				Object.assign({}, addPropsButton, {
					disabled: isDisabled
				})
			);
			this._gridToolbar.render();
		},

		/**
		 * Update the state of dialog OK button
		 *
		 * It should be disabled if there are no selected properties
		 */
		_updateOkButton: function () {
			this._utils.setNodeDisabledState(
				this._okButton,
				!this._selectedPropsMap.size
			);
		},

		/**
		 * Clear grid search criteria
		 */
		_clearSearch: function () {
			this._columns.forEach(function (value, colId) {
				var isDropdown = colId === 'prop_group';

				this._grid.head.set(colId, null, 'searchValue');
				if (isDropdown) {
					// Dropdown fields have 2 input types. First - input by user, second - select dropdown option.
					// Each input type stored in different property: user's input in 'inputLabel' and dropdown selection in 'searchValue'.
					// That is why we need this additional clearance
					this._grid.head.set(colId, null, 'inputLabel');
				}
			}, this);
		},

		/**
		 * Select property to index
		 *
		 * @param {string} propName Property name
		 */
		_addProperty: function (propName) {
			this._selectedPropsMap.set(propName, this._grid.rows.get(propName));
			this._grid.rows.delete(propName);
		},

		/**
		 * Update dialog elements after properties selection
		 */
		_updateAfterPropertyAdd: function () {
			this._setAddPropsButtonState(true);
			this._updateSelectedPropsList();
			this._propsContainer.scrollTo(0, this._propsContainer.scrollHeight);
			this._updateOkButton();
		},

		/**
		 * Create selected property item node
		 *
		 * @param {string} propName Property name
		 * @returns {HTMLElement} Selected property item node
		 */
		_getSelectedPropItemNode: function (propName) {
			var deleteButtonMarkup =
				'<button class="aras-button aras-button_c">' +
				'<img class="aras-button__icon" src="../../../../Images/Close.svg">' +
				'</button>';
			var labelMarkup =
				'<div class="propItemLabel">' +
				this._indexedTypeName +
				' - ' +
				propName +
				'</div>';
			var itemNode = document.createElement('div');

			itemNode.classList.add('propItem');
			itemNode.innerHTML = labelMarkup + deleteButtonMarkup;

			var deleteButton = itemNode.querySelector('button');
			deleteButton.addEventListener(
				'click',
				this._removeListItem.bind(this, propName)
			);

			return itemNode;
		},

		/**
		 * Update Properties to Index list
		 */
		_updateSelectedPropsList: function () {
			while (this._propsContainer.firstChild) {
				this._propsContainer.removeChild(this._propsContainer.firstChild);
			}
			var fragment = document.createDocumentFragment();
			this._selectedPropsMap.forEach(function (value, propName) {
				fragment.appendChild(this._getSelectedPropItemNode(propName));
			}, this);
			this._propsContainer.appendChild(fragment);
		},

		/**
		 * Remove property from Properties to Index list
		 *
		 * @param {string} propName Property name
		 */
		_removeListItem: function (propName) {
			this._grid.rows.set(propName, this._selectedPropsMap.get(propName));
			this._selectedPropsMap.delete(propName);
			this._updateSelectedPropsList();
			this._updateOkButton();
		},

		/**
		 * Show warning dialog about ignoring xProperty permissions
		 *
		 * @returns {Promise<boolean>} Dialog result promise
		 */
		_showWarnDialog: function () {
			var options = {
				dialogWidth: 384,
				dialogHeight: 154,
				title: this._utils.getResourceValueByKey('dialog.add_props_warn.title'),
				content:
					'../Modules/aras.innovator.ES/Views/AddPropertiesWarnDialog.html'
			};
			var dialog = window.parent.ArasModules.Dialog.show('iframe', options);
			var ifrm = dialog.contentNode.querySelector('iframe');

			ifrm.onload = function () {
				var acceptButton = ifrm.contentDocument.querySelector('#acceptButton');
				var backButton = ifrm.contentDocument.querySelector('#backButton');

				this._utils.processMultilingualNodes(ifrm.contentDocument);
				acceptButton.addEventListener('click', dialog.close.bind(dialog, true));
				backButton.addEventListener('click', dialog.close.bind(dialog, false));
				this._utils.setNodeVisibility(ifrm.contentDocument.body, true);
			}.bind(this);

			return dialog.promise;
		},

		/**
		 * Get the list of indexed properties data from selected properties
		 *
		 * @returns {object[]}
		 */
		_getIndexedPropsData: function () {
			var indexedPropsData = [];
			this._selectedPropsMap.forEach(
				function (value) {
					indexedPropsData.push({
						property_name: value.name,
						property_type: this._propGroupLabelNameMap[value.prop_group],
						property_label: value.label,
						property_data_type: value.data_type
					});
				}.bind(this)
			);

			return indexedPropsData;
		},

		/**
		 * Close Add Properties dialog
		 *
		 * @param {boolean} isOk Dialog result
		 */
		close: function (isOk) {
			if (isOk) {
				var indexedPropsData = this._getIndexedPropsData();
				var isXpSelected = indexedPropsData.some(
					function (data) {
						return data.property_type === this._propGroups.xProperty;
					}.bind(this)
				);

				if (isXpSelected) {
					this._dialog.hide();
					this._showWarnDialog().then(this._onWarnDialogClose.bind(this));
				} else {
					this._dialog.close(indexedPropsData);
				}
			} else {
				this._dialog.close();
			}
		},

		/**
		 * Toolbar click event handler
		 *
		 * @param {string} itemId Toolbar item id
		 */
		_onToolbarControlClick: function (itemId) {
			switch (itemId) {
				case this._buttonIds.runSearch:
					this._onSearch();
					break;
				case this._buttonIds.clearSearch:
					this._clearSearch();
					break;
				case this._buttonIds.addProps:
					this._onAddPropsButtonClick();
			}
		},

		/**
		 * Grid row select event handler
		 *
		 * It is intended to update Add Properties button state
		 */
		_onSelectRow: function () {
			var hasSelectedRows = this._grid.settings.selectedRows.length > 0;
			this._setAddPropsButtonState(!hasSelectedRows);
		},

		/**
		 * Grid row double click event handler
		 *
		 * The property should become selected on double click
		 *
		 * @param {string} propName Property name
		 */
		_onDblClickRow: function (propName) {
			this._addProperty(propName);
			this._updateAfterPropertyAdd();
		},

		/**
		 * Grid search event handler
		 *
		 * Prepares search criteria and runs properties search
		 */
		_onSearch: function () {
			var criteria = {};

			this._columns.forEach(function (value, colId) {
				var searchValue = this._grid.head.get(colId).searchValue;
				if (
					!this._utils.isNullOrUndefined(searchValue) &&
					typeof searchValue === 'string'
				) {
					searchValue = searchValue.trim();
					if (searchValue) {
						criteria[colId] = searchValue;
					}
				}
			}, this);
			this._runSearch(criteria);
		},

		/**
		 * Add Properties button click event handler
		 */
		_onAddPropsButtonClick: function () {
			var selectedRows = this._grid.settings.selectedRows.slice(0);

			selectedRows.forEach(this._addProperty, this);
			this._updateAfterPropertyAdd();
		},

		/**
		 * Warning dialog close event handler
		 *
		 * @param {boolean} accept Dialog result
		 */
		_onWarnDialogClose: function (accept) {
			if (accept) {
				this._dialog.close(this._getIndexedPropsData());
			} else {
				this._dialog.show();
			}
		}
	});
});
