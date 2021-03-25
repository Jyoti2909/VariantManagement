define('Controls/VariantsTree/Layers/TreeVisualizationLayer', [
	'dojo/_base/declare',
	'Controls/VariantsTree/Layers/VisualizationLayer'
], function (declare, VisualizationLayer) {
	return declare(
		'Aras.Controls.CFG.TreeVisualizationLayer',
		[VisualizationLayer],
		{
			treeLayout: null,
			_treeHeight: 0,
			_precalculatedRenderData: null,
			_collapsedCounter: 0,
			visualization: {
				levelSpacing: 200,
				transitionDuration: 100,
				maxLabelLength: 15,
				maxSubLabelLength: 25
			},
			_d3Framework: null,

			constructor: function (initialArguments) {},

			_getIconDefinitionId: function (iconHref) {
				var iconDefinitions = this._precalculatedRenderData.iconDefinitions;
				var definitionId =
					iconDefinitions[iconHref] && iconDefinitions[iconHref].id;

				if (!definitionId) {
					var newDefinitionNode;

					definitionId =
						'iconSymbol' + this.ownerControl.getNewDefinitionIndex();

					newDefinitionNode = this.ownerControl.defsNode
						.append('image')
						.attr('id', definitionId)
						.attr('href', iconHref)
						.attr('width', 26)
						.attr('height', 26);

					iconDefinitions[iconHref] = {
						id: definitionId,
						node: newDefinitionNode
					};
				}

				return definitionId;
			},

			_getNodeCenterOffset: function () {
				return this.visualization.levelSpacing / 2;
			},

			setSpacing: function (spacingValue) {
				if (spacingValue !== this.visualization.levelSpacing) {
					var layerMaxBounds = this.getMaxLayerBounds();

					this.visualization.levelSpacing = spacingValue;
					this.treeLayout.nodeSize([2, spacingValue]);
					this.treeLayout(this.layerData);
					this.renderLayer();

					this._maxLayerBounds = layerMaxBounds;

					// updating maxBounds x-axe properties, which should be updated after spacing changes
					actualLayerBounds = this.getActualLayerBounds();
					this._maxLayerBounds.right = actualLayerBounds.right;
					this._maxLayerBounds.width = actualLayerBounds.width;
				}
			},

			_getActiveParentItem: function (dataItem) {
				var parentItem = dataItem.parent;

				while (parentItem && parentItem.passedNode) {
					parentItem = parentItem.parent;
				}

				return parentItem;
			},

			_initializeProperties: function (initialArguments) {
				this.inherited(arguments);

				this._precalculatedRenderData = {
					iconDefinitions: {}
				};

				this._d3Framework = initialArguments.d3Framework;
				this._classedNodeHash = {};

				this.treeLayout = this._d3Framework
					.tree()
					.nodeSize([2, this.visualization.levelSpacing])
					.separation(
						function (a, b) {
							return a.parent == b.parent
								? (a.children && b.children) || a.depth === this._treeHeight
									? 16
									: 45
								: 30;
						}.bind(this)
					);
			},

			_cleanupPrecalculatedData: function () {
				if (this._precalculatedRenderData) {
					var iconDefinitions = this._precalculatedRenderData.iconDefinitions;
					var collectionKey;
					var definitionNode;

					for (collectionKey in iconDefinitions) {
						definitionNode = iconDefinitions[collectionKey].node;
						definitionNode.remove();

						delete iconDefinitions[collectionKey];
					}
				}
			},

			_preprocessData: function (layerData) {
				var preparedData = layerData
					? this._d3Framework.hierarchy(layerData)
					: this.generateTreeData(100, 5)[0];

				this._bypassStructure(
					preparedData,
					function (dataItem) {
						dataItem.hasChildren =
							dataItem.children && dataItem.children.length > 0;
						dataItem.passedNode = !dataItem.data.itemData;
					},
					true
				);
				this._cleanupPrecalculatedData();

				this._treeHeight = preparedData.height;
				this.treeLayout(preparedData);
				return preparedData;
			},

			_bypassStructure: function (targetItems, bypassMethod, deepBypassing) {
				if (targetItems && bypassMethod) {
					var currentItem;
					var i;

					targetItems = targetItems
						? Array.isArray(targetItems)
							? targetItems
							: [targetItems]
						: [];
					targetItems.map(bypassMethod);

					if (deepBypassing) {
						for (i = 0; i < targetItems.length; i++) {
							currentItem = targetItems[i];

							if (currentItem.children) {
								this._bypassStructure(
									currentItem.children,
									bypassMethod,
									deepBypassing
								);
							}
						}
					}
				}
			},

			getActualLayerBounds: function () {
				// layer bounds calculated this way instead of simple getBBox, in order to increase performance on large structures
				var dataItems = this.layerData.descendants();
				var layerBounds = { x: 0, right: 0, y: 0, bottom: 0 };
				var xCoor;
				var yCoor;
				var i;

				for (i = 0; i < dataItems.length; i++) {
					xCoor = dataItems[i].y;
					yCoor = dataItems[i].x;

					if (xCoor < layerBounds.x) {
						layerBounds.x = xCoor;
					} else {
						layerBounds.right = Math.max(layerBounds.right, xCoor);
					}

					if (yCoor < layerBounds.y) {
						layerBounds.y = yCoor;
					} else {
						layerBounds.bottom = Math.max(layerBounds.bottom, yCoor);
					}
				}

				layerBounds.width = layerBounds.right - layerBounds.x;
				layerBounds.height = layerBounds.bottom - layerBounds.y;

				return layerBounds;
			},

			_getLabelTransform: function (d) {
				if (!d.depth) {
					return 'translate(0, 5)';
				} else if (d.collapsedGroup) {
					return 'translate(16, -4)';
				} else {
					if (!d.hasChildren && !d.data.itemData.subLabel) {
						return 'translate(16, 3)';
					} else {
						return 'translate(16, -4)';
					}
				}
			},

			_getSubLabelTransform: function (d) {
				return 'translate(16, 11)';
			},

			_getCountTextTransform: function (d) {
				return 'translate(7,10)';
			},

			_getCountRectCoordinates: function (d) {
				return 'M1,4 h12 v8 h-12 Z';
			},

			_getIconTransform: function (d) {
				return 'translate(-13, -13)';
			},

			_getGroupTransform: function (d) {
				return 'translate(' + (d.y + ',' + d.x) + ')';
			},

			_getGroupTransformNearParent: function (d) {
				var parentItem = this._getActiveParentItem(d);

				return 'translate(' + parentItem.y + ',' + d.x + ') scale(0.1)';
			},

			_getLinkCoordinatesStart: function (d) {
				var points = [
					{ x: -15, y: 0 },
					{ x: -16, y: 0 },
					{ x: -17, y: 0 }
				];

				return (
					'M ' +
					points[0].x +
					' ' +
					points[0].y +
					' H ' +
					points[1].x +
					' L ' +
					points[2].x +
					' ' +
					points[2].y
				);
			},

			_getCirlePathCoordinates: function (circleRadius) {
				var circleDiameter = 2 * circleRadius;

				return (
					'm-' +
					circleRadius +
					',0' +
					'a' +
					circleRadius +
					',' +
					circleRadius +
					' 0 1,0 ' +
					circleDiameter +
					',0' +
					'a' +
					circleRadius +
					',' +
					circleRadius +
					' 0 1,0 -' +
					circleDiameter +
					',0Z'
				);
			},

			_getRhombusPathCoordinates: function (diagonalWidth) {
				var halfWidth = diagonalWidth / 2;

				return (
					'm-' +
					halfWidth +
					',0' +
					'l' +
					halfWidth +
					',-' +
					halfWidth +
					' ' +
					halfWidth +
					',' +
					halfWidth +
					' -' +
					halfWidth +
					',' +
					halfWidth +
					' -' +
					halfWidth +
					',-' +
					halfWidth
				);
			},

			_getSquarePathCoordinates: function (squareWidth, roundRadius) {
				if (squareWidth) {
					var halfWidth = squareWidth / 2;
					var edgeWidth = squareWidth - roundRadius * 2;

					if (roundRadius) {
						var roundCommand = roundRadius
							? 'a' + roundRadius + ',' + roundRadius + ' 0 0,1 '
							: '';

						return (
							'm-' +
							halfWidth +
							',' +
							(halfWidth - roundRadius) +
							'v-' +
							edgeWidth +
							roundCommand +
							roundRadius +
							',-' +
							roundRadius +
							'h' +
							edgeWidth +
							roundCommand +
							roundRadius +
							',' +
							roundRadius +
							'v' +
							edgeWidth +
							roundCommand +
							'-' +
							roundRadius +
							',' +
							roundRadius +
							'h-' +
							edgeWidth +
							roundCommand +
							'-' +
							roundRadius +
							',-' +
							roundRadius
						);
					} else {
						return (
							'm-' +
							halfWidth +
							',' +
							(halfWidth - roundRadius) +
							'v-' +
							edgeWidth +
							'h' +
							edgeWidth +
							'v' +
							edgeWidth +
							'h-' +
							edgeWidth
						);
					}
				}
			},

			_getLinkExpandShapeCoordinates: function (dataItem) {
				var itemData = dataItem.data.itemData || {};
				var expandShapeCoordinates = '';

				if (dataItem.collapsedGroup || !itemData.icon) {
					var isRootItem = !dataItem.depth;
					var collapseCircleRadius = isRootItem
						? 8
						: dataItem.collapsedGroup
						? 2
						: dataItem.hasChildren
						? dataItem.data.collapsed
							? 7
							: 6
						: 3;

					expandShapeCoordinates += this._getCirlePathCoordinates(
						collapseCircleRadius
					);
				}

				return expandShapeCoordinates;
			},

			_getLinkCoordinatesDefault: function (dataItem) {
				var linkPathCoordinates = '';
				var itemData = dataItem.data.itemData || {};
				var isRootItem = !dataItem.depth;
				var expandShape = this._getLinkExpandShapeCoordinates(dataItem);

				if (expandShape) {
					linkPathCoordinates +=
						'M' + (isRootItem ? 17 : 0) + ',0' + expandShape;
				}

				if (isRootItem) {
					if (dataItem.data.collapsed) {
						linkPathCoordinates +=
							'M30,0h' + (this.visualization.levelSpacing - 45);
					} else {
						linkPathCoordinates +=
							'M30,0h' + (this.visualization.levelSpacing - 85);
					}
				} else {
					var parentItem = this._getActiveParentItem(dataItem);
					var parentStartX = parentItem.y - dataItem.y;
					var parentEndX = parentStartX + this.visualization.levelSpacing;

					if (!dataItem.collapsedGroup) {
						var parentOffsetY = parentItem.x - dataItem.x;
						var angle = Math.atan2(30, parentOffsetY);
						var angleCos = Math.cos(angle);
						var roundX = Math.abs(Math.round(8 * angleCos));
						var roundY = Math.round(5 * angleCos);

						// draw rounded line
						linkPathCoordinates +=
							(itemData.icon
								? 'M-15,0' + 'h' + (parentEndX - 5)
								: 'M-7,0' + 'h' + (parentEndX - 13)) +
							'q-' +
							roundX +
							' 0 -8,' +
							roundY +
							'L' +
							(parentEndX - 55) +
							',' +
							parentOffsetY +
							//'L' + (parentEndX - 20) + ',0Z';
							'L' +
							(parentEndX - 28) +
							',' +
							roundY +
							'q' +
							(8 - roundX) +
							',' +
							-roundY +
							' 8,' +
							-roundY +
							'Z';
					}

					if (dataItem.hasChildren && !dataItem.data.collapsed) {
						linkPathCoordinates +=
							'M15,0' + 'h' + (this.visualization.levelSpacing - 70);
					} else if (dataItem.collapsedGroup && parentItem.depth) {
						linkPathCoordinates += 'M-15,0' + 'h' + (parentStartX + 30);
					}
				}

				return linkPathCoordinates;
			},

			getLeafDataNodes: function () {
				return this.layerData ? this.layerData.leaves() : [];
			},

			_buildNodeContent: function (dataItem, nearParentPosition) {
				var resultHTML = '';
				var nodeClasses = this.calculateNodeClasses(dataItem);

				if (!dataItem.passedNode) {
					var itemData = dataItem.data.itemData;
					var isRootItem = !dataItem.depth;
					var normalizedLabel = this._getNormalizedText(
						nodeClasses,
						'Label',
						itemData.label
					);

					if (isRootItem) {
						resultHTML += this.wrapInTag('', 'path', {
							class: 'nodeLink',
							d: this._getLinkCoordinatesDefault(dataItem)
						});

						resultHTML += this.wrapInTag(normalizedLabel, 'text', {
							class: 'Label',
							transform: this._getLabelTransform(dataItem)
						});
					} else if (dataItem.collapsedGroup) {
						resultHTML += this.wrapInTag('', 'path', {
							class: 'nodeLink',
							d: this._getLinkCoordinatesDefault(dataItem)
						});

						resultHTML += this.wrapInTag('Group', 'text', {
							class: 'Label',
							transform: this._getLabelTransform(dataItem)
						});
						resultHTML += this.wrapInTag(
							'items: ' + dataItem.collapseInfo.itemsCount,
							'text',
							{
								class: 'SubLabel',
								transform: this._getSubLabelTransform(dataItem)
							}
						);
					} else {
						resultHTML += this.wrapInTag('', 'path', {
							class: 'nodeLink',
							d: this._getLinkCoordinatesDefault(dataItem)
						});

						if (itemData.icon) {
							resultHTML += this.wrapInTag('', 'use', {
								href: '#' + this._getIconDefinitionId(itemData.icon),
								transform: this._getIconTransform(dataItem)
							});
						}

						if (itemData.count) {
							resultHTML += this.wrapInTag('', 'path', {
								class: 'CountRectangle',
								d: this._getCountRectCoordinates(dataItem)
							});

							resultHTML += this.wrapInTag(itemData.count, 'text', {
								class: 'CountLabel',
								transform: this._getCountTextTransform(dataItem)
							});
						}

						resultHTML += this.wrapInTag(normalizedLabel, 'text', {
							class: 'Label',
							transform: this._getLabelTransform(dataItem)
						});

						if (itemData.subLabel) {
							var normalizedSubLabel = this._getNormalizedText(
								nodeClasses,
								'SubLabel',
								itemData.subLabel
							);

							resultHTML += this.wrapInTag(normalizedSubLabel, 'text', {
								class: 'SubLabel',
								transform: this._getSubLabelTransform(dataItem)
							});
						}
					}
				}

				resultHTML = this.wrapInTag(resultHTML, 'g', {
					class: nodeClasses,
					transform: nearParentPosition
						? this._getGroupTransformNearParent(dataItem)
						: this._getGroupTransform(dataItem)
				});

				return resultHTML;
			},

			_getNormalizedText: function (
				nodeClasses,
				textElementClass,
				textContent
			) {
				var requiredSpace = this._getClassedTextLength(
					nodeClasses,
					textElementClass,
					textContent
				);
				var availableSpace = this.visualization.levelSpacing - 85; // summary of Label element offset and start of child links fork

				return this.normalizeText(
					textContent,
					Math.floor(availableSpace / (requiredSpace / textContent.length))
				);
			},

			_renderItems: function (dataItems, optionalParameters) {
				var treeNodes = this.inherited(arguments);

				if (treeNodes) {
					var i = 0;

					treeNodes = this._d3Framework.selectAll(treeNodes);

					// attaching event handlers
					if (!optionalParameters.skipEventHandling) {
						treeNodes.on('click', this.clickHandler.bind(this));
						treeNodes.on('mousemove', this.showNodeTooltip.bind(this));
					}

					// creating references between dom nodes and dataItems
					treeNodes.datum(function () {
						return dataItems[i++];
					});

					return treeNodes;
				}
			},

			showNodeTooltip: function (dataItem) {
				if (dataItem.collapsedGroup) {
					this.ownerControl.showTooltip(this, dataItem, [
						{ label: 'Label', value: 'Group' },
						{ label: 'Count', value: dataItem.collapseInfo.itemsCount }
					]);
				} else {
					var itemData = dataItem.data.itemData;

					this.ownerControl.showTooltip(this, dataItem, [
						{ label: 'Label', value: itemData.label },
						{ label: 'Sublabel', value: itemData.subLabel },
						typeof itemData.count !== undefined
							? { label: 'Count', value: itemData.count }
							: null
					]);
				}

				this._d3Framework.event.stopPropagation();
			},

			renderHandler: function () {
				var dataItems = this.layerData.descendants();

				this._renderItems(dataItems, { renderMethod: this._buildNodeContent });
			},

			generateTreeData: function (
				elementCount,
				childrenCount,
				targetLevelElements
			) {
				var i;
				var j;

				targetLevelElements = targetLevelElements || [
					{ id: 'root', label: 'root', children: [] }
				];
				nextLevelElements = [];

				if (elementCount) {
					var elementChildren;
					var expectedChildrenCount;
					var currentElement;
					var newElement;

					for (i = 0; i < targetLevelElements.length; i++) {
						currentElement = targetLevelElements[i];

						expectedChildrenCount = elementCount - childrenCount;
						expectedChildrenCount =
							expectedChildrenCount >= 0
								? childrenCount
								: expectedChildrenCount;

						if (expectedChildrenCount > 0) {
							elementChildren = currentElement.children = [];

							for (j = 0; j < expectedChildrenCount; j++) {
								newElement = {
									id: elementCount.toString(),
									label: 'Element-' + elementCount
								};
								elementChildren.push(newElement);
								nextLevelElements.push(newElement);

								elementCount--;
							}
						}
					}

					this.generateTreeData(elementCount, childrenCount, nextLevelElements);
				}

				return targetLevelElements;
			},

			clickHandler: function (targetNode) {
				var nodeData = targetNode.data;

				if (nodeData.collapsed) {
					this.expandNode(targetNode);
				} else if (targetNode.hasChildren) {
					this.collapseNode(targetNode);
				}
			},

			collapseNode: function (targetNode, optionalParameters) {
				if (targetNode) {
					optionalParameters = optionalParameters || {};

					targetNode.data.collapsed = true;
					targetNode._children = targetNode.children;
					targetNode.children = this._prepareCollapsedChildren(targetNode);

					if (!optionalParameters.skipInvalidation) {
						this.invalidateLayer(targetNode);
					}
				}
			},

			collapseAll: function () {
				var leafDataItems = this.getLeafDataNodes();
				var ascendingLevelItems = new Array(this._treeHeight + 1);
				var dataItem;
				var parentDataItem;
				var levelItemsHash;
				var itemId;
				var i;

				this.expandNode(this.layerData, {
					skipInvalidation: true,
					deepExpand: true
				});

				for (i = 0; i < leafDataItems.length; i++) {
					dataItem = leafDataItems[i];
					parentDataItem = dataItem.parent;

					while (parentDataItem) {
						levelItemsHash =
							ascendingLevelItems[parentDataItem.depth] ||
							(ascendingLevelItems[parentDataItem.depth] = {});
						itemId = parentDataItem.data.id;

						if (!levelItemsHash[itemId]) {
							levelItemsHash[itemId] = parentDataItem;
						}

						parentDataItem = parentDataItem.parent;
					}
				}

				for (i = this._treeHeight; i >= 0; i--) {
					levelItemsHash = ascendingLevelItems[i] || {};

					for (itemId in levelItemsHash) {
						dataItem = levelItemsHash[itemId];
						this.collapseNode(dataItem, { skipInvalidation: true });
					}
				}

				this.invalidateLayer(this.layerData);
			},

			expandAll: function () {
				this.expandNode(this.layerData, { deepExpand: true });
			},

			_prepareCollapsedChildren: function (collapsedDataItem) {
				var collapsedItemLevel = collapsedDataItem.depth;
				var childLevelHash = {};
				var resultChildrenList = [];
				var parentLevelItem;
				var currentLevelItem;
				var i;

				this._bypassStructure(
					collapsedDataItem,
					function (dataItem) {
						if (dataItem.depth > collapsedItemLevel) {
							var levelItemInfo = childLevelHash[dataItem.depth];
							var itemsCount = dataItem.collapseInfo
								? dataItem.collapseInfo.itemsCount
								: dataItem.passedNode
								? 0
								: 1;
							var itemData = dataItem.data.itemData;

							if (levelItemInfo) {
								levelItemInfo.collapseInfo.itemsCount += itemsCount;
								levelItemInfo.data.itemData =
									levelItemInfo.data.itemData || itemData;
							} else {
								childLevelHash[dataItem.depth] = {
									data: {
										id: '_collapsedNode_' + this._collapsedCounter++,
										itemData: itemData
									},
									collapsedGroup: true,
									collapseInfo: {
										itemsCount: itemsCount
									},
									depth: dataItem.depth,
									x: collapsedDataItem.x,
									y: dataItem.y
								};
							}
						}
					}.bind(this),
					true
				);

				levelChildrenList = resultChildrenList;
				parentLevelItem = collapsedDataItem;

				for (i = collapsedItemLevel + 1; i <= this._treeHeight; i++) {
					currentLevelItem = childLevelHash[i];

					if (currentLevelItem) {
						currentLevelItem.parent = parentLevelItem;
						currentLevelItem.passedNode = !currentLevelItem.collapseInfo
							.itemsCount;

						levelChildrenList.push(currentLevelItem);
						parentLevelItem = currentLevelItem;

						if (i < this._treeHeight) {
							levelChildrenList = currentLevelItem.children = [];
							currentLevelItem.intermediateLevel = true;
						}
					} else {
						delete parentLevelItem.children;
						break;
					}
				}

				return resultChildrenList;
			},

			expandNode: function (targetNode, optionalParameters) {
				if (targetNode) {
					optionalParameters = optionalParameters || {};

					if (targetNode.data.collapsed) {
						targetNode.data.collapsed = false;
						targetNode.children = targetNode._children;
						targetNode._children = null;
					}

					if (optionalParameters.deepExpand && targetNode.children) {
						for (var i = 0; i < targetNode.children.length; i++) {
							this.expandNode(targetNode.children[i], {
								deepExpand: true,
								skipInvalidation: true
							});
						}
					}

					if (!optionalParameters.skipInvalidation) {
						this.invalidateLayer(targetNode);
					}
				}
			},

			_dataItemComparer: function (dataItem) {
				return dataItem.data.id;
			},

			invalidateLayer: function (targetNode) {
				var d3ContenNode = this._d3Framework.select(this.contentNode);
				var allNodes = d3ContenNode.selectAll('.Node');
				var transitionDuration = this.visualization.transitionDuration;
				var hiddenDataItems;
				var visibleDomNodes;
				var targetDomNode;
				var currentNode;
				var newNodes;
				var i;

				this.treeLayout(this.layerData);

				visibleDomNodes = allNodes.data(
					this.layerData.descendants(),
					this._dataItemComparer
				);
				hiddenDataItems = visibleDomNodes.exit().data();

				// hiding and deleting collapsed nodes
				visibleDomNodes
					.exit()
					.transition()
					.duration(transitionDuration)
					.style('opacity', '0')
					.attr('transform', this._getGroupTransformNearParent.bind(this))
					.remove();

				for (i = 0; i < hiddenDataItems.length; i++) {
					currentNode = hiddenDataItems[i];
					currentNode.x = 0;
					currentNode.y = 0;
				}

				// slightly bluring layer and animating opacity restoration
				d3ContenNode.style('opacity', '0.6');
				d3ContenNode
					.transition()
					.duration(transitionDuration)
					.style('opacity', '1');

				// positioning visible nodes
				visibleDomNodes
					.style('opacity', '1')
					.attr('transform', this._getGroupTransform);

				visibleDomNodes
					.select('path')
					.attr('d', this._getLinkCoordinatesDefault.bind(this));

				// creating expanded nodes
				newNodes = this._renderItems(visibleDomNodes.enter().data(), {
					nearParentPosition: true,
					renderMethod: this._buildNodeContent
				});

				if (newNodes) {
					newNodes
						.transition()
						.duration(transitionDuration)
						.style('opacity', '1')
						.attr('transform', this._getGroupTransform);
				}

				// updating target node properties
				targetDomNode = visibleDomNodes.filter(function (d) {
					return d.data.id === targetNode.data.id;
				});
				targetDomNode.attr('class', this.calculateNodeClasses);

				this.raiseEvent('onResizeLayer');
			},

			calculateNodeClasses: function (targetNode) {
				var nodeClasses = ['Node'];
				var nodeData = targetNode.data;

				if (!targetNode.parent) {
					nodeClasses.push('RootNode');
				} else if (!targetNode.hasChildren) {
					nodeClasses.push('LeafNode');
				}

				if (nodeData.collapsed) {
					nodeClasses.push('CollapsedNode');
				}

				if (targetNode.collapsedGroup) {
					nodeClasses.push('CollapsedGroup');
				}

				return nodeClasses.join(' ');
			}
		}
	);
});
