require([
	'dojo/dom-construct',
	'dojo/dom-style',
	'dojo/_base/declare',
	'dojo/on',
	'dojo/query',
	'dojo/dom-attr',
	'dojo/dom-geometry'
], function (domConstruct, domStyle, declare, on, query, domAttr, domGeom) {
	function improveIzendaUI(clientUrl, rightPanel, metadata, djUiSqlBridge) {
		//makes bottom buttons look like Innovator
		Izenda.Utils.improveButtons(rightPanel);

		var buttonQuickAdd = query('input.iz-button', rightPanel).find(function (
			elem
		) {
			return elem.name.indexOf('_QuickAdd') > 0;
		});
		domStyle.set(buttonQuickAdd, 'display', 'none');

		var contentTables = query('table table', rightPanel);
		var recordsTable = contentTables[0];
		recordsTable.classList.add('records-table');

		var pivotTable = contentTables[12];
		pivotTable.classList.add('pivot-table');

		//merge thead TDs in one with label
		var thead = query('.iz-table-fields thead tr')[0];
		Izenda.Utils.fixHeaders(thead);
		var theadCells = query('th', thead);

		theadCells.forEach(function (el, idx) {
			//FldId field is last column, but it is service and could be inside actions colspan
			if (idx >= theadCells.length - 7) {
				domConstruct.destroy(el);
			}
		});
		domStyle.set(theadCells[4].firstChild, 'margin-left', '');
		var actionsTh = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.actions')
		);
		domAttr.set(actionsTh, 'colspan', 7);
		actionsTh.colspan = '7';
		thead.appendChild(actionsTh);

		query('.iz-table-fields', rightPanel)
			.children('tbody')
			.children('tr')
			.forEach(function (el, idx) {
				var rowTDs = el.cells;
				Izenda.Utils.setViewOfActionSectionInTableWithFields(rowTDs, clientUrl);
			});

		//change sort of action images for pivot
		var actionButtons = query(
			'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_ExtraColumn_valueTR .iz-cell-icon'
		);
		actionButtons[2].appendChild(actionButtons[0].firstChild);
		actionButtons[0].appendChild(actionButtons[2].firstChild);
		// advanced-settings highlighs changes from default
		let advSetImgName = 'advanced-settings.png';
		if (
			actionButtons[0].firstChild.src.endsWith(
				'image=advanced-settings-dot.png'
			)
		) {
			advSetImgName = 'advanced-settings-dot.png';
		}
		// change action images
		actionButtons[0].firstChild.src =
			clientUrl + '/modules/aras.innovator.izenda/images/' + advSetImgName;
		actionButtons[1].firstChild.src =
			clientUrl + '/images/InsertFieldBelow.svg';
		actionButtons[2].firstChild.src = clientUrl + '/images/Delete.svg';

		//Hide InsertBelow and Remove action icons for Pivot
		domStyle.set(actionButtons[1], 'display', 'none');
		domStyle.set(actionButtons[2], 'display', 'none');

		//add ItemType and Property columns to head
		var headPropertyColumn = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.property')
		);
		thead.insertBefore(headPropertyColumn, thead.firstChild);
		var headItemTypeColumn = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.itemtype')
		);
		thead.insertBefore(headItemTypeColumn, thead.firstChild);

		query('.iz-table-fields', rightPanel)
			.children('tbody')
			.children('tr')
			.forEach(function (el, idx) {
				var selectEl = query('select', el.cells[0])[0];
				var metaDataForRow = metadata[selectEl.value];
				var itemTypeName = metaDataForRow
					? (metaDataForRow.itemTypeLabel || metaDataForRow.itemTypeName) +
					  metaDataForRow.itemTypeCount
					: '';
				var propertyName = metaDataForRow
					? metaDataForRow.propertyLabel || metaDataForRow.name
					: '';
				self
					.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[selectEl.value]++;
				//add ItemType and Property columns to rows
				var bodyItemTypeColumn = document.createElement('td');
				bodyItemTypeColumn.appendChild(document.createElement('span'));
				bodyItemTypeColumn.firstChild.appendChild(
					document.createTextNode(propertyName)
				);
				el.insertBefore(bodyItemTypeColumn, el.cells[0]);
				var bodyPropertyColumn = document.createElement('td');
				bodyPropertyColumn.appendChild(document.createElement('span'));
				bodyPropertyColumn.firstChild.appendChild(
					document.createTextNode(itemTypeName)
				);
				el.insertBefore(bodyPropertyColumn, el.cells[0]);

				//set D&D for first column
				var rowTDs = el.cells;
				domAttr.set(rowTDs[0], 'name', 'dragIcon');

				//hide Field column
				thead = query('.iz-table-fields thead tr');
				domStyle.set(rowTDs[2], 'display', 'none');
				domStyle.set(rowTDs[2].firstChild, 'display', 'none');
				domStyle.set(thead.children('th')[2], 'display', 'none');
			});

		//rename Description column
		thead.children('th')[3].firstChild.innerHTML = Izenda.Utils.GetResource(
			'reportdesigner.tables.displaylabel'
		);

		//improve selects with popup for Pivot
		pivotTable = query('.iz-table-extrafield', rightPanel)
			.children('tbody')
			.children('tr');
		var onEllipsisClickFunction = function (e) {
			Izenda.Utils.showReportingStructurePopup(
				query(e.target).closest('td')[0].previousSibling.innerText,
				djUiSqlBridge.htmlToTree(),
				e.target.previousSibling,
				null,
				clientUrl
			);
		};
		pivotTable.forEach(function (el, idx) {
			var selectEl = query('select', query(el).children('td')[1])[0];
			if (selectEl) {
				Izenda.Utils.improveSelectInput(selectEl);
				Izenda.Utils.improveInnovatorSelectWithEllipsis(
					selectEl,
					onEllipsisClickFunction
				);
			}
		});
	}

	function preselectProperties(
		itemTypesLabels,
		djUiSqlBridge,
		rightPanelContent,
		selectedRows
	) {
		const loadedProperties = {};

		function loadProperties() {
			const itemTypesWithPropsToSelect = [];
			const itemTypesAdditionalData = {};

			for (let i = 0; i < itemTypesLabels.length; i++) {
				// evaluate candidate to add as preselected property
				const dataValue = itemTypesLabels[i].dataset.value;
				if (!(dataValue === '1' || dataValue === '4')) {
					continue;
				}
				const item = itemTypesLabels[i].parentElement;
				const parentItem = item.parentElement;
				if (djUiSqlBridge.getItemTypeUserData(parentItem, 'isRelationship')) {
					continue;
				}
				const itemTypeId = djUiSqlBridge.getItemTypeUserData(
					item,
					'itemTypeId'
				);
				// check if it is main item properties
				const itemTypeGuid =
					djUiSqlBridge.getItemTypeUserData(parentItem, 'rule') !== '-1'
						? item.id
						: '';
				const itemTypeSuffix = itemTypeGuid
					? "'" +
					  djUiSqlBridge.getTableNameOnly(itemTypeId) +
					  '_' +
					  itemTypeGuid
					: '';

				// looking candidate in added joined tables
				const rowsToAdd = this.djUiSqlBridge.rowsToAdd;
				let rowFound = false;

				const keys = Object.keys(rowsToAdd);
				for (let j = 0; j < keys.length; j++) {
					const el = rowsToAdd[keys[j]];
					//it is enough that we add joined tablea and we found it is the table for this property
					if (el && itemTypeSuffix === "'" + el[5]) {
						rowFound = true;
						break;
					}
				}
				if (!rowFound) {
					continue;
				}

				const columnName = djUiSqlBridge.getItemTypeUserData(
					item,
					'columnName'
				);
				const itemCountSuffix = djUiSqlBridge.getItemTypeUserData(
					item,
					'countSuffix'
				);

				let itemType;
				if (tempCache[itemTypeId]) {
					itemType = tempCache[itemTypeId];
				} else {
					itemType = tempCache[
						itemTypeId
					] = Izenda.Utils.getAras().getItemTypeForClient(itemTypeId, 'id');
				}

				const parentItemId = djUiSqlBridge.getItemTypeUserData(
					parentItem,
					'itemTypeId'
				);

				const instanceData = itemType.getProperty('instance_data');
				const typeLabel = itemType.getProperty('label');
				const typeName = itemType.getProperty('name');

				const properties = {
					name: 'keyed_name',
					itemType: instanceData.toUpperCase(),
					itemTypeLabel: typeLabel,
					propertyLabel: '', // fill later conditionally
					itemTypeName: typeName,
					//'propertyDataType': dataType,
					itemTypeSuffix: itemTypeSuffix,
					itemTypeCount: itemCountSuffix,
					customLabel: '', // fill later conditionally
					columnName: columnName, // need for conditions
					itemTypeId: itemTypeId,
					parentItemTypeId: parentItemId // need to get parent for conditions
				};

				const key = format(
					Izenda.Utils.propertyNamingTemplate,
					properties.itemType,
					properties.name.toUpperCase(),
					properties.itemTypeSuffix
				);
				properties.key = key;

				const additionalData = {
					countSuffix: itemCountSuffix
				};
				itemTypesWithPropsToSelect.push({ itemTypeId: parentItemId });
				itemTypesAdditionalData[itemTypeId] = additionalData;
				loadedProperties[key] = properties;
			}

			const itemTypesProperties = Izenda.Utils.getItemTypeProperties(
				itemTypesWithPropsToSelect,
				itemTypesAdditionalData,
				false
			);
			const keys = Object.keys(loadedProperties);

			for (let k = 0; k < keys.length; k++) {
				const loadedPropertiesKey = keys[k];
				const property = loadedProperties[loadedPropertiesKey];

				const propColumnName = property.columnName;
				const parentProps = itemTypesProperties[property.parentItemTypeId];
				let propKeyedNameData;
				let extendedProperty;

				for (let m = 0; m < parentProps.length; m++) {
					if (parentProps[m].name === 'keyed_name') {
						propKeyedNameData = parentProps[m];
					} else if (parentProps[m].name === propColumnName) {
						extendedProperty = parentProps[m];
					}
				}

				property.propertyLabel =
					propKeyedNameData.label || propKeyedNameData.name;
				if (extendedProperty) {
					property.customLabel =
						extendedProperty.label || extendedProperty.name;
				}
			}
		}

		loadProperties();
		rightContentTbody = query(
			'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc',
			rightPanelContent
		).children('tbody');
		self.addOrRemoveRightContentRow(
			loadedProperties,
			false,
			rightContentTbody,
			0,
			1,
			3
		);
		djUiSqlBridge.rowsToAdd = {}; // clean rows list after add
		added = true;
	}

	var tempCache = {};
	var rightContentTbody;
	var self;
	var added = false;

	dojo.setObject(
		'Izenda.UI.Tab.Properties',
		declare(Izenda.UI.Tab.Splitted, {
			leftPanelWidget: null,

			init: function (metadata) {
				self = this;

				this.leftPanelWidget = new Izenda.UI.Widgets.ReportingStructure({
					selectorType: 'checkbox',
					onBottomPanelRowSelectedCallback: function (propertiesList) {
						rightContentTbody = query(
							'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc',
							this.rightPanelContent
						).children('tbody');
						self.addOrRemoveRightContentRow(
							propertiesList,
							false,
							rightContentTbody,
							0,
							1,
							3
						);
					},
					clientUrl: this.args.clientUrl,
					skipItemTypeProperties: true,
					isLazySelect: true,
					dblclickEnabled: true,
					buttonText: Izenda.Utils.GetResource(
						'reportingstructure.add_props_button_text'
					)
				});
				this.leftPanelWidget.placeAt(this.leftPanelContent);
				this.leftPanelWidget.startup();
				this.leftPanelWidget.init();
				this.inherited(arguments);
				this.leftPanelWidget.selectedRowsMetadata.selectedRows = metadata;
				improveIzendaUI(
					this.args.clientUrl,
					this.rightPanelContent,
					metadata,
					this.args.djUiSqlBridge
				);
				document.addEventListener(
					'allItemTypesLoaded',
					function () {
						preselectProperties(
							this.args.djUiSqlBridge.getSelectedItemTypeProps(),
							this.args.djUiSqlBridge,
							this.rightPanelContent,
							this.leftPanelWidget.selectedRowsMetadata.selectedRows
						);
						window['SC_CallOnColumnFunctionChangeHandlers'](
							'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc'
						);
					}.bind(this)
				);
			},

			onResize: function () {
				this.inherited(arguments);
				this.leftPanelWidget.onResize(
					domStyle.get(this.leftTogglePanel.domNode, 'height') -
						domGeom.getMarginBox(this.header).h
				);
			},

			onSelect: function () {
				this.inherited(arguments);
				this.leftPanelWidget.reloadTree(this.args.djUiSqlBridge.htmlToTree());
			}
		})
	);
});
