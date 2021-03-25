(function () {
	var xClassEditorTree = {};
	var xClassIT;
	var xClassIcon;
	var insertSubLabel;
	var renameLabel;
	var solutionName = '../Modules/aras.innovator.ExtendedClassification/';
	var toolbarApplet;
	var searchToolbarApplet;

	function XControlNav() {
		const self = ArasModules.utils.extendHTMLElement.call(this);
		this.init.call(self);
		self.formatter = this.formatter;
		return self;
	}

	XControlNav.prototype = {
		constructor: Nav.prototype.constructor,
		init: function () {
			this.dom = this;
			this._renderingPromise = null;
			this._lastAnimation = null;
			this.dataStore = {
				roots: null, // <Set>
				items: null // <Map>
			};
			this.selectedItemKey = null;
			this.expandedItemsKeys = new Set();
			this.templates = NavTemplates(this);
			var self = this;
			this.dom.addEventListener('click', function (event) {
				if (event.target.closest('.aras-nav__icon')) {
					var itemKey = self._getKeyByDomElement(event.target);
					self._toggleItemExpansion(itemKey);
				}
			});
		},
		formatter: function (nodeInfo) {
			const item = nodeInfo.value;

			if (!item.isMarked) {
				return null;
			}

			const defaultTemplate = this.templates.getDefaultTemplate(nodeInfo);
			const searchText = item.searchText;
			const startIndex = item.label.toLowerCase().indexOf(searchText);
			const endIndex = startIndex + searchText.length;
			const markedText = item.label.slice(startIndex, endIndex);
			const markNode = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('mark'),
				'mark',
				item.isFocused ? 'focused' : null,
				Inferno.createTextVNode(markedText),
				ArasModules.utils.infernoFlags.hasVNodeChildren
			);

			const labelNode = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				'aras-nav__label',
				[
					Inferno.createTextVNode(item.label.slice(0, startIndex)),
					markNode,
					Inferno.createTextVNode(item.label.slice(endIndex))
				],
				ArasModules.utils.infernoFlags.hasKeyedChildren
			);

			defaultTemplate[2] = labelNode;

			return defaultTemplate;
		}
	};

	var showDialog = function (item, title) {
		if (!item) {
			item = aras.newIOMItem('xClass', 'add');
		}
		var formId;
		var formDisplay;
		var formNd;
		var formHeight;
		var formWidth;
		var showDialogResult;

		formId = '68876D7C2E1A43199D73AD04AB96A2D4';
		formDisplay = this.aras.getFormForDisplay(formId);
		formNd = formDisplay.node;
		formHeight = 170;
		formWidth = 255;
		var dialogParams = {
			title: title,
			aras: aras,
			isEditMode: true,
			editType: 'edit',
			formNd: formNd,
			item: item,
			dialogWidth: formWidth,
			dialogHeight: formHeight,
			resizable: true,
			content: 'ShowFormAsADialog.html',
			buttonClickHandler: function (action) {
				if (action === 'save') {
					var name = aras.getItemProperty(item.node, 'name');
					if (!name) {
						aras.AlertWarning(
							aras.getResource(
								'../Modules/aras.innovator.ExtendedClassification/',
								'classEditor.tree.dialog.nameRequired'
							)
						);
						return;
					}
					showDialogResult.close(item.node);
				} else {
					showDialogResult.close();
				}
			}
		};

		showDialogResult = ArasModules.Dialog.show('iframe', dialogParams);
		return showDialogResult.promise;
	};

	xClassEditorTree.xClassMethods = {
		remove: function (rowId) {
			var rowObj = xClassEditorTree.tree.data.get(rowId);

			var parentToChildIds = {};
			var hierarchy = JSON.parse(
				aras.getItemProperty(xClassEditorTree.item, 'classification_hierarchy')
			);
			hierarchy.forEach(function (edge) {
				if (!parentToChildIds[edge.fromRefId]) {
					parentToChildIds[edge.fromRefId] = [];
				}
				parentToChildIds[edge.fromRefId].push(edge.toRefId);
			});

			var getAllChilds = function (id) {
				var ids = [id];
				if (parentToChildIds[id] && parentToChildIds[id].length > 0) {
					parentToChildIds[id].forEach(function (childId) {
						ids = ids.concat(getAllChilds(childId));
					});
				}
				return ids;
			};
			var idsToDelete = getAllChilds(rowId);

			var relships = xClassEditorTree.item.selectNodes(
				"Relationships/Item[@id='" + idsToDelete.join("' or @id='") + "']"
			);
			Array.prototype.forEach.call(relships, function (relship) {
				if (relship.getAttribute('action') === 'add') {
					relship.parentNode.removeChild(relship);
				} else {
					relship.setAttribute('action', 'delete');
				}
			});

			var invalidatedHierarchy = hierarchy.reduce(function (prev, current) {
				if (idsToDelete.indexOf(current.toRefId) === -1) {
					prev.push(current);
				}
				return prev;
			}, []);
			aras.setItemProperty(
				xClassEditorTree.item,
				'classification_hierarchy',
				JSON.stringify(invalidatedHierarchy)
			);
			var parentObj = xClassEditorTree.tree.data.get(rowObj.parentId);
			parentObj.children.splice(parentObj.children.indexOf(rowId), 1);
			if (parentObj.children.length === 0) {
				parentObj.children = null;
			}
			xClassEditorTree.tree.data.set(rowObj.parentId, parentObj);
			xClassEditorTree.item.setAttribute('isDirty', '1');

			xClassEditorTree.tree.data.delete(rowId);
			xClassEditorTree.tree.render();
			xClassEditorTree.onDeleteNode(
				rowId,
				xClassEditorTree.item.selectSingleNode(
					'Relationships/Item[ref_id="' + rowObj.parentId + '"]'
				)
			);
		},
		rename: function (rowId, item, relship) {
			var rowObj = xClassEditorTree.tree.data.get(rowId);
			if (item) {
				var currentAction = relship.getAttribute('action');
				if (currentAction !== 'add' && currentAction !== 'delete') {
					relship.setAttribute('action', 'update');
				}
				var langLabels = item.selectNodes(
					"*[local-name()='label' and namespace-uri()='" +
						aras.translationXMLNsURI +
						"']"
				);
				Array.prototype.forEach.call(langLabels, function (node) {
					aras.setNodeTranslationElement(
						relship,
						'label',
						node.text,
						node.getAttribute('xml:lang')
					);
				});
				aras.setItemProperty(
					relship,
					'name',
					aras.getItemProperty(item, 'name')
				);
				aras.setItemProperty(
					relship,
					'label',
					aras.getItemProperty(item, 'label')
				);
				if (!rowObj.parentId) {
					aras.setItemProperty(
						window.item,
						'name',
						aras.getItemProperty(item, 'name')
					);
					var oldLabels = window.item.selectNodes("./*[name()='i18n:label']");
					Array.prototype.forEach.call(oldLabels, function (oldLabel) {
						oldLabel.parentNode.removeChild(oldLabel);
					});
					aras.setItemProperty(
						window.item,
						'label',
						aras.getItemProperty(item, 'label')
					);
					var labels = item.selectNodes("./*[name()='i18n:label']");
					Array.prototype.forEach.call(labels, function (label) {
						window.item.appendChild(label);
					});
				}

				xClassEditorTree.item.setAttribute('isDirty', '1');
				rowObj.label =
					aras.getItemProperty(relship, 'label') ||
					aras.getItemProperty(relship, 'name');
				xClassEditorTree.tree.data.set(rowId, rowObj);
				xClassEditorTree.tree.render();
			}
		},
		insert: function (rowId, item) {
			if (item) {
				var id = aras.getItemProperty(item, 'id');
				item.setAttribute('action', 'add');
				aras.setItemProperty(item, 'ref_id', id);
				xClassEditorTree.item
					.selectSingleNode('Relationships')
					.appendChild(item);

				var rowObj = {
					label:
						aras.getItemProperty(item, 'label') ||
						aras.getItemProperty(item, 'name'),
					icon: xClassIcon,
					xClassId: id,
					parentId: rowId
				};

				var hierarchy = JSON.parse(
					aras.getItemProperty(
						xClassEditorTree.item,
						'classification_hierarchy'
					)
				);
				hierarchy.push({
					fromRefId: rowId,
					toRefId: id
				});
				aras.setItemProperty(
					xClassEditorTree.item,
					'classification_hierarchy',
					JSON.stringify(hierarchy)
				);
				xClassEditorTree.item.setAttribute('isDirty', '1');

				xClassEditorTree.tree.data.set(id, rowObj);
				var parentObj = xClassEditorTree.tree.data.get(rowId);
				if (!parentObj.children) {
					parentObj.children = [];
				}
				parentObj.children.push(id);
				xClassEditorTree.tree.data.set(rowId, parentObj);
				xClassEditorTree.tree.expand(rowId);
				return xClassEditorTree.tree.render();
			}
		}
	};

	var contextItemHandler = function (menuItemId, e, rowId) {
		switch (menuItemId) {
			case 'Insert':
				const startTooltipDialog = function () {
					require([
						'ExtendedClassification/scripts/xClassTooltipDialog'
					], function (xClassTooltipDialog) {
						xClassTooltipDialog.show(newItem, newRowId).then(function (item) {
							if (item) {
								xClassEditorTree.xClassMethods.rename(
									newRowId,
									item,
									newItem.node
								);
							} else {
								xClassEditorTree.xClassMethods.remove(newRowId);
							}
							searchMethods.updateSearch();
						});
					});
				};

				const animationEndHandler = function () {
					startTooltipDialog();
					animationTarget.removeEventListener(
						'transitionend',
						animationEndHandler
					);
					waitAnimation = false;
				};

				const newItem = aras.newIOMItem('xClass', 'add');
				const newRowId = aras.getItemProperty(newItem.node, 'id');

				const targetNode = xClassEditorTree.tree.dom.querySelector(
					"[data-key='" + rowId + "']"
				);
				const animationTarget = targetNode.lastElementChild;
				let waitAnimation = false;
				if (animationTarget.tagName === 'UL') {
					waitAnimation = true;
					animationTarget.addEventListener(
						'transitionend',
						animationEndHandler
					);
				}

				xClassEditorTree.xClassMethods
					.insert(rowId, newItem.node)
					.then(function () {
						if (!waitAnimation) {
							startTooltipDialog();
						}
					});
				break;
			case 'Rename':
				var rowObj = xClassEditorTree.tree.data.get(rowId);
				const relship = xClassEditorTree.item.selectSingleNode(
					"Relationships/Item[@id='" + rowObj.xClassId + "']"
				);
				var backup = relship.xml;
				var iomItem = aras.newIOMItem('xClass');
				iomItem.loadAML(relship.xml);

				require([
					'ExtendedClassification/scripts/xClassTooltipDialog'
				], function (xClassTooltipDialog) {
					xClassTooltipDialog.show(iomItem, rowId).then(function (item) {
						if (item) {
							xClassEditorTree.xClassMethods.rename(rowId, item, relship);
						} else {
							iomItem.loadAML(backup);
							relship.parentNode.replaceChild(iomItem.node, relship);
						}
						searchMethods.updateSearch();
					});
				});
				break;
			case 'Delete':
				xClassEditorTree.xClassMethods.remove(rowId);
				searchMethods.updateSearch();
				break;
		}
	};

	var contextMenu;
	var rootContextMenu;
	var addContextMenu = function () {
		contextMenu = new ArasModules.ContextMenu();
		rootContextMenu = new ArasModules.ContextMenu();
		xClassEditorTree.contextMenus = [rootContextMenu, contextMenu];
		contextMenu.on('click', contextItemHandler);
		rootContextMenu.on('click', contextItemHandler);
		var rootMenuData = {
			Insert: {
				label: insertSubLabel
			}
		};
		var menuData = Object.assign({}, rootMenuData, {
			Rename: {
				label: renameLabel
			},
			EmptyLine: {},
			Delete: {
				label: aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification/',
					'classEditor.tree.context_menu.delete'
				)
			}
		});
		contextMenu.applyData(menuData);
		rootContextMenu.applyData(rootMenuData);
	};

	var contextMenuHandler = function (rowId, e) {
		e.preventDefault();
		e.stopPropagation();

		if (window.isEditMode) {
			xClassEditorTree.showContextMenu(rowId, { x: e.clientX, y: e.clientY });
		}
	};

	xClassEditorTree.showContextMenu = function (rowId, coords) {
		const rowObj = xClassEditorTree.tree.data.get(rowId);
		const menu = rowObj.parentId ? contextMenu : rootContextMenu;
		return menu.show(coords, rowId);
	};

	xClassEditorTree.selectItem = function (menuItemId) {
		var itemObj = xClassEditorTree.tree.data.get(menuItemId);
		xClassEditorTree.tree.select(menuItemId);
		xClassEditorTree.onSelectNode(itemObj.xClassId);
		xClassEditorTree.disableButtonsToolbar();
	};

	var addHandlersToTree = function (tree) {
		tree.on('contextmenu', contextMenuHandler, 'row');
		tree.on(
			'click',
			function (menuItemId, e) {
				if (!e.target.closest('.aras-nav__icon')) {
					xClassEditorTree.selectItem(menuItemId);
				}
			},
			'row'
		);
	};

	var loadDataToTree = function (tree, data) {
		if (data) {
			tree.data = data.rows;
			tree.roots = data.roots;
		}
	};

	xClassEditorTree.prepareDataForTree = function (item) {
		var relationships = item.selectNodes(
			'Relationships/Item[@type="xClass" and not(@action="delete")]'
		);
		if (relationships.length === 0) {
			return;
		}
		var hierarchy = aras.getItemProperty(item, 'classification_hierarchy');
		if (!hierarchy) {
			return;
		}
		var treeStructure = JSON.parse(hierarchy);
		var edges = {};
		treeStructure.forEach(function (edge) {
			var from = edge.fromRefId || 'roots';
			var to = edge.toRefId;
			if (!edges[from]) {
				edges[from] = [];
			}
			edges[from].push(to);
		});
		var childToParents = {};

		var rows = new Map();
		var roots = new Set(edges.roots);
		Array.prototype.forEach.call(relationships, function (xClass) {
			var id = aras.getItemProperty(xClass, 'id');
			var refId = aras.getItemProperty(xClass, 'ref_id');
			var rowObj = {
				label:
					aras.getItemProperty(xClass, 'label') ||
					aras.getItemProperty(xClass, 'name'),
				icon: xClassIcon,
				xClassId: id
			};
			if (edges[refId] && edges[refId].length > 0) {
				rowObj.children = edges[refId];
				rowObj.children.forEach(function (childId) {
					childToParents[childId] = refId;
				});
			}

			rows.set(refId, rowObj);
		});
		rows.forEach(function (rowObj, refId) {
			if (childToParents[refId]) {
				rowObj.parentId = childToParents[refId];
			}
		});
		return {
			rows: rows,
			roots: roots
		};
	};

	var initToolbar = function () {
		var toolbarId = 'toolbar_xClass';
		if (!toolbarApplet) {
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Public.ToolBar',
				{ id: toolbarId, connectId: 'xClassTreeToolbar' },
				function (toolbar) {
					toolbarApplet = toolbar;
					var contextParams = {
						locationName: 'xTreeEditorToolbar_Main',
						itemID: itemID,
						itemType: itemType
					};
					contextParams.items = topWindow.cui.dataLoader.loadCommandBar(
						contextParams.locationName,
						contextParams
					);
					contextParams.toolbarApplet = toolbar;
					contextParams.toolbarId = toolbarId;

					topWindow.cui
						.loadToolbarFromCommandBarsAsync(contextParams)
						.then(function () {
							topWindow.cui.initToolbarEvents(toolbar);
							toolbar.showToolbar(toolbarId);
							xClassEditorTree.disableButtonsToolbar();
						});
				}
			);
		}
	};

	xClassEditorTree.init = function (node, xmlData) {
		insertSubLabel = aras.getResource(
			solutionName,
			'classEditor.tree.dialog.insert_sub'
		);
		renameLabel = aras.getResource(
			solutionName,
			'classEditor.tree.context_menu.rename'
		);
		xClassIT = aras.getItemTypeForClient('xClass', 'name');
		xClassIcon =
			xClassIT.getProperty('large_icon') ||
			xClassIT.getProperty('small_icon') ||
			'../images/DefaultItemType.svg';
		if (!xClassEditorTree.tree) {
			xClassEditorTree.item = xmlData;
			xClassEditorTree.tree = new XControlNav();
			node.appendChild(xClassEditorTree.tree);
			addHandlersToTree(xClassEditorTree.tree);
			addContextMenu(node);
		}
		var convertedData = xClassEditorTree.prepareDataForTree(xmlData);
		loadDataToTree(xClassEditorTree.tree, convertedData);
		initToolbar();
	};

	xClassEditorTree.disableButtonsToolbar = function () {
		const mainToolbar = xClassEditorTree.getMainToolbar();
		if (!mainToolbar) {
			return;
		}
		var isLockedTree = aras.isLocked(xClassEditorTree.item);
		var isSpecificButton = function (btnName, action) {
			return btnName.indexOf('_' + action) > -1;
		};
		var btns = mainToolbar
			.GetItemIds_Experimental(';')
			.split(';')
			.filter(function (btnName) {
				return (
					isSpecificButton(btnName, 'Add') ||
					isSpecificButton(btnName, 'Edit') ||
					isSpecificButton(btnName, 'Delete')
				);
			});
		var treeElements = xClassEditorTree.tree;
		var isRootElement = treeElements.dataStore.roots.has(
			treeElements.selectedItemKey
		);

		btns.forEach(function (btnName) {
			var btn = mainToolbar.getElement(btnName);
			if (btn) {
				var isEnabled = btn.GetEnabled();
				if (isLockedTree) {
					if (isRootElement && !isSpecificButton(btnName, 'Add')) {
						btn.Disable();
					} else if (!isEnabled) {
						btn.Enable();
					}
				} else if (isEnabled) {
					btn.Disable();
				}
			}
		});
	};

	xClassEditorTree.getMainToolbar = function () {
		return toolbarApplet;
	};

	xClassEditorTree.extendedItemHandler = function (actionType) {
		contextItemHandler(actionType, null, xClassEditorTree.tree.selectedItemKey);
	};

	var focusClass = 'focused';
	var infernoFlags = ArasModules.utils.infernoFlags;
	var foundedElements;
	var foundedTreeIds;
	var activeIndex;
	var currentFilter;
	var searchInput;
	var foundOfNode;
	var clearSearchNode;
	var searchRightBlock;
	var searchMethods = {
		initSearchInput: function (toolbarId) {
			var toolbarNode = document.getElementById(toolbarId);
			searchInput = toolbarNode && toolbarNode.querySelector('input');
			if (searchInput) {
				searchInput.addEventListener('keypress', function (event) {
					if (event.keyCode === 13) {
						xClassEditorTree.findNext(true);
					}
				});

				searchInput.placeholder = aras.getResource(
					solutionName,
					'classEditor.tree.search.input_placeholder'
				);
				searchInput.parentNode.style.display = 'inline-flex';
				searchInput.parentNode.style.width = '100%';
			}
		},
		isValidSearch: function (searchText) {
			return searchText;
		},
		doSearch: function () {
			foundedElements = [];
			foundedTreeIds = [];
			var orderedItemsTree = [];
			xClassEditorTree.tree.roots.forEach(function (rootId) {
				Array.prototype.push.apply(
					orderedItemsTree,
					searchMethods.getOrderedChilds(rootId)
				);
			});
			orderedItemsTree.forEach(function (item, key) {
				if (
					!item.isMarked &&
					item.label.toLowerCase().indexOf(currentFilter) > -1
				) {
					foundedElements.push(item);
					foundedTreeIds.push(key);
					searchMethods.markElement(item, currentFilter);
				} else if (item.isMarked) {
					// marked element
					foundedElements.push(item);
					foundedTreeIds.push(key);
				}
			});
		},
		getOrderedChilds: function (itemId) {
			var item = xClassEditorTree.tree.data.get(itemId);
			var childItems = [item];
			if (item && item.children) {
				item.children.forEach(function (childId) {
					Array.prototype.push.apply(
						childItems,
						searchMethods.getOrderedChilds(childId)
					);
				});
			}
			return childItems;
		},
		updateSearch: function () {
			if (searchMethods.isValidSearch(currentFilter)) {
				searchMethods.doSearch();
				searchMethods.updateFoundOf();
			}
		},
		markElement: function (item, searchText) {
			if (!item.label) {
				return;
			}
			item.isMarked = true;
			item.searchText = searchText;
		},
		focusElement: function (item, isFocused) {
			if (!item || !item.isMarked) {
				return;
			}

			item.isFocused = isFocused;
			if (isFocused) {
				searchMethods.expandedTreeToElement(item);
			}
		},
		scrollToFocusedElement: function () {
			var tree = xClassEditorTree.tree.dom;
			var verticalOffset = 50;
			var itemNode = tree.querySelector('.' + focusClass);
			if (!tree || !itemNode) {
				return;
			}

			if (tree.scrollTop + tree.offsetHeight < itemNode.offsetTop) {
				tree.scrollTop =
					itemNode.offsetTop - tree.offsetHeight + verticalOffset;
			} else if (tree.scrollTop > itemNode.offsetTop) {
				tree.scrollTop = itemNode.offsetTop - verticalOffset;
			}
		},
		expandedTreeToElement: function (item) {
			if (!item && !item.parentId) {
				return;
			}

			if (xClassEditorTree.tree.expandedItemsKeys.has(item.parentId)) {
				var parentItem = xClassEditorTree.tree.data.get(item.parentId);
				searchMethods.expandedTreeToElement(parentItem);
			} else {
				xClassEditorTree.tree.expand(item.parentId, true);
			}
		},
		showRightBlock: function () {
			if (!searchRightBlock) {
				searchMethods.initSearchBlock();
			}
			if (searchInput && !searchRightBlock.isConnected) {
				searchInput.parentElement.appendChild(searchRightBlock);
			}

			searchMethods.updateFoundOf();
		},
		initSearchBlock: function () {
			searchRightBlock = document.createElement('span');
			var styles = {
				'padding-left': '5px',
				'font-size': '12px',
				color: '#808080',
				'font-family': 'tahoma'
			};
			Object.assign(searchRightBlock.style, styles);
			searchMethods.initFoundOf();
			searchMethods.initSearchClear();
			searchMethods.searchBlockRender();
		},
		searchBlockRender: function () {
			var style = {
				display: 'inline-flex'
			};
			var childrens = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('div'),
				'div',
				null,
				[foundOfNode, clearSearchNode],
				ArasModules.utils.infernoFlags.hasNonKeyedChildren,
				{
					style: style
				}
			);
			Inferno.render(childrens, searchRightBlock);
		},
		initFoundOf: function () {
			foundOfNode = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				null,
				aras.getResource(
					solutionName,
					'classEditor.tree.search.found_of_matches',
					activeIndex + 1,
					foundedElements.length
				),
				ArasModules.utils.infernoFlags.hasTextChildren
			);
		},
		initSearchClear: function () {
			var styles = {
				'margin-left': '2px',
				height: '16px',
				width: '16px',
				'background-image': 'url(../images/Close.svg)',
				'background-repeat': 'no-repeat',
				cursor: 'pointer'
			};
			clearSearchNode = Inferno.createVNode(
				Inferno.getFlagsForElementVnode('span'),
				'span',
				null,
				null,
				ArasModules.utils.infernoFlags.hasInvalidChildren,
				{
					style: styles,
					onClick: function () {
						xClassEditorTree.clearSearchData(true);
					}
				}
			);
		},
		updateFoundOf: function () {
			foundOfNode.children = aras.getResource(
				solutionName,
				'classEditor.tree.search.found_of_matches',
				activeIndex + 1,
				foundedElements.length
			);
			searchMethods.searchBlockRender();
		},
		unmarkElements: function () {
			if (!foundedElements) {
				return;
			}
			foundedElements.forEach(function (item) {
				item.isMarked = false;
				item.isFocused = false;
				item.searchText = '';
			});
		}
	};

	xClassEditorTree.initSearch = function () {
		var toolbarId = 'toolbar_xClass_find';
		var toolbarOffsetHeight = 30;
		var height =
			xClassEditorTree.tree.dom.parentNode.offsetHeight - toolbarOffsetHeight;
		xClassEditorTree.tree.dom.style.height = height + 'px';
		if (!searchToolbarApplet) {
			clientControlsFactory.createControl(
				'Aras.Client.Controls.Public.ToolBar',
				{ id: toolbarId, connectId: 'xClassTreeToolbar' },
				function (toolbar) {
					searchToolbarApplet = toolbar;
					var contextParams = {
						locationName: 'xTreeEditorToolbar_Search',
						itemID: itemID,
						itemType: itemType
					};
					contextParams.items = topWindow.cui.dataLoader.loadCommandBar(
						contextParams.locationName,
						contextParams
					);
					contextParams.toolbarApplet = toolbar;
					contextParams.toolbarId = toolbarId;

					topWindow.cui
						.loadToolbarFromCommandBarsAsync(contextParams)
						.then(function () {
							topWindow.cui.initToolbarEvents(toolbar);
							toolbar.showToolbar(toolbarId);
							searchMethods.initSearchInput(toolbarId);
						});
				}
			);
		} else {
			var searchToolbarNode = document.getElementById(toolbarId);
			if (!searchToolbarNode) {
				return;
			}
			var hide = 'none';
			var show = 'block';
			if (searchToolbarNode.style.display === hide) {
				searchToolbarNode.style.display = show;
			} else {
				searchToolbarNode.style.display = hide;
				xClassEditorTree.tree.dom.style.height = '';
				xClassEditorTree.clearSearchData(true);
			}
		}
	};

	xClassEditorTree.getSearchValue = function () {
		return searchInput && searchInput.value.toLowerCase();
	};

	xClassEditorTree.findNext = function (isNext) {
		var searchText = xClassEditorTree.getSearchValue();
		if (!searchMethods.isValidSearch(searchText)) {
			return;
		}

		if (searchText !== currentFilter) {
			xClassEditorTree.clearSearchData();
			currentFilter = searchText;
			searchMethods.doSearch();
		}
		if (foundedElements.length > 0) {
			searchMethods.focusElement(foundedElements[activeIndex], false);
			if (isNext) {
				if (activeIndex < foundedElements.length - 1) {
					activeIndex++;
				} else {
					activeIndex = 0;
				}
			} else {
				if (activeIndex > 0) {
					activeIndex--;
				} else {
					activeIndex = foundedElements.length - 1;
				}
			}
			searchMethods.focusElement(foundedElements[activeIndex], true);
		} else {
			activeIndex = -1;
		}

		searchMethods.showRightBlock();
		xClassEditorTree.tree.render().then(searchMethods.scrollToFocusedElement);
	};

	xClassEditorTree.clearSearchData = function (clearNode) {
		activeIndex = -1;
		currentFilter = '';
		searchMethods.unmarkElements();
		if (clearNode) {
			searchInput.value = '';
			if (searchRightBlock && searchRightBlock.parentNode !== null) {
				searchRightBlock.parentNode.removeChild(searchRightBlock);
			}
		}
		xClassEditorTree.tree.render();
	};

	window.xClassEditorTree = xClassEditorTree;
})();
