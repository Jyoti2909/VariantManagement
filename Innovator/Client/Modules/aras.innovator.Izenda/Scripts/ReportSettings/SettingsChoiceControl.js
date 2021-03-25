require(['dojo/_base/declare'], function (declare) {
	'use strict';
	var self;
	dojo.setObject(
		'Izenda.UI.SettingsChoiceControl',
		declare(null, {
			xml:
				'<table enableHTML="false" treelines="1" draw_grid="true" thinBorder="true" editable="false" ' +
				'nosort="true"><menu></menu><thead><th align="center">label</th></thead><columns><column width="200" order="1" align="left" /></columns>{0}</table>',
			template: '<tr level="0" id="{0}"><td align="left">{1}</td></tr>',
			itemsCount: 0,

			constructor: function (args) {
				this.leftTreeControl = args.leftTreeControl;
				this.rightTreeControl = args.rightTreeControl;
				this.leftSearch = args.leftSearch;
				this.rightSearch = args.rightSearch;
				this.allItems = args.allItems;
				this.isProps = args.isProps;
				this.returnValue = args.returnValue;
				self = this;
			},

			onMoveRightClickItemsOnly: function () {
				let ids = self.leftTreeControl.getSelectedItemIds('|');
				if (ids) {
					ids = ids.split('|');
					ids.forEach(function (selectedId) {
						self.returnValue.push({ id: selectedId });
						if (
							!self.rightTreeControl._store ||
							!self.rightTreeControl._store._itemsByIdentity[selectedId]
						) {
							self.rightTreeControl.insertRoot(
								selectedId,
								self.leftTreeControl._store._itemsByIdentity[selectedId]
									.label[0]
							);
						}
					});
					self.rightTreeControl['grid_Experimental'].refresh();
					self.rightTreeControl.Sort(0, true);
					self.rightTreeControl['selection_Experimental'].clear();

					self.leftTreeControl.DeleteSelectedItem();
					self.leftTreeControl['grid_Experimental'].refresh();
					self.leftTreeControl['selection_Experimental'].clear();
				}
			},

			onMoveLeftClickItemsOnly: function () {
				let ids = self.rightTreeControl.getSelectedItemIds('|');
				if (ids) {
					ids = ids.split('|');
					ids.forEach(function (selectedId) {
						for (let i = 0; i < self.returnValue.length; i++) {
							if (self.returnValue[i].id === selectedId) {
								self.returnValue.splice(i, 1);
								break;
							}
						}
						if (
							!self.leftTreeControl._store ||
							!self.leftTreeControl._store._itemsByIdentity[selectedId]
						) {
							self.leftTreeControl.insertRoot(
								selectedId,
								self.rightTreeControl._store._itemsByIdentity[selectedId]
									.label[0]
							);
						}
					});
					self.leftTreeControl['grid_Experimental'].refresh();
					self.leftTreeControl.Sort(0, true);
					self.leftTreeControl['selection_Experimental'].clear();

					self.rightTreeControl.DeleteSelectedItem();
					self.rightTreeControl['grid_Experimental'].refresh();
					self.rightTreeControl['selection_Experimental'].clear();
				}
			},

			onMoveRightClick: function () {
				let ids = self.leftTreeControl.getSelectedItemIds('|');
				if (!ids) {
					return;
				}

				ids = ids.split('|');
				ids.forEach(function (selectedId) {
					const parentId = self.leftTreeControl.GetParentId(selectedId);
					let itemFound = false;
					let loadId;
					let label;

					if (parentId) {
						for (let i = 0; i < self.returnValue.length; i++) {
							if (self.returnValue[i].id === parentId) {
								self.returnValue[i].childs.push(selectedId);
								itemFound = true;
								break;
							}
						}

						if (!itemFound) {
							self.returnValue.push({ id: parentId, childs: [selectedId] });
						}

						loadId = parentId;
					} else {
						self.leftTreeControl['items_Experimental'].set(
							selectedId,
							'open',
							false
						);
						let currentRel;

						const items = self.allItems.getItemsByXPath(
							"//Item[@type='ItemType' and @id='" + selectedId + "']"
						);
						const currentItem = items.getItemByIndex(0);
						const rels = currentItem.getRelationships();
						label =
							currentItem.getProperty('label') ||
							currentItem.getProperty('name');
						for (let i = 0; i < self.returnValue.length; i++) {
							if (self.returnValue[i].id === selectedId) {
								for (let j = 0; j < rels.getItemCount(); j++) {
									currentRel = rels.getItemByIndex(j);
									if (
										self.returnValue[i].childs.indexOf(currentRel.getID()) < 0
									) {
										self.returnValue[i].childs.push(currentRel.getID());
									}
								}

								itemFound = true;
								break;
							}
						}

						if (!itemFound) {
							const props = [];
							for (let j = 0; j < rels.getItemCount(); j++) {
								currentRel = rels.getItemByIndex(j);
								props.push(currentRel.getID());
							}
							self.returnValue.push({ id: selectedId, childs: props });
						}

						loadId = selectedId;
					}

					if (
						!self.rightTreeControl._store ||
						!self.rightTreeControl._store._itemsByIdentity[loadId]
					) {
						self.rightTreeControl.insertRoot(
							loadId,
							label ||
								self.leftTreeControl._store._itemsByIdentity[loadId].label[0]
						);
					}

					self.onGetRightChildren(loadId);
				});
				const leftOpenedItems = self.leftTreeControl[
					'getOpenedItems_Experimental'
				]();
				self.rightTreeControl['grid_Experimental'].refresh();
				self.rightTreeControl.Sort(0, true);
				self.initializeLeftTree(self.leftTreeControl, leftOpenedItems);
			},

			onMoveLeftClick: function () {
				let ids = self.rightTreeControl.getSelectedItemIds('|');
				if (!ids) {
					return;
				}

				ids = ids.split('|');
				ids.forEach(function (selectedId) {
					const parentId = self.rightTreeControl.GetParentId(selectedId);
					const label =
						self.rightTreeControl._store._itemsByIdentity[
							parentId || selectedId
						].label[0];
					let loadId;

					if (parentId) {
						for (let i = 0; i < self.returnValue.length; i++) {
							if (self.returnValue[i].id === parentId) {
								const pos = self.returnValue[i].childs.indexOf(selectedId);
								self.returnValue[i].childs.splice(pos, 1);
								if (self.returnValue[i].childs.length === 0) {
									self.rightTreeControl.deleteRow(parentId);
									self.returnValue.splice(i, 1);
									if (!self.leftTreeControl._store._itemsByIdentity[parentId]) {
										self.leftTreeControl.insertRoot(parentId, label);
									}
								}

								if (!self.leftTreeControl._store._itemsByIdentity[parentId]) {
									self.leftTreeControl.insertRoot(parentId, label);
								}
								break;
							}
						}
						loadId = parentId;
					} else {
						self.rightTreeControl['items_Experimental'].set(
							selectedId,
							'open',
							false
						);
						for (let i = 0; i < self.returnValue.length; i++) {
							if (self.returnValue[i].id === selectedId) {
								if (!self.leftTreeControl._store._itemsByIdentity[selectedId]) {
									self.leftTreeControl.insertRoot(selectedId, label);
								}
								self.returnValue.splice(i, 1);

								break;
							}
						}
						loadId = selectedId;
					}

					if (
						!self.leftTreeControl._store ||
						!self.leftTreeControl._store._itemsByIdentity[loadId]
					) {
						self.leftTreeControl.insertRoot(
							loadId,
							label ||
								self.rightTreeControl._store._itemsByIdentity[loadId].label[0]
						);
					}

					self.onGetLeftChildren(loadId);
				});
				const rightOpenedItems = self.rightTreeControl[
					'getOpenedItems_Experimental'
				]();
				self.leftTreeControl['grid_Experimental'].refresh();
				self.leftTreeControl.Sort(0, true);
				self.initializeRightTree(self.rightTreeControl, rightOpenedItems);
			},

			onGetRightChildren: function (rowId) {
				for (let i = 0; i < self.returnValue.length; i++) {
					if (self.returnValue[i].id === rowId) {
						const items = self.allItems.getItemsByXPath(
							"//Item[@type='ItemType' and @id='" + rowId + "']"
						);
						const currentItem = items.getItemByIndex(0);
						const rels = currentItem.getRelationships();

						for (let j = 0; j < self.returnValue[i].childs.length; j++) {
							const id = self.returnValue[i].childs[j];
							if (!self.rightTreeControl._store._itemsByIdentity[id]) {
								const rel = rels
									.getItemsByXPath(
										"//Item[@type='Property' and @id='" + id + "']"
									)
									.getItemByIndex(0);
								self.rightTreeControl.insertNewChild(
									rowId,
									id,
									rel.getProperty('label') || rel.getProperty('name')
								);
							}
						}
						break;
					}
				}
			},

			onGetLeftChildren: function (rowId) {
				const items = self.allItems.getItemsByXPath(
					"//Item[@type='ItemType' and @id='" + rowId + "']"
				);
				const currentItem = items.getItemByIndex(0);
				const rels = currentItem.getRelationships();
				let tmpForced;
				for (let i = 0; i < self.returnValue.length; i++) {
					if (self.returnValue[i].id === rowId) {
						tmpForced = self.returnValue[i].childs;
						break;
					}
				}

				for (let j = 0; j < rels.getItemCount(); j++) {
					const rel = rels.getItemByIndex(j);
					const relId = rel.getID();
					if (
						(!tmpForced || tmpForced.indexOf(relId) === -1) &&
						!self.leftTreeControl._store._itemsByIdentity[relId]
					) {
						self.leftTreeControl.insertNewChild(
							rowId,
							relId,
							rel.getProperty('label') || rel.getProperty('name')
						);
					}
				}
			},

			initializeLeftTree: function (tree, openedItems, fromSearch) {
				if (self.leftSearch.emptyReportSearchResult) {
					return;
				}

				const items = self.allItems.getItemsByXPath("//Item[@type='ItemType']");
				let ignore = false;
				let req = '';

				self.itemsCount = tree[
					'grid_Experimental'
				].keepRows = items.getItemCount();
				for (let i = 0; i < self.itemsCount; i++) {
					const currentItem = items.getItemByIndex(i);
					const itemId = currentItem.getID();
					for (let j = 0; j < self.returnValue.length; j++) {
						if (self.returnValue[j].id === itemId) {
							const relsCount = currentItem.getRelationships().getItemCount();
							if (
								self.returnValue[j].childs &&
								self.returnValue[j].childs.length === relsCount
							) {
								ignore = true;
							}

							if (!self.isProps) {
								ignore = true;
							}
							break;
						}
					}
					if (
						!ignore &&
						(self.leftSearch.forced.length === 0 ||
							self.leftSearch.forced.indexOf(itemId) > -1)
					) {
						req += self.template.Format(
							itemId,
							currentItem.getProperty('label') ||
								currentItem.getProperty('name')
						);
					}
					ignore = false;
				}

				if (req) {
					tree.InitXML(self.xml.Format(req));
				}

				self.handleOpenedItems(
					tree,
					openedItems,
					fromSearch,
					self.onGetLeftChildren
				);
				if (fromSearch) {
					self.leftTreeControl['grid_Experimental'].refresh();
				}
			},

			initializeRightTree: function (tree, openedItems, fromSearch) {
				if (self.rightSearch.emptyReportSearchResult) {
					return;
				}
				let req = '';

				tree['grid_Experimental'].keepRows = self.itemsCount;
				for (let i = 0; i < self.returnValue.length; i++) {
					const id = self.returnValue[i].id;
					const items = self.allItems.getItemsByXPath(
						"//Item[@type='ItemType' and @id='" + id + "']"
					);
					const currentItem = items.getItemByIndex(0);
					if (
						self.rightSearch.forced.length === 0 ||
						self.rightSearch.forced.indexOf(id) > -1
					) {
						req += self.template.Format(
							id,
							currentItem.getProperty('label') ||
								currentItem.getProperty('name')
						);
					}
				}
				if (req) {
					tree.InitXML(self.xml.Format(req));
				} else {
					req += self.template.Format('simple', 'simple');
					tree.InitXML(self.xml.Format(req));
					tree.RemoveAllRows();
				}

				self.handleOpenedItems(
					tree,
					openedItems,
					fromSearch,
					self.onGetRightChildren
				);

				if (fromSearch) {
					self.rightTreeControl['grid_Experimental'].refresh();
				}
			},

			handleOpenedItems: function (
				tree,
				openedItems,
				fromSearch,
				onGetChildren
			) {
				if (
					self.isProps &&
					tree &&
					tree._store &&
					tree._store._arrayOfTopLevelItems
				) {
					for (let i = 0; i < tree._store._arrayOfTopLevelItems.length; i++) {
						const id = tree._store._arrayOfTopLevelItems[i].uniqueId[0];
						if (!tree._store._arrayOfTopLevelItems[i].children) {
							if (fromSearch) {
								const treeItem = tree._store._itemsByIdentity[id];
								if (treeItem) {
									treeItem.children = [true];
								}
							} else {
								tree['items_Experimental'].set(id, 'value', 'children', true);
							}

							if (openedItems && openedItems.indexOf(id) > -1) {
								onGetChildren(id);
							}
						}
					}
				}
			}
		})
	);
});
