define([
	'dojo/_base/declare',
	'dojo/aspect',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'Aras/Client/Controls/Public/TreeGridContainer',
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/TreeGridRowModel'
], function (
	declare,
	aspect,
	ContextMenu,
	TreeGridContainer,
	TreeGridRowModel
) {
	'use strict';
	var HEADER_ROW_ID = 'header_row';
	var dojoxGridLazyExpandoSetImageSrc =
		dojox.grid._LazyExpando.prototype._setImageSrc;

	dojo.extend(dojox.grid._LazyExpando, {
		_setImageSrc: function (item) {
			dojoxGridLazyExpandoSetImageSrc.apply(this, arguments);

			if (
				item.isReferencingTreeGridRow &&
				item.isReferencingTreeGridRow[0] &&
				(!item.hasJoinedNodes || !item.hasJoinedNodes[0])
			) {
				var img = this.domNode.lastChild;
				var refGlyphUrl = '../../images/ReferenceGlyph.svg';
				img.style['background-image'] =
					'url("' + refGlyphUrl + '"), url("' + img.src + '")';
				img.src = refGlyphUrl;
				img.className += ' reference_glyph';
			}
		}
	});

	var ConfiguratorTreeGridContainer = declare([TreeGridContainer], {
		_headerContextMenu: null,
		constructor: function (args) {
			this._disableGridSort();
			this._initializeHeaderContextMenu();
		},
		onGridHeaderCellContextMenu: function (rowId, columnIndex) {},
		onGridHeaderContextMenuEntryClick: function (id, rowId, columnIndex) {},
		getHeaderContextMenu: function () {
			return this._headerContextMenu;
		},
		canEdit_Experimental: function (rowId, column) {
			if (!this.grid_Experimental._canEdit) {
				return false;
			}
			var rowIndex = this.getRowIndex(rowId);
			var columnIndex = this.getColumnIndex(column);
			if (typeof rowIndex !== 'number' || typeof columnIndex !== 'number') {
				return false;
			}
			var cell = this.grid_Experimental.getCell(columnIndex);
			var item = this.grid_Experimental.getItem(rowIndex);
			var canEdit =
				typeof cell.canEditCell === 'function'
					? cell.canEditCell(item, rowIndex, columnIndex, cell)
					: !!cell.canEditCell;
			return canEdit;
		},
		getSelectedItemIdsArray: function () {
			var ids = this.getSelectedItemIDs_Experimental(',');
			return ids.split(',');
		},
		destroyHeaderContextMenu: function () {
			if (!this._headerContextMenu) {
				return;
			}
			this._headerContextMenu.menu.destroyRecursive();
		},
		getSelectedRowIds: function () {
			var separator = ',';
			var selectedRowsString = this.getSelectedItemIDs_Experimental(separator);
			if (selectedRowsString) {
				return selectedRowsString.split(separator);
			} else {
				return [];
			}
		},
		getValueFromGridRow: function (rowId, property, defaultValue) {
			var rowIndex = this.getRowIndex(rowId);
			var item = this.grid_Experimental.getItem(rowIndex);
			var store = this.grid_Experimental.store;
			var isCandidate = store.getValue(item, property, defaultValue);
		},
		getTreeRowModel: function (rowId) {
			var rowIndex = this.getRowIndex(rowId);
			var item = this.grid_Experimental.getItem(rowIndex);
			return new TreeGridRowModel(item);
		},
		getTreeGridColumnModel: function (columnIndex) {
			var layout = this.grid_Experimental.structure;
			var columnDefinition = layout[columnIndex].columnDefinition;
			return columnDefinition;
		},
		getSelectedRowModels: function () {
			var ids = this.getSelectedRowIds();
			var self = this;
			return ids.map(function (id) {
				return self.getTreeRowModel(id);
			});
		},
		canExecuteExpandAll: function () {
			var canExecuteExpandAll = this.grid_Experimental
				.getState()
				.cache.items.some(function (item) {
					return !item.opened;
				});
			return canExecuteExpandAll;
		},
		canExecuteCollapseAll: function () {
			var canExecuteCollapseAll = this.grid_Experimental
				.getState()
				.cache.items.some(function (item) {
					return item.opened;
				});
			return canExecuteCollapseAll;
		},
		_disableGridSort: function () {
			this.grid_Experimental.own(
				aspect.after(
					this.grid_Experimental,
					'canSort',
					function (inSortInfo) {
						return false;
					},
					true
				)
			);
		},
		_initializeHeaderContextMenu: function () {
			var _this = this;
			this._headerContextMenu = new ContextMenu(null, true);
			this.grid_Experimental.set('headerMenu', this._headerContextMenu.menu);
			aspect.after(
				this._headerContextMenu,
				'onItemClick',
				this.onGridHeaderContextMenuEntryClick.bind(this),
				true
			);
			this.grid_Experimental.own(
				aspect.after(
					this.grid_Experimental,
					'onHeaderCellContextMenu',
					function (e) {
						return _this._updateHeaderContextMenuClickParameters(e);
					},
					true
				),
				aspect.after(
					this.grid_Experimental,
					'onHeaderCellContextMenu',
					function (e) {
						return _this._callGridHeaderCellContextMenuEvent(e);
					},
					true
				)
			);
		},
		_callGridHeaderCellContextMenuEvent: function (e) {
			var columnIndex = e.cell.index;
			this.onGridHeaderCellContextMenu(HEADER_ROW_ID, columnIndex);
		},
		_updateHeaderContextMenuClickParameters: function (e) {
			this._headerContextMenu.rowId = HEADER_ROW_ID;
			this._headerContextMenu.columnIndex = e.cell.index;
		}
	});
	return ConfiguratorTreeGridContainer;
});
