require([
	'dojo/dom-construct',
	'dojo/dom-style',
	'dojo/_base/declare',
	'dojo/query',
	'dojo/dom-attr',
	'dojo/dom-geometry'
], function (domConstruct, domStyle, declare, query, domAttr, domGeom) {
	function improveIzendaUI(clientUrl, rightPanel, metadata) {
		//makes bottom buttons look like Innovator
		Izenda.Utils.improveButtons(this.rightPanel);

		var contentTables = query('table table', rightPanel);
		var recordsTable = contentTables[0];
		recordsTable.classList.add('records-table');

		//merge thead TDs in one with label
		var thead = query('.iz-table-fields thead tr', rightPanel)[0];
		var theadCells = query('th', thead);

		theadCells.forEach(function (el, idx) {
			//FldId field is last column, but it is service and could be inside actions colspan
			if (idx >= theadCells.length - 7) {
				domConstruct.destroy(el);
			}
		});

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

		//add ItemType and Property columns
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
				var rowTDs = el.cells;
				var fieldTD = rowTDs[0];
				var bodyItemTypeColumn = document.createElement('td');
				bodyItemTypeColumn.appendChild(document.createElement('span'));
				bodyItemTypeColumn.firstChild.appendChild(
					document.createTextNode(itemTypeName)
				);
				el.insertBefore(bodyItemTypeColumn, fieldTD);
				var bodyPropertyColumn = document.createElement('td');
				bodyPropertyColumn.appendChild(document.createElement('span'));
				bodyPropertyColumn.firstChild.appendChild(
					document.createTextNode(propertyName)
				);
				el.insertBefore(bodyPropertyColumn, fieldTD);

				//set D&D for first column
				rowTDs = el.cells;
				domAttr.set(rowTDs[0], 'name', 'dragIcon');

				//hide Field column
				thead = query('.iz-table-fields thead tr', rightPanel);
				domStyle.set(rowTDs[2], 'display', 'none');
				domStyle.set(rowTDs[2].firstChild, 'display', 'none');
				domStyle.set(thead.children('th')[2], 'display', 'none');
			});

		//rename Description column
		thead.children('th')[3].firstChild.innerHTML = Izenda.Utils.GetResource(
			'reportdesigner.tables.displaylabel'
		);

		var subtotalsTableContainer = document.getElementById(
			'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_TotalsDiv'
		);
		subtotalsTableContainer.classList.add('inline-block');
		subtotalsTableContainer.classList.add('summary_bottom_controls');
		var deltasTable = query(subtotalsTableContainer).next()[0];
		deltasTable.classList.add('inline-block');
		deltasTable.classList.add('summary_bottom_controls');
	}

	var self;

	dojo.setObject(
		'Izenda.UI.Tab.Summary',
		declare(Izenda.UI.Tab.Splitted, {
			init: function (metadata) {
				self = this;
				this.leftPanelWidget = new Izenda.UI.Widgets.ReportingStructure({
					selectorType: 'checkbox',
					onBottomPanelRowSelectedCallback: function (propertiesList) {
						var rightContentTbody = query(
							'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm',
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
