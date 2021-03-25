require([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/query',
	'dojo/on',
	'dojo/text!Izenda/Views/Widgets/ShareSelector.html'
], function (declare, domConstruct, query, on, selectShareTemplate) {
	var _shareWithRightsTable = null;
	var _drillDownKeysTable = null;

	dojo.setObject(
		'Izenda.UI.Tab.Misc',
		declare(Izenda.UI.Tab.Base, {
			constructor: function () {
				Object.defineProperty(this, 'shareWithRightsTable', {
					get: function () {
						if (_shareWithRightsTable === null) {
							_shareWithRightsTable = this.tabContent.querySelectorAll(
								'table:first-child table'
							)[8];
						}

						return _shareWithRightsTable;
					}
				});

				Object.defineProperty(this, 'drillDownKeysTable', {
					get: function () {
						if (_drillDownKeysTable === null) {
							_drillDownKeysTable = this.tabContent.querySelectorAll(
								'table:first-child table'
							)[10];
							_drillDownKeysTable.lastRow = _drillDownKeysTable.querySelectorAll(
								'tr:last-child'
							)[0];
							_drillDownKeysTable.lastRow.cells = _drillDownKeysTable.lastRow.querySelector(
								'td'
							);
						}

						return _drillDownKeysTable;
					}
				});
			},

			metadata: {
				breadcrumbs: {}
			},

			init: function (metadata) {
				this.inherited(arguments);
				this.addNameField(this.tabContent);
				this.improveIzendaUI(this.tabContent, this.metadata);
			},

			onSelect: function () {
				this.shareSelector.resize();
			},

			getMetaData: function () {
				return this.metadata;
			},

			addNameField: function (container) {
				const titleDiv = query('table tr div', container)[1];
				const existName =
					this.args.arasObj.getItemProperty(window.parent.item, 'name') || '';
				const nameLabel = Izenda.Utils.GetResource('reportdesigner.name');
				const innerHtml =
					'<table width="674"><tbody><tr><td>' +
					nameLabel +
					'</td></tr><tr><td>' +
					'<input required id="innovatorReportName" name="innovatorReportName" style="width:100%" value="' +
					existName +
					'" type="text"></td><td></td></tr></tbody></table>';

				domConstruct.create(
					'div',
					{ innerHTML: innerHtml },
					titleDiv,
					'before'
				);
			},

			improveIzendaUI: function (container, metadata) {
				// shared with block construction
				this.shareWithRightsTable.style.display = 'none';
				var dom = domConstruct.create(
					'div',
					{ class: 'share_with_and_right', innerHTML: selectShareTemplate },
					this.shareWithRightsTable,
					'before'
				);
				this.shareSelector = new Izenda.UI.Widgets.ShareSelector({
					arasObj: this.args.arasObj,
					clientUrl: this.args.clientUrl,
					widgetDom: dom,
					isEditMode: this.args.isEditMode
				});

				// drill down block construction
				this.drillDownKeysTable.width = 250;
				//hide "Ignore First Key" option
				var tdNode = this.drillDownKeysTable.lastRow.querySelector(
					'td:last-child'
				);
				tdNode.style.display = 'none';

				var selectCellContainer = query(
					this.drillDownKeysTable.lastRow
				).children('td')[1];
				var selectResultArray = query('select', selectCellContainer);

				var select = selectResultArray[1];
				var select2 = selectResultArray[0];
				select.parentNode.style.marginTop = '10px';

				var onEllipsisClickFunction = function (e) {
					var callback = null;
					if (
						query(e.target)
							.closest('.sys_f_div_select')[0]
							.nextSibling.classList.contains('sys_f_div_select')
					) {
						callback = Izenda.UI.Widgets.Breadcrumbs.setBreadcrumb.bind(
							this,
							e.target
						);
					}
					var title = Izenda.Utils.GetResource(
						'reportdesigner.drill_down_key.dialog.title'
					);
					Izenda.Utils.showReportingStructurePopup(
						title,
						djUiSqlBridge.htmlToTree(),
						e.target.previousSibling,
						callback
					);
				}.bind(this);

				Izenda.Utils.improveSelectInput(select2);
				Izenda.Utils.improveSelectInput(select);
				Izenda.Utils.improveInnovatorSelectWithEllipsis(
					select2,
					onEllipsisClickFunction
				);
				var breadcrumdContainer = Izenda.UI.Widgets.Breadcrumbs.addBreadcrumbContainer(
					select2
				);

				select2.boundBreadcrumbContainer = breadcrumdContainer;
				select2.boundMetadata = metadata.breadcrumbs;

				Izenda.Utils.improveInnovatorSelectWithEllipsis(
					select,
					onEllipsisClickFunction
				);
				on(
					query('table tr div input', container)[1],
					'change',
					djUiSqlBridge.setDirty
				);
				on(
					query('table tr div input', container)[1],
					'keypress',
					djUiSqlBridge.setDirty
				);
			}
		})
	);
});
