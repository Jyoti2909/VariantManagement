VC.Utils.Page.LoadWidgets([
	'ModelBrowser/TabBase',
	'ModelBrowser/ModelBrowserTreeNode',
	'ModelBrowser/BasicTreeNode',
	'ModelBrowser/TreeNodeToTreeConnector'
]);

require([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/_base/lang',
	'dijit/popup',
	'Aras/Client/Controls/Experimental/Tree',
	'dojo/text!../styles/ModelBrowser/structure_to_tree_constructor.xslt',
	'dojo/text!../styles/ModelBrowser/unique_tree_constructor.xslt'
], function (
	declare,
	connect,
	lang,
	popup,
	tree,
	structureToTreeXSLT,
	uniqueTreeNodesXSLT
) {
	return dojo.setObject(
		'VC.ModelBrowser.Tabs.ModelTab',
		declare(VC.ModelBrowser.Tabs.TabBase, {
			tabID: 'model',
			isSelectionFromTree: null,
			contextMenu: null,
			selectedTreeItem: null,
			properties: {},
			_cadId: null,
			resolution: null,
			onReadyModelTree: null,

			onSelectTreeItem: function (treeNodeId) {},
			onOpenCad: function (treeNodeId) {},
			onIsolate: function (treeNodeId) {},
			onFitAll: function () {},
			onResetView: function () {},
			onVisibility: function (treeNodeId, isVisible) {},
			onHideAllOther: function (treeNodeId) {},
			onDisplayAll: function () {},
			onShowPart: function (treeNodeId) {},
			onHidePart: function (treeNodeId) {},
			onAllNodesRendered: function () {},
			isLegacyModelType: function () {
				return false;
			},
			isSelectedNodeVisible: function (treeNodeId) {
				return false;
			},
			isTreeReady: false,

			constructor: function (args) {
				args = args || {};
				args.id = 'modelTab';
				this.title = VC.Utils.GetResource('modelTabTitle');
				this.resolution = args.resolution;
				this._cadId = args.cadId;
				this.isSelectionFromTree = false;
			},

			postCreate: function () {
				this.inherited(arguments);

				var self = this;
				clientControlsFactory.createControl(
					'Aras.Client.Controls.Experimental.Tree',
					{
						id: 'modelBrowserTree',
						IconPath: '../cbin/',
						allowEmptyIcon: true,
						contextMenuCallback: function (event, closeContextMenu, evt) {
							var modelTabContext = self;
							modelTabContext.contextMenuCallback.call(
								this,
								event,
								closeContextMenu,
								evt,
								modelTabContext
							);
						}
					},
					function (control) {
						var treeApplet = control;
						self.domNode.appendChild(treeApplet._tree.domNode);
						VC.TreeNodeToTreeConnector.onProcessNodeInTree = lang.hitch(
							self,
							self._processTreeNode
						);

						clientControlsFactory.on(treeApplet, {
							menuClick: lang.hitch(self, self.onMenuClick)
						});
						self.initializationTree(treeApplet);
					}
				);
			},

			initializationTree: function (treeApplet) {
				this.tree = treeApplet;
				connect.connect(this.tree._tree, 'onClick', this, this.onItemSelect);
				this.tree._tree._createTreeNode = this.createTreeNode.bind(this);
				this.isTreeReady = true;
				this.onReadyModelTree();
				this.setupContextMenu();
				VC.Utils.addClass(this.tree._tree.domNode, 'ModelBrowserTree');
			},

			createTreeNode: function (args) {
				var treeNode = !this.isLegacyModelType()
					? new VC.Widgets.ModelBrowserTreeNode(args)
					: new VC.Widgets.BasicTreeNode(args);

				if (treeNode.toggleButton) {
					treeNode.toggleButton.onShowPart = lang.hitch(this, this._onShowPart);
					treeNode.toggleButton.onHidePart = lang.hitch(this, this._onHidePart);
				}
				treeNode.onGetSelectedNodeId = lang.hitch(
					this.tree,
					this.tree.getSelectedId
				);

				return treeNode;
			},

			contextMenuCallback: function (
				event,
				closeContextMenu,
				evt,
				modelTabContext
			) {
				var aWidget = dijit.getEnclosingWidget(evt.target);
				var id = aWidget && aWidget.item ? aWidget.getIdentity() : '';
				var item = this._model.fetchItemByIdentity(id);
				var mouseButtonWasClicked = evt.pageX && evt.pageY;
				var visibilityLabel = '';

				if (item) {
					if (
						!(this._tree.selectedItem && this._tree.selectedItem.id === item.id)
					) {
						this.selectItem(item.id);
						this.itemSelect(item.id, false);
					}
					this.contextMenu.rowId = item.id;

					modelTabContext._setVisibilityLabel(this.contextMenu, item);

					if (mouseButtonWasClicked) {
						connect.connect(this.contextMenu.menu, 'onBlur', closeContextMenu);
						dijit.popup.open({
							popup: this.contextMenu.menu,
							parent: this._tree,
							x: evt.pageX,
							y: evt.pageY
						});
						this.contextMenu.menu.domNode.focus();
					} else {
						closeContextMenu();
					}
				}
				event.stop(evt);
			},

			_setVisibilityLabel: function (contextMenu, item) {
				if (contextMenu.getItemById('visibility')) {
					if (this.isSelectedNodeVisible(item.id)) {
						visibilityLabel = VC.Utils.GetResource('hideLabel');
					} else {
						visibilityLabel = VC.Utils.GetResource('showLabel');
					}
					contextMenu.setLabel('visibility', visibilityLabel);
				}
			},

			loadTreeDataForHWF: function (nodeProperties) {
				var treeXml =
					'<table>' +
					"<tr level='1' id='" +
					nodeProperties.treeNodeId +
					"' icon0='../../../images/CAD.svg' icon1='../../../images/CAD.svg'>" +
					"<userdata key='itemId' value='" +
					nodeProperties.itemId +
					"'/>" +
					'<td>' +
					nodeProperties.itemName +
					'</td>' +
					'</tr>' +
					'</table>';
				this.tree.initXML(treeXml);
			},

			loadTreeData: function (structureXml) {
				if (structureXml) {
					structureXml = '<Result>' + structureXml + '</Result>';
					var treeXml = VC.Utils.convertXsltToHtml(
						structureXml,
						structureToTreeXSLT
					);
					var treeXmlwithUniqueNodes = VC.Utils.convertXsltToHtml(
						treeXml,
						uniqueTreeNodesXSLT
					);

					this.fillNodesDictionary(treeXmlwithUniqueNodes);
					this.tree.reload(treeXmlwithUniqueNodes);
					this.tree.ExpandAll();
				}
			},

			fillTreeNodeIdToModelNodeIdDictionary: function (
				treeNodeIdToModelNodeIdDictionary
			) {
				var treeNodes = this.tree._model._items;
				for (var i = 1; i < treeNodes.length; i++) {
					var nodeIds = treeNodes[i].userdata.nodeIds.split(',').map(Number);
					var id = treeNodes[i].id;
					var cadId = treeNodes[i].userdata.itemId;
					for (var j = 0; j < nodeIds.length; j++) {
						treeNodeIdToModelNodeIdDictionary.addPair(nodeIds[j], id, cadId);
					}
				}
			},

			_onSelectTreeItem: function (treeNodeId) {
				this.isSelectionFromTree = true;
				this.onSelectTreeItem(treeNodeId);
				this.isSelectionFromTree = false;
			},

			_hideToggleButtons: function () {
				var treeItems = this.tree.GetAllItems();
				var treeItem = null;
				var treeNodes = null;
				var treeNode = null;

				for (var i = 0; i < treeItems.length; i++) {
					treeItem = treeItems[i];
					treeNodes = this.tree._tree.getNodesByItem(treeItem);
					treeNode = treeNodes[0];

					if (treeNode && treeNode.toggleButton) {
						treeNode.toggleButton.hide();
					}
				}
			},

			_onShowPart: function (treeNodeId) {
				this.onShowPart(treeNodeId);
			},

			_onHidePart: function (treeNodeId) {
				this.onHidePart(treeNodeId);
			},

			_onOpenCad: function (treeNodeId) {
				this.onOpenCad(treeNodeId);
			},

			_onIsolate: function (treeNodeId) {
				this.onIsolate(treeNodeId);
			},

			_onVisibility: function (treeNodeId, isVisible) {
				this.onVisibility(treeNodeId, isVisible);
			},

			_onHideAllOther: function (treeNodeId) {
				this.onHideAllOther(treeNodeId);
			},

			_onFitAll: function () {
				this.onFitAll();
			},

			_onResetView: function () {
				this.onResetView();
			},

			_onDisplayAll: function () {
				this.onDisplayAll();
			},

			setupContextMenu: function () {
				var curLabel = VC.Utils.GetResource('openLabel');
				var menuItems = [
					{
						id: 'open',
						name: curLabel,
						onClick: lang.hitch(this, this.onMenuClick)
					}
				];
				menuItems.push({ separator: true });
				if (!this.isLegacyModelType()) {
					curLabel = VC.Utils.GetResource('isolateLabel');
					menuItems.push({
						id: 'isolate',
						name: curLabel,
						onClick: lang.hitch(this, this.onMenuClick)
					});

					curLabel = VC.Utils.GetResource('hideLabel');
					menuItems.push({
						id: 'visibility',
						name: curLabel,
						onClick: lang.hitch(this, this.onMenuClick)
					});

					curLabel = VC.Utils.GetResource('hideAllOtherLabel');
					menuItems.push({
						id: 'hideAllOther',
						name: curLabel,
						onClick: lang.hitch(this, this.onMenuClick)
					});
				}

				curLabel = VC.Utils.GetResource('fitAllLabel');
				menuItems.push({
					id: 'fitAll',
					name: curLabel,
					onClick: lang.hitch(this, this.onMenuClick)
				});

				curLabel = VC.Utils.GetResource('resetViewLabel');
				menuItems.push({
					id: 'resetView',
					name: curLabel,
					onClick: lang.hitch(this, this.onMenuClick)
				});

				curLabel = VC.Utils.GetResource('displayAllLabel');
				menuItems.push({
					id: 'displayAll',
					name: curLabel,
					onClick: lang.hitch(this, this.onMenuClick)
				});
				this.tree.contextMenu.addRange(menuItems);
			},

			onMenuClick: function (commandId, selectedId) {
				var isVisible = null;

				switch (commandId) {
					case 'open':
						this._onOpenCad(selectedId);
						break;
					case 'isolate':
						this._onIsolate(selectedId);
						break;
					case 'visibility':
						this.loopByNodes(function (treeNode) {
							if (
								treeNode.toggleButton &&
								treeNode.toggleButton.treeNodeId === selectedId
							) {
								isVisible = treeNode.isVisible;
							}
						});
						this._onVisibility(selectedId, isVisible);
						break;
					case 'hideAllOther':
						this._onHideAllOther(selectedId);
						break;
					case 'fitAll':
						this._onFitAll();
						break;
					case 'resetView':
						this._onResetView();
						break;
					case 'displayAll':
						this._onDisplayAll();
						break;
				}
			},

			onItemSelect: function (item, node, event) {
				var treeNodeId = item.id;

				if (event.which === 1) {
					if (this.tree.selectedItem !== treeNodeId) {
						this.tree.selectedItem = treeNodeId;
						this._onSelectTreeItem(treeNodeId);
					}
				}

				if (node.toggleButton) {
					this._hideToggleButtons();
					node.toggleButton.show();
				}
			},

			selectTreeItem: function (treeNodeId) {
				if (!this.tree.IsItemExists(treeNodeId)) {
					return;
				}

				this.tree.selectItem(treeNodeId);
				this._hideToggleButtons();
				this.loopByNodes(function (treeNode) {
					if (
						treeNode.toggleButton &&
						treeNode.toggleButton.treeNodeId === treeNodeId
					) {
						treeNode.toggleButton.show();
					}
				});

				var treeContainer = document.getElementById(this.tree._tree.id);
				var containerHeight = treeContainer.offsetHeight;
				var selectedItemNode = this.tree._tree._itemNodesMap[treeNodeId][0]
					.domNode;
				var selectedItemPosition =
					selectedItemNode.offsetTop - containerHeight / 2;

				treeContainer.scrollTop = selectedItemPosition;
			}
		})
	);
});
