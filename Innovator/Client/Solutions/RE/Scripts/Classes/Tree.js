define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Tree',
	'RE/Scripts/UI/RequirementTreeRenderer',
],

function(declare, TechDocTree, RETreeRenderer) {
	return declare('Aras.Client.Controls.Requirement.Tree', [TechDocTree], {
		_rootNode: null,

		constructor: function() {
			this.treeRenderer = new RETreeRenderer({tree: this, viewmodel: this.viewmodel});
		},

		startup: function() {
			this.inherited(arguments);
			this._expandRootNode();
		},

		_getRenderedTreeStoreData: function() {
			var storeData = this.inherited(arguments);
			// Three first elements ('Requirement-Chapter', 'Requirement-Title' and 'Requirement-Number') should be removed to not be displayed in Tree panel
			storeData.splice(2, 4);
			return storeData;
		},

		_expandRootNode: function() {
			if (this.tree) {
				this.tree.showRoot = false;
				this.tree.rootNode.rowNode.style.display = 'none';
				//get rootNode if showRoot is true and get first child of rootNode if showRoot is false
				var childElementOfRoot = this.tree._getFirst();
				this.tree._expandNode(childElementOfRoot);
			}
		},

		_setupRootNode: function() {
			if (!this._rootNode) {
				var rootTreeNode = this.domNode.querySelector('.dijitTreeIsRoot');
				var treeContainer = rootTreeNode.lastElementChild;
				var firstChildTreeNode = treeContainer.firstChild;
				var widgetId = firstChildTreeNode.getAttribute('widgetId');
				this._rootNode = firstChildTreeNode.firstChild;
				this._rootNode.setAttribute('widgetId', widgetId);
				this._rootNode.classList.add('TitleRow');

				this.domNode.insertBefore(this._rootNode, this.domNode.firstChild);
			}
		},

		_dropRootNode: function() {
			this._rootNode.parentNode.removeChild(this._rootNode);
			this._rootNode = null;
		},

		_showContextMenu: function(e) {
			var targetWidget = dijit.getEnclosingWidget(e.target);
			if (!targetWidget.item) {
				var currentSelectedItem = this.viewmodel.getLastElement();
				var menuModel = this.actionsHelper.GetActionsMenuModel();
				this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, currentSelectedItem.Id(), {
					'x': e.pageX,
					'y': e.pageY
				});
				this.viewmodel.SetSelectedItems();
			} else if (targetWidget.item.uid != this.viewmodel.getRootNodeUid()) {
				return this.inherited(arguments);
			}
			this._contextMenuKey = 0;
			e.preventDefault();
			e.stopPropagation();
		},

		isTreeUpdatedCompletely: function() {
			return this.viewmodel.isTreeUpdatedCompletely;
		},

		_onViewModelInvalidate: function(sender, earg) {
			var invalidationList = earg.invalidationList;
			if (invalidationList.length) {
				for (var i = 0; i < invalidationList.length; i++) {
					this.treeRenderer.invalidate(invalidationList[i]);
				}

				this.treeRenderer.refresh();
				this._updateRootNode();
			}
		},

		_updateRootNode: function() {
			if (this.isTreeUpdatedCompletely()) {
				this._dropRootNode();
				this._setupRootNode();
				this._expandRootNode();
			}
		}
	});
});
