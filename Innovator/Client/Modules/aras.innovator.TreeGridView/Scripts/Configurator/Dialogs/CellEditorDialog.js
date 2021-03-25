define(function () {
	'use strict';
	var CellEditorDialog = (function () {
		function CellEditorDialog(aras, treeGridRepository, tooltipDialogUtils) {
			this._arasObject = aras;
			this._treeGridRepository = treeGridRepository;
			this._tooltipDialogUtils = tooltipDialogUtils;
		}
		CellEditorDialog.prototype.tryShowDialog = function (
			treeGridRowModel,
			columnDefinition,
			targetDomNode
		) {
			var self = this;
			if (treeGridRowModel.isCandidate) {
				return;
			}
			var mappings = treeGridRowModel.columnMappings;
			var columnMapping = mappings.reduceRight(function (a, c) {
				return c.sourceId === columnDefinition.id ? c : a;
			}, null);
			//rbUiCellEditorItem is used just for Form. Note item type rbUiCellEditorItem should not contain any instances in DB.
			var rbUiCellEditorItem = this._arasObject.newIOMItem('rb_UI_CellEditor');
			var template = columnMapping && columnMapping.template;
			if (template) {
				rbUiCellEditorItem.setProperty('text_template', template.text_template);
				rbUiCellEditorItem.setProperty(
					'list_value_template',
					template.list_value_template
				);
				rbUiCellEditorItem.setProperty(
					'innovator_type_name',
					template.item_type_name
				);
				rbUiCellEditorItem.setProperty(
					'innovator_list_name',
					template.list_name
				);
				rbUiCellEditorItem.setProperty('precision', template.precision);
				rbUiCellEditorItem.setProperty('scale', template.scale);
				rbUiCellEditorItem.setProperty('item_id_template', template.item_id);
				rbUiCellEditorItem.setProperty('icon_template', template.icon);
				rbUiCellEditorItem.setProperty('date_format', template.date_format);
			}
			var cellViewType = columnMapping ? columnMapping.cellViewType : 'Text';
			rbUiCellEditorItem.setProperty('cell_view_type', cellViewType);
			function showTooltipDialog() {
				var formId;
				//see below recursive call of this function. In this case cell_view_type can be changed. So, we need to update cellViewType.
				cellViewType = rbUiCellEditorItem.getProperty('cell_view_type');
				var cellViewTypeUpper = cellViewType.toUpperCase();
				switch (cellViewTypeUpper) {
					case 'ITEM':
						formId = 'A7947FE643FB4581ADE5D37E54E3BB7C'; //form name rb_UI_CellEditorItem
						break;
					case 'LIST':
						formId = '3B7DF72F4BFF4BF8AFC0EEB37D9970AE'; //form name rb_UI_CellEditorList
						break;
					case 'DECIMAL':
						formId = '8C57A733E29049B59BA5EBDFF462F16A'; //form name rb_UI_CellEditorDecimal
						break;
					case 'DATE':
						formId = '462C2D638F78408B8B9CA380FDEC2E52'; //form name rb_UI_CellEditorDate
						break;
					default:
						formId = 'B6029B27A2504290A49ABC601AA40EF7'; //rb_UI_CellEditor, used for Text, Decimal, etc. CellViewTypes
						break;
				}
				var currentBranch = self._treeGridRepository.getCurrentBranch();
				var graphNode = currentBranch.getNodeById(treeGridRowModel.uniqueId);
				var qbAliases = self._treeGridRepository.getAliasesForNode(
					graphNode,
					false
				);
				var qbCellTemplateValuesByAlias = {};
				qbAliases.map(function (alias) {
					if (alias) {
						qbCellTemplateValuesByAlias[
							alias
						] = self._treeGridRepository.getQbCellTemplateValuesForAlias(
							graphNode,
							alias
						);
					}
				});
				self._tooltipDialogUtils.showTooltipDialog(
					rbUiCellEditorItem.node,
					{
						around: targetDomNode,
						cellViewType: cellViewType,
						qbCellTemplateValuesByAlias: qbCellTemplateValuesByAlias
					},
					{
						formType: isEditMode ? null : 'view',
						formId: formId,
						callbacks: {
							onClose: function (args) {
								if (!isEditMode) {
									return;
								}
								if (args && args.isToReopen) {
									setTimeout(showTooltipDialog, 0);
									return;
								}
								if (!columnMapping) {
									columnMapping = self._treeGridRepository.createColumnMapping(
										graphNode,
										columnDefinition
									);
								}
								if (!columnMapping.template) {
									columnMapping.template = {};
								}
								var textTemplateValue = rbUiCellEditorItem.getProperty(
									'text_template'
								);
								var listValueTemplate = rbUiCellEditorItem.getProperty(
									'list_value_template'
								);
								var itemTypeNameValue = rbUiCellEditorItem.getProperty(
									'innovator_type_name'
								);
								var listName = rbUiCellEditorItem.getProperty(
									'innovator_list_name'
								);
								var itemIdValue = rbUiCellEditorItem.getProperty(
									'item_id_template'
								);
								var iconValue = rbUiCellEditorItem.getProperty('icon_template');
								var cellViewTypeValue = rbUiCellEditorItem.getProperty(
									'cell_view_type'
								);
								var precision = rbUiCellEditorItem.getProperty('precision');
								var scale = rbUiCellEditorItem.getProperty('scale');
								var dateFormat = rbUiCellEditorItem.getProperty('date_format');
								//'if' statements are required to differentiate empty values in template and if values are not specified.
								//It's used, e.g., for icon in default builder method. No value in template and empty value are different values.
								if (columnMapping.template.text_template || textTemplateValue) {
									columnMapping.template.text_template = textTemplateValue;
								}
								if (
									columnMapping.template.list_value_template ||
									listValueTemplate
								) {
									columnMapping.template.list_value_template = listValueTemplate;
								}
								if (
									columnMapping.template.item_type_name ||
									itemTypeNameValue
								) {
									columnMapping.template.item_type_name = itemTypeNameValue;
								}
								if (columnMapping.template.list_name || listName) {
									columnMapping.template.list_name = listName;
								}
								if (columnMapping.template.item_id || itemIdValue) {
									columnMapping.template.item_id = itemIdValue;
								}
								if (columnMapping.template.icon || iconValue) {
									columnMapping.template.icon = iconValue;
								}
								if (columnMapping.cellViewType || cellViewTypeValue) {
									columnMapping.cellViewType = cellViewTypeValue;
								}
								if (columnMapping.template.precision || precision) {
									columnMapping.template.precision = precision;
								}
								if (columnMapping.template.scale || scale) {
									columnMapping.template.scale = scale;
								}
								if (columnMapping.template.dateFormat || dateFormat) {
									columnMapping.template.date_format = dateFormat;
								}
								self._treeGridRepository.addOrUpdateColumnMapping(
									columnMapping
								);
								//self._view.reload();
								self.needReloadView();
							},
							onCancel: function () {}
						}
					}
				);
			}
			showTooltipDialog();
		};
		CellEditorDialog.prototype.needReloadView = function () {};
		return CellEditorDialog;
	})();
	return CellEditorDialog;
});
