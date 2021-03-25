define([
	'dojo/_base/declare',
	'dojo/aspect',
	'RE/Scripts/Classes/Tree',
	'RE/Scripts/UI/TreeRenderer'
],

function(declare, aspect, RequirementTree, TreeRenderer) {
	return declare('Aras.Client.Controls.RequirementDocument.ContentTree', [RequirementTree], {
		_currentActiveId: null,
		_currentActiveReqId: null,
		isEmptyContentTree: true,
		renderedRootNode: null,
		_availibleStateIcons: null,

		startup: function() {
			this.domNode.addEventListener('click', this.onDomClickHandler.bind(this));
			this.inherited(arguments);
		},

		constructor: function() {
			aspect.before(this.viewmodel, 'Reload', this._cleanUpContentTree.bind(this), true);
			aspect.after(this.viewmodel, 'setRequirementState', this._updateStateIcon.bind(this), true);
			aspect.after(this.viewmodel, 'MarkAsDeletedRequirementDocRequirementsByIds', this._cleanUpContentTree.bind(this), true);
			this._availibleStateIcons = ['contentTreeBlank', 'contentTreeNewItem', 'contentTreeModified',
				'contentTreeLockedAndModified', 'contentTreeLockedByMe', 'contentTreeLockedByOther'];
			this.treeRenderer = new TreeRenderer({tree: this, viewmodel: this.viewmodel});
		},

		setCurrentActiveId: function(newValue) {
			this._currentActiveId = newValue;
		},

		getCurrentActiveId: function() {
			return this._currentActiveId;
		},

		_cleanUpContentTree: function() {
			if (this.rootNode) {
				this.rootNode.destroy();
				var titleRow = this._rootNode.querySelector('.TitleRow .dijitTreeLabel');
				if (titleRow) {
					titleRow.innerText = '';
				}

				this._currentActiveId = null;
			}

			const storeData = this._getRenderedTreeStoreData();
			this._populateTreeModel(storeData);
		},

		selectionChangeHandler: function(sender, selectedItems) {
			if (selectedItems && selectedItems.length > 0) {
				var parentItem = this._getParentItem(selectedItems[0]);
				if (this._currentActiveId != parentItem._id) {
					const firstLoad = this._currentActiveId == null;
					this._currentActiveId = parentItem._id;
					this._currentActiveReqId = parentItem.Attribute('reqId');
					this._updateContentTree(parentItem, firstLoad);
				}

				this.inherited(arguments);
			} else {
				this._cleanUpContentTree();
			}
		},

		_getParentItem: function(item) {
			if (item.Parent && item.Parent.nodeName == 'aras:block') {
				return item;
			} else {
				return this._getParentItem(item.Parent);
			}
		},

		_setupRootNode: function() {
			if (!this._rootNode) {
				var rootTreeNode = this.domNode.querySelector('.dijitTreeIsRoot');
				if (!this.isEmptyContentTree) {
					var treeContainer = rootTreeNode.lastElementChild;
					rootTreeNode = treeContainer.firstChild;
				}
				var widgetId = rootTreeNode.getAttribute('widgetId');
				this._rootNode = rootTreeNode.firstElementChild;
				this._rootNode.setAttribute('widgetId', widgetId);
				this._rootNode.classList.add('TitleRow');

				this.domNode.insertBefore(this._rootNode, this.domNode.firstChild);
			}
		},

		_isStateIconUpdateAllowed: function(reqId) {
			return this._currentActiveReqId === reqId;
		},

		_updateStateIcon: function(state, reqId) {
			if (!this._isStateIconUpdateAllowed(reqId)) {
				return;
			}

			const stateIconNode = document.getElementById('re_content_tree_state');
			if (stateIconNode) {
				stateIconNode.classList.remove.apply(stateIconNode.classList, this._availibleStateIcons);
				stateIconNode.classList.add('contentTree' + state);
			}
		},

		_expandRootNode: function() {
			if (!this.isEmptyContentTree) {
				this.inherited(arguments);
			}
		},

		_reloadTree: function() {
			this._itemNodesMap = {};
			if (this.rootNode) {
				this.rootNode.destroy();
			}
			this._load();
		},

		_getRootNode: function() {
			// Creation of fake root aras:block node.
			// This block is used as root node of content tree that contains a requirement item.
			// Render aras:blok node from structured document is bad,
			// because all requirement document structure will be rendered and it takes a lot of time.
			var newBlockElement = this.viewmodel.CreateElement('element', {type: 'aras:block'});
			var renderedRootNode = this.treeRenderer.RenderModel(newBlockElement);
			renderedRootNode[0].id = this.viewmodel.Dom().Id().toString();
			return renderedRootNode;
		},

		_populateTreeModel: function(storeData) {
			this.inherited(arguments);
			if (!this.isEmptyContentTree) {
				this._reloadTree();
			}
		},

		_getRenderedTreeStoreData: function(requirementElement) {
			if (requirementElement) {
				var renderedTreeStoreData = this.renderedRootNode;
				renderedTreeStoreData = renderedTreeStoreData.concat(this.treeRenderer.RenderModel(requirementElement));
				renderedTreeStoreData.labelType = 'html';
				return renderedTreeStoreData;
			} else {
				this.renderedRootNode = this._getRootNode();
				return this.renderedRootNode.slice();
			}
		},

		_updateContentTree: function(selectedItem, firstLoad) {
			this.isEmptyContentTree = false;
			if (firstLoad) {
				let storeData = this._getRenderedTreeStoreData(selectedItem);
				this._populateTreeModel(storeData);
				this.setDeferredFunction('rootNodeUpdate', this._rootNodeUpdate, this);
			} else {
				this.treeRenderer.invalidate(selectedItem);
				this.treeRenderer.refresh(null, true);
			}

			this.viewmodel.refreshStateForElement(selectedItem);
		},

		_rootNodeUpdate: function() {
			const selectedItems = this.viewmodel.GetSelectedItems();
			if (selectedItems.length) {
				let previousTitle = document.getElementById('contentTree');
				previousTitle.removeChild(previousTitle.firstChild);
				delete this._rootNode;

				this._setupRootNode();
				this._expandRootNode();
			}
		},

		_isRenderableElement: function(targetElement) {
			if (targetElement) {
				let validationElement = targetElement;
				let isRenderable = true;

				while (validationElement && isRenderable) {
					isRenderable = !validationElement.is('Requirement-Info');
					validationElement = validationElement.Parent;
				}

				return isRenderable;
			}
		},

		_onViewModelInvalidate: function(sender, earg) {
			// if any item is loaded to tree need to do invalidation, in other cases invalidation is not required
			if (this._currentActiveId !== null) {
				const invalidationList = earg.invalidationList;
				if (invalidationList.length) {
					for (let i = 0; i < invalidationList.length; i++) {
						// Need to skip tree update for Requirement-Chapter block because tree is not used it
						if (!invalidationList[i].is('ArasBlockXmlSchemaElement') && this._isRenderableElement(invalidationList[i])) {
							let parentItem = this._getParentItem(invalidationList[i]);
							if (parentItem.Id() === this._currentActiveId) {
								this.treeRenderer.invalidate(invalidationList[i]);
							}
						}
					}

					this.treeRenderer.refresh();
				}
			}
		},

		_showContextMenu: function(e) {
			const selectedItems = this.viewmodel.GetSelectedItems();
			if (selectedItems.length) {
				const targetWidget = dijit.getEnclosingWidget(e.target);
				if (!targetWidget.item) {
					const currentSelectedItem = this.viewmodel.getLastElement();
					const menuModel = this.actionsHelper.GetActionsMenuModel();
					const classifiedParent = this.viewmodel._getClassifiedParentElement(currentSelectedItem);
					this.viewmodel.SetSelectedItems(classifiedParent);
					this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, currentSelectedItem.Id(), {
						'x': e.pageX,
						'y': e.pageY
					});
				} else if (targetWidget.item.uid != this.viewmodel.getRootNodeUid()) {
					return this.inherited(arguments);
				}
			}
		},

		_updateRootNode: function() {},

		onDomClickHandler: function(e) {
			const targetWidget = dijit.getEnclosingWidget(e.target);

			if (targetWidget.declaredClass != 'dijit._TreeNode') {
				const currentSelectedItems = this.structuredDocument.GetSelectedItems();
				if (currentSelectedItems.length) {
					const classifiedParent = this.structuredDocument._getClassifiedParentElement(currentSelectedItems[0]);
					this.structuredDocument.SetSelectedItems(classifiedParent);
					e.stopImmediatePropagation();
				}
			}
		},

		setDeferredFunction: function(key, func, context) {
			const functionKey = '_' + key + '_deferred';
			if (this[functionKey]) {
				clearTimeout(this[functionKey]);
			}

			const later = function() {
				func.apply(context);
				this[functionKey] = null;
			};
			this[functionKey] = setTimeout(later.bind(this), 20);
		}
	});
});
