(function (cmfModule) {
	const referenceMenu = function (MenuItem) {
		this.menuModules = [
			// resolve the conflict when binding of element is wrong
			{
				fulfilCondition: function (selectedTreeItem) {
					const flagged = selectedTreeItem.flagged;
					return flagged && flagged.isBindingWrong && flagged.smmRelatedId;
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_accept_wrong_binding'),
						iconPath: null,
						onClick: function () {
							const changeObject = {
								element: selectedTreeItem,
								relatedId: selectedTreeItem.flagged.smmRelatedId
							};
							controller.onChange('on apply wrong binding', changeObject);
						}
					});
				}
			},

			// resolve the conflict when element not bound
			{
				fulfilCondition: function (selectedTreeItem) {
					const flagged = selectedTreeItem.flagged;
					return flagged && flagged.isBindingNotExist && flagged.smmRelatedId;
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_accept_bind'),
						iconPath: null,
						onClick: function () {
							const changeObject = {
								element: selectedTreeItem,
								relatedId: selectedTreeItem.flagged.smmRelatedId
							};
							controller.onChange('bind', changeObject);
						}
					});
				}
			},

			// resolve the conflict when element has bad sort order
			{
				fulfilCondition: function (selectedTreeItem) {
					const flagged = selectedTreeItem.flagged;
					return (
						flagged &&
						flagged.isBadSortOrder &&
						flagged.correctSortOrder !== undefined &&
						flagged.correctSortOrder !== null
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_accept_resort'),
						iconPath: null,
						onClick: function () {
							const changeObject = { element: selectedTreeItem };
							controller.onChange('resort', changeObject);
						}
					});
				}
			},

			// on apply binding
			{
				fulfilCondition: function (selectedTreeItem) {
					if (selectedTreeItem.boundItemId) {
						if (
							selectedTreeItem.flagged &&
							selectedTreeItem.flagged.isStructureWrong
						) {
							const bindingObj = selectedTreeItem.documentElementType.binding;
							return (
								bindingObj &&
								bindingObj.onApplyBinding &&
								selectedTreeItem.boundItem &&
								!selectedTreeItem.boundItem.isRemovedOrNoPermissions
							);
						}
					}
					return false;
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_accept'),
						iconPath: null,
						onClick: function () {
							const changeObject = { element: selectedTreeItem };
							controller.onChange('on apply binding', changeObject);
						}
					});
				}
			},

			// Resume Tracking
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.boundItemId &&
						CMF.Utils.getClearBindingSettingValue(
							selectedTreeItem.trackingMode
						) === 'NonTracking'
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_resume_tracking'),
						iconPath: null,
						onClick: function () {
							selectedTreeItem.trackingMode = 'Manual';
							controller.refreshTreeItemAfterBindingChanges(selectedTreeItem);
						}
					});
				}
			},

			// Ignore Conflict
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.boundItemId &&
						CMF.Utils.getClearBindingSettingValue(
							selectedTreeItem.trackingMode
						) !== 'NonTracking'
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_ignore_conflict'),
						iconPath: null,
						onClick: function () {
							controller.onIgnoreConflictClicked(selectedTreeItem);
						}
					});
				}
			},

			// Ignore Conflict (All)
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.boundItemId &&
						CMF.Utils.getClearBindingSettingValue(
							selectedTreeItem.trackingMode
						) !== 'NonTracking'
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_ignore_conflict_all'),
						iconPath: null,
						onClick: function () {
							controller.onIgnoreAllConflictClicked(selectedTreeItem);
						}
					});
				}
			},

			//Release Reference
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.boundItemId &&
						!selectedTreeItem.documentElementType.binding.referenceRequired
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_release_reference'),
						iconPath: null,
						onClick: function () {
							const changeObject = { releasedElement: selectedTreeItem };
							controller.onChange('release reference', changeObject);
						}
					});
				}
			},

			// Pick/Replace Item
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.documentElementType.binding.newRowMode !==
						'CreateOnly'
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_pick_replace_item'),
						iconPath: null,
						onClick: function () {
							controller.onPickReplaceClick(selectedTreeItem);
						}
					});
				}
			},

			// Update Document
			{
				fulfilCondition: function (selectedTreeItem) {
					const tracking =
						CMF.Utils.getClearBindingSettingValue(
							selectedTreeItem.trackingMode
						) !== 'NonTracking';
					const notRemovedWithPerm =
						selectedTreeItem.boundItem &&
						!selectedTreeItem.boundItem.isRemovedOrNoPermissions;
					return selectedTreeItem.boundItemId && tracking && notRemovedWithPerm;
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_update_document'),
						iconPath: null,
						onClick: function () {
							controller.onUpdateDocumentClick(selectedTreeItem);
						}
					});
				}
			},

			// Update Document (All)
			{
				fulfilCondition: function (selectedTreeItem) {
					const tracking =
						CMF.Utils.getClearBindingSettingValue(
							selectedTreeItem.trackingMode
						) !== 'NonTracking';
					const notRemovedWithPerm =
						selectedTreeItem.boundItem &&
						!selectedTreeItem.boundItem.isRemovedOrNoPermissions;
					return selectedTreeItem.boundItemId && tracking && notRemovedWithPerm;
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_update_document_all'),
						iconPath: null,
						onClick: function () {
							controller.onUpdateDocumentAllClick(selectedTreeItem);
						}
					});
				}
			},

			// View
			{
				fulfilCondition: function (selectedTreeItem) {
					return (
						selectedTreeItem.boundItemId &&
						!selectedTreeItem.boundItem.isRemovedOrNoPermissions
					);
				},
				getMenuItem: function (selectedTreeItem, controller) {
					return new MenuItem({
						label: CMF.Utils.getResource('menu_view'),
						iconPath: null,
						onClick: function () {
							controller.viewReference(selectedTreeItem);
						}
					});
				}
			}
		];
	};

	referenceMenu.prototype.generateMenu = function (
		selectedTreeItem,
		subMenu,
		controller
	) {
		this.menuModules.forEach(
			function (module) {
				if (module.fulfilCondition(selectedTreeItem)) {
					const menuItem = module.getMenuItem(selectedTreeItem, controller);
					subMenu.add(menuItem);
				}
			}.bind(this)
		);
	};

	cmfModule.ReferenceMenu = referenceMenu;
	window.CMF = cmfModule;
})(window.CMF || {});
