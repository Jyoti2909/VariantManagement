/* global define,dojo, treeNodeTemplate */
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/dijit',
	'dijit/tree/ObjectStoreModel',
	'dijit/Tree',
	'CMF/Scripts/AdminPanel/AdminTreeStore',
	'dijit/tree/dndSource',
	'dojo/aspect',
	'CMF/Scripts/AdminPanel/AdminEnum',
	'dijit/Tooltip',
	'dojo/dnd/Manager',
	'dojo/_base/array'
], function (
	declare,
	connect,
	dijit,
	ObjectStoreModel,
	DojoTree,
	adminTreeStore,
	dndSource,
	aspect,
	AdminEnum,
	Tooltip,
	DNDManager,
	dojoArray
) {
	var aras = parent.aras;
	var systemEnums = new AdminEnum();
	return declare(null, {
		tree: null,
		treeStore: null,
		lastSelectedId: null,
		lastDndPosition: null,
		lastBeforeElement: null,

		// args contains store(Memory) and readOnly properties
		constructor: function (connectId, args) {
			adminTreeStore.loadItems(args.store);
			this.treeStore = adminTreeStore;
			var self = this;
			var store = this.treeStore.getMemStore();
			var storeModel = new ObjectStoreModel({
				store: store,
				query: { id: 'root' },
				mayHaveChildren: function (item) {
					return this.store.mayHaveChildren(item);
				},
				getLabel: function (item) {
					return self.getLabel(item, self);
				}
			});

			// function to support DnD
			aspect.around(store, 'put', function (originalPut) {
				return function (obj, options) {
					if (
						obj.element.type === systemEnums.TreeModelType.TabularViewColumn
					) {
						self.dndInsertTabColumn(obj, options, self);
					}

					if (obj.element.type === systemEnums.TreeModelType.ElementType) {
						if (self.lastDndPosition === 'after') {
							options.before = self.lastBeforeElement;
							self.dndInsertElementType(obj, options, true);
						} else {
							self.dndInsertElementType(obj, options, false);
						}
					}
					return originalPut.call(store, obj, options); //empty function
				};
			});

			if (!args.readOnly) {
				this.tree = new DojoTree(
					{
						model: storeModel,
						persist: false,
						onOpenClick: true,
						showRoot: true,
						getIconStyle: function (item, opened) {
							return self.getIconForTreeItem(item, opened);
						},
						betweenThreshold: 5,
						dndController: dndSource,
						checkAcceptance: this.treeCheckAcceptance,
						checkItemAcceptance: this.trgTreeCheckItemAcceptance
					},
					connectId
				);
			} else {
				this.tree = new DojoTree(
					{
						model: storeModel,
						persist: false,
						onOpenClick: true,
						showRoot: true,
						getIconStyle: function (item, opened) {
							return self.getIconForTreeItem(item, opened);
						}
					},
					connectId
				);
			}

			this.tree.startup();
			if (this.tree.dndController) {
				this.tree.dndController.singular = true; // turn off multi select
			}

			//disable browser's menu, e.g., on RMB click.
			this.tree.domNode.addEventListener(
				'contextmenu',
				function (menuEvent) {
					var targetWidget = dijit.getEnclosingWidget(menuEvent.target);
					if (
						targetWidget &&
						targetWidget.declaredClass === 'dijit._TreeNode'
					) {
						tree.selectItem(targetWidget.item._element.id);
					}
					menuEvent.preventDefault();
					menuEvent.stopPropagation();
				},
				false
			);

			connect.connect(this.tree, 'onClick', function (treeItem) {
				self.onNodeSelected(treeItem.element);
			});

			connect.connect(this.tree, '_expandNode', function (node) {
				if (window.isEditMode) {
					// check for warnings
					node.item.removeWarning('innerWarning');
					tree.setWarningIcon(node.item, node.item.getWarning());
					var children = tree.treeStore.dataStore.getChildren(node.item);
					for (var i = 0; i < children.length; i++) {
						var childNode = tree.tree.getNodesByItem(children[i]);
						if (childNode && !childNode[0].isExpanded) {
							var hasInnerWarinigns = tree.treeStore.dataStore.hasChildrenWarnings(
								children[i]
							);
							if (hasInnerWarinigns) {
								children[i].addWarning(
									'innerWarning',
									aras.getResource(
										'../Modules/aras.innovator.CMF/',
										'admin_contain_inner_warnings'
									)
								);
							}
							tree.setWarningIcon(children[i], children[i].getWarning());
						}
					}
				}
			});

			connect.connect(this.tree, '_collapseNode', function (node) {
				if (window.isEditMode) {
					// check for warnings
					var hasChildrenWarning = self.treeStore.dataStore.hasChildrenWarnings(
						node.item
					);
					if (hasChildrenWarning) {
						node.item.addWarning(
							'innerWarning',
							aras.getResource(
								'../Modules/aras.innovator.CMF/',
								'admin_contain_inner_warnings'
							)
						);
					}
					tree.setWarningIcon(node.item, node.item.getWarning());
				}
			});

			// override onMouseMove event to change drag behavior on scroll
			this.tree.dndController.onMouseMove = function (e) {
				if (this.isDragging && this.targetState == 'Disabled') {
					return;
				}
				var m = DNDManager.manager();
				if (this.isDragging) {
					this._onDragMouse(e);
				} else {
					if (
						this.mouseDown &&
						this.isSource &&
						(Math.abs(e.pageX - this._lastX) >= this.dragThreshold ||
							Math.abs(e.pageY - this._lastY) >= this.dragThreshold)
					) {
						var nodes = this.getSelectedTreeNodes();
						if (nodes.length) {
							if (nodes.length > 1) {
								var seen = this.selection;
								var i = 0;
								var r = [];
								var n;
								var p;
								nextitem: while ((n = nodes[i++])) {
									for (
										p = n.getParent();
										p && p !== this.tree;
										p = p.getParent()
									) {
										if (seen[p.id]) {
											//parent is already selected, skip this node
											continue nextitem;
										}
									}
									r.push(n);
								}
								nodes = r;
							}
							nodes = dojoArray.map(nodes, function (n) {
								return n.domNode;
							});

							if (this._lastX > nodes[0].clientWidth) {
								// check if event called from scroll
								return;
							}
							m.startDrag(this, nodes, this.copyState(connect.isCopyKey(e)));
							this._onDragMouse(e, true); // because this may be the only mousemove event we get before the drop
						}
					}
				}
			};

			this.updateRootFolders();
		},

		// set warnings to root folders if any item warnings exist
		updateRootFolders: function () {
			this.treeStore.dataStore.checkOnEmptyLinks();
			var rootElement = this.treeStore.dataStore.getRootElement();
			var children = this.treeStore.dataStore.getChildren(rootElement);
			for (var i = 0; i < children.length; i++) {
				var hasInnerWarinigns = this.treeStore.dataStore.hasChildrenWarnings(
					children[i]
				);
				if (hasInnerWarinigns) {
					children[i].addWarning(
						'innerWarning',
						aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'admin_contain_inner_warnings'
						)
					);
					this.setWarningIcon(children[i], children[i].getWarning());
				}
			}
		},

		updateAllDescendantElementWarnings: function () {
			var elements = this.tree.tree.getDescendants();
			for (var i = 0; i < elements.length; i++) {
				if (!elements[i].isExpanded) {
					var hasInnerWarinigns = this.treeStore.dataStore.hasChildrenWarnings(
						elements[i].item
					);
					if (hasInnerWarinigns) {
						elements[i].item.addWarning(
							'innerWarning',
							aras.getResource(
								'../Modules/aras.innovator.CMF/',
								'admin_contain_inner_warnings'
							)
						);
					}
				}
				this.setWarningIcon(elements[i].item, elements[i].item.getWarning());
			}
		},

		// DnD
		treeCheckAcceptance: function (node, source) {
			return (
				this.tree.selectedItem.getType() ===
					systemEnums.TreeModelType.TabularViewColumn ||
				this.tree.selectedItem.getType() ===
					systemEnums.TreeModelType.ElementType
			);
		},

		// DnD
		trgTreeCheckItemAcceptance: function (node, source, position) {
			if (position !== 'over') {
				window.tree.lastDndPosition = position;
				var beforeElement = source.current.item.element;
				window.tree.lastBeforeElement = source.current.item;

				if (
					beforeElement.type === systemEnums.TreeModelType.TabularViewColumn
				) {
					return window.tree.dndCheckOnTabColumn(
						source,
						beforeElement,
						position
					);
				}

				if (beforeElement.type === systemEnums.TreeModelType.ElementType) {
					return window.tree.dndCheckOnElementType(
						source,
						beforeElement,
						position
					);
				}

				if (
					beforeElement.type === systemEnums.TreeModelType.ElementFolder &&
					position === 'after'
				) {
					return window.tree.dndCheckOnElementType(
						source,
						beforeElement,
						position
					);
				}
			}

			return false;
		},

		dndCheckOnElementType: function (source, beforeElement, position) {
			if (
				source.current.item.element.id === source.tree.selectedItem.element.id
			) {
				return false;
			}
			return position != 'over';
		},

		dndCheckOnTabColumn: function (source, beforeElement, position) {
			if (source.current.item.parentId !== source.tree.selectedItem.parentId) {
				return false;
			}

			var beforeSortOrder = beforeElement.sortOrder;
			var currentSortOrder = source.tree.selectedItem.element.sortOrder;

			if (currentSortOrder === beforeSortOrder) {
				return false;
			}
			if (currentSortOrder - 1 === beforeSortOrder && position === 'after') {
				return false;
			}
			if (currentSortOrder + 1 === beforeSortOrder && position === 'before') {
				return false;
			}

			return position != 'over';
		},

		dndInsertTabColumn: function (obj, options, self) {
			var elementSortOrder = obj.element.sortOrder;
			var beforeSortOrder = options.before
				? options.before.element.sortOrder
				: null;

			if (
				elementSortOrder === beforeSortOrder ||
				elementSortOrder + 1 === beforeSortOrder
			) {
				return;
			}

			var children = this.treeStore.memStore.resortColumnNodes(
				obj,
				options.before,
				options.parent
			);
			self.updateChildrenNodes(options.parent);
			for (var i = 0; i < children.length; i++) {
				self.updateTreeLabel(children[i]);
			}
		},

		dndInsertElementType: function (obj, options, asChild) {
			var sourceParentId = obj.parentId;
			this.treeStore.dataStore.reorderElementType(
				obj,
				options.before,
				options.parent,
				asChild
			);

			var sourceParent = this.treeStore.dataStore.getElementById(
				sourceParentId
			);

			this.updateChildrenNodes(sourceParent);
			if (
				options.before &&
				(options.before.getType() === systemEnums.TreeModelType.ElementFolder ||
					asChild)
			) {
				this.updateChildrenNodes(options.before);
			} else {
				this.updateChildrenNodes(options.parent);
			}
		},

		selectItem: function (rowId) {
			if (!rowId) {
				return this.onNodeSelected(this.treeStore.dataStore.getRootElement());
			}

			if (this.tree.selectedItem && this.tree.selectedItem.id === rowId) {
				return this.onNodeSelected(this.tree.selectedItem.element);
			}
			var getAncestorsAndSelf = function (childRowId, chain) {
				chain = chain || [];
				var treeElement = this.treeStore.dataStore.getElementById(childRowId);
				if (treeElement) {
					chain.unshift(treeElement);
					var parentRowId = treeElement.parentId;
					if (parentRowId) {
						getAncestorsAndSelf.call(this, parentRowId, chain);
					}
				}
				return chain;
			};
			var ancestorsAndSelf = getAncestorsAndSelf.call(this, rowId);
			this.tree.set('path', ancestorsAndSelf);
			var treeItem = this.treeStore.dataStore.getElementById(rowId);
			if (!treeItem) {
				treeItem = this.treeStore.dataStore.getRootElement();
				return this.onNodeSelected(treeItem);
			}

			// check for warnings
			if (treeItem.node && window.isEditMode) {
				var defaultFieldCheckCallback = function (
					itemNode,
					reqName,
					proplabel,
					defVal
				) {
					var ask = aras.confirm(
						aras.getResource(
							'',
							'item_methods_ex.field_required_default_will_be_used',
							proplabel,
							defVal
						)
					);
					if (ask) {
						aras.setItemProperty(itemNode, reqName, defVal);
					}
					return {
						result: ask,
						message: !ask
							? aras.getResource(
									'',
									'item_methods_ex.field_required_provide_value',
									proplabel
							  )
							: ''
					};
				};
				var checkCopy = treeItem.node.cloneNode(true);
				clearCheckNode(checkCopy);
				var errors = aras.clientItemValidation(
					treeItem.node.getAttribute('type'),
					checkCopy,
					false,
					defaultFieldCheckCallback
				);
				if (errors.length > 0) {
					var message = '';
					for (var i = 0; i < errors.length; i++) {
						message = message + errors[i].message + '</br>';
					}
					treeItem.addWarning('clientValidation', message);
					tree.setWarningIcon(treeItem, treeItem.getWarning());
				}
			}
			return this.onNodeSelected(treeItem.element);
		},

		getIconForTreeItem: function (treeElement) {
			var iconPath = this.treeStore.getIcon(treeElement);
			if (iconPath) {
				if (iconPath.toLowerCase().indexOf('vault:///?fileid=') === 0) {
					var fileId = iconPath.replace(/vault:\/\/\/\?fileid=/i, '');
					iconPath = aras.IomInnovator.getFileUrl(
						fileId,
						parent.aras.Enums.UrlType.SecurityToken
					);
				} else {
					iconPath = dojo.baseUrl + '../' + iconPath;
				}
				var size = '22px';
				var backgroundImage = 'url(' + iconPath + ')';
				return {
					backgroundImage: backgroundImage,
					backgroundSize: '22px 22px',
					backgroundPosition: 'center center',
					height: size,
					width: size,
					marginBottom: '2px'
				};
			}

			return '';
		},

		getLabel: function (item) {
			if (item) {
				return item.getTreeLabel();
			}
			return 'label';
		},

		destroy: function () {
			this.tree.destroy();
		},

		updateChildrenNodes: function (parentNode) {
			var parentNodes = this.tree.getNodesByItem(parentNode);
			if (parentNodes && parentNodes[0]) {
				var children = this.tree.model.store.getChildren(parentNode);
				parentNodes[0].setChildItems(children);
			}
		},

		updateTreeLabel: function (treeItem) {
			var node = this.tree.getNodesByItem(treeItem);
			if (node && node.length > 0 && node[0]) {
				node[0].set('label', treeItem.getTreeLabel());
			}
		},

		createAdditionalIcon: function (node) {
			var span = node.ownerDocument.createElement('span');
			span.className += 'additional-icon';
			node.rowNode.appendChild(span);
			node.rowNode.style.position = 'relative';
			return span;
		},

		setWarningIcon: function (treeItem, label) {
			if (!label) {
				this.removeWarningIcon(treeItem);
				return;
			}
			var nodes = this.tree.getNodesByItem(treeItem);
			if (nodes && nodes.length > 0) {
				var node = nodes[0];
				var iconNode = node.rowNode.getElementsByClassName('additional-icon');
				if (iconNode.length > 0) {
					iconNode = iconNode[0];
					iconNode.style.display = 'inline-block';
				} else {
					iconNode = this.createAdditionalIcon(node);
				}

				iconNode.onmouseover = function (param) {
					Tooltip.show(label, param.currentTarget);
				};
				iconNode.onmouseout = function (param) {
					Tooltip.hide(param.currentTarget);
				};
			}
		},

		removeWarningIcon: function (treeItem) {
			var nodes = this.tree.getNodesByItem(treeItem);
			if (nodes && nodes.length > 0) {
				var node = nodes[0];
				var iconNode = node.rowNode.getElementsByClassName('additional-icon');
				if (iconNode.length > 0) {
					iconNode[0].style.display = 'none';
					iconNode[0].onmouseover = null;
					iconNode[0].onmouseout = null;
				}
			}
		},

		getTreeElementById: function (id) {
			return this.treeStore.getTreeNodeById(id);
		},

		/* jshint ignore:start */
		//Events
		onNodeSelected: function (element) {}
		/* jshint ignore:end */
	});
});
