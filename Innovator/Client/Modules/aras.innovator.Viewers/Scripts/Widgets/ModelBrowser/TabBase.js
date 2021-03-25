require([
	'dojo/_base/declare',
	'Aras/Client/Controls/Experimental/Tree',
	'dijit/layout/ContentPane'
], function (declare, tree, ContentPane) {
	return dojo.setObject(
		'VC.ModelBrowser.Tabs.TabBase',
		declare(ContentPane, {
			name: null,
			title: null,
			tree: null,
			nodesDictionary: [],
			isActive: false,

			onAllNodesRendered: function () {},

			loopByNodes: function (callback, afterLoopCalback) {
				var treeNodeIds = Object.keys(this.nodesDictionary);
				var treeNodeId = null;
				var treeNode = null;

				for (var i = 0; i < treeNodeIds.length; i++) {
					treeNodeId = treeNodeIds[i];
					treeNode = dijit.byId(this.nodesDictionary[treeNodeId].widgetId);

					if (treeNode && callback) {
						callback(treeNode);
					}
				}

				if (afterLoopCalback) {
					afterLoopCalback();
				}
			},

			// sets all toggle buttons enabled state
			setNodesEnabled: function () {
				this.loopByNodes(function (treeNode) {
					if (treeNode.toggleButton) {
						treeNode.enableDisplayButton();
					}
				});
			},

			setNodeEnabled: function (treeNodeId) {
				this.loopByNodes(function (treeNode) {
					if (
						treeNode.toggleButton &&
						treeNode.toggleButton.treeNodeId === treeNodeId
					) {
						treeNode.enableDisplayButton();
					}
				});
			},

			setNodeDisabled: function (treeNodeId) {
				this.loopByNodes(function (treeNode) {
					if (
						treeNode.toggleButton &&
						treeNode.toggleButton.treeNodeId === treeNodeId
					) {
						treeNode.disableDisplayButton();
					}
				});
			},

			// sets all toggle buttons are disabled except treeNodeId and all its parent,
			// if treeNodeId is not set, disable all toggle buttons
			setNodesDisabled: function (treeNodeId) {
				var exceptionsCadIdsArray = [];
				var self = this;

				function addParentToArray(node) {
					var parent = node.getParent();

					if (parent.item && parent.toggleButton) {
						addParentToArray(parent);
						if (exceptionsCadIdsArray.indexOf() === -1) {
							exceptionsCadIdsArray.push(parent.toggleButton.treeNodeId);
						}
					}
				}

				function disableToggleButtons() {
					self.loopByNodes(function (treeNode) {
						if (
							treeNode.toggleButton &&
							exceptionsCadIdsArray.indexOf(
								treeNode.toggleButton.treeNodeId
							) === -1
						) {
							treeNode.disableDisplayButton();
						}
					});
				}

				if (treeNodeId) {
					exceptionsCadIdsArray.push(treeNodeId);
				}

				this.loopByNodes(function (treeNode) {
					if (
						treeNode.toggleButton &&
						treeNode.toggleButton.treeNodeId === treeNodeId
					) {
						addParentToArray(treeNode);
					}
				}, disableToggleButtons);
			},

			setNodesDisabledByModelNodeIds: function (
				modelNodeIds,
				treeNodeIdToModelNodeIdDictionary
			) {
				this.loopByNodes(function (treeNode) {
					treeNode.enableDisplayButton();
				});
				for (var i = 0; i < modelNodeIds.length; i++) {
					var treeNodeId = treeNodeIdToModelNodeIdDictionary.getTreeNodeId(
						modelNodeIds[i]
					);
					var treeNode = dijit.byId(this.nodesDictionary[treeNodeId].widgetId);
					treeNode.disableDisplayButton();
				}
			},

			setTabVisibility: function (doVisible) {
				this.isActive = doVisible;
			},

			fillNodesDictionary: function (treeXml) {
				this.nodesDictionary = {};
				this.hiddenItemsIds = [];
				var currentId = null;
				var index = 1; // index 1 matches with id value
				var regexp = new RegExp('id="([\\w\\d]+)"', 'g');
				var result = null;

				while ((result = regexp.exec(treeXml)) !== null) {
					currentId = result[index];

					if (currentId) {
						this.nodesDictionary[currentId] = {
							isRendered: false,
							widgetId: null
						};
					}
				}
			},

			getModelNodeIdsOfHiddenTreeNodes: function () {
				var modelNodeIds = [];

				this.loopByNodes(function (treeNode) {
					if (treeNode && !treeNode.isVisible) {
						modelNodeIds = modelNodeIds.concat(treeNode.modelNodeIds);
					}
				});

				return modelNodeIds;
			},

			_processTreeNode: function (nodeId, widgetId) {
				var currentNodeId = null;
				var isRendered = null;
				var allNodesAreRendered = true;

				if (this.nodesDictionary.hasOwnProperty(nodeId)) {
					this.nodesDictionary[nodeId].isRendered = true;
					this.nodesDictionary[nodeId].widgetId = widgetId;
				}

				var keys = Object.keys(this.nodesDictionary);
				for (var i = 0; i < keys.length; i++) {
					currentNodeId = keys[i];
					isRendered = this.nodesDictionary[currentNodeId].isRendered;

					if (!isRendered) {
						allNodesAreRendered = false;
						break;
					}
				}

				if (allNodesAreRendered) {
					this.onAllNodesRendered();
				}
			}
		})
	);
});
