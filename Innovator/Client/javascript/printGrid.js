function SettingsHelper(contentTable, columnsArr) {
	this.contentTable = contentTable;
	this.columnsArr = columnsArr;
}

SettingsHelper.prototype.populateMenu = function (menu, columnId) {
	var column;
	var extendedMenu;
	var index = 0;
	var aWindow = menu.ownerDocument.defaultView;
	var MenuItem = aWindow.dojo.require('dijit.MenuItem');
	var PopupMenuItem = aWindow.dojo.require('dijit.PopupMenuItem');
	var MenuSeparator = aWindow.dojo.require('dijit.MenuSeparator');
	var Menu = aWindow.dojo.require('dijit.Menu');
	var items = menu.getChildren();
	var self = this;
	var onMenuClick = function (event) {
		self.onSettingsMenuItemClick(this.id);
	};
	for (var i = 0; i < items.length; i += 1) {
		menu.removeChild(items[i]);
		items[i].destroyRecursive(true);
	}
	if (!columnId) {
		for (index; index < this.columnsArr.length; index += 1) {
			column = this.columnsArr[index];
			menu.addChild(
				new MenuItem({
					id: column.id,
					label:
						(column.visible ? '&#957; ' : '&nbsp;&nbsp;&nbsp;') +
						(index + 1) +
						'. ' +
						column.label,
					onClick: onMenuClick
				})
			);
		}
		menu.addChild(new MenuSeparator());
		extendedMenu = new Menu({ id: 'Extended', label: 'Extended' });

		extendedMenu.addChild(
			new MenuItem({
				id: 'select_all',
				label: 'Select All',
				onClick: onMenuClick
			})
		);
		extendedMenu.addChild(
			new MenuItem({
				id: 'deselect_all',
				label: 'Deselect All',
				onClick: onMenuClick
			})
		);
		extendedMenu.addChild(
			new MenuItem({
				id: 'stretch',
				label: 'Stretch to 100%',
				onClick: onMenuClick
			})
		);
		menu.addChild(
			new PopupMenuItem({
				label: 'Extended',
				popup: extendedMenu
			})
		);
	} else {
		menu.addChild(
			new MenuItem({ id: columnId, label: 'Hide Column', onClick: onMenuClick })
		);
	}
};

SettingsHelper.prototype.setDisplayPropertyForColumn = function (
	columnId,
	value
) {
	var cssSelector = "td[id='" + columnId + "'], th[id='" + columnId + "']";
	var items = document.querySelectorAll(cssSelector);
	var count = items.length;
	var index = 0;
	for (index; index < count; index += 1) {
		items[index].style.display = value;
	}
};

SettingsHelper.prototype.hideColumn = function (columnId) {
	this.setDisplayPropertyForColumn(columnId, 'none');
	this.columnsArr[columnId].visible = false;

	for (var i = 0; i < this.columnsArr.length; i++) {
		if (columnsArr[i].visible) {
			return;
		}
	}
	this.contentTable.style.visibility = 'hidden';
};

SettingsHelper.prototype.showColumn = function (columnId) {
	if ('hidden' != this.contentTable.style.visibility) {
		this.contentTable.style.visibility = 'visible';
	}
	this.setDisplayPropertyForColumn(columnId, 'table-cell');
	this.columnsArr[columnId].visible = true;
};

SettingsHelper.prototype.hideAllColumns = function () {
	var index = 0;
	this.contentTable.style.visibility = 'hidden';
	for (index; index < columnsArr.length; index += 1) {
		this.columnsArr[index].visible = false;
	}
};

SettingsHelper.prototype.showAllColumns = function () {
	var index = 0;
	var column = 0;
	this.contentTable.style.visibility = 'visible';

	for (index; index < this.columnsArr.length; index += 1) {
		column = this.columnsArr[index];
		this.setDisplayPropertyForColumn(column.id, 'table-cell');
		column.visible = true;
	}
};

SettingsHelper.prototype.populateContextMenu = function (contextMenu, event) {
	var elem = event.target;
	var tagName = elem.tagName;
	var columnId;
	if (tagName.search(/^TH$|^TD$/) === 0) {
		columnId = elem.id;
	}
	this.populateMenu(contextMenu, columnId);
};

SettingsHelper.prototype.onSettingsMenuItemClick = function (menuItemId) {
	var column = this.columnsArr[menuItemId];
	if (column) {
		if (!column.visible) {
			this.showColumn(column.id);
		} else {
			this.hideColumn(column.id);
		}
	} else {
		if (menuItemId == 'select_all') {
			this.showAllColumns();
		} else if (menuItemId == 'deselect_all') {
			this.hideAllColumns();
		} else if (menuItemId == 'stretch') {
			this.contentTable.style.width =
				'' === this.contentTable.style.width ? '100%' : '';
		}
	}
};
