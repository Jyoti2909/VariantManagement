(function (cmfModule) {
	const permissionMenu = function (Menu, MenuItem) {
		this.Menu = Menu;
		this.MenuItem = MenuItem;
	};

	permissionMenu.prototype.hasPermissions = function (permission, property) {
		return parent.aras.getPermissions(
			permission,
			property.id,
			property.propertyTypeId
		);
	};

	permissionMenu.prototype.addMenuItem = function (
		subMenu,
		label,
		iconPath,
		onClick,
		onClickParams
	) {
		const menuItem = new this.MenuItem({
			label: label,
			iconPath: iconPath,
			onClickParams: onClickParams
		});
		menuItem.onClick = onClick;
		subMenu.add(menuItem);
	};

	permissionMenu.prototype.isCalledFromGrid = function (target) {
		while (target) {
			if (target.id === 'grid') {
				return true;
			}
			target = target.parentElement;
		}
		return false;
	};

	permissionMenu.prototype.generateProtectionMenu = function (
		propertyType,
		cellItem,
		protectedMenu,
		controller,
		selectedTreeItem
	) {
		const callback = function () {
			controller.onChange('permission changed', {
				selectedTreeItem: selectedTreeItem,
				cellId: cellItem.id,
				permission: arguments[0].onClickParams.allowedPermission
			});
		};

		for (let i = 0; i < propertyType.allowedPermission.length; i++) {
			if (
				propertyType.allowedPermission[i]['related_id'] !==
				cellItem.permissionId
			) {
				const menuLabel =
					CMF.Utils.getResource('menu_protection_set_1') +
					propertyType.allowedPermission[i].name +
					CMF.Utils.getResource('menu_protection_set_2');

				this.addMenuItem(protectedMenu, menuLabel, null, callback, {
					allowedPermission: propertyType.allowedPermission[i]
				});
			}
		}
	};

	permissionMenu.prototype.generatePrivatePermissionMenu = function (
		propertyType,
		cellItem,
		protectedMenu,
		controller,
		selectedTreeItem
	) {
		if (cellItem && cellItem.hasPrivatePermission()) {
			const permissions = propertyType.allowedPermission.filter(function (
				element
			) {
				return element['related_id'] === cellItem.permissionId;
			});

			const label =
				permissions.length > 0
					? CMF.Utils.getResource('menu_protection_reset_1') +
					  permissions[0].name +
					  CMF.Utils.getResource('menu_protection_reset_2')
					: CMF.Utils.getResource('menu_protection_reset_3');

			this.addMenuItem(protectedMenu, label, null, function () {
				controller.onChange('permission changed', {
					selectedTreeItem: selectedTreeItem,
					cellId: cellItem.id,
					permission: null
				});
			});
		}
	};

	permissionMenu.prototype.generateMenu = function (
		target,
		grid,
		treeMenu,
		selectedTreeItem,
		controller
	) {
		if (!this.isCalledFromGrid(target)) {
			return;
		}

		const cellItem = grid.getCellItem(grid.selectedCellId);
		if (cellItem) {
			const propertyType = cellItem.property;
			if (
				propertyType.allowedPermission.length > 0 &&
				this.hasPermissions('can_change_access', cellItem)
			) {
				const protectedMenu = new this.Menu();

				treeMenu.addSubMenu(
					protectedMenu,
					CMF.Utils.getResource('menu_view_protect')
				);
				this.generateProtectionMenu(
					propertyType,
					cellItem,
					protectedMenu,
					controller,
					selectedTreeItem
				);
				this.generatePrivatePermissionMenu(
					propertyType,
					cellItem,
					protectedMenu,
					controller,
					selectedTreeItem
				);
			}
		}
	};

	cmfModule.PermissionMenu = permissionMenu;
	window.CMF = cmfModule;
})(window.CMF || {});
