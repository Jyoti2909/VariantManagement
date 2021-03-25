define([
	'dojo/aspect',
	'TreeGridView/Scripts/Configurator/iconTemplate'
], function (aspect, IconTemplate) {
	'use strict';
	var CellMenu = (function () {
		function CellMenu(controllerContext, viewContext) {
			this.controllerContext = controllerContext;
			this.grid = viewContext.grid;
			this.viewContext = viewContext;
			this.arasObject = viewContext.arasObject;
		}
		CellMenu.prototype.init = function () {
			var _this = this;
			aspect.after(
				this.grid,
				'gridMenuInit',
				function (rowId, columnIndex) {
					var selectedRowIds = _this.grid.getSelectedRowIds();
					var treeGridRowModels = _this.getTreeRowModels(selectedRowIds);
					var contextMenuObject = _this.controllerContext.getContextMenuObject(
						treeGridRowModels,
						columnIndex
					);
					var menu = _this.grid.getMenu();
					var changeIconItem = menu.getItemById('ContextMenuEntryChangeIcon');
					var isToHideShowCellDetails = !_this.isAtLeastOneNotCandidateSelected();
					var changeIconItemLabel = _this.getResource(
						'configurator.context_menu_change_icon'
					);

					changeIconItem.setLabel(changeIconItemLabel);
					if (contextMenuObject.canExecuteChangeIcon) {
						changeIconItem.setLabel(
							'<img class="menu_item-image" src="' +
								treeGridRowModels[0].icon +
								'"/>' +
								changeIconItemLabel
						);
					}
					menu.setDisable(
						'ContextMenuEntryShowCellDetails',
						!_this.isOnlyOneRowSelected()
					);
					menu.setDisable(
						'ContextMenuEntryChangeIcon',
						!contextMenuObject.canExecuteChangeIcon
					);
					menu.setHide(
						'ContextMenuEntryShowCellDetails',
						isToHideShowCellDetails
					);
					menu.setDisable(
						'ContextMenuEntryShowCellDataTemplate',
						!_this.isOnlyOneRowSelected()
					);
					menu.setHide(
						'ContextMenuEntryShowCellDataTemplate',
						isToHideShowCellDetails
					);
					menu.setHideSeparator(
						'SeparatorShowCellDetails',
						isToHideShowCellDetails
					);
					menu.setDisable(
						'ContextMenuEntryMap',
						!contextMenuObject.canExecuteMap
					);
					// Show disabled "Map" entry even when "Map" and "Unmap" can't be executed. User should knows about possible operations.
					menu.setHide('ContextMenuEntryMap', !contextMenuObject.canShowMap);
					menu.setDisable(
						'ContextMenuEntryMultipleMap',
						!contextMenuObject.canExecuteMultipleMap
					);
					menu.setHide(
						'ContextMenuEntryMultipleMap',
						!contextMenuObject.canShowMultipleMap
					);
					menu.setDisable(
						'ContextMenuEntryUnmap',
						!contextMenuObject.canExecuteUnmap
					);
					menu.setHide(
						'ContextMenuEntryUnmap',
						!contextMenuObject.canShowUnmap
					);
					menu.setDisable(
						'ContextMenuEntryMultipleUnmap',
						!contextMenuObject.canExecuteMultipleUnmap
					);
					menu.setHide(
						'ContextMenuEntryMultipleUnmap',
						!contextMenuObject.canShowMultipleUnmap
					);
					menu.setDisable(
						'ContextMenuEntryCombine',
						!contextMenuObject.canExecuteCombine
					);
					// Show disabled "Combine" entry even when "Combine" and "Separate" can't be executed. User should knows about possible operations.
					var canExecuteSeparate = contextMenuObject.canExecuteSeparate;
					menu.setHide(
						'ContextMenuEntryCombine',
						!(contextMenuObject.canExecuteCombine || !canExecuteSeparate)
					);
					menu.setDisable('ContextMenuEntrySeparate', !canExecuteSeparate);
					menu.setHide('ContextMenuEntrySeparate', !canExecuteSeparate);
					menu.setDisable(
						'ContextMenuEntryShowUnmapped',
						!contextMenuObject.canExecuteShowUnmapped
					);
					menu.setHide(
						'ContextMenuEntryShowUnmapped',
						!contextMenuObject.canExecuteShowUnmapped
					);
					menu.setDisable(
						'ContextMenuEntryHideUnmapped',
						!contextMenuObject.canExecuteHideUnmapped
					);
					menu.setHide(
						'ContextMenuEntryHideUnmapped',
						!contextMenuObject.canExecuteHideUnmapped
					);
					menu.setDisable(
						'ContextMenuEntryExpand',
						!_this.grid.canExecuteExpandAll()
					);
					menu.setHide(
						'ContextMenuEntryExpand',
						!_this.grid.canExecuteExpandAll()
					);
					menu.setDisable(
						'ContextMenuEntryCollapse',
						!_this.grid.canExecuteCollapseAll()
					);
					menu.setHide(
						'ContextMenuEntryCollapse',
						!_this.grid.canExecuteCollapseAll()
					);
				},
				true
			);
			this.loadGridCellMenuContext();
		};
		CellMenu.prototype.loadGridCellMenuContext = function () {
			var _this = this;
			var menu = this.grid.getMenu();
			menu.add(
				'ContextMenuEntryShowCellDetails',
				this.getResource('configurator.context_menu_show_cell_details'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						_this.grid.gridDoubleClick(rowId, columnIndex);
					}
				}
			);
			menu.add(
				'ContextMenuEntryShowCellDataTemplate',
				this.getResource('configurator.context_menu_show_data_template'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						_this.viewContext.onShowDataTemplate(rowId, columnIndex);
					}
				}
			);
			menu.add(
				'ContextMenuEntryChangeIcon',
				this.getResource('configurator.context_menu_change_icon'),
				null,
				{
					onClick: function (rowId) {
						new IconTemplate({
							configuratorController: _this.controllerContext,
							rowModel: _this.grid.getTreeRowModel(rowId),
							columnModel: _this.grid.getTreeGridColumnModel(0)
						});
					}
				}
			);
			menu.addSeparator(null, 'SeparatorShowCellDetails');
			menu.add(
				'ContextMenuEntryMap',
				this.getResource('configurator.context_menu_map_element'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						_this.viewContext.onMapTreeRow(rowId, rowId);
					}
				}
			);
			menu.add(
				'ContextMenuEntryMultipleMap',
				this.getResource('configurator.context_menu_multiple_map_element'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var selectedRowIds = _this.grid.getSelectedRowIds();
						_this.viewContext.onMultipleMap(selectedRowIds);
					}
				}
			);
			menu.add(
				'ContextMenuEntryUnmap',
				this.getResource('configurator.context_menu_unmap_element'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var model = _this.grid.getTreeRowModel(rowId);
						_this.viewContext.onUnmapTreeRow(model);
					}
				}
			);
			menu.add(
				'ContextMenuEntryMultipleUnmap',
				this.getResource('configurator.context_menu_multiple_unmap_element'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var models = _this.grid.getSelectedRowModels();
						_this.viewContext.onMultipleUnmap(models);
					}
				}
			);
			menu.addSeparator();
			menu.add(
				'ContextMenuEntryCombine',
				this.getResource('configurator.context_menu_combine'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var res = _this.arasObject.confirm(
							_this.getResource('configurator.combining_confirm')
						);
						if (res) {
							var selectedRowIds = _this.grid.getSelectedRowIds();
							_this.viewContext.onCombineNodes(selectedRowIds);
						}
					}
				}
			);
			menu.add(
				'ContextMenuEntrySeparate',
				this.getResource('configurator.context_menu_decombine'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var resDialog = _this.arasObject.confirm(
							_this.getResource('configurator.decombining_confirm')
						);
						if (resDialog) {
							_this.viewContext.onDecombineNodes(rowId);
						}
					}
				}
			);
			menu.addSeparator();
			menu.add(
				'ContextMenuEntryHideUnmapped',
				this.getResource('configurator.context_menu_hide_unmapped'),
				null,
				{
					onClick: function (el) {
						_this.viewContext.onCandidateVisibilityChanged({ innerEvent: el });
					}
				}
			);
			menu.add(
				'ContextMenuEntryShowUnmapped',
				this.getResource('configurator.context_menu_show_unmap'),
				null,
				{
					onClick: function (el) {
						_this.viewContext.onCandidateVisibilityChanged({ innerEvent: el });
					}
				}
			);
			menu.add(
				'ContextMenuEntryExpand',
				this.getResource('configurator.context_menu_expand_tree'),
				null,
				{
					onClick: function (el) {
						_this.grid.expandAll();
					}
				}
			);
			menu.add(
				'ContextMenuEntryCollapse',
				this.getResource('configurator.context_menu_collapse_tree'),
				null,
				{
					onClick: function (el) {
						_this.grid.collapseAll();
					}
				}
			);
		};
		CellMenu.prototype.isOnlyOneRowSelected = function () {
			var ids = this.grid.getSelectedRowIds();
			return ids.length === 1;
		};
		CellMenu.prototype.getTreeRowModels = function (selectedRowIds) {
			var self = this;
			return selectedRowIds.map(function (id) {
				return self.grid.getTreeRowModel(id);
			});
		};
		CellMenu.prototype.isAtLeastOneNotCandidateSelected = function () {
			var ids = this.grid.getSelectedRowIds();
			var i;
			for (i = 0; i < ids.length; i++) {
				var isCandidate = this.grid.getValueFromGridRow(
					ids[i],
					'isCandidate',
					true
				);
				if (!isCandidate) {
					return true;
				}
			}
			return false;
		};
		CellMenu.prototype.getResource = function (resourceName) {
			return this.viewContext.getResource(resourceName);
		};
		return CellMenu;
	})();
	return CellMenu;
});
