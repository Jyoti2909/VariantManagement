define([
	'dojo/_base/declare',
	'Aras/Client/Controls/Experimental/ContextMenuWrapper'
], function (declare) {
	return declare(null, {
		constructor: function (mediator, grid) {
			this._mediator = mediator;
			this._grid = grid;
			const self = this;

			this._initContextMenu();

			this._contextMenuHandler = function (rowId, e) {
				e.preventDefault();

				self._getContextMenu();
				self._contextMenu.show({ x: e.clientX, y: e.clientY }, rowId);
			};

			const contextItemHandler = function (menuItemId, rowID, columnIndex) {
				const args = {
					commandId: menuItemId,
					rowId: rowID,
					col: columnIndex
				};
				self._contextMenu.onClickHandlerMap[menuItemId](args);
			};

			this._contextMenu.menu.on('click', contextItemHandler);
			this._grid.on('contextmenu', this._contextMenuHandler, 'row');
		},

		_initContextMenu: function () {
			this._contextMenu = new ContextMenuWrapper();

			window.cui.fillPopupMenu('MP_ContextMenu', this._contextMenu);
			window.cui.initPopupMenu(this._contextMenu);
		},

		disable: function () {
			this._grid.off('contextmenu', this._contextMenuHandler);
		},

		_getContextMenu: function () {
			this._contextMenu.setHide('mp_unlock', !this._isLockedByMe());
			this._contextMenu.setHide(
				'mp_promote',
				this._isSingleItemSelected() && !this._allItemsAreUnlocked()
			);
			this._contextMenu.setHide(
				'mp_view_lifecycle',
				!this._isSingleItemSelected()
			);
		},

		_isSingleItemSelected: function () {
			const selectedRowIds = this._grid.getSelectedRowIds();
			return selectedRowIds.length === 1;
		},

		_allItemsAreUnlocked: function () {
			var selectedRowIds = this._grid.getSelectedRowIds();
			if (selectedRowIds.length > 0) {
				var anyLocked = selectedRowIds.some(function (id) {
					var row = this._grid.rows.get(id);
					if (!row || aras.isLocked(row.sourceObject.node)) {
						return true;
					}
				}, this);

				return !anyLocked;
			}
			return false;
		},

		// return true only if all selected items are locked by user
		_isLockedByMe: function () {
			var selectedRowIds = this._grid.getSelectedRowIds();
			if (selectedRowIds.length > 0) {
				var lockedByOther = selectedRowIds.some(function (id) {
					var row = this._grid.rows.get(id);
					if (!aras.isLockedByUser(row.sourceObject.node)) {
						return true;
					}
				}, this);

				return !lockedByOther;
			}
		}
	});
});
