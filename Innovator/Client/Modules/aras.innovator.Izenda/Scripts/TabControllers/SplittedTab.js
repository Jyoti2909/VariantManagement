require([
	'dojo/aspect',
	'dojo/dom-style',
	'dojo/_base/declare',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!Izenda/Views/Tabs/SplittedTab.html',
	'dojo/query',
	'dojo/dom-attr',
	'dojo/dom-geometry'
], function (
	aspect,
	domStyle,
	declare,
	on,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template,
	query,
	domAttr,
	domGeom
) {
	function EBCInsertRow(table, n, newRow) {
		var tb = table.tBodies[0];
		var r = tb.rows;
		if (!newRow) {
			newRow = r[r.length - 1].cloneNode(true);
		}
		if (newRow.style.display == 'none') {
			newRow.style.display = '';
		}

		if (r.length <= n) {
			tb.appendChild(newRow);
		} else {
			tb.insertBefore(newRow, r[n]);
		}
		//for(i in newRow)
		//	if(i.charAt(0) == '_')
		//		newRow[i] = undefined;
		newRow._table = table;
		var filterNumber = window['EBC_GetInputByName'](newRow, 'FilterNumber');
		if (filterNumber && window['CC_RenumFilters']) {
			window['CC_RenumFilters'](window['EBC_GetParentTable'](newRow));
		}
		return newRow;
	}

	function togglePanelMouseOver(evt) {
		var togglePanel = this.leftTogglePanel.domNode;
		var tgt = evt.srcElement || evt.target;
		if (togglePanel.id !== tgt.id) {
			tgt.classList.add('collapsed-panel-hover');
			togglePanel.buttonsCovered = true;
		}
		if (togglePanel.id === tgt.id && !togglePanel.buttonsCovered) {
			tgt.classList.add('collapsed-panel-hover');
		} else {
			tgt.classList.remove('collapsed-panel-hover');
		}
	}

	function togglePanelMouseOut(evt) {
		var togglePanel = this.leftTogglePanel.domNode;
		var tgt = evt.srcElement || evt.target;
		var el = togglePanel.id !== tgt.id ? tgt : togglePanel;
		el.classList.remove('collapsed-panel-hover');
		togglePanel.buttonsCovered = false;
	}

	var self;
	declare(
		'Izenda.UI.Tab.Splitted',
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			templateString: template,
			isLeftPanelCollapsed: false,
			name: null,

			constructor: function (args) {
				this.args = args;
				this.name = this.args.name;
			},

			init: function (metadata) {
				if (metadata) {
					this.metadata = metadata;
				}
				self = this;
				//custom delete row action
				window[
					'EBC_RemoveNotLastRowHandler'
				] = Izenda.Utils.extendMethodWithFuncs(
					window['EBC_RemoveNotLastRowHandler'],
					null,
					function () {
						var row = query(
							arguments[1].target ? arguments[1].target : arguments[1]
						).closest('tr')[0];
						var activeTab = Izenda.UI.Widgets.TabsAggregator.getActiveTab();
						if (activeTab.leftPanelWidget) {
							var key = domAttr.get(row, 'innovator-row-key');
							self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[key]--;
							if (
								self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[
									key
								] === 0
							) {
								delete self.leftPanelWidget.selectedRowsMetadata.selectedRows[
									key
								];
								delete self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[
									key
								];
							}
						}
					}
				);

				this.rowsIdsCounter = {};
				this.startup();
				//press any place on collapsed panel to show
				on(
					this.leftTogglePanel,
					'click',
					function (evt) {
						var tgt = evt.srcElement || evt.target;
						if (
							this.borderContainer.domNode.classList.contains(
								'toggle-panel-collapsed'
							) &&
							!tgt.classList.contains('hide-btn') &&
							!tgt.classList.contains('toggle-icon-arrow')
						) {
							this.showLeftTree(true);
						}
					}.bind(this)
				);
				on(this.showBtn, 'click', this.showLeftTree.bind(this, true));
				on(this.hideBtn, 'click', this.showLeftTree.bind(this, false));

				on(this.leftTogglePanel, 'mouseover', togglePanelMouseOver.bind(this));
				on(this.leftTogglePanel, 'mouseout', togglePanelMouseOut.bind(this));

				if (this.args.rightPanelContentObj) {
					this.rightPanelContent.appendChild(this.args.rightPanelContentObj);
				}

				//Remove option before implementation - IR-035239 SSR: Implement "Automatic" option for drill-down reports
				var selectArr = this.rightPanelContent.querySelectorAll(
					'select[name$="Subreport"] option[value="(AUTO)"]'
				);
				for (var i = 0; i < selectArr.length; i++) {
					selectArr[i].parentNode.removeChild(selectArr[i]);
				}

				Izenda.Utils.improveCheckboxes(
					this.rightPanelContent,
					'input[type=checkbox]'
				);
				Izenda.Utils.improveButtons(this.rightPanelContent);

				this.borderContainer.resize();

				document.getElementById(
					'st_collapsed_header'
				).title = Izenda.Utils.GetResource('common.st_collapsed_header');
				document.getElementById('st_header').title = Izenda.Utils.GetResource(
					'common.st_header'
				);
			},

			addOrRemoveRightContentRow: function (
				propertiesList,
				isRemoved,
				rightContentTbody,
				itemTypeColumnIdx,
				propertyColumnIdx,
				displayLabelColumnIdx
			) {
				const createdRows = {};

				function createNewRows() {
					const keys = Object.keys(propertiesList);
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i];
						createNewRow(key, propertiesList[key]);
					}
				}

				function createNewRow(key, property) {
					const existingRowsCount = rightContentTbody[0].children.length - 1;
					// 'EBCInsertRow' method of Izenda clones last row and pastes to table.
					// All handlers (observers of attribute, etc.) were attached to elements of source row were not copied to target row
					let newRow = EBCInsertRow(
						rightContentTbody[0].parentNode,
						existingRowsCount
					);
					newRow.setAttribute('userChanged', '');
					window['SC_ClearRowSelects'](newRow);
					createdRows[key] = newRow;
					processAddedRow(key, property, newRow);
				}

				function processAddedRow(key, property, row) {
					var selectedItemTypeName = property.itemTypeName;
					var selectedPropertyName = property.name;
					var itemTypeLabel =
						(property.itemTypeLabel || selectedItemTypeName) +
						(property.itemTypeCount || '');
					var propertyLabel = property.propertyLabel || selectedPropertyName;

					self.leftPanelWidget.selectedRowsMetadata.selectedRows[
						key
					] = property;
					if (!self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[key]) {
						self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[key] = 1;
					} else {
						self.leftPanelWidget.selectedRowsMetadata.rowsIdsCounter[key]++;
					}

					var affectedRow = row;
					domAttr.set(affectedRow, 'innovator-row-key', key);
					var mainSelectControl = query('td select', affectedRow)[0];
					mainSelectControl.value = key;
					if (mainSelectControl.value != key) {
						for (var i = 0; i < mainSelectControl.length; i++) {
							if (
								mainSelectControl[i].value.toLowerCase() === key.toLowerCase()
							) {
								mainSelectControl.value = mainSelectControl[i].value;
								break;
							}
						}
					}

					var rowTDs = query(row).children('td');
					rowTDs[itemTypeColumnIdx].innerHTML = itemTypeLabel;
					rowTDs[propertyColumnIdx].innerHTML = propertyLabel;

					Izenda.Utils.FireOnchange(mainSelectControl);

					var label = property.customLabel;
					if (label && displayLabelColumnIdx !== -1) {
						var displayLabelInput = rowTDs[displayLabelColumnIdx].children[0];
						domAttr.set(displayLabelInput, 'firstmodification', 'true');
						displayLabelInput.value = label;
					}

					domAttr.set(rightContentTbody[0].lastChild, 'innovator-row-key', '');

					var propertyDataType = property.propertyDataType;
					if (
						propertyDataType === 'color' ||
						propertyDataType === 'color list'
					) {
						// special format for custom expression related to property name
						// on server side property with such expression will be processed in a special way
						var expression = '${' + selectedPropertyName + '}';

						setSpecialExpressions(mainSelectControl, expression, expression);
					} else if (propertyDataType === 'boolean') {
						// set custom expressions for boolean data type
						var backgroundExpression =
							'0:url(../client/images/checkbox-unchecked.svg) no-repeat center / 12px;';
						backgroundExpression +=
							' 1:url(../client/images/checkbox-checked.svg) no-repeat center / 12px';
						var textExpression = 'transparent';

						setSpecialExpressions(
							mainSelectControl,
							backgroundExpression,
							textExpression
						);
					} else if (propertyDataType === 'image') {
						// set custom expression for image data type
						var urlExpression = '__REPLACE_TEXT_WITH_CLICKABLE_IMAGE20x20__';
						setSpecialImageExpression(mainSelectControl, urlExpression);
					}
				}

				function setSpecialExpressions(
					mainSelectControl,
					backgroundExpression,
					textExpression
				) {
					var dialogRow = window['EBC_GetRow']();
					var propsTable = window['EBC_GetElementByName'](
						dialogRow,
						'PropertiesTable',
						'table'
					);

					var cellElement;
					var textElement;
					if (
						mainSelectControl.id ===
						'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_Column'
					) {
						//this means the current tab is "Properties"
						cellElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_CellHighlight]',
							propsTable
						)[0];
						cellElement.value = backgroundExpression;
						textElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_TextHighlight]',
							propsTable
						)[0];
						textElement.value = textExpression;
					} else if (
						mainSelectControl.id ===
						'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_Column'
					) {
						//this means the current tab is "Summary"
						cellElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_CellHighlight]',
							propsTable
						)[0];
						cellElement.value = backgroundExpression;
						textElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_TextHighlight]',
							propsTable
						)[0];
						textElement.value = textExpression;
					}
				}

				function setSpecialImageExpression(mainSelectControl, urlExpression) {
					var dialogRow = window['EBC_GetRow']();
					var propsTable = window['EBC_GetElementByName'](
						dialogRow,
						'PropertiesTable',
						'table'
					);
					// Setting of special url expression only for the Properties and Summary tabs
					// For others (for ex. the Filters tab) it hasn't to be set
					var urlElement;
					if (
						mainSelectControl.id ===
						'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_Column'
					) {
						//this means the current tab is "Properties"
						urlElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc_Url]',
							propsTable
						)[0];
						urlElement.value = urlExpression;
					} else if (
						mainSelectControl.id ===
						'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_Column'
					) {
						//this means the current tab is "Summary"
						urlElement = query(
							'[name=ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sm_Url]',
							propsTable
						)[0];
						urlElement.value = urlExpression;
					}
				}

				function reimproveElements(rows) {
					var keys = Object.keys(rows);
					keys.forEach(function (key) {
						var row = rows[key];
						Izenda.Utils.unimproveCheckboxes(row, 'input[type=checkbox]');
						Izenda.Utils.improveCheckboxes(row, 'input[type=checkbox]');
					});
				}

				createNewRows();
				// All created rows are cloned nodes that have wrappers on all 'select' elements,
				// but any handlers were not copied.
				reimproveElements(createdRows);
				this.args.djUiSqlBridge.propsDirty = true;
				this.args.djUiSqlBridge.switchDirty();
			},

			onResize: function () {
				const tabStrip = query('.TabStrip')[0];
				const toolbar = query('#designerToolbar')[0];
				const newHeight =
					domStyle.get(query('body')[0], 'height') -
					domGeom.getMarginBox(tabStrip).h -
					domGeom.getMarginBox(toolbar).h +
					'px';
				this.domNode.style.height = newHeight;
				this.borderContainer.resize();
			},

			onSelect: function () {
				//this.borderContainer.resize();
			},

			showLeftTree: function (show) {
				if (show) {
					this.collapsedHeader.style.display = 'none';
					this.header.removeAttribute('style');
				} else {
					this.collapsedHeader.removeAttribute('style');
					this.header.style.display = 'none';
				}
				this.borderContainer.domNode.classList.toggle(
					'toggle-panel-collapsed',
					!show
				);
				this.borderContainer.resize();
			},

			getMetaData: function () {
				return this.leftPanelWidget.selectedRowsMetadata.selectedRows;
			}
		}
	);
});
