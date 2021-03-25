require([
	'dojo/dom-construct',
	'dojo/dom-style',
	'dojo/_base/declare',
	'dojo/on',
	'dojo/query',
	'dojo/dom-attr',
	'dojo/dom-geometry'
], function (domConstruct, domStyle, declare, on, query, domAttr, domGeom) {
	function improveIzendaUI(clientUrl, rightPanel, metadata) {
		//makes bottom buttons look like Innovator
		Izenda.Utils.improveButtons(this.rightPanel);

		var contentTables = query('table table', rightPanel);
		var recordsTable = contentTables[0];
		recordsTable.classList.add('records-table');

		//merge thead TDs in one with label
		var thead = query('.iz-table-filters thead tr')[0];
		Izenda.Utils.fixHeaders(thead);
		var theadCells = query('th', thead);

		theadCells.forEach(function (el, idx) {
			if (idx >= theadCells.length - 4) {
				domConstruct.destroy(el);
			}
		});

		var actionsTh = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.actions')
		);
		domAttr.set(actionsTh, 'colspan', 7);
		actionsTh.colspan = '6';
		thead.appendChild(actionsTh);

		query('.iz-table-filters', rightPanel)
			.children('tbody')
			.children('tr')
			.forEach(function (el, idx) {
				//change sort of action icons
				var rowTDs = el.cells;
				var countOfColumns = rowTDs.length;
				var deleteImg = rowTDs[countOfColumns - 4].firstChild;
				var insertFieldAboveImg = rowTDs[countOfColumns - 3].firstChild;
				var insertFieldBelowImg = rowTDs[countOfColumns - 2].firstChild;
				var dragDropImg = rowTDs[countOfColumns - 1].firstChild;
				rowTDs[countOfColumns - 4].appendChild(insertFieldAboveImg);
				rowTDs[countOfColumns - 3].appendChild(insertFieldBelowImg);
				rowTDs[countOfColumns - 2].appendChild(deleteImg);

				//Hide InserAfter/below action icons
				domStyle.set(insertFieldAboveImg.parentNode, 'display', 'none');
				domStyle.set(insertFieldBelowImg.parentNode, 'display', 'none');
				domStyle.set(insertFieldAboveImg, 'display', 'none');
				domStyle.set(insertFieldBelowImg, 'display', 'none');

				//beautify drag and drop
				domStyle.set(dragDropImg.parentNode, 'display', 'none');
				domStyle.set(dragDropImg, 'display', 'none');
				domAttr.remove(dragDropImg.parentNode, 'name');

				//change action images
				insertFieldAboveImg.src = clientUrl + '/images/InsertFieldAbove.svg';
				insertFieldBelowImg.src = clientUrl + '/images/InsertFieldBelow.svg';
				deleteImg.src = clientUrl + '/images/Delete.svg';
			});

		//add ItemType and Property columns
		var headPropertyColumn = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.property')
		);
		thead.insertBefore(headPropertyColumn, thead.firstChild.nextSibling);
		var headItemTypeColumn = Izenda.Utils.generateIzendaStyleHeaderElement(
			Izenda.Utils.GetResource('reportdesigner.tables.itemtype')
		);
		thead.insertBefore(headItemTypeColumn, thead.firstChild.nextSibling);

		query('.iz-table-filters', rightPanel)
			.children('tbody')
			.children('tr')
			.forEach(function (el, idx) {
				var selectEl = query('select', el.cells[1])[0];
				var metaDataForRow = metadata[selectEl.value];
				var itemTypeName = metaDataForRow
					? metaDataForRow.itemTypeLabel || metaDataForRow.itemTypeName
					: '';
				var propertyName = metaDataForRow
					? metaDataForRow.propertyLabel || metaDataForRow.name
					: '';
				self
					.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[selectEl.value]++;
				var rowTDs = el.cells;
				var filterTD = rowTDs[1];
				var bodyItemTypeColumn = document.createElement('td');
				bodyItemTypeColumn.appendChild(document.createElement('span'));
				bodyItemTypeColumn.firstChild.appendChild(
					document.createTextNode(itemTypeName)
				);
				el.insertBefore(bodyItemTypeColumn, filterTD);
				var bodyPropertyColumn = document.createElement('td');
				bodyPropertyColumn.appendChild(document.createElement('span'));
				bodyPropertyColumn.firstChild.appendChild(
					document.createTextNode(propertyName)
				);
				el.insertBefore(bodyPropertyColumn, filterTD);

				//set D&D for first column
				rowTDs = el.cells;
				domAttr.set(rowTDs[1], 'name', 'dragIcon');

				//hide Filter Field column
				thead = query('.iz-table-filters thead tr');
				domStyle.set(rowTDs[3], 'display', 'none');
				domStyle.set(rowTDs[3].firstChild, 'display', 'none');
				domStyle.set(thead.children()[3], 'display', 'none');

				//hide first column with row numbers
				domStyle.set(rowTDs[0], 'display', 'none');
				domStyle.set(rowTDs[0].firstChild, 'display', 'none');
				domStyle.set(thead.children()[0], 'display', 'none');
			});

		//rename Alias column till Izenda adds localization
		thead.children('th')[7].firstChild.innerHTML = Izenda.Utils.GetResource(
			'reportdesigner.tables.alias'
		);

		var requireRow = document.getElementById(
			'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_cc_TableValuesShouldBe'
		);
		requireRow.classList.add('iz-table-filters');
		requireRow.classList.add('iz-table-require-row');
		var filterLogicRow = document.getElementById(
			'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_cc_FilterLogic'
		);
		filterLogicRow.classList.add('iz-table-filters');
		filterLogicRow.classList.add('iz-table-logic-row');
	}

	function improveIzendaFiltersControls(container, djUiSqlBridge) {
		window['CC_ShowPopupFilterResponse'] = Izenda.Utils.extendMethodWithFuncs(
			window['CC_ShowPopupFilterResponse'],
			null,
			function () {
				Izenda.Utils.improveCheckboxes(
					document.getElementsByClassName('izenda-vis-tooltip')[0],
					'input[type=checkbox]'
				);
				Izenda.Utils.improveButtons(
					document.getElementsByClassName('izenda-vis-tooltip')[0]
				);
				Izenda.Utils.improvePopupDialog('Select values', function () {
					window['CC_PopupFiltersConfirm'](false);
				});
			}
		);
		window['CC_PopupFiltersConfirm'] = Izenda.Utils.extendMethodWithFuncs(
			window['CC_PopupFiltersConfirm'],
			function () {
				Izenda.Utils.unimproveCheckboxes(
					document.getElementsByClassName('izenda-vis-tooltip')[0],
					'input[type=checkbox]',
					false
				);
			},
			null
		);
		window['EBC_LoadData'] = Izenda.Utils.extendAsyncMethodWithFunc(
			window['EBC_LoadData'],
			function () {
				if (Izenda.UI.Widgets.TabsAggregator.activeTab.name == 'Filters') {
					if (this[0] == 'ExistentValuesList') {
						var row = window['EBC_GetRow']();
						Izenda.Utils.improveCheckboxes(row, 'input[type=checkbox]');
					}
				}
			},
			4
		);
		window['CC_LoadFields'] = Izenda.Utils.extendMethodWithFuncs(
			window['CC_LoadFields'],
			null,
			function () {
				var operatorValue = window['EBC_GetSelectByName'](
					arguments[0],
					'Operator'
				).value;
				if (
					operatorValue == 'NotEqualsField' ||
					operatorValue == 'EqualsField' ||
					operatorValue == 'LessThanField' ||
					operatorValue == 'GreaterThanField'
				) {
					var valueSelectEl = window['EBC_GetSelectByName'](
						arguments[0],
						'SelectValue'
					);
					Izenda.Utils.improveSelectInput(valueSelectEl);
					var onEllipsisClickFunction = function (e) {
						Izenda.Utils.showReportingStructurePopup(
							Izenda.Utils.GetResource('reportingstructure.selectvalue'),
							djUiSqlBridge.htmlToTree(),
							e.target.previousSibling
						);
					};
					Izenda.Utils.improveInnovatorSelectWithEllipsis(
						valueSelectEl,
						onEllipsisClickFunction
					);
				}
			}
		);

		window['CC_LoadValues'] = Izenda.Utils.extendMethodWithFuncs(
			window['CC_LoadValues'],
			null,
			function () {
				var operatorValue = window['EBC_GetSelectByName'](
					arguments[0],
					'Operator'
				).value;
				var valueSelectEl = window['EBC_GetSelectByName'](
					arguments[0],
					'SelectValue'
				);
				if (
					operatorValue == 'Equals_Select' ||
					operatorValue == 'NotEquals_Select' ||
					operatorValue == 'Equals_TreeView' ||
					operatorValue == 'NotEquals_TreeView' ||
					operatorValue == 'Equals_CheckBoxes'
				) {
					Izenda.Utils.removeEllipsisFromInnovatorSelect(valueSelectEl);
					Izenda.Utils.improveSelectInput(valueSelectEl);
				} else if (
					operatorValue == 'Equals_Multiple' ||
					operatorValue == 'NotEquals_Multiple'
				) {
					Izenda.Utils.unimproveSelectInput(valueSelectEl);
				}
			}
		);
	}

	function setDateTimePickerIconForInputsOfDataTimeCondition(
		clientUrl,
		rightPanelContent
	) {
		const dateTimePickerInnovatorIconSrc = clientUrl + '/images/calendar.svg';
		query(
			'img.iz-ui-datepicker-trigger:not(.date_pickup)',
			rightPanelContent
		).forEach(function (element, index) {
			element.src = dateTimePickerInnovatorIconSrc;
			domAttr.set(element, 'onclick', 'Izenda.Utils.showCalendar(this)');
			element.classList.add('date_pickup');
		});
		const datepicker = document.getElementById('iz-ui-datepicker-div');
		if (datepicker) {
			datepicker.parentNode.removeChild(datepicker);
		}
	}

	var self;

	dojo.setObject(
		'Izenda.UI.Tab.Filters',
		declare(Izenda.UI.Tab.Splitted, {
			init: function (metadata) {
				self = this;
				this.leftPanelWidget = new Izenda.UI.Widgets.ReportingStructure({
					selectorType: 'checkbox',
					onBottomPanelRowSelectedCallback: function (propertiesList) {
						var rightContentTbody = query(
							'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_cc',
							this.rightPanelContent
						).children('tbody');
						self.addOrRemoveRightContentRow(
							propertiesList,
							false,
							rightContentTbody,
							1,
							2,
							-1
						);
					},
					clientUrl: this.args.clientUrl,
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
				improveIzendaUI(this.args.clientUrl, this.rightPanelContent, metadata);
				var djUiSqlBridge = this.args.djUiSqlBridge;
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
				improveIzendaFiltersControls(
					this.rightPanelContent,
					this.args.djUiSqlBridge
				);
				setDateTimePickerIconForInputsOfDataTimeCondition(
					this.clientUrl,
					this.rightPanelContent
				);
			}
		})
	);
});
