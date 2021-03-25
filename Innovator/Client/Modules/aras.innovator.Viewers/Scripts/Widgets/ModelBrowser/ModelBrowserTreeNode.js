VC.Utils.Page.LoadWidgets([
	'ModelBrowser/ToggleDisplayButton',
	'ModelBrowser/BasicTreeNode'
]);

require([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-style',
	'dojo/_base/array',
	'dojo/_base/connect',
	'dojo/aspect',
	'dojo/text!../Views/ModelBrowserTreeNodeTemplate.html'
], function (
	declare,
	lang,
	domStyle,
	array,
	connect,
	aspect,
	treeNodeTemplate
) {
	var ToggleDisplayAction = { show: 'show', hide: 'hide' };
	var OriginEventType = { originHoverEvent: 'originHoverEvent' };

	return dojo.setObject(
		'VC.Widgets.ModelBrowserTreeNode',
		declare([VC.Widgets.BasicTreeNode], {
			toggleButton: null,
			templateString: '',
			originHoverEvent: true,

			onGetSelectedNodeId: function () {},

			constructor: function () {
				this.templateString = treeNodeTemplate;

				Object.defineProperty(this, 'modelNodeIds', {
					get: function () {
						var returnedValue = null;
						var userdata = this.item.userdata;

						if (userdata && userdata.nodeIds) {
							var array = userdata.nodeIds.split(',');
							returnedValue = array.map(Number);
						}

						return returnedValue;
					}
				});

				Object.defineProperty(this, 'cadStructureIds', {
					get: function () {
						var returnedValue = null;
						var userdata = this.item.userdata;

						if (userdata) {
							if (userdata.cadStructureIds) {
								returnedValue = userdata.cadStructureIds;
							} else {
								returnedValue = userdata.itemId;
							}
						}
						return returnedValue;
					}
				});

				Object.defineProperty(this, 'isSelected', {
					get: function () {
						var selectedNodeId = this._onGetSelectedNodeId();
						return selectedNodeId === this.item.id;
					}
				});

				Object.defineProperty(this, 'treeNodeId', {
					get: function () {
						return this.item.id;
					}
				});

				Object.defineProperty(this, 'isVisible', {
					get: function () {
						return this.toggleButton && this.toggleButton.isVisible;
					}
				});
			},

			postCreate: function () {
				var self = this;

				this.inherited(arguments);
				this.createToggleButton(this.item);
				this.iconNode.setAttribute('src', this.item.openIcon);

				connect.connect(this, 'onMouseOver', this, function (event) {
					// prevents bubbling of mouseOver event to roots nodes
					if (this.originHoverEvent) {
						self.toggleButton.show();
						this._setParentsNodesOriginEvent(OriginEventType.originHoverEvent);
					}

					this.originHoverEvent = true;
				});

				connect.connect(this, 'onMouseOut', this, function (event) {
					if (!self.isSelected) {
						self.toggleButton.hide();
					}
				});

				VC.TreeNodeToTreeConnector.onTreeNodeRendered(this.treeNodeId, this.id);
			},

			createToggleButton: function (item) {
				this.toggleButton = new VC.Widgets.ToggleDisplayButton(
					{},
					this.toggleButtonNode
				);
				this.toggleButton.treeNodeId = item.id;
				this.toggleButton.onAfterShow = lang.partial(
					lang.hitch(this, this.setNodesVisibility),
					ToggleDisplayAction.show
				);
				this.toggleButton.onAfterHide = lang.partial(
					lang.hitch(this, this.setNodesVisibility),
					ToggleDisplayAction.hide
				);
				this.toggleButton.hide();

				this.contentNode.appendChild(this.toggleButton.domNode);
			},

			setNodesVisibility: function (action) {
				this.setNodeAndChildrenVisibility(action);
				this.setParentNodeVisibility(action);
			},

			setNodeVisibility: function (action) {
				switch (action) {
					case ToggleDisplayAction.show:
						this.toggleButton.Enable();
						this.labelNode.style.color = '#000';
						break;
					case ToggleDisplayAction.hide:
						this.toggleButton.Disable();
						this.labelNode.style.color = '#bfbfbf';
						break;
				}
			},

			setNodeAndChildrenVisibility: function (action) {
				var children = this.getChildren();
				var child = null;

				this.setNodeVisibility(action);

				for (var i = 0; i < children.length; i++) {
					child = children[i];

					if (child.hasChildren()) {
						child.setNodeAndChildrenVisibility(action);
					}
					child.setNodeVisibility(action);

					switch (action) {
						case ToggleDisplayAction.show:
							child.toggleButton.showPart();
							break;
						case ToggleDisplayAction.hide:
							child.toggleButton.hidePart();
							break;
					}
				}
			},

			setParentNodeVisibility: function (action) {
				var parent = this.getParent();
				if (parent && parent.item) {
					switch (action) {
						case ToggleDisplayAction.show:
							parent.setNodeVisibility(action);
							break;
						case ToggleDisplayAction.hide:
							if (parent.allChildHidden()) {
								parent.setNodeVisibility(action);
							}
							break;
					}
					parent.setParentNodeVisibility(action);
				}
			},

			_setParentsNodesOriginEvent: function (eventType) {
				var parent = this.getParent();

				if (parent.item && parent.toggleButton) {
					parent._setParentsNodesOriginEvent(eventType);
					parent[eventType] = false;
				}
			},

			_onGetSelectedNodeId: function () {
				return this.onGetSelectedNodeId();
			},

			enableDisplayButton: function () {
				if (this.toggleButton) {
					this.toggleButton.Enable();
					this.labelNode.style.color = '#000';
				}
			},

			disableDisplayButton: function () {
				if (this.toggleButton) {
					this.toggleButton.Disable();
					this.labelNode.style.color = '#bfbfbf';
				}
			},

			allChildHidden: function () {
				var children = this.getChildren();
				var child = null;

				for (var i = 0; i < children.length; i++) {
					child = children[i];
					if (child.isVisible) {
						return false;
					}
				}
				return true;
			}
		})
	);
});
