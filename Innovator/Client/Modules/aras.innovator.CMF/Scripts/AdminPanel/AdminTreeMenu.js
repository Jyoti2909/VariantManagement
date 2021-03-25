/* global define */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/Menu',
	'CMF/Scripts/AdminPanel/AdminEnum',
	'dijit/MenuItem',
	'CMF/Scripts/AdminPanel/DataAutomigration'
], function (
	declare,
	connect,
	DijitMenu,
	AdminEnum,
	DigitMenuItem,
	DataAutomigration
) {
	return declare(null, {
		treeMenu: null,
		systemEnums: new AdminEnum(),
		dataAutomigration: new DataAutomigration(),

		constructor: function () {
			this.treeMenu = new DijitMenu({
				targetNodeIds: ['divTree'],
				selector: '.dijitTreeRow'
			});
			this.treeMenu.startup();
		},

		onOpenMenu: function (selectedTreeElement) {
			this.removeAll();
			switch (selectedTreeElement.getType()) {
				case this.systemEnums.TreeModelType.ElementFolder:
					this.generateContentTypeMenu();
					break;
				case this.systemEnums.TreeModelType.ElementType:
					this.generateElementTypeMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.ElementBindingType:
					this.generateElementBindingMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.PropertyType:
					this.generatePropertyTypeMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.ViewFolder:
					this.generateViewMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.BaseView:
					this.generateBaseViewMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.HeaderRowsFolder:
					this.generateHeaderFolderMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.TabularViewHeaderRows:
					this.generateHeaderRowMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.TreeFolder:
					this.generateTreeFolderMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.TabularViewTree:
					this.generateTabularViewTreeMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.ColumnFolder:
					this.generateColumnFolderMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.TabularViewColumn:
					this.generateTabularViewColumnMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.ExportFolder:
					this.generateExportFolderMenu(selectedTreeElement);
					break;
				case this.systemEnums.TreeModelType.ExportToExcelElement:
					this.generateExportSettingsMenu(selectedTreeElement);
					break;
			}
		},

		generateContentTypeMenu: function () {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_element_type'
					),
					onClick: function () {
						self.onAddElementType(null);
					}
				})
			);
		},

		generateElementBindingMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_element_binding'
					),
					onClick: function () {
						self.onRemoveElementBinding(selectedTreeElement);
					}
				})
			);
		},

		generateViewMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_view'
					),
					onClick: function () {
						self.onAddView(selectedTreeElement);
					}
				})
			);
		},

		generateBaseViewMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_view'
					),
					onClick: function () {
						self.onAddView(selectedTreeElement);
					}
				})
			);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_view'
					),
					onClick: function () {
						self.onRemoveView(selectedTreeElement);
					}
				})
			);
		},

		generateExportFolderMenu: function (selectedTreeElement) {
			var self = this;
			if (!selectedTreeElement.element.hasRecord) {
				this.treeMenu.addChild(
					new DigitMenuItem({
						label: aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'admin_add_export_settings'
						),
						onClick: function () {
							self.onAddExportSettings(selectedTreeElement);
						}
					})
				);
			}
		},

		generateExportSettingsMenu: function (selectedTreeElement) {
			var self = this;

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_export_settings'
					),
					onClick: function () {
						self.onRemoveExportSettings(selectedTreeElement);
					}
				})
			);
		},

		generateHeaderFolderMenu: function (selectedTreeElement) {
			if (!selectedTreeElement.element.hasHeaderRow) {
				var self = this;
				this.treeMenu.addChild(
					new DigitMenuItem({
						label: aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'admin_add_additional_header_row'
						),
						onClick: function () {
							self.onAddHeaderRow(selectedTreeElement);
						}
					})
				);
			}
		},

		generateHeaderRowMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_additional_header_row'
					),
					onClick: function () {
						self.onRemoveHeader(selectedTreeElement);
					}
				})
			);
		},

		generateTreeFolderMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_element_type_config'
					),
					onClick: function () {
						self.onAddTabularViewTree(selectedTreeElement);
					}
				})
			);
		},

		generateTabularViewTreeMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_element_type_config'
					),
					onClick: function () {
						self.onAddTabularViewTree(selectedTreeElement);
					}
				})
			);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_element_type_config'
					),
					onClick: function () {
						self.onRemoveTabularViewTree(selectedTreeElement);
					}
				})
			);
		},

		generateColumnFolderMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_column'
					),
					onClick: function () {
						self.onAddTabularColumn(selectedTreeElement);
					}
				})
			);
		},

		generateTabularViewColumnMenu: function (selectedTreeElement) {
			var self = this;
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_column'
					),
					onClick: function () {
						self.onAddTabularColumn(selectedTreeElement);
					}
				})
			);
			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_remove_column'
					),
					onClick: function () {
						self.onRemoveTabularColumn(selectedTreeElement);
					}
				})
			);
		},

		generateElementTypeMenu: function (selectedTreeElement) {
			var self = this;
			var menuItem = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_add_element_type'
				),
				onClick: function () {
					self.onAddElementType(selectedTreeElement);
				}
			});

			this.treeMenu.addChild(menuItem);

			var menuItem2 = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_add_child_element_type'
				),
				onClick: function () {
					self.onAddElementType(selectedTreeElement, true);
				}
			});
			this.treeMenu.addChild(menuItem2);

			var menuItem3 = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_remove_element_type'
				),
				onClick: function () {
					self.onRemoveElementType(selectedTreeElement);
				}
			});

			this.treeMenu.addChild(menuItem3);

			if (!selectedTreeElement.element.elementBinding) {
				var menuItem4 = new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_add_element_binding'
					),
					onClick: function () {
						self.onAddElementBinding(selectedTreeElement);
					}
				});

				this.treeMenu.addChild(menuItem4);
			}

			var menuItem5 = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_add_property_type'
				),
				onClick: function () {
					self.onAddPropertyType(selectedTreeElement);
				}
			});

			this.treeMenu.addChild(menuItem5);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_convert_to_property'
					),
					onClick: function () {
						if (!aras.isDirtyEx(item)) {
							var result = self.dataAutomigration.convertElementToProperty(
								selectedTreeElement.element
							);
							if (result) {
								self.onSuccessDataMigration(selectedTreeElement);
							}
						} else {
							aras.AlertError(
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_data_migration_warning'
								)
							);
						}
					}
				})
			);
		},

		generatePropertyTypeMenu: function (selectedTreeElement) {
			var self = this;
			var menuItem = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_add_property_type'
				),
				onClick: function () {
					self.onAddPropertyType(selectedTreeElement);
				}
			});

			this.treeMenu.addChild(menuItem);

			var menuItem2 = new DigitMenuItem({
				label: aras.getResource(
					'../Modules/aras.innovator.CMF/',
					'admin_remove_property_type'
				),
				onClick: function () {
					self.onRemovePropertyType(selectedTreeElement);
				}
			});
			this.treeMenu.addChild(menuItem2);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_convert_to_element'
					),
					onClick: function () {
						if (!aras.isDirtyEx(item)) {
							var result = self.dataAutomigration.convertToElementType(
								selectedTreeElement.element
							);
							if (result) {
								self.onSuccessDataMigration(selectedTreeElement);
							}
						} else {
							aras.AlertError(
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_data_migration_warning'
								)
							);
						}
					}
				})
			);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_change_parent_element'
					),
					onClick: function () {
						if (!aras.isDirtyEx(item)) {
							var result = self.dataAutomigration.changeParent(
								selectedTreeElement.element
							);
							if (result) {
								result.then(function (a) {
									if (a) {
										self.onSuccessDataMigration(selectedTreeElement);
									}
								});
							}
						} else {
							aras.AlertError(
								aras.getResource(
									'../Modules/aras.innovator.CMF/',
									'admin_data_migration_warning'
								)
							);
						}
					}
				})
			);

			this.treeMenu.addChild(
				new DigitMenuItem({
					label: aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'admin_update_permissions'
					),
					onClick: function () {
						var element = selectedTreeElement.element;
						var action = aras.getItemByName(
							'Action',
							'cmf_UpdatePermissionsPropertyType'
						);
						aras.invokeAction(
							action,
							element.node.getAttribute('typeId'),
							element.id
						);
					}
				})
			);
		},

		removeAll: function () {
			var items = this.treeMenu.getChildren();

			for (var i = 0; i < items.length; i++) {
				this.treeMenu.removeChild(items[i]);
			}
		},

		onAddElementType: function (sourceTreeElement, isChild) {},

		onRemoveElementType: function (treeElement) {},

		onAddElementBinding: function (treeElement) {},

		onRemoveElementBinding: function (treeElement) {},

		onAddPropertyType: function (treeElement) {},

		onRemovePropertyType: function (treeElement) {},

		onAddView: function (treeElement) {},

		onRemoveView: function (treeElement) {},

		onAddHeaderRow: function (treeElement) {},

		onRemoveHeader: function (treeElement) {},

		onAddTabularViewTree: function (treeElement) {},

		onRemoveTabularViewTree: function (treeElement) {},

		onAddTabularColumn: function (treeElement) {},

		onRemoveTabularColumn: function (treeElement) {},

		onAddExportSettings: function (treeElement) {},

		onRemoveExportSettings: function (treeElement) {},

		onSuccessDataMigration: function (treeElement) {}
	});
});
