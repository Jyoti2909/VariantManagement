/* global define */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'../Modules/aras.innovator.CMF/Scripts/AdminPanel/AdminEnum.js',
	'dijit/popup'
], function (declare, connect, AdminEnum, popup) {
	var systemEnums = new AdminEnum();

	return declare(null, {
		_tree: null,
		_grid: null,
		_transformer: null,
		dataStore: null,
		_collectedRows: {},
		selectedTreeItem: null,

		constructor: function (relationshipsGrid, tree, treeMenu, dataStore) {
			connect.connect(treeMenu, 'onAddElementType', function (
				sourceTreeElement,
				isChild
			) {
				var newTreeElement = dataStore.insertElementType(
					sourceTreeElement,
					isChild
				);
				var parentNode = null;
				if (isChild && sourceTreeElement) {
					parentNode = dataStore.getElementById(sourceTreeElement.id);
				} else {
					parentNode = dataStore.getElementById(
						sourceTreeElement
							? sourceTreeElement.parentId
							: newTreeElement.parentId
					);
				}
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(newTreeElement.id);
			});

			connect.connect(treeMenu, 'onRemoveElementType', function (treeElement) {
				var children = dataStore.getChildren(
					treeElement,
					systemEnums.TreeModelType.ElementType
				);
				if (children.length > 0) {
					aras.AlertError(
						aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'admin_can_not_delete_element'
						)
					);
					return;
				}

				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeElementType(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
				if (dataStore.hasEmptyLinks()) {
					tree.updateAllDescendantElementWarnings();
				}
			});

			connect.connect(treeMenu, 'onAddElementBinding', function (treeElement) {
				var binding = dataStore.insertElementBinding(treeElement);
				var parentNode = dataStore.getElementById(treeElement.id);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(binding.id);
			});

			connect.connect(treeMenu, 'onRemoveElementBinding', function (
				treeElement
			) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeElementBinding(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onAddPropertyType', function (treeElement) {
				var propertyTreeElement = dataStore.insertPropertyType(treeElement);
				var parentNode =
					treeElement.getType() === systemEnums.TreeModelType.ElementType
						? dataStore.getElementById(treeElement.id)
						: dataStore.getElementById(treeElement.parentId);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(propertyTreeElement.id);
			});

			connect.connect(treeMenu, 'onRemovePropertyType', function (treeElement) {
				var message = dataStore.checkPropertyTypeBeforeRemove(treeElement);
				if (!message) {
					var parentNode = dataStore.getElementById(treeElement.parentId);
					dataStore.removePropertyType(treeElement);
					tree.updateChildrenNodes(parentNode);
					tree.selectItem(parentNode.id);
					if (dataStore.hasEmptyLinks()) {
						tree.updateAllDescendantElementWarnings();
					}
				} else {
					aras.AlertError(message);
				}
			});

			connect.connect(treeMenu, 'onAddView', function (treeElement) {
				window.selectedTreeItem = treeElement;
				const srcItemTypeId = aras.getItemTypeId('cmf_baseView');
				const selectionDialog = window.ArasCore.Dialogs.polySources(
					srcItemTypeId
				);
				return selectionDialog.then(onBaseViewSelected);
			});

			connect.connect(treeMenu, 'onRemoveView', function (treeElement) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeView(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onAddHeaderRow', function (treeElement) {
				var headerRow = dataStore.insertHeaderRow(treeElement);
				tree.updateChildrenNodes(treeElement);
				tree.selectItem(headerRow.id);
			});

			connect.connect(treeMenu, 'onRemoveHeader', function (treeElement) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeHeaderRow(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onAddTabularViewTree', function (treeElement) {
				var tabularViewTree = dataStore.insertTabularViewTree(treeElement);
				var fromFolder =
					treeElement.getType() === systemEnums.TreeModelType.TreeFolder;
				var parentNode = dataStore.getElementById(
					fromFolder ? treeElement.id : treeElement.parentId
				);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(tabularViewTree.id);
			});

			connect.connect(treeMenu, 'onRemoveTabularViewTree', function (
				treeElement
			) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeTabularViewTree(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onAddTabularColumn', function (treeElement) {
				var fromFolder =
					treeElement.getType() === systemEnums.TreeModelType.ColumnFolder;
				var tabularViewColumn = dataStore.insertTabularColumn(
					treeElement,
					fromFolder
				);
				var parentNode = dataStore.getElementById(
					fromFolder ? treeElement.id : treeElement.parentId
				);
				var children = dataStore.getChildren(parentNode);
				for (var i = 0; i < children.length; i++) {
					if (children[i] !== tabularViewColumn) {
						tree.updateTreeLabel(children[i]);
					}
				}
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(tabularViewColumn.id);
			});

			connect.connect(treeMenu, 'onRemoveTabularColumn', function (
				treeElement
			) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeTabularColumn(treeElement);
				var children = dataStore.getChildren(parentNode);
				for (var i = 0; i < children.length; i++) {
					tree.updateTreeLabel(children[i]);
				}
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onAddExportSettings', function (treeElement) {
				window.selectedTreeItem = treeElement;
				const srcItemTypeId = aras.getItemTypeId(
					'cmf_ContentTypeExportSetting'
				);
				const selectionDialog = window.ArasCore.Dialogs.polySources(
					srcItemTypeId
				);
				return selectionDialog.then(onExportSettingsSelected);
			});

			connect.connect(treeMenu, 'onRemoveExportSettings', function (
				treeElement
			) {
				var parentNode = dataStore.getElementById(treeElement.parentId);
				dataStore.removeExportSettings(treeElement);
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(parentNode.id);
			});

			connect.connect(treeMenu, 'onSuccessDataMigration', function (
				treeElement
			) {
				var newContentType = aras.IomInnovator.newItem(
					'cmf_ContentType',
					'get'
				);
				newContentType.setAttribute('id', item.getAttribute('id'));
				var res = newContentType.apply();
				if (res) {
					item = res.node;
					reload();
				}
			});

			function onBaseViewSelected(typeName) {
				if (!typeName) {
					return;
				}
				var baseView = dataStore.insertBaseView(
					typeName,
					window.selectedTreeItem
				);
				var parentNode;
				if (
					window.selectedTreeItem.getType() ===
					systemEnums.TreeModelType.ViewFolder
				) {
					parentNode = dataStore.getElementById(window.selectedTreeItem.id);
				} else {
					parentNode = dataStore.getElementById(
						window.selectedTreeItem.parentId
					);
				}
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(baseView.id);
			}

			function onExportSettingsSelected(typeName) {
				if (!typeName) {
					return;
				}
				var baseView = dataStore.insertExportSettings(
					window.selectedTreeItem,
					typeName
				);
				var parentNode;
				if (
					window.selectedTreeItem.getType() ===
					systemEnums.TreeModelType.ExportFolder
				) {
					parentNode = dataStore.getElementById(window.selectedTreeItem.id);
				} else {
					parentNode = dataStore.getElementById(
						window.selectedTreeItem.parentId
					);
				}
				tree.updateChildrenNodes(parentNode);
				tree.selectItem(baseView.id);
			}

			connect.connect(treeMenu.treeMenu, '_openMyself', function (res) {
				if (isEditMode) {
					if (!tree.tree.selectedNode) {
						return;
					}
					var current = tree.tree.selectedNode.rowNode;
					if (current === res.delegatedTarget) {
						var selectedItem = tree.tree.selectedItem;
						treeMenu.onOpenMenu(selectedItem);
					}
				}
			});

			connect.connect(tree, 'onNodeSelected', function (element) {
				popup.close(treeMenu.treeMenu);

				let promiseResolve;
				const promise = new Promise((resolve) => {
					promiseResolve = resolve;
				});
				// need timeout 0 because form item can not save last property
				// when we at once change focus from form field to tree element
				setTimeout(function () {
					switch (element.type) {
						case systemEnums.TreeModelType.ElementType:
						case systemEnums.TreeModelType.ContentType:
						case systemEnums.TreeModelType.PropertyType:
						case systemEnums.TreeModelType.ElementBindingType:
						case systemEnums.TreeModelType.BaseView:
						case systemEnums.TreeModelType.TabularViewColumn:
						case systemEnums.TreeModelType.TabularViewTree:
						case systemEnums.TreeModelType.TabularViewHeaderRows:
						case systemEnums.TreeModelType.ExportToExcelElement:
							tree.lastSelectedId = element.id;
							showTreeElement(element);
							break; // see cmfAdminPanel.js
						default:
							hideFormAndGrid();
							break;
					}

					promiseResolve();
				}, 0);

				return promise;
			});
		}
	});
});
