function XClassRelationshipsGrid() {
	this.xPropertyOverride = new PropertyOverrideModule([
		'label',
		'default_value',
		'is_required',
		'readonly'
	]);
	this._editableColumns = ['inactive_D'];
}

XClassRelationshipsGrid.prototype.checkReorderingPossible = function () {
	if (isEditMode) {
		var resultDom = this.mergeXPropertyRelationships(
			item,
			currQryItem.getResultDOM()
		);
		var sortProps = grid.grid_Experimental.getSortProps()[1];
		if (sortProps.attribute === 'sort_order_R') {
			var existingItem = resultDom.selectSingleNode(
				aras.XPathResult(
					"/Item[@type='xClass_xPropertyDefinition' and @id='" +
						grid.getSelectedId() +
						"']/related_id/Item"
				)
			);
			var sortOrder = parseInt(
				aras.getItemProperty(existingItem, 'sort_order')
			);
			var totalPropsCount = resultDom.selectNodes(
				aras.XPathResult(
					"/Item[@type='xClass_xPropertyDefinition' and (not(@action) or @action != 'delete')]"
				)
			).length;
			return {
				up: sortOrder > 1,
				down: sortOrder < totalPropsCount
			};
		}
	}
	return { up: false, down: false };
};

XClassRelationshipsGrid.prototype.reorderRelationship = function (
	itemId,
	delta
) {
	var reorderPossibility = this.checkReorderingPossible();
	if (!reorderPossibility.up && !reorderPossibility.down) {
		return;
	}
	var resultDom = this.mergeXPropertyRelationships(
		item,
		currQryItem.getResultDOM(),
		true
	);
	var currentItem = resultDom.selectSingleNode(
		aras.XPathResult("/Item[@id='" + itemId + "']/related_id/Item")
	);
	var currSortOrder = parseInt(aras.getItemProperty(currentItem, 'sort_order'));

	var idToSort = {};
	Array.prototype.forEach.call(
		resultDom.selectNodes(
			aras.XPathResult("/Item[not(@action) or @action!='delete']")
		),
		function (xProp) {
			var relatedItem = xProp.selectSingleNode('related_id/Item');
			var sort = parseInt(aras.getItemProperty(relatedItem, 'sort_order'));
			var id = aras.getItemProperty(relatedItem, 'id');

			var max = Math.max(currSortOrder, currSortOrder + delta);
			var min = Math.min(currSortOrder, currSortOrder + delta);
			if (sort <= max && sort >= min) {
				if (sort === currSortOrder) {
					sort = currSortOrder + delta;
					aras.setItemProperty(relatedItem, 'sort_order', sort);
				} else {
					if (delta > 0) {
						sort--;
					} else {
						sort++;
					}
					aras.setItemProperty(relatedItem, 'sort_order', sort);
				}
			}

			idToSort[id] = sort;
		}
	);
	var sortArr = Object.keys(idToSort).sort(function (a, b) {
		if (idToSort[a] < idToSort[b]) {
			return -1;
		} else if (idToSort[a] > idToSort[b]) {
			return 1;
		} else {
			return 0;
		}
	});
	aras.setItemProperty(item, 'xproperties_sort_order', sortArr.join(','));
	if (item.getAttribute('action') !== 'add') {
		item.setAttribute('action', 'edit');
	}

	var params = {};
	params['only_rows'] = true;
	params['enable_links'] = false;
	params.enableFileLinks = true;
	params.bgInvert = true;
	var gridXml = aras.uiGenerateRelationshipsGridXML(
		resultDom,
		DescByVisibleProps,
		RelatedVisibleProps,
		window['DescByItemType_ID'],
		params,
		true
	);
	grid.InitXMLRows_Experimental(gridXml);
	grid.setSelectedRow(itemId);
	updateControls(itemId);
};

XClassRelationshipsGrid.prototype.createGridContainer = function () {
	var self = this;
	return new Promise(function (resolve) {
		var virtualGridNode = document.createDocumentFragment();
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.GridContainer',
			{
				connectNode: virtualGridNode,
				onStartSearch_Experimental: doSearch,
				canEdit_Experimental: canEditCell,
				validateCell_Experimental: validateCell,
				customRowHeight: 32
			},
			function (control) {
				self.xPropertyOverride.grid = grid = gridApplet = control;
				grid.setColumnTypeManager_Experimental('File', FilePropertyManager);
				gridReady = true;

				clientControlsFactory.on(grid.grid_Experimental, {
					onHeaderCellContextMenu: onRelshipsHeaderCellContextMenu,
					onHeaderContextMenu: onRelshipsHeaderContextMenu
				});

				clientControlsFactory.on(grid.grid_Experimental, {
					onStyleRow: function (row) {
						var item = this.getItem(row.index);
						if (!item) {
							return;
						}
						item.attrs[0].dnd_R.dndPointer = 'true';
						var itemId = item.uniqueId;
						var relItem = window.item.selectSingleNode(
							"Relationships/Item[@id='" + itemId + "']"
						);
						if (!relItem) {
							row.customClasses += ' inherited';
						}
					},
					onSort_Dg: function () {
						updateControls(grid.getSelectedId());
					},
					onCellDblClick: function (e) {
						if (e.target.closest('.aras-form-switch')) {
							grid.grid_Experimental.selection.selected[e.rowIndex] = false;
						}
					}
				});
				const baseOnApplyCellEdit = grid.grid_Experimental.onApplyCellEdit;
				grid.grid_Experimental.onApplyCellEdit = function (
					value,
					indexRow,
					field
				) {
					if (self._editableColumns.indexOf(field) > -1) {
						baseOnApplyCellEdit(value, indexRow, field);
					} else {
						const rowId = grid.GetRowId(indexRow);
						const cell = self.xPropertyOverride.getCell(rowId, field);
						cell.overrideCell.SetValue(value, true);
						cell.defaultCell.SetValue(cell.defaultValue);
					}
				};
				grid.grid_Experimental.onCellClick = (function () {
					onClick = grid.grid_Experimental.onCellClick.bind(
						grid.grid_Experimental
					);
					return function (e) {
						const columnName = e.cell.field;
						if (
							self.xPropertyOverride.isOverrideCell(columnName) &&
							isXPropertyBelongXClass(
								e.cell.field,
								grid.getRowId(e.rowIndex)
							) &&
							isEditMode
						) {
							const rowId = grid.getRowId(e.rowIndex);
							const cell = self.xPropertyOverride.getCell(rowId, columnName);
							if (e.target.closest('.aras-form-switch')) {
								e.target
									.closest('.aras-form-switch')
									.classList.toggle('checked');
								grid.grid_Experimental.selection.selected[e.rowIndex] = false;
								if (e.target.tagName === 'SPAN') {
									cell.isOverride = !cell.isOverride;
								}
							}
							if (
								cell.isOverride &&
								grid.grid_Experimental.selection.isSelected(e.rowIndex) &&
								!grid.grid_Experimental.edit.isEditing() &&
								canEditCell(rowId, e.cell.field)
							) {
								if (e.target.classList.contains('aras_grid_checkbox')) {
									cell.overrideCell.SetValue(
										!cell.overrideCell.GetValue(),
										true
									);
									return;
								}
								cell.defaultValue = cell.defaultCell.GetValue();
								cell.defaultCell.SetValue(cell.overrideCell.GetValue());
							}
						}
						onClick(e);
					};
				})();

				var oldSetSortIndex = grid.grid_Experimental.setSortIndex;
				grid.grid_Experimental.setSortIndex = function (columnIndex, asc) {
					var currentSort = grid.grid_Experimental.getSortProps()[1];
					var activatingSort = grid.getColumnName(columnIndex);
					if (
						activatingSort === currentSort.attribute &&
						grid.getColumnName(columnIndex) === 'sort_order_R' &&
						currentSort.descending === false
					) {
						return false;
					} else {
						oldSetSortIndex.call(grid.grid_Experimental, columnIndex, asc);
					}
				};

				clientControlsFactory.on(grid, {
					gridHeaderMenuClick_Experimental: onRelshipsHeaderMenuClicked,
					gridDoubleClick: onDoubleClick,
					gridXmlLoaded: onXmlLoaded,
					gridClick: onSelectItem,
					gridLinkClick: function (linkVal) {
						if (linkVal.length) {
							linkVal = linkVal.replace(/'/g, '');
							var typeName = linkVal.split(',')[0];
							var id = linkVal.split(',')[1];
							onLink(typeName, id);
						}
					},
					onInputHelperShow_Experimental: relshipsGrid_showInputHelperDialog,
					onStartEdit_Experimental: startCellEditRG,
					onApplyEdit_Experimental: applyCellEditRG,
					onCancelEdit_Experimental: onCancelEditHandler,
					gridMenuInit: function (rowID, col) {
						if (
							!window.item.selectSingleNode(
								"Relationships/Item[@id='" + rowID + "']"
							)
						) {
							var inArgs = {
								item: window.parent.xClassTreeItem.selectSingleNode(
									"Relationships/Item[@type='xClass' and Relationships/Item[@id='" +
										rowID +
										"']]"
								),
								hasRelatedItem: function (rowId) {
									return true;
								}
							};
							return XClassRelationshipsGrid.superclass.gridMenuInit(
								rowID,
								col,
								inArgs
							);
						}
						return XClassRelationshipsGrid.superclass.gridMenuInit(rowID, col);
					},
					gridMenuClick: function (cmdId, rowId, col) {
						return onRelationshipPopupMenuClicked(cmdId, rowId, col);
					},
					gridKeyPress: onKeyPressed,
					onDragDrop_Experimental: function (targetRowId, isCtrlPressed) {
						if (!targetRowId) {
							return;
						}
						var fromId = grid.getRowId(
							grid.dnd_Experimental.onMouseDownRowIndex
						);
						if (fromId !== targetRowId) {
							var delta =
								grid.getRowIndex(targetRowId) -
								grid.dnd_Experimental.onMouseDownRowIndex;
							self.reorderRelationship(fromId, delta);
						}
					},
					canDragDrop_Experimental: function (e) {
						if (grid.getColumnName(e.target.getAttribute('idx')) === 'dnd_R') {
							var reorderPossibility = self.checkReorderingPossible();
							if (reorderPossibility.up || reorderPossibility.down) {
								return true;
							}
						}
						return false;
					}
				});

				clientControlsFactory.on(grid.items_Experimental, {
					onNew: addNewRowEvent
				});

				topWindow_Experimental.cui.initPopupMenu(grid.contexMenu_Experimental);
				topWindow_Experimental.cui.initPopupMenu(
					grid.headerContexMenu_Experimental
				);
				scriptInit();
				initSearch().then(refreshGridSize);
				if (grid.getColumnName(0) === 'L') {
					hideColumn(0);
				}
				self.xPropertyOverride.hideColumns();
				var gridTd = document.getElementById('gridTD');
				gridTd.appendChild(virtualGridNode);
				gridTd.classList.add('extended-properties-grid');
				// refresh method must be called only when toolbar completelly initialized
				if (isToolbarUsed && toolbar) {
					toolbar.refreshToolbar_Experimental();
				}
				aras.registerEventHandler('ItemLock', window, relatedItemLockListener);
				aras.registerEventHandler('ItemSave', window, ItemSaveListener);
				require([
					'ExtendedClassification/scripts/xClassRelationshipsGridModules'
				], function (xClassRelGridModules) {
					control.dnd_Experimental = xClassRelGridModules.dnd(control);
					resolve();
				});

				grid.formatter_Experimental.formatHandler = (function () {
					const originalFormatterFunction = grid.formatter_Experimental.formatHandler.bind(
						grid.formatter_Experimental
					);
					return function (layoutCell, storeValue, index) {
						const isOverrideCell = self.xPropertyOverride.isOverrideCell(
							layoutCell.field
						);
						let content;
						if (isOverrideCell) {
							const overrideCell = self.xPropertyOverride.getCell(
								grid.GetRowId(index),
								layoutCell.field
							);
							let checkboxIsDisabled = '';
							if (
								!isXPropertyBelongXClass(
									layoutCell.field,
									grid.getRowId(index)
								) ||
								!isEditMode
							) {
								checkboxIsDisabled = 'disabled';
							}
							const switchHtml =
								'<label class="aras-form-switch ' +
								(overrideCell.isOverride ? 'checked' : '') +
								'">' +
								'<input type="checkbox" ' +
								(overrideCell.isOverride ? 'checked' : '') +
								' ' +
								checkboxIsDisabled +
								'>' +
								'<span class="switch-off"></span>' +
								'<span class="switch-on"></span>' +
								'</label>';
							content = originalFormatterFunction(
								layoutCell,
								overrideCell.value,
								index
							);
							if ('string' === typeof overrideCell.value) {
								content =
									'<div class="switch-container-data"><span class="cell-data">' +
									content +
									'</span>' +
									switchHtml +
									'</div>';
							} else {
								content += switchHtml;
								content = '<div class="switch-container">' + content + '</div>';
							}
							layoutCell.customClasses.push('aras-grid-row-cell_switch');
						} else {
							content = originalFormatterFunction(
								layoutCell,
								storeValue,
								index
							);
						}
						return content;
					};
				})();

				grid._addRowImplementation_Experimental = (function () {
					const originalAddRowFunction = grid._addRowImplementation_Experimental.bind(
						grid
					);
					return function (id, row, rowState) {
						originalAddRowFunction(id, row, rowState);
						self.xPropertyOverride.afterAddingRowToGrid(id);
					};
				})();
			}
		);
	});
};

XClassRelationshipsGrid.prototype.showRelatedItemById = function (relID) {
	var selectedItem = item.selectSingleNode(
		'Relationships/Item[@id="' +
			relID +
			'"]/related_id[not(@discover_only="1")]/Item'
	);
	if (!selectedItem) {
		selectedItem = currQryItem.result.selectSingleNode(
			'Item[@id="' + relID + '"]/related_id[not(@discover_only="1")]/Item'
		);
	}
	return XClassRelationshipsGrid.superclass.showRelatedItem(
		selectedItem,
		relID
	);
};

XClassRelationshipsGrid.prototype.addRow = function (
	relationshipNode,
	relatedItemNode,
	markDirty
) {
	if (!relationshipNode) {
		return false;
	}

	var existingProps = relationshipNode.parentNode.selectNodes(
		"Item[@type='xClass_xPropertyDefinition']"
	);
	var inheritedProps = currQryItem.result.selectNodes(
		"Item[@type='xClass_xPropertyDefinition']"
	);
	var existingPropIds = Array.prototype.map.call(existingProps, function (
		prop
	) {
		return aras.getItemProperty(prop, 'id');
	});
	var inheritedPropIds = Array.prototype.map.call(inheritedProps, function (
		prop
	) {
		return aras.getItemProperty(prop, 'id');
	});
	var propCount = existingPropIds.reduce(function (prev, curr) {
		if (inheritedPropIds.indexOf(curr) >= 0) {
			return prev;
		}
		return prev + 1;
	}, inheritedPropIds.length);

	aras.setItemProperty(relatedItemNode, 'sort_order', propCount);

	//clonedRelationship is a temporary copy of a relationship. Is used only to generate grid row xml.
	var clonedRelationship = relationshipNode.cloneNode(true);
	var relId = aras.getItemProperty(clonedRelationship, 'id');
	var sourceDom = createEmptyResultDom();
	var tmpDom = createEmptyResultDom();
	var targetNode = sourceDom.selectSingleNode(aras.XPathResult());
	var rowNode;
	var gridXml;
	var rowId;

	if (relatedItemNode) {
		const path = this.generateXPropertyLevel(item);
		const cloneRelatedItem = relatedItemNode.cloneNode(true);
		aras.setItemProperty(cloneRelatedItem, 'level', path);
		aras.setItemProperty(
			clonedRelationship,
			'related_id',
			cloneRelatedItem,
			false
		);
	}

	targetNode.appendChild(clonedRelationship);
	const columnObjects = aras.uiPrepareDOM4XSLT(sourceDom, RelType_ID, 'RT_');

	gridXml = getGenerateRelationshipsGridXML(sourceDom, columnObjects);
	tmpDom.loadXML(gridXml);
	rowNode = tmpDom.selectSingleNode('/table/tr');
	rowNode.setAttribute('rowState', 'new');

	addRowInProgress_Number++;
	grid.addXMLRows_Experimental('<table>' + rowNode.xml + '</table>', true);

	//to support removeRelationship in onInsertRow event of RelationshipType
	rowId = rowNode.getAttribute('id');
	if (!item.selectSingleNode('Relationships/Item[@id="' + rowId + '"]')) {
		grid.deleteRow(rowId);
	}

	grid.setSelectedRow(relId);
	updateControls(relId);
};

XClassRelationshipsGrid.prototype.addNewRowEvent = function (id) {
	if (callback4NewCmd) {
		if (editWait) {
			clearTimeout(editWait);
		}
		callback4NewCmd(id, callbackFunction4NewCmd_data_bf);
		callbackFunction4NewCmd_data_bf = true;
		callback4NewCmd = null;
		var definition = item.selectSingleNode(
			'Relationships/Item[@id="' + id + '"]/related_id/Item'
		);
		this.invalidateSortOrders([aras.getItemProperty(definition, 'id')], 'add');
	}
};

XClassRelationshipsGrid.prototype.invalidateSortOrders = function (
	propIds,
	action
) {
	var resultDom = this.mergeXPropertyRelationships(
		item,
		currQryItem.getResultDOM(),
		true
	);
	var setSortOrderToXClass = function (xClass) {
		var xClassSortOrder = aras.getItemProperty(
			xClass,
			'xproperties_sort_order'
		);
		var sortOrderArr = [];
		if (xClassSortOrder) {
			sortOrderArr = xClassSortOrder.split(',');
		} else {
			const xClassProperties = item.selectNodes(
				'Relationships/Item[@type="xClass_xPropertyDefinition" and not(@isTemp)]/related_id/Item[@type="xPropertyDefinition"]'
			);

			let lastRelatedPropertySortOrder = 0;
			if (xClassProperties.length > 0) {
				lastRelatedPropertySortOrder = aras.getItemProperty(
					xClassProperties[xClassProperties.length - 1],
					'sort_order'
				);
			}
			// not all related id's added to xproperties_sort_order
			if (
				xClassProperties.length == 0 ||
				lastRelatedPropertySortOrder != xClassProperties.length
			) {
				Array.prototype.forEach.call(
					resultDom.selectNodes(
						aras.XPathResult("/Item[not(@action) or @action!='delete']")
					),
					function (xProp) {
						xClassProperties.push(xProp.selectSingleNode('related_id/Item'));
					}
				);
			}
			xClassProperties.forEach(function (xProperty) {
				sortOrderArr[aras.getItemProperty(xProperty, 'sort_order') - 1] =
					xProperty.id;
			});
		}
		var sortOrder = {};
		sortOrderArr.forEach(function (key, idx) {
			sortOrder[key] = idx + 1;
		});
		propIds.forEach(function (propId) {
			if (action === 'delete') {
				delete sortOrder[propId];
			} else if (action === 'add' && !sortOrder[propId]) {
				sortOrder[propId] = Object.keys(sortOrder).length + 1;
			}
		});
		var invalidatedSortOrder = {};
		Object.keys(sortOrder)
			.sort(function (a, b) {
				if (sortOrder[a] > sortOrder[b]) {
					return 1;
				} else if (sortOrder[a] < sortOrder[b]) {
					return -1;
				} else {
					return 0;
				}
			})
			.forEach(function (key, idx) {
				invalidatedSortOrder[key] = idx + 1;
			});
		var sortArr = Object.keys(invalidatedSortOrder).sort(function (a, b) {
			if (invalidatedSortOrder[a] < invalidatedSortOrder[b]) {
				return -1;
			} else if (invalidatedSortOrder[a] > invalidatedSortOrder[b]) {
				return 1;
			} else {
				return 0;
			}
		});
		aras.setItemProperty(xClass, 'xproperties_sort_order', sortArr.join(','));
	};
	setSortOrderToXClass(item);
	propIds.forEach(function (propId) {
		if (action === 'delete') {
			var prop = item.selectSingleNode(
				'Relationships/Item/related_id/Item[@id="' + propId + '"]'
			);
			aras.setItemProperty(prop, 'sort_order', '');
		}
	});

	var parentToChildIds = {};
	var hieararchy = JSON.parse(
		aras.getItemProperty(
			window.parent.xClassTreeItem,
			'classification_hierarchy'
		)
	);
	hieararchy.forEach(function (edge) {
		if (!parentToChildIds[edge.fromRefId]) {
			parentToChildIds[edge.fromRefId] = [];
		}
		parentToChildIds[edge.fromRefId].push(edge.toRefId);
	});
	var setSortOrderToChildren = function (xClass) {
		var childClassRefIds =
			parentToChildIds[aras.getItemProperty(xClass, 'ref_id')];
		if (childClassRefIds && childClassRefIds.length > 0) {
			childClassRefIds.forEach(function (childXClassRefId) {
				var childXClass = window.parent.xClassTreeItem.selectSingleNode(
					'Relationships/Item[ref_id="' + childXClassRefId + '"]'
				);
				setSortOrderToXClass(childXClass);
				setSortOrderToChildren(childXClass);
			});
		}
	};
	setSortOrderToChildren(item);
};

XClassRelationshipsGrid.prototype.deleteRelationship = function () {
	var ids = grid.getSelectedItemIds();
	var res = this.mergeXPropertyRelationships(
		item,
		currQryItem.getResultDOM(),
		true
	);
	var itemsToDelete = res.selectNodes(aras.XPathResult('/Item'));
	var definitionIds = [];
	Array.prototype.forEach.call(itemsToDelete, function (item) {
		if (ids.indexOf(aras.getItemProperty(item, 'id')) > -1) {
			if (item.getAttribute('action') !== 'add') {
				item.setAttribute('action', 'delete');
			} else {
				item.parentNode.removeChild(item);
			}
			definitionIds.push(
				aras.getItemProperty(item.selectSingleNode('related_id/Item'), 'id')
			);
		}
	});
	this.invalidateSortOrders(definitionIds, 'delete');
	XClassRelationshipsGrid.superclass.deleteRelationship();
	var params = {};
	params['only_rows'] = true;
	params['enable_links'] = false;
	params.enableFileLinks = true;
	params.bgInvert = true;
	this.doSortByInheritance(res.selectSingleNode(aras.XPathResult()));
	var gridXml = aras.uiGenerateRelationshipsGridXML(
		res,
		DescByVisibleProps,
		RelatedVisibleProps,
		window['DescByItemType_ID'],
		params,
		true
	);
	grid.InitXMLRows_Experimental(gridXml);
};

XClassRelationshipsGrid.prototype.mergeXPropertyRelationships = function (
	item,
	resultDom,
	notTempDoc
) {
	var res;
	if (notTempDoc) {
		res = resultDom;
	} else {
		res = createEmptyResultDom();
		res.loadXML(resultDom.xml);
	}
	var itemsFromMainItem = item.selectNodes(
		'Relationships/Item[@type="xClass_xPropertyDefinition"]'
	);
	Array.prototype.forEach.call(itemsFromMainItem, function (item) {
		var existingItem = res.selectSingleNode(
			aras.XPathResult('/Item[@id="' + aras.getItemProperty(item, 'id') + '"]')
		);
		if (!existingItem) {
			res
				.selectSingleNode(aras.XPathResult())
				.appendChild(item.cloneNode(true));
		}
	});
	return res;
};

XClassRelationshipsGrid.prototype.createToolbar = function () {
	return XClassRelationshipsGrid.superclass.createToolbar();
};

XClassRelationshipsGrid.prototype.getToolbarXml = function () {
	return aras.getI18NXMLResource(
		'xPropRelationshipsGridToolbar.xml',
		aras.getScriptsURL() + '../Modules/aras.innovator.ExtendedClassification/'
	);
};

XClassRelationshipsGrid.prototype.loadToolbar = function () {
	XClassRelationshipsGrid.superclass.loadToolbar(this.getToolbarXml());
};

XClassRelationshipsGrid.prototype.processCommand = function (cmdId, col) {
	if (cmdId === 'move_up') {
		this.reorderRelationship(grid.getSelectedId(), -1);
	} else if (cmdId === 'move_down') {
		this.reorderRelationship(grid.getSelectedId(), 1);
	} else {
		XClassRelationshipsGrid.superclass.processCommand(cmdId, col);
	}
};

XClassRelationshipsGrid.prototype.computeColWidhtOrder = function () {
	var additionalRelatedVisibleProps = [];

	var dndProp = aras.newItem('Property');
	aras.setItemProperty(dndProp, 'name', 'dnd');
	aras.setItemProperty(dndProp, 'sort_order', 0);
	aras.setItemProperty(dndProp, 'column_width', 16);
	aras.setItemProperty(dndProp, 'label', ' ');
	additionalRelatedVisibleProps.push(dndProp);

	var sortOrderProp = aras.newItem('Property');
	aras.setItemProperty(sortOrderProp, 'name', 'sort_order');
	aras.setItemProperty(sortOrderProp, 'sort_order', 1);
	aras.setItemProperty(sortOrderProp, 'data_type', 'integer');
	aras.setItemProperty(sortOrderProp, 'column_alignment', 'right');
	aras.setItemProperty(sortOrderProp, 'label', 'N');
	aras.setItemProperty(sortOrderProp, 'order_by', '0');
	aras.setItemProperty(sortOrderProp, 'column_width', 36);
	additionalRelatedVisibleProps.push(sortOrderProp);

	var levelProp = aras.newItem('Property');
	aras.setItemProperty(levelProp, 'name', 'level');
	aras.setItemProperty(levelProp, 'sort_order', 2);
	aras.setItemProperty(levelProp, 'label', 'Level');
	aras.setItemProperty(levelProp, 'column_width', 236);
	additionalRelatedVisibleProps.push(levelProp);

	return XClassRelationshipsGrid.superclass.computeColWidhtOrder(
		additionalRelatedVisibleProps
	);
};

XClassRelationshipsGrid.prototype.onXmlLoaded = function () {
	if (!isGridSortingDefined) {
		sortPriority = [
			{
				colNum: grid.getColumnIndex('sort_order_R'),
				order_by: 0,
				priority: 0
			}
		];
		sortRowByDefault();
		isGridSortingDefined = true;
	}
	grid.sort();

	if (isToolbarUsed) {
		updateToolbar();
	}

	updateDirtyRows();

	if (redlineController.isRedlineActive) {
		redlineController.RefreshRedlineView();
	}
};

XClassRelationshipsGrid.prototype.onSelectItem = function (
	rowId,
	col,
	generateEvent,
	processAllSelected,
	loadItemFromServer
) {
	if (
		!window.item.selectSingleNode("Relationships/Item[@id='" + rowId + "']")
	) {
		updateControls(rowId);
		return;
	}
	return XClassRelationshipsGrid.superclass.onSelectItem(
		rowId,
		col,
		generateEvent,
		processAllSelected,
		loadItemFromServer
	);
};

XClassRelationshipsGrid.prototype.onDoubleClick = function (rowId) {
	if (
		!window.item.selectSingleNode("Relationships/Item[@id='" + rowId + "']")
	) {
		return;
	}
	return XClassRelationshipsGrid.superclass.onDoubleClick(rowId);
};

XClassRelationshipsGrid.prototype.syncWithClient = function (resDom) {
	XClassRelationshipsGrid.superclass.syncWithClient(resDom);
	var res = resDom.selectSingleNode(aras.XPathResult());
	this.addInheritedRelationships(res);
	this.doSortByInheritance(res);
};

XClassRelationshipsGrid.prototype.doSortByInheritance = function (res) {
	var xProps = res.selectNodes(
		"Item[@type='xClass_xPropertyDefinition' and (not(@action) or @action != 'delete')]"
	);
	var deletedXProps = res.selectNodes(
		"Item[@type='xClass_xPropertyDefinition' and @action = 'delete']"
	);

	var propIdToSort = xPropertiesUtils.getSortOrderForProperties(
		item,
		window.parent.xClassTreeItem,
		xProps,
		deletedXProps
	);
	Array.prototype.forEach.call(xProps, function (xProp) {
		var id = aras.getItemProperty(xProp, 'id');
		aras.setItemProperty(
			xProp.selectSingleNode('related_id/Item'),
			'sort_order',
			propIdToSort[id] + 1
		);
	});
};

XClassRelationshipsGrid.prototype.addInheritedRelationships = function (res) {
	var parentClassesChain = xPropertiesUtils.getParentClassesChain(
		item,
		window.parent.xClassTreeItem
	);
	var parentChainIds = parentClassesChain.map(function (xClass) {
		return aras.getItemProperty(xClass, 'id');
	});

	var ownProps = res.selectNodes("Item[@type='xClass_xPropertyDefinition']");
	var path = this.generateXPropertyLevel(item);
	Array.prototype.forEach.call(ownProps, function (relship) {
		aras.setItemProperty(
			relship.selectSingleNode('related_id/Item'),
			'level',
			path
		);
	});

	if (
		parentChainIds.length > 0 &&
		window.parent &&
		window.parent.xClassTreeItem
	) {
		parentClassesChain.forEach(function (xClass) {
			var rels = xClass.selectNodes(
				"Relationships/Item[@type='xClass_xPropertyDefinition']"
			);
			if (rels.length === 0) {
				rels =
					aras.getItemRelationships(
						'xClass',
						aras.getItemProperty(xClass, 'id'),
						'xClass_xPropertyDefinition'
					) || [];
			}
			var path = this.generateXPropertyLevel(xClass);
			Array.prototype.forEach.call(rels, function (relship) {
				var clone = relship.cloneNode(true);
				aras.setItemProperty(clone, 'source_id', item);
				aras.setItemProperty(
					clone.selectSingleNode('related_id/Item'),
					'level',
					path
				);
				res.appendChild(clone);
			});
		}, this);

		var query = aras.newIOMItem('xClass_xPropertyDefinition', 'get');
		aras.setItemProperty(query.node, 'source_id', parentChainIds.join(','));
		aras.setItemPropertyAttribute(query.node, 'source_id', 'condition', 'in');
		query = query.apply();

		if (query.nodeList || query.node) {
			Array.prototype.forEach.call(query.nodeList || [query.node], function (
				relship
			) {
				if (
					!res.selectSingleNode(
						"Item[@id='" + aras.getItemProperty(relship, 'id') + "']"
					)
				) {
					aras.setItemProperty(relship, 'source_id', item);
					res.appendChild(relship);
				}
			});
		}
	}
};

XClassRelationshipsGrid.prototype.updateControls = function (
	rowId,
	doRepaint,
	relFiles,
	relatedFiles
) {
	XClassRelationshipsGrid.superclass.updateControls(
		rowId,
		doRepaint,
		relFiles,
		relatedFiles
	);
	var ids = grid.getSelectedItemIds();
	var ownDefinition = true;
	if (isToolbarUsed && ids.length > 1) {
		setControlEnabled('move_up', false);
		setControlEnabled('move_down', false);
	} else {
		var selectedItem = item.selectSingleNode(
			'Relationships/Item[@id="' + rowId + '"]'
		);
		if (!selectedItem) {
			selectedItem = currQryItem.result.selectSingleNode(
				'Item[@id="' + rowId + '"]'
			);
			ownDefinition = false;
		}
		if (selectedItem) {
			setControlEnabled('show_item', true);
			var isReorderingPossible = this.checkReorderingPossible();
			setControlEnabled('move_up', isReorderingPossible.up);
			setControlEnabled('move_down', isReorderingPossible.down);
		} else {
			setControlEnabled('move_up', false);
			setControlEnabled('move_down', false);
		}

		if (ownDefinition === false) {
			setControlEnabled('show_item', true);
			setControlEnabled('new', false);
		} else {
			setControlEnabled('new', true);
		}
	}
	setControlEnabled('pick_replace', false);
};

XClassRelationshipsGrid.prototype.isSpecialItemType = function () {
	return false;
};

XClassRelationshipsGrid.prototype.getUnlockFlg = function () {
	return false;
};

XClassRelationshipsGrid.prototype.computeCorrectControlState = function (
	controlName,
	arg1,
	relFiles,
	relatedFiles
) {
	if (controlName === 'lock') {
		return false;
	}

	var ownDefinition = true;
	var ids = grid.getSelectedItemIds();
	if (ids.length === 1) {
		var selectedItem = item.selectSingleNode(
			'Relationships/Item[@id="' + ids[0] + '"]'
		);
		if (!selectedItem) {
			selectedItem = currQryItem.result.selectSingleNode(
				'Item[@id="' + ids[0] + '"]'
			);
			ownDefinition = false;
		}
		if (!ownDefinition) {
			if (controlName === 'show_item') {
				return true;
			}
			if (controlName === 'new') {
				return false;
			}
		}
	}

	return XClassRelationshipsGrid.superclass.computeCorrectControlState(
		controlName,
		arg1,
		relFiles,
		relatedFiles
	);
};

XClassRelationshipsGrid.prototype.generateXPropertyLevel = function (
	xClassItem
) {
	var parentClassesChain = xPropertiesUtils.getParentClassesChain(
		item,
		window.parent.xClassTreeItem
	);
	var parentChainIds = parentClassesChain.map(function (xClass) {
		return aras.getItemProperty(xClass, 'id');
	});
	var sourceXClassId = aras.getItemProperty(xClassItem, 'id');
	var idx = parentChainIds.slice().reverse().indexOf(sourceXClassId);
	var slicedIdx;
	if (idx > -1) {
		slicedIdx = idx + 1;
	} else {
		slicedIdx = parentChainIds.length;
	}
	var path = parentClassesChain
		.slice()
		.reverse()
		.slice(0, slicedIdx)
		.reduce(function (prev, curr) {
			return prev + '\\' + aras.getItemProperty(curr, 'name');
		}, '');
	if (item === xClassItem) {
		path += '\\' + aras.getItemProperty(item, 'name');
	}
	return path.slice(1);
};

XClassRelationshipsGrid.prototype.canEditCell = function (
	readonly,
	isEditMode,
	isDescBy,
	propInfo,
	lockedStatusStr,
	hasRelatedItem,
	isTemp,
	hasEditState,
	rowId,
	cellIndex
) {
	const columnName = grid.GetColumnName(
		grid.grid_Experimental.order[cellIndex]
	);
	if (isEditMode && isXPropertyBelongXClass(columnName, rowId)) {
		if (this._editableColumns.indexOf(columnName) > -1) {
			return true;
		} else if (this.xPropertyOverride.isOverrideCell(columnName)) {
			const cell = this.xPropertyOverride.getCell(rowId, columnName);
			return cell.isOverride;
		}
	}
	return false;
};

XClassRelationshipsGrid.prototype.getPropsForColumnDialog = function () {
	const propsToShow = XClassRelationshipsGrid.superclass.getPropsForColumnDialog();
	return propsToShow.filter(function (prop) {
		const colName = grid.GetColumnName(prop.colNumber);
		// dnd column has empty label to show in relgrid header
		// need to set clear value of Label for dnd column here to show in column insert dialog
		if (colName === 'dnd_R') {
			prop.label = aras.getResource(
				'../Modules/aras.innovator.ExtendedClassification/',
				'classEditor.grid.dnd_label'
			);
			return true;
		}
		const DRL = colName.slice(colName.length - 1);
		return (
			colName !== 'L' &&
			(DRL === 'R' || this._editableColumns.indexOf(colName) !== -1)
		);
	}, this);
};

function isXPropertyBelongXClass(field, rowId) {
	const col = fieldsArr.indexOf(field);
	const dlr = propsArr[col].DRL;
	let itm;
	if (dlr === 'D') {
		itm = item.selectSingleNode('Relationships/Item[@id="' + rowId + '"]');
	} else if (dlr === 'R') {
		itm = item.selectSingleNode(
			'Relationships/Item[@id="' + rowId + '"]/related_id/Item'
		);
	}

	return !!itm;
}
