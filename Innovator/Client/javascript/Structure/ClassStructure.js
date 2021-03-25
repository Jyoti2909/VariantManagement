var classStructure;
var aras = dialogArguments.aras;

function ClassStructureEventHandlerProvider(objectId) {
	this.objectId = objectId;
}

function addToolbarOnKeyUpEventHandler() {
	tearOffMenuController.when('ToolbarInitialized').then(function (toolbar) {
		toolbar._toolbar.on('input', function (itemId, event) {
			const item = toolbar.getItem('filterStructureItemsExpression')
				._item_Experimental;
			if (itemId === item.id) {
				classStructure.Filter(item.value);
			}
		});
	});
}

function InitializeClassStructure() {
	addToolbarOnKeyUpEventHandler();
	const dlgArguments = dialogArguments;
	classStructure.Initialize(
		dlgArguments.dialogType,
		dlgArguments.isEditMode && dlgArguments.dialogType === 'class_structure',
		dlgArguments.item,
		dlgArguments.itemTypeName,
		dlgArguments.class_structure,
		dlgArguments.selectLeafOnly,
		dlgArguments.isRootClassSelectForbidden,
		dlgArguments.expandClassPath
	);
}

function LoadStructureState(stateArray, item) {
	if (stateArray == null) {
		return;
	}

	const childIds = item.children || [];
	const itemKey = item.itemId;
	let containsSelected =
		childIds.indexOf(classStructure.selected) > -1 ? true : false;

	childIds.forEach(function (id) {
		if (LoadStructureState(stateArray, classStructure.data.get(id))) {
			containsSelected = true;
		}
	});

	const state = stateArray[itemKey];
	if (state) {
		if (item.enabled !== state.enabledState) {
			item.enabled = state.enabledState;
		}

		if (state.openedState || containsSelected) {
			classStructure.expandedItemsKeys.add(itemKey);
		} else {
			classStructure.expandedItemsKeys.delete(itemKey);
		}
	}
	return containsSelected;
}

function SaveStructureState(stateArray, item) {
	stateArray[item.itemId] = {
		enabledState: item.enabled,
		openedState: classStructure.expandedItemsKeys.has(item.itemId)
	};
	const childIds = item.children || [];
	childIds.forEach(function (id) {
		SaveStructureState(stateArray, classStructure.data.get(id));
	});
	return stateArray;
}

ClassStructureEventHandlerProvider.prototype = new StructureEventHandlerProvider();

ClassStructureEventHandlerProvider.prototype.OnLoad = function Structure_OnLoad(
	structureContainer
) {
	classStructure = structureContainer;
	InitializeClassStructure();
};

ClassStructureEventHandlerProvider.prototype.OnDbClick = function ClassStructureEventHandlerProvider_OnDbClick(
	itemKey
) {
	const item = classStructure.data.get(itemKey);
	if (!item) {
		return;
	}
	if (
		classStructure.Settings.DialogType === 'class_path' ||
		classStructure.Settings.DialogType === 'classification'
	) {
		if (
			classStructure.Settings.SelectLeafOnly &&
			!classStructure.IsSelectedItemLeaf()
		) {
			aras.AlertError(
				aras.getResource('', 'classstructure.you_may_select_leaf_nodes_only'),
				'',
				'',
				window
			);
			return;
		}
		window.onCloseCommand(classStructure.GetClassPath());
	} else if (
		classStructure.Settings.DialogType === 'class_structure' &&
		classStructure.Settings.IsEditMode &&
		item !== classStructure.getRootItem()
	) {
		classStructure.editedItemKey = itemKey;
		classStructure.render();
	}
};

ClassStructureEventHandlerProvider.prototype.OnMenuClick = function ClassStructureEventHandlerProvider_OnMenuClick(
	menuText,
	selectedItem
) {
	const selectedNode = classStructure.SelectedNode;
	if (!selectedNode || !classStructure.Settings.IsEditMode || !selectedItem) {
		return false;
	}
	const initToolbarHandler = function () {
		const topWindow = aras.getMostTopWindowWithAras(window);
		if (topWindow && topWindow.cui) {
			topWindow.cui.callInitHandlersForToolbar({}, 'UpdateTearOffWindowState');
		}
	};
	let newItem;
	switch (menuText) {
		case 'add':
			newItem = classStructure.AddNode(selectedNode, selectedItem);

			if (newItem) {
				classStructure.expandedItemsKeys.add(selectedItem.itemId);
				classStructure.selectedItemKey = newItem.itemId;
				classStructure.editedItemKey = newItem.itemId;
				initToolbarHandler();
			}
			break;
		case 'remove':
			classStructure.DeleteNode(selectedNode, selectedItem);
			initToolbarHandler();
			break;
		case 'cut':
			classStructure.CutNode(selectedNode, selectedItem);
			initToolbarHandler();
			break;
		case 'paste':
			newItem = classStructure.PasteNode(selectedNode, selectedItem);
			if (newItem) {
				classStructure.expandedItemsKeys.add(selectedItem.itemId);
				classStructure.selectedItemKey = newItem.itemId;
			}
			initToolbarHandler();
			break;
		case 'sort_asc':
			classStructure.sortBranch(selectedItem.itemId, true);
			break;
		case 'sort_dsc':
			classStructure.sortBranch(selectedItem.itemId, false);
			break;
	}
};

(ClassStructureEventHandlerProvider.prototype.OnMenuShow = function ClassStructureEventHandlerProvider_OnMenuShow(
	selectedItem
) {
	if (!classStructure.Settings.IsEditMode || !selectedItem) {
		return false;
	}

	const id = selectedItem.itemId;
	classStructure.SelectedNode = id
		? classStructure.StructureDom.selectSingleNode('//class[@id="' + id + '"]')
		: null;

	const nodeName = aras.EscapeSpecialChars(selectedItem.label);
	const hasChildren = selectedItem.children;
	const isRootNode = selectedItem === classStructure.getRootItem();
	const dataForContextMenu = {};
	const structMenu = classStructure.contexMenu;

	const getContextMenuItem = function (label, disabled, children) {
		return {
			label: label,
			disabled: disabled,
			children: children
		};
	};

	dataForContextMenu['add'] = getContextMenuItem(
		aras.getResource('', 'classstructureframe.add_subclass_to', nodeName)
	);
	dataForContextMenu['remove'] = getContextMenuItem(
		aras.getResource('', 'classstructureframe.remove_subclass', nodeName),
		isRootNode
	);
	dataForContextMenu['cut'] = getContextMenuItem(
		aras.getResource('', 'classstructureframe.cut_subclass'),
		isRootNode
	);
	dataForContextMenu['paste'] = getContextMenuItem(
		aras.getResource('', 'classstructureframe.paste_subclass'),
		classStructure.Clipboard.isEmpty()
	);

	dataForContextMenu['sort'] = getContextMenuItem(
		aras.getResource('', 'classstructureframe.sort'),
		!hasChildren,
		{
			sort_asc: getContextMenuItem(
				aras.getResource('', 'classstructureframe.sort_ascending'),
				!hasChildren
			),
			sort_dsc: getContextMenuItem(
				aras.getResource('', 'classstructureframe.sort_discending'),
				!hasChildren
			)
		}
	);

	structMenu.applyData(dataForContextMenu);
	return true;
}),
	(ClassStructureEventHandlerProvider.prototype.OnNameEdit = function ClassStructureEventHandlerProvider_OnNameEdit(
		editItem,
		newName
	) {
		if (!classStructure.ValidateClassName(newName)) {
			aras.AlertError(
				aras.getResource(
					'',
					'classstructure.node_name_is_invalid_it_contains_illegal_character',
					newName
				),
				'',
				'',
				window
			);
			return false;
		}

		const classId = editItem.itemId;
		const classNode = classStructure.StructureDom.selectSingleNode(
			'//class[@id="' + classId + '"]'
		);
		const oldName = classNode.getAttribute('name');

		if (oldName === newName) {
			return true;
		}

		if (
			!aras.isTempEx(classNode) &&
			!aras.confirm(aras.getResource('', 'classstructure.rename_confirmation'))
		) {
			return false;
		}

		const parentNode = classNode.parentNode;

		if (
			parentNode.selectSingleNode(
				'class[@name=' +
					aras.EscapeXPathStringCriteria(newName) +
					' and @id!=' +
					aras.EscapeXPathStringCriteria(classId) +
					']'
			)
		) {
			editItem.label = oldName;
			aras.AlertError(
				aras.getResource(
					'',
					'classstructure.changenode_name_to_existing_name',
					newName
				),
				'',
				'',
				window
			);
			return false;
		}

		const classPathOld = classStructure.GetClassPath(classNode);
		classNode.setAttribute('name', newName);
		editItem.label = newName;
		const classPathNew = classStructure.GetClassPath(classNode);

		const propsWithNonEmptyClassPath = classStructure.Settings.Item.selectNodes(
			'Relationships/Item[@type="Property" or @type="ItemType Life Cycle" or @type="Can Add"]/class_path'
		);

		let i;
		for (i = 0; i < propsWithNonEmptyClassPath.length; i++) {
			if (
				aras.doesClassPath1StartWithClassPath2(
					propsWithNonEmptyClassPath[i].text,
					classPathOld
				)
			) {
				propsWithNonEmptyClassPath[i].text = propsWithNonEmptyClassPath[
					i
				].text.replace(classPathOld, classPathNew);
				if (!propsWithNonEmptyClassPath[i].parentNode.getAttribute('action')) {
					propsWithNonEmptyClassPath[i].parentNode.setAttribute(
						'action',
						'update'
					);
				}
			}
		}

		const propsWithNonEmptyFromClassification = classStructure.Settings.Item.selectNodes(
			'Relationships/Item[@type="View"]/form_classification'
		);

		for (i = 0; i < propsWithNonEmptyFromClassification.length; i++) {
			if (
				aras.doesClassPath1StartWithClassPath2(
					propsWithNonEmptyFromClassification[i].text,
					classPathOld
				)
			) {
				propsWithNonEmptyFromClassification[
					i
				].text = propsWithNonEmptyFromClassification[i].text.replace(
					classPathOld,
					classPathNew
				);
				if (
					!propsWithNonEmptyFromClassification[i].parentNode.getAttribute(
						'action'
					)
				) {
					propsWithNonEmptyFromClassification[i].parentNode.setAttribute(
						'action',
						'update'
					);
				}
			}
		}
		return true;
	}),
	(ClassStructure.prototype.Initialize = function ClassStructure_Initialize(
		dialogType,
		isEditMode,
		item,
		itemTypeName,
		class_structure,
		selectLeafOnly,
		isRootClassSelectForbidden,
		expandClassPath
	) {
		var classImage,
			itemTypeId = aras.getItemTypeId(itemTypeName),
			itemTypeNode;

		// If itemType isNew, than itemTypeId could be empty.
		if (!itemTypeId) {
			itemTypeNode = aras.getItemByName('ItemType', itemTypeName, 0);
			itemTypeId = aras.getItemProperty(itemTypeNode, 'id');
		} else {
			var currItemType = aras.getItemTypeDictionary(itemTypeName, 'name');
			if (currItemType && currItemType.node) {
				itemTypeNode = currItemType.node;
			}
		}

		classImage = aras.getItemProperty(itemTypeNode, 'open_icon');

		this.Settings = {};
		this.Settings.DialogType = dialogType;
		this.Settings.IsEditMode = isEditMode;
		this.Settings.IsUsedInMetaDataOnStart = false;
		this.Settings.IsUsedInDataOnStart = false;
		this.Settings.Item = item;
		this.Settings.ItemTypeName = itemTypeName;
		this.Settings.ItemTypeId = itemTypeId;
		this.Settings.ClassImage = classImage;
		this.Settings.ClassStructure = class_structure;
		this.Settings.SelectLeafOnly = selectLeafOnly;
		this.Settings.IsRootClassSelectForbidden = isRootClassSelectForbidden;
		this.Settings.IsFirstDeletedNode = true;
		this.Settings.ExpandClassPath = expandClassPath;

		ArasModules.SvgManager.load([classImage]);

		this.Clipboard = new Clipboard();

		this.ClassItemEditQueue = [];

		function isClassStructureUsedInMetaData(itemTypeId) {
			var aml =
				'' +
				'<AML>' +
				"  <Item type='ItemType' id='" +
				itemTypeId +
				"' action='get' select='id,class_structure'>" +
				'    <Relationships>' +
				"      <Item type='Property' action='get' select='class_path'>" +
				'      </Item>' +
				"      <Item type='ItemType Life Cycle' action='get' select='class_path'>" +
				'      </Item>' +
				"      <Item type='View' action='get' select='form_classification'>" +
				'      </Item>' +
				"      <Item type='Can Add' action='get' select='class_path'>" +
				'      </Item>' +
				'    </Relationships>' +
				'  </Item>' +
				'</AML>';
			var resXML = aras.applyAML(aml);

			var metaDataResultDom = aras.createXMLDocument();
			metaDataResultDom.loadXML(resXML);

			var metaDataXpath =
				'Item/Relationships/' +
				"Item[(@type='Property' and class_path and class_path != '') or " +
				"(@type='ItemType Life Cycle' and class_path and class_path != '') or " +
				"(@type='View' and form_classification and form_classification != '') or " +
				"(@type='Can Add' and class_path and class_path != '')]";

			var metaDataNodeList = metaDataResultDom.selectNodes(metaDataXpath);

			return metaDataNodeList.length !== 0;
		}

		function isClassStructureUsedInData(itemTypeId) {
			var aml =
					'' +
					'<AML>' +
					"  <Item typeId='" +
					itemTypeId +
					"' action='get' select='id,classification'>" +
					"    <classification condition='is not null'/>" +
					'  </Item>' +
					'</AML>',
				resXML = aras.applyAML(aml),
				dataResultDom = aras.createXMLDocument(),
				dataXPath = "Item[classification and classification != '']",
				dataNodeList;

			dataResultDom.loadXML(resXML);
			dataNodeList = dataResultDom.selectNodes(dataXPath);

			return dataNodeList.length !== 0;
		}

		if (this.Settings.IsEditMode && !aras.isTempEx(this.Settings.Item)) {
			this.Settings.IsUsedInMetaDataOnStart = isClassStructureUsedInMetaData(
				this.Settings.ItemTypeId
			);
			if (!this.Settings.IsUsedInMetaDataOnStart) {
				this.Settings.IsUsedInDataOnStart = isClassStructureUsedInData(
					this.Settings.ItemTypeId
				);
			} else {
				this.Settings.IsUsedInDataOnStart = true;
			}
		}

		this.StructureDom = aras.createXMLDocument();

		this.StructureDom.loadXML(this.Settings.ClassStructure);
		if (this.StructureDom.parseError.errorCode !== 0) {
			aras.AlertError(
				aras.getResource('', 'common.an_internal_error_has_occured'),
				aras.getResource(
					'',
					'classstructure.malformed_xml',
					this.Settings.ClassStructure
				),
				aras.getResource('', 'common.client_side_err')
			);
			window.onCloseCommand();
		}

		//isTemp attribute is unavailable
		var classNodes = this.StructureDom.selectNodes('//class[@isTemp]');
		for (var i = 0; i < classNodes.length; i++) {
			var classNode = classNodes(i);
			classNode.removeAttribute('isTemp');
		}

		this.AddNode(null, null, this.StructureDom.documentElement);

		this.sortTree(true);

		this.ExpandLevels(2);
		this.expandPath(this.Settings.ExpandClassPath);
	});

ClassStructure.prototype.SetLayout = function ClassStructure_SetLayout(layout) {
	this.getStructureContainer().setLayout(layout);
};

ClassStructure.prototype.IsModified = function ClassStructure_IsModified() {
	return this.Settings.ClassStructure !== this.StructureDom.xml;
};

ClassStructure.prototype.IsSelectedItemLeaf = function ClassStructure_IsSelectedItemLeaf() {
	const selectedItem = this.data.get(this.selected);
	return selectedItem && selectedItem.children == null;
};

ClassStructure.prototype.GetClassPath = function ClassStructure_GetClassPath(
	node
) {
	let classNode = node;
	if (!classNode) {
		const selectedItem = this.data.get(this.selected);
		if (!selectedItem) {
			return null;
		}
		const classId = selectedItem.itemId;
		classNode = this.StructureDom.selectSingleNode(
			'//class[@id="' + classId + '"]'
		);
	}

	let className = classNode.getAttribute('name');
	let res = className;

	while (
		(classNode = classNode.parentNode) &&
		classNode.parentNode &&
		classNode.parentNode.nodeType !== 9
	) {
		//while not root element
		className = classNode.getAttribute('name');
		res = className + '/' + res;
	}

	return res;
};

ClassStructure.prototype.ValidateClassName = function ClassStructure_ValidateClassName(
	name
) {
	name = name.trim();
	if (!name || name.indexOf('/') > -1) {
		return false;
	}

	return true;
};

ClassStructure.prototype.GetImpactData = function ClassStructure_GetImpactData(
	classId,
	type,
	detailed
) {
	return aras.getClassWhereUsed(
		this.Settings.ItemTypeId,
		classId,
		type,
		detailed
	);
};

ClassStructure.prototype.HasMetaReferences = function ClassStructure_HasMetaReferences(
	impactData
) {
	var metaRef = impactData.documentElement.selectNodes(
			'relatedItems/Item[@type="View" or @type="Can Add" or @type="Property" or @type="ItemType Life Cycle"]'
		),
		metaRefCount = metaRef ? metaRef.length : 0;

	return metaRefCount > 0;
};

ClassStructure.prototype.HasDataReferences = function ClassStructure_HasDataReferences(
	impactData
) {
	var dataRef = impactData.documentElement.selectNodes(
			'relatedItems/Item[@type="' + this.Settings.ItemTypeName + '"]'
		),
		dataRefCount = dataRef ? dataRef.length : 0;

	return dataRefCount > 0;
};

ClassStructure.prototype.ExpandLevels = function ClassStructure_ExpandLevels(
	levels
) {
	const rootItemId = this.getRootItem().itemId;
	const self = this;

	function expandRecursive(childs, maxLevels, currentLevel) {
		if (!childs || currentLevel === maxLevels) {
			return;
		}

		childs.forEach(function (child) {
			self.expand(child);
			child = self.data.get(child);
			expandRecursive(child.children, maxLevels, currentLevel + 1);
		});
	}

	expandRecursive([rootItemId], levels, 0);
};

ClassStructure.prototype.AddNode = function ClassStructure_AddNode(
	sourceNode,
	sourceItem,
	relatedNode
) {
	var impactData, sourceNodeId;

	if (!relatedNode) {
		//Add new node
		if (
			(this.Settings.IsUsedInMetaDataOnStart ||
				this.Settings.IsUsedInDataOnStart) &&
			!aras.isTempEx(sourceNode) &&
			this.IsSelectedItemLeaf()
		) {
			sourceNodeId = sourceNode.getAttribute('id');
			impactData = this.GetImpactData(
				sourceNodeId,
				'View,' + this.Settings.ItemTypeName
			);
			if (this.HasMetaReferences(impactData)) {
				this.AlertError(
					aras.getResource('', 'classstructure.view_references_add_alert'),
					window,
					this.Settings.Item,
					sourceNodeId
				);
				return null;
			}

			if (this.HasDataReferences(impactData)) {
				this.AlertError(
					aras.getResource('', 'classstructure.data_references_add_alert'),
					window,
					this.Settings.Item,
					sourceNodeId
				);
			}
		}

		let count = sourceNode.selectNodes('class').length;
		const newID = aras.generateNewGUID();

		const newNd = this.StructureDom.createElement('class');
		let newNm = 'New SubClass (' + count + ')';

		while (
			sourceNode.selectSingleNode(
				'class[@name=' + aras.EscapeXPathStringCriteria(newNm) + ']'
			)
		) {
			++count;
			newNm = 'New SubClass (' + count + ')';
		}

		newNd.setAttribute('id', newID);
		newNd.setAttribute('name', newNm);
		newNd.setAttribute('isTemp', '1');
		sourceNode.appendChild(newNd);

		const newRelatedItem = {
			children: null,
			icon: this.Settings.ClassImage || '',
			itemId: newID,
			label: newNm,
			enabled: true
		};
		if (!sourceItem.children) {
			sourceItem.children = [];
		}
		sourceItem.children.push(newID);

		this.data.set(newID, newRelatedItem);

		return newRelatedItem;
	} else {
		//append class structure
		let relatedItem;
		const relatedItemID = relatedNode.getAttribute('id');

		if (!sourceItem) {
			//append root
			relatedItem = {
				children: null,
				icon: '',
				itemId: '',
				label: this.Settings.ItemTypeName,
				enabled: !(
					this.Settings.SelectLeafOnly ||
					this.Settings.IsRootClassSelectForbidden
				)
			};
			this.roots = new Set([relatedItemID]);
			this.data = new Map();
		} else {
			//append sub nodes
			const relatedName = relatedNode.getAttribute('name');

			if (
				sourceNode.selectSingleNode(
					'class[@name=' +
						aras.EscapeXPathStringCriteria(relatedName) +
						' and @id!=' +
						aras.EscapeXPathStringCriteria(relatedItemID) +
						']'
				)
			) {
				aras.AlertError(
					aras.getResource(
						'',
						'classstructure.changenode_name_to_existing_name',
						relatedName
					)
				);
				return null;
			} else {
				//if element with the same id already exists in childs then just draw class stracture, else that means that element was moved and we have to append it.
				if (
					!sourceNode.selectSingleNode('class[@id="' + relatedItemID + '"]')
				) {
					if (
						this.Settings.IsUsedInMetaDataOnStart &&
						this.IsSelectedItemLeaf()
					) {
						impactData = this.GetImpactData(
							sourceNode.getAttribute('id'),
							'View'
						);
						if (this.HasMetaReferences(impactData)) {
							this.AlertError(
								aras.getResource(
									'',
									'classstructure.view_references_add_alert'
								),
								window,
								this.Settings.Item,
								sourceNode.getAttribute('id')
							);
							return null;
						}
					}

					sourceNode.appendChild(relatedNode);
					//mark node as temp, because it is new in cass structure and can't uses
					relatedNode.setAttribute('isTemp', '1');
				}
			}

			relatedItem = {
				children: null,
				icon: '',
				itemId: '',
				label: relatedName,
				enabled:
					!this.Settings.SelectLeafOnly ||
					relatedNode.getAttribute('enabled') !== '0'
			};
			if (!sourceItem.children) {
				sourceItem.children = [];
			}
			sourceItem.children.push(relatedItemID);
		}

		relatedItem.itemId = relatedItemID;
		if (this.Settings.ClassImage) {
			relatedItem.icon = this.Settings.ClassImage;
		}

		this.data.set(relatedItemID, relatedItem);
		const subClasses = relatedNode.selectNodes('class');
		for (let i = 0; i < subClasses.length; i++) {
			const subClass = subClasses[i];

			//mark node as temp if parent also temp
			if (aras.isTempEx(relatedNode)) {
				subClass.setAttribute('isTemp', '1');
			}

			this.AddNode(relatedNode, relatedItem, subClass);
		}

		return relatedItem;
	}
};

ClassStructure.prototype.DeleteNode = function ClassStructure_DeleteNode(
	deleteNode,
	deleteItem
) {
	if (deleteNode.parentNode.nodeType === 9) {
		return false;
	}

	if (
		(this.Settings.IsUsedInMetaDataOnStart ||
			this.Settings.IsUsedInDataOnStart) &&
		!aras.isTempEx(deleteNode)
	) {
		if (this.Settings.IsFirstDeletedNode) {
			const res = aras.confirm(
				aras.getResource('', 'classstructure.removenode_warning'),
				window
			);
			if (!res) {
				return false;
			}
			this.Settings.IsFirstDeletedNode = false;
		}

		const impactData = this.GetImpactData(deleteNode.getAttribute('id'), null);
		if (this.HasMetaReferences(impactData)) {
			this.AlertError(
				aras.getResource('', 'classstructure.meta_references_delete_alert'),
				window,
				this.Settings.Item,
				deleteNode.getAttribute('id')
			);
			return false;
		} else {
			if (this.HasDataReferences(impactData)) {
				this.AlertError(
					aras.getResource('', 'classstructure.data_references_delete_warning'),
					window,
					this.Settings.Item,
					deleteNode.getAttribute('id')
				);
				return false;
			}
		}
	}

	const deleteItemId = deleteNode.getAttribute('id');
	const parentId = deleteNode.parentNode.getAttribute('id');

	this.deleteItem(deleteItemId, parentId);

	deleteNode.parentNode.removeChild(deleteNode);

	return true;
};

ClassStructure.prototype.CutNode = function ClassStructure_CutNode(
	cutNode,
	cutItem
) {
	const data = {
		CutNode: cutNode
	};

	if (!this.Clipboard.isEmpty()) {
		if (
			!aras.confirm(aras.getResource('', 'classstructure.clipboard_isnotempty'))
		) {
			return;
		}
	}

	if (!this.DeleteNode(cutNode, cutItem)) {
		return;
	}

	this.Clipboard.clear();
	this.Clipboard.copy([data]);
};

ClassStructure.prototype.PasteNode = function ClassStructure_PasteNode(
	sourceNode,
	sourceItem
) {
	const clipboardData = this.Clipboard.paste();
	const node = this.AddNode(sourceNode, sourceItem, clipboardData[0].CutNode);
	if (node) {
		this.Clipboard.clear();
	}

	return node;
};

ClassStructure.prototype.Filter = function ClassStructure_Filter(expression) {
	const rootItem = this.getRootItem();

	if (!expression) {
		LoadStructureState(this.structureItemState, rootItem);
		this.filteredItems = null;
	} else {
		if (!this.filteredItems) {
			// save structure state
			this.structureItemState = SaveStructureState([], rootItem);
			this.expandTree();
		}

		this.filter(expression);
	}
	this.render();
};

ClassStructure.prototype.AlertError = function ClassStructure_AlertError(
	errorMessage,
	argwin,
	itemType,
	classID
) {
	const itemTypeId = aras.getItemProperty(itemType, 'id');
	const rootNode = aras.getClassWhereUsed(itemTypeId, classID, null, true);
	const alertCustomization = {
		copyCustomizator: function (copyButton, message, alertOptions) {
			copyButton.addEventListener(
				'click',
				function () {
					ArasModules.copyTextToBuffer(
						this.text + rootNode.xml,
						this.container
					);
				}.bind({ text: message, container: copyButton.parentElement })
			);
		},

		descriptionCustomizator: function (
			descriptionContainer,
			message,
			alertOptions
		) {
			classReferencesStructure(descriptionContainer, rootNode);
		}
	};
	return ArasModules.Dialog.alert(errorMessage, {
		customization: alertCustomization
	});
};
