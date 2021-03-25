VC.Utils.Page.LoadWidgets([
	'ModelBrowser/TabBase',
	'ModelBrowser/SavedViewTreeNode',
	'ModelBrowser/SavedViewHeaderTreeNode',
	'ModelBrowser/BasicTreeNode'
]);

require([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/aspect',
	'dojo/text!../xml/views_tree template.xml'
], function (declare, lang, aspect, viewsTreeTemplate) {
	return dojo.setObject(
		'VC.ModelBrowser.Tabs.ViewsTab',
		declare(VC.ModelBrowser.Tabs.TabBase, {
			tabID: 'views',
			viewsTypes: {
				savedViews: 'savedViews',
				standardViews: 'standardViews',
				cadViews: 'cadViews',
				annotationViews: 'annotationViews'
			},
			treeTemplate: null,
			isSavedViewsSupported: true,

			onSelectStandardView: function (viewDirectionType) {},
			onSelectCustomView: function (cadViewId) {},
			onSelectSavedView: function (cadViewId) {},
			onGetCustomViews: function () {},
			onGetSavedViews: function () {},
			onCreateSavedView: function () {},
			onDeleteSavedView: function (id, name) {},

			constructor: function (args) {
				args = args || {};
				args.id = 'viewsTab';
				this.title = VC.Utils.GetResource('viewsTabTitle');
				this.treeTemplate = viewsTreeTemplate;
			},

			postCreate: function () {
				this.inherited(arguments);

				var self = this;
				clientControlsFactory.createControl(
					'Aras.Client.Controls.Experimental.Tree',
					{
						id: 'viewsTree',
						IconPath: '../cbin/',
						allowEmptyIcon: true
					},
					function (control) {
						self.tree = control;

						self.setTreeStyle(self.tree, self.domNode);
						self.tree._tree._createTreeNode = self.createTreeNode.bind(self);
					}
				);
			},

			setTreeStyle: function (tree, domNode) {
				domNode.appendChild(tree._tree.domNode);
				VC.Utils.addClass(tree._tree.domNode, 'ViewsTree');
				VC.Utils.addClass(tree._tree.rootNode.domNode, 'ViewsTreeRoot');
				tree._tree.getRowClass = this.getRowClass;
				aspect.after(
					tree._tree,
					'getIconStyle',
					this.hideBackgroundImage.bind(tree)
				);
			},

			getRowClass: function (item) {
				if (item.userdata && item.userdata.className) {
					return item.userdata.className;
				}
			},

			hideBackgroundImage: function (style) {
				if (
					style &&
					style.backgroundImage === 'url(' + this.IconPath + 'null)'
				) {
					style.backgroundImage = 'none';
				}

				return style;
			},

			onItemSelect: function (itemId, multi, userdata) {
				if (userdata) {
					if (userdata.viewDirectionType) {
						this.onSelectStandardView(userdata.viewDirectionType);
					} else if (userdata.cadViewId) {
						switch (userdata.viewType) {
							case this.viewsTypes.savedViews:
								this.onSelectSavedView(userdata.cadViewId);
								break;
							case this.viewsTypes.cadViews:
							case this.viewsTypes.annotationViews:
							default:
								this.onSelectCustomView(userdata.cadViewId);
								break;
						}
					}
				}
			},

			loadViews: function () {
				var trNodeName = 'tr';
				var xmlDocument = VC.Utils.createXMLDocument();

				xmlDocument.loadXML(this.treeTemplate);

				var savedViewsNode = xmlDocument.selectSingleNode(
					"./table/tr[@id='savedViews']"
				);
				var cadViewsNode = xmlDocument.selectSingleNode(
					"./table/tr[@id='cadViews']"
				);
				var annotationViewsNode = xmlDocument.selectSingleNode(
					"./table/tr[@id='annotationViews']"
				);

				if (this.isSavedViewsSupported) {
					this.fillSavedViewsSection(savedViewsNode);
				}

				this.fillCustomSection(annotationViewsNode, cadViewsNode);

				this.tree.initXML(xmlDocument.documentElement.xml);
				this.tree.ExpandAll();

				if (!this.isSavedViewsSupported) {
					this.hideSection(this.viewsTypes.savedViews);
				} else {
					this.setAddSavedViewBtnAccessibility(false);
				}

				if (cadViewsNode.selectNodes(trNodeName).length === 0) {
					this.hideSection(this.viewsTypes.cadViews);
				}

				if (annotationViewsNode.selectNodes(trNodeName).length === 0) {
					this.hideSection(this.viewsTypes.annotationViews);
				}
			},

			fillSavedViewsSection: function (savedViewsNode) {
				var savedViews = this.onGetSavedViews();

				if (savedViews.length > 0) {
					var node = null;

					for (var i = 0; i < savedViews.length; i++) {
						node = this.createNodeTemplateFromLoadedData(savedViews[i]);
						savedViewsNode.appendChild(node);
					}
				}
			},

			fillCustomSection: function (annotationViewsNode, cadViewsNode) {
				var customViews = this.onGetCustomViews();

				if (customViews.length > 0) {
					var view = null;
					var node = null;

					for (var i = 0; i < customViews.length; i++) {
						view = customViews[i];
						node = this.createNodeTemplateFromLoadedData(view);

						switch (view.viewType) {
							case this.viewsTypes.annotationViews:
								annotationViewsNode.appendChild(node);
								break;
							case this.viewsTypes.cadViews:
								cadViewsNode.appendChild(node);
								break;
						}
					}
				}
			},

			hideSection: function (sectionName) {
				var sectionTreeNode = this.tree._tree.getNodesByItem(sectionName)[0];
				sectionTreeNode.domNode.style.display = 'none';
			},

			createNodeTemplateFromLoadedData: function (view) {
				var xmlDocument = VC.Utils.createXMLDocument();
				var node = xmlDocument.createElement('tr');
				var userdataNode = xmlDocument.createElement('userdata');
				var labelNode = xmlDocument.createElement('td');
				const viewTypeUserdataNode = xmlDocument.createElement('userdata');

				node.setAttribute('id', view.id);
				switch (view.viewType) {
					case this.viewsTypes.savedViews:
						node.setAttribute('icon0', '../../../images/Saved3DView.svg');
						node.setAttribute('icon1', '../../../images/Saved3DView.svg');
						break;
					case this.viewsTypes.cadViews:
						node.setAttribute('icon0', '../../../images/CADView.svg');
						node.setAttribute('icon1', '../../../images/CADView.svg');
						break;
					case this.viewsTypes.annotationViews:
						node.setAttribute('icon0', '../../../images/AnnotationView.svg');
						node.setAttribute('icon1', '../../../images/AnnotationView.svg');
						break;
				}
				node.setAttribute('level', 1);
				userdataNode.setAttribute('key', 'cadViewId');
				userdataNode.setAttribute('value', view.id);
				viewTypeUserdataNode.setAttribute('key', 'viewType');
				viewTypeUserdataNode.setAttribute('value', view.viewType);
				labelNode.text = view.label;

				node.appendChild(userdataNode);
				node.appendChild(viewTypeUserdataNode);
				node.appendChild(labelNode);

				return node;
			},

			createTreeNode: function (args) {
				let viewType = null;
				let treeNode = null;

				args.declaredClass = 'dijit._TreeNode';

				if (args.item.userdata.viewType) {
					viewType = args.item.userdata.viewType;
				}

				switch (viewType) {
					case this.viewsTypes.savedViews:
						treeNode = this.createSavedViewTreeNode(args);
						break;
					case this.viewsTypes.standardViews:
					case this.viewsTypes.cadViews:
					case this.viewsTypes.annotationViews:
					default:
						treeNode = this.createBasicTreeNode(args);
						break;
				}
				treeNode.rowNode.onclick = this.onItemSelect.bind(
					this,
					treeNode.item.id,
					false,
					treeNode.item.userdata
				);

				return treeNode;
			},

			createBasicTreeNode: function (args) {
				return new VC.Widgets.BasicTreeNode(args);
			},

			createSavedViewTreeNode: function (args) {
				let treeNode = null;
				const className = this.getRowClass(args.item);
				let self = this;
				if (className && className.indexOf('ViewsTypeHead') != -1) {
					treeNode = new VC.Widgets.SavedViewHeaderTreeNode(args);
					treeNode.createSavedViewButton.onClick = this._onCreateSavedView.bind(
						this
					);
				} else {
					treeNode = new VC.Widgets.SavedViewTreeNode(args);
					treeNode.deleteSavedViewButton.onClick = function (event) {
						self._onDeleteSavedView(event, treeNode.item.id, treeNode.label);
					};
				}

				return treeNode;
			},

			addSavedView: function (savedViewId, savedViewName) {
				var savedView = {
					id: savedViewId,
					label: savedViewName,
					viewType: this.viewsTypes.savedViews
				};
				var savedViewNode = this.createNodeTemplateFromLoadedData(savedView);
				var model = this.tree._model;
				var savedViewsTitleNode = this.tree._tree.getNodesByItem(
					'savedViews'
				)[0];
				var actualSavedViewsCount = savedViewsTitleNode.getChildren().length;
				if (actualSavedViewsCount === 0) {
					savedViewsTitleNode.expand();
				}

				model._processTreeItem(savedViewsTitleNode.item, savedViewNode);
			},

			deleteTreeNode: function (id, viewType) {
				var model = this.tree._model;
				var thisItem = model.fetchItemByIdentity(id);
				var items = model._items;
				var index = items.indexOf(thisItem);
				if (index >= 0) {
					items.splice(index, 1);
				}
				model._itemcnt--;

				var parentItem = this.tree._tree.getNodesByItem(viewType)[0].item;
				var thisNode = this.tree._tree.getNodesByItem(id)[0];
				var children = parentItem.children;
				index = children.indexOf(thisNode.item);
				if (index >= 0) {
					children.splice(index, 1);
				}

				this.tree._tree._onItemDelete(thisItem);
			},

			deleteSavedView: function (savedViewId) {
				this.deleteTreeNode(savedViewId, this.viewsTypes.savedViews);
			},

			_onCreateSavedView: function () {
				this.onCreateSavedView();
			},

			_onDeleteSavedView: function (event, id, name) {
				this.onDeleteSavedView(id, name);
				event.stopPropagation();
			},

			setAddSavedViewBtnAccessibility: function (isAccessible) {
				this.tree._tree
					.getNodesByItem(this.viewsTypes.savedViews)[0]
					.createSavedViewButton.enable(isAccessible);
			}
		})
	);
});
