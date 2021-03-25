define(['dojo/aspect'], function (aspect) {
	'use strict';
	var HeaderMenu = (function () {
		function HeaderMenu(controllerContext, viewContext) {
			this.controllerContext = controllerContext;
			this.grid = viewContext.grid;
			this.viewContext = viewContext;
			this.arasObject = viewContext.arasObject;
		}
		HeaderMenu.prototype.init = function () {
			var _this = this;
			aspect.after(
				this.grid,
				'onGridHeaderCellContextMenu',
				function (rowId, columnIndex) {
					var treeGridRowModels = _this.grid.getSelectedRowModels();
					var contextMenuObject = _this.controllerContext.getContextMenuObject(
						treeGridRowModels,
						columnIndex
					);
					var headerMenu = _this.grid.getHeaderContextMenu();
					headerMenu.setDisable(
						'HeaderMenuEntryAddColumn',
						!contextMenuObject.canExecuteAddColumn
					);
					headerMenu.setDisable(
						'HeaderMenuEntryRenameColumn',
						!contextMenuObject.canExecuteRenameColumn
					);
					headerMenu.setDisable(
						'HeaderMenuEntryRemoveColumn',
						!contextMenuObject.canExecuteRemoveColumn
					);
					headerMenu.setDisable(
						'HeaderMenuEntryShowUnmapped',
						!contextMenuObject.canExecuteShowUnmapped
					);
					headerMenu.setHide(
						'HeaderMenuEntryShowUnmapped',
						!contextMenuObject.canExecuteShowUnmapped
					);
					headerMenu.setDisable(
						'HeaderMenuEntryHideUnmapped',
						!contextMenuObject.canExecuteHideUnmapped
					);
					headerMenu.setHide(
						'HeaderMenuEntryHideUnmapped',
						!contextMenuObject.canExecuteHideUnmapped
					);
					headerMenu.setDisable(
						'HeaderMenuEntryExpand',
						!_this.grid.canExecuteExpandAll()
					);
					headerMenu.setHide(
						'HeaderMenuEntryExpand',
						!_this.grid.canExecuteExpandAll()
					);
					headerMenu.setDisable(
						'HeaderMenuEntryCollapse',
						!_this.grid.canExecuteCollapseAll()
					);
					headerMenu.setHide(
						'HeaderMenuEntryCollapse',
						!_this.grid.canExecuteCollapseAll()
					);
				},
				true
			);
			var menu = this.grid.getHeaderContextMenu();
			menu.add(
				'HeaderMenuEntryAddColumn',
				this.getResource('configurator.context_menu_addColumn'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var columnModel = _this.grid.getTreeGridColumnModel(columnIndex);
						_this.viewContext.onAddColumn(columnModel);
					}
				}
			);
			menu.add(
				'HeaderMenuEntryRenameColumn',
				this.getResource('configurator.context_menu_rename_column'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var columnModel = _this.grid.getTreeGridColumnModel(columnIndex);
						_this.viewContext.onRenameColumn(columnModel);
					}
				}
			);
			menu.addSeparator();
			menu.add(
				'HeaderMenuEntryRemoveColumn',
				this.getResource('configurator.context_menu_remove_column'),
				null,
				{
					onClick: function (rowId, columnIndex) {
						var columnModel = _this.grid.getTreeGridColumnModel(columnIndex);
						_this.viewContext.onRemoveColumn(columnModel, columnIndex);
					}
				}
			);
			menu.addSeparator();
			menu.add(
				'HeaderMenuEntryShowUnmapped',
				this.getResource('configurator.context_menu_show_unmap'),
				null,
				{
					onClick: function (el) {
						_this.viewContext.onCandidateVisibilityChanged({ innerEvent: el });
					}
				}
			);
			menu.add(
				'HeaderMenuEntryHideUnmapped',
				this.getResource('configurator.context_menu_hide_unmapped'),
				null,
				{
					onClick: function (el) {
						_this.viewContext.onCandidateVisibilityChanged({ innerEvent: el });
					}
				}
			);
			menu.add(
				'HeaderMenuEntryExpand',
				this.getResource('configurator.context_menu_expand_tree'),
				null,
				{
					onClick: function (el) {
						_this.grid.expandAll();
					}
				}
			);
			menu.add(
				'HeaderMenuEntryCollapse',
				this.getResource('configurator.context_menu_collapse_tree'),
				null,
				{
					onClick: function (el) {
						_this.grid.collapseAll();
					}
				}
			);
		};
		HeaderMenu.prototype.getResource = function (resourceName) {
			return this.viewContext.getResource(resourceName);
		};
		return HeaderMenu;
	})();
	return HeaderMenu;
});
