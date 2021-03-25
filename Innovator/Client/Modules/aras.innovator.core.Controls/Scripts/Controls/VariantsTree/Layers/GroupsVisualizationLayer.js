define('Controls/VariantsTree/Layers/GroupsVisualizationLayer', [
	'dojo/_base/declare',
	'Controls/VariantsTree/Layers/VisualizationLayer'
], function (declare, VisualizationLayer) {
	var GroupsTransformationFactory = function (direction) {
		this.isHorizontal = direction === 'ltr';
		this.visualSettings = {};

		this.gTransform = function (d) {
			return 'translate(' + d.data.x + ',' + d.data.y + ')';
		}.bind(this);

		this.gLabelTransform = function (isFirst) {
			var settings = this.visualSettings;

			if (this.isHorizontal) {
				return (
					'translate(-' +
					settings.labelWidth / 2 +
					',' +
					(isFirst
						? '-30'
						: settings.sourceBounds.height + settings.sourceMargin * 2) +
					')'
				);
			} else {
				return (
					'translate(-' +
					(isFirst
						? -settings.labelWidth - 30
						: settings.sourceBounds.width + settings.sourceMargin * 2) +
					', -15)'
				);
			}
		}.bind(this);

		this.pathD = function (d) {
			if (this.isHorizontal) {
				return (
					'M 0 0 V ' +
					(this.visualSettings.sourceBounds.height +
						this.visualSettings.sourceMargin * 2)
				);
			} else {
				return (
					'M' +
					this.visualSettings.labelWidth +
					',' +
					0 +
					'H' +
					(this.visualSettings.groupLineWidth - this.visualSettings.labelWidth)
				);
			}
		}.bind(this);
	};

	GroupsTransformationFactory.prototype.setVisualSettings = function (
		visualSettings
	) {
		this.visualSettings = visualSettings || {};
	};

	GroupsTransformationFactory.prototype.get = function (type, property) {
		var transformations = {
			g: {
				transform: this.gTransform,
				'label:transform': this.gLabelTransform
			},
			path: {
				d: this.pathD
			}
		};

		return transformations[type][property];
	};

	return declare(
		'Aras.Controls.CFG.GroupsVisualizationLayer',
		[VisualizationLayer],
		{
			groupPropertyName: 'groupName',
			sourceLayer: null,
			_groupData: null,
			_dragData: null,
			_visibleGroupCount: null,
			_d3Framework: null,
			_isGroupGrabbed: null,
			visualization: {
				labelWidth: 180,
				sourceMargin: 150,
				transitionDuration: 50
			},

			constructor: function (initialArguments) {
				initialArguments = initialArguments || {};

				this.setSourceLayer(initialArguments.sourceLayer);
			},

			_initializeProperties: function (initialArguments) {
				this.inherited(arguments);

				if (initialArguments.groupPropertyName) {
					this.groupPropertyName = initialArguments.groupPropertyName;
				}

				this._d3Framework = initialArguments.d3Framework;
				this.dndCallback = initialArguments.dndCallback;
				this.groupsTransform = new GroupsTransformationFactory('ltr');
			},

			grabHandler: function (targetDomNode, targetDataNode) {
				if (!this._isGroupGrabbed) {
					var groupItems = this._groupData;
					var dragData = {
						sourceDataNode: targetDataNode,
						dragIndex: groupItems.indexOf(targetDataNode.data),
						sourceDomNode: targetDomNode,
						groupDomNodes: this.contentNode.querySelectorAll('.GroupAnchor'),
						leftBoundingNode: null,
						rightBoundingNode: null
					};

					if (dragData.dragIndex !== dragData.groupDomNodes.length - 1) {
						targetDomNode.parentNode.appendChild(targetDomNode);
					}

					targetDomNode._oldTransform = targetDomNode.getAttribute('transform');
					this.toggleNodeCssClass(dragData.sourceDomNode, 'dragSource', false);

					this.toggleNodeCssClass(targetDomNode, 'dragSource', true);
					this._dragData = dragData;
					this._isGroupGrabbed = true;
				}
			},

			dragHandler: function (targetDomNode, targetDataNode) {
				var dragData = this._dragData;
				var groupItems = this._groupData.slice(0, this._visibleGroupCount);
				var cursorPosition = this._d3Framework.event.x;
				var dropIndex;

				// searching drop target
				for (dropIndex = 0; dropIndex < groupItems.length; dropIndex++) {
					if (groupItems[dropIndex].x >= cursorPosition) {
						break;
					}
				}

				if (
					dropIndex !== dragData.dragIndex &&
					dropIndex - 1 !== dragData.dragIndex
				) {
					var itemData;
					var d3DomNode;
					var leftBoundingNode;
					var rightBoundingNode;
					var isLeftBoundUpdated;
					var isRightBoundUpdated;

					dragData.dropIndex = dropIndex;

					leftBoundingNode =
						dropIndex > 0 && dragData.groupDomNodes[dropIndex - 1];
					isLeftBoundUpdated = leftBoundingNode !== dragData.leftBoundingNode;

					rightBoundingNode =
						groupItems.length && dragData.groupDomNodes[dropIndex];
					isRightBoundUpdated =
						rightBoundingNode !== dragData.rightBoundingNode;

					// first step is to cleanup current bounding nodes
					if (dragData.leftBoundingNode && isLeftBoundUpdated) {
						this._cleanupDragBoundingNode(dragData, 'leftBoundingNode');
					}

					if (dragData.rightBoundingNode && isRightBoundUpdated) {
						this._cleanupDragBoundingNode(dragData, 'rightBoundingNode');
					}

					// after that setup new bounding nodes position and styling
					if (leftBoundingNode && isLeftBoundUpdated) {
						d3DomNode = this._d3Framework.select(leftBoundingNode);
						itemData = groupItems[dropIndex - 1];

						this.toggleNodeCssClass(leftBoundingNode, 'boundingNode', true);
						leftBoundingNode._oldTransform =
							leftBoundingNode._oldTransform ||
							leftBoundingNode.getAttribute('transform');
						d3DomNode
							.transition()
							.duration(this.visualization.transitionDuration)
							.attr(
								'transform',
								'translate(' + (itemData.x - 80) + ',' + (itemData.y - 5) + ')'
							);

						dragData.leftBoundingNode = leftBoundingNode;
					}

					if (rightBoundingNode && isRightBoundUpdated) {
						d3DomNode = this._d3Framework.select(rightBoundingNode);
						itemData = groupItems[dropIndex];

						this.toggleNodeCssClass(rightBoundingNode, 'boundingNode', true);
						rightBoundingNode._oldTransform =
							rightBoundingNode._oldTransform ||
							rightBoundingNode.getAttribute('transform');
						d3DomNode
							.transition()
							.duration(this.visualization.transitionDuration)
							.attr(
								'transform',
								'translate(' + (itemData.x + 80) + ',' + (itemData.y - 5) + ')'
							);

						dragData.rightBoundingNode = rightBoundingNode;
					}
				} else {
					dragData.dropIndex = -1;

					this._cleanupDragBoundingNode(dragData, 'leftBoundingNode');
					this._cleanupDragBoundingNode(dragData, 'rightBoundingNode');
				}

				dragData.sourceDomNode.setAttribute(
					'transform',
					'translate(' +
						this._d3Framework.event.x +
						',' +
						dragData.sourceDataNode.data.y +
						')'
				);
			},

			_cleanupDragBoundingNode: function (dragData, nodePropertyName) {
				var targetNode = dragData && dragData[nodePropertyName];

				if (targetNode) {
					var d3DomNode = this._d3Framework.select(targetNode);

					this.toggleNodeCssClass(targetNode, 'boundingNode', false);

					d3DomNode
						.transition()
						.duration(10)
						.attr('transform', targetNode._oldTransform);

					dragData[nodePropertyName] = null;
				}
			},

			getActualLayerBounds: function () {
				var sourceLayerBounds = this.sourceLayer.getMaxLayerBounds();
				var sourceMargin = this.visualization.sourceMargin;

				return {
					x: sourceLayerBounds.x,
					right: sourceLayerBounds.right,
					width: sourceLayerBounds.width,
					y: sourceLayerBounds.y - sourceMargin,
					bottom: sourceLayerBounds.bottom + sourceMargin,
					height: sourceLayerBounds.height + sourceMargin * 2
				};
			},

			dropHandler: function () {
				var dragData = this._dragData;
				var runDropCallback =
					dragData.dropIndex > -1 && typeof this.dndCallback == 'function';
				var sourceDomNode = dragData.sourceDomNode;

				if (runDropCallback) {
					var groupItems = this._groupData;
					var insertAfter = dragData.dropIndex == groupItems.length;
					var sourceGroupId = groupItems[dragData.dragIndex].itemId;
					var targetGroupId =
						groupItems[
							insertAfter ? dragData.dropIndex - 1 : dragData.dropIndex
						].itemId;

					this.dndCallback(sourceGroupId, targetGroupId, insertAfter);
				}

				if (dragData.dragIndex !== dragData.groupDomNodes.length - 1) {
					var parentDomNode = sourceDomNode.parentNode;

					parentDomNode.insertBefore(
						sourceDomNode,
						parentDomNode.childNodes[dragData.dragIndex]
					);
				}

				this._cleanupDragBoundingNode(dragData, 'leftBoundingNode');
				this._cleanupDragBoundingNode(dragData, 'rightBoundingNode');
				this.toggleNodeCssClass(sourceDomNode, 'dragSource', false);
				sourceDomNode.setAttribute('transform', sourceDomNode._oldTransform);

				this._dragData = null;
				this._isGroupGrabbed = false;
			},

			_preprocessData: function (sourceLayerData) {
				var foundGroups = this._constructGroupData(sourceLayerData);

				if (foundGroups) {
					this._groupData = Object.keys(foundGroups).map(function (key) {
						return foundGroups[key];
					});

					return this._d3Framework
						.stratify()
						.id(function (d) {
							return d.itemId;
						})
						.parentId(function (d) {
							return d.parentId;
						})(this._groupData);
				}
			},

			_constructGroupData: function (sourceLayerData) {
				if (sourceLayerData) {
					var sourceDataNodes = sourceLayerData.descendants().slice(1);

					if (sourceDataNodes.length) {
						var foundGroups = {};
						var treeBounds = this.sourceLayer.getActualLayerBounds();
						var isHorizontal = this.groupsTransform.isHorizontal;
						var groupData;
						var groupName;
						var currentNode;
						var itemData;
						var parentData;

						for (i = 0; i < sourceDataNodes.length; i++) {
							currentNode = sourceDataNodes[i];
							itemData = currentNode.data.itemData;
							groupName = itemData && itemData[this.groupPropertyName];

							if (groupName) {
								groupData = foundGroups[groupName];
								parentData =
									currentNode.parent && currentNode.parent.data.itemData;

								if (!groupData) {
									groupData = {
										label: groupName,
										itemId: itemData.sourceId,
										parentId: (parentData && parentData.sourceId) || '',
										x: isHorizontal
											? currentNode.y
											: treeBounds.x - this.visualization.sourceMargin,
										y: isHorizontal
											? treeBounds.y - this.visualization.sourceMargin
											: currentNode.x
									};

									foundGroups[groupName] = groupData;
								} else if (!groupData.parentId && parentData) {
									groupData.parentId = parentData.sourceId;
								}
							}
						}

						return foundGroups;
					}
				}
			},

			setSourceLayer: function (sourceLayer) {
				if (this.sourceLayer) {
					this.sourceLayer.removeEventListeners(this);
				}

				this.sourceLayer = sourceLayer;

				if (this.sourceLayer) {
					eventListener = this.sourceLayer.addEventListener(
						this,
						this,
						'onRenderLayer',
						function () {
							this.renderLayer();
						}
					);

					eventListener = this.sourceLayer.addEventListener(
						this,
						this,
						'onResizeLayer',
						function () {
							this.invalidateLayer();
						}
					);
				}
			},

			setData: function (layerData) {
				this.layerData = this._preprocessData(layerData);
			},

			renderHandler: function () {
				this.setData(
					this.sourceLayer.isRegistered() && this.sourceLayer.layerData
				);

				if (this.layerData) {
					var treeBounds = this.sourceLayer.getActualLayerBounds();

					// setup visual settings before rendering
					this.groupsTransform.setVisualSettings({
						labelWidth: this.visualization.labelWidth,
						sourceBounds: treeBounds,
						sourceMargin: this.visualization.sourceMargin
					});

					this._renderItems(this.layerData.descendants(), {
						renderMethod: this._buildNodeContent
					});
				}
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
				var availableSpace = this.visualization.labelWidth - 60;

				return this.normalizeText(
					textContent,
					Math.floor(availableSpace / (requiredSpace / textContent.length))
				);
			},

			_buildNodeContent: function (dataItem) {
				var visualSettings = this.groupsTransform.visualSettings;
				var resultHTML = '';
				var labelGroup;

				// left label group creation
				labelGroup = this.wrapInTag('', 'rect', {
					rx: 2,
					width: visualSettings.labelWidth,
					height: 30
				});

				labelGroup += this.wrapInTag(
					this._getNormalizedText('GroupAnchor', '', dataItem.data.label),
					'text',
					{
						x: visualSettings.labelWidth / 2,
						y: 20
					}
				);

				resultHTML += this.wrapInTag(labelGroup, 'g', {
					transform: this.groupsTransform.get('g', 'label:transform')(true)
				});

				// right label group creation
				labelGroup = this.wrapInTag('', 'rect', {
					rx: 2,
					width: visualSettings.labelWidth,
					height: 30
				});

				labelGroup += this.wrapInTag(
					this._getNormalizedText(
						'GroupAnchor SecondLabel',
						'',
						dataItem.data.label
					),
					'text',
					{
						x: visualSettings.labelWidth / 2,
						y: 20
					}
				);

				resultHTML += this.wrapInTag(labelGroup, 'g', {
					class: 'SecondLabel',
					transform: this.groupsTransform.get('g', 'label:transform')()
				});

				// link rendering
				resultHTML += this.wrapInTag('', 'path', {
					class: 'GroupLink',
					d: this.groupsTransform.get('path', 'd')(dataItem)
				});

				resultHTML += this.wrapInTag('', 'path', {
					class: 'HelpLink',
					d: this.groupsTransform.get('path', 'd')(dataItem)
				});

				// root group node creation
				resultHTML = this.wrapInTag(resultHTML, 'g', {
					class: 'GroupAnchor',
					transform: this.groupsTransform.get('g', 'transform')(dataItem)
				});

				return resultHTML;
			},

			_renderItems: function (dataItems, optionalParameters) {
				var groupNodes = this.inherited(arguments);

				this._visibleGroupCount = dataItems.length;

				if (groupNodes) {
					var d3Framework = this._d3Framework;
					var self = this;
					var i = 0;

					groupNodes = d3Framework.selectAll(groupNodes);

					// creating references between dom nodes and dataItems
					groupNodes.datum(function () {
						return dataItems[i++];
					});

					// attaching DnD event handlers
					groupNodes
						.call(
							d3Framework
								.drag()
								.on('start', function (d) {
									self.grabHandler(this, d);
								})
								.on('drag', this.dragHandler.bind(this))
								.on('end', this.dropHandler.bind(this))
						)
						.on('mousemove', this.showNodeTooltip.bind(this));

					return groupNodes;
				}
			},

			showNodeTooltip: function (dataItem) {
				var itemData = dataItem.data;

				this.ownerControl.showTooltip(this, dataItem, [
					{ label: 'Group Name', value: itemData.label }
				]);

				this._d3Framework.event.stopPropagation();
			},

			_invalidateVisibleNodes: function (targetGroupNodes) {
				var visualSettings = this.groupsTransform.visualSettings;

				targetGroupNodes
					.transition()
					.duration(this.visualization.transitionDuration)
					.style('opacity', '1')
					.attr('transform', this.groupsTransform.get('g', 'transform'));

				// second label group positioning
				targetGroupNodes
					.selectAll('.SecondLabel')
					.transition()
					.duration(this.visualization.transitionDuration)
					.attr(
						'transform',
						this.groupsTransform.get('g', 'label:transform')()
					);

				targetGroupNodes
					.selectAll('path')
					.transition()
					.duration(this.visualization.transitionDuration)
					.attr('d', this.groupsTransform.get('path', 'd'));

				this._visibleGroupCount = targetGroupNodes.size();
			},

			_dataItemComparer: function (dataItem) {
				return dataItem.data.itemId;
			},

			invalidateLayer: function () {
				if (this.layerData) {
					var foundGroups = this._constructGroupData(
						this.sourceLayer.layerData
					);
					var dataNodes = this.layerData.descendants();
					var allGroupNodes = this._d3Framework
						.select(this.contentNode)
						.selectAll('.GroupAnchor');
					var visibleItems = [];
					var hiddenItems = [];
					var currentDataItem;
					var visibleGroupNodes;
					var hiddenGroupNodes;
					var nodeData;
					var i;

					// setup visual settings before node positioning
					this.groupsTransform.setVisualSettings({
						labelWidth: this.visualization.labelWidth,
						sourceBounds: this.sourceLayer.getActualLayerBounds(),
						sourceMargin: this.visualization.sourceMargin
					});

					// nodes filtering
					for (i = 0; i < dataNodes.length; i++) {
						currentDataItem = dataNodes[i];
						nodeData = currentDataItem.data;
						groupData = foundGroups && foundGroups[nodeData.label];

						if (groupData) {
							nodeData.x = groupData.x;
							nodeData.y = groupData.y;

							visibleItems.push(currentDataItem);
						} else {
							hiddenItems.push(currentDataItem);
						}
					}

					// show and position active group nodes
					visibleGroupNodes = allGroupNodes.data(
						visibleItems,
						this._dataItemComparer
					);
					this._invalidateVisibleNodes(visibleGroupNodes);

					// hiding group nodes, that currently should not be displayed
					hiddenGroupNodes = visibleGroupNodes.exit();
					hiddenGroupNodes
						.transition()
						.duration(this.visualization.transitionDuration)
						.style('opacity', '0');

					this._updateMaxLayerBounds();
				}
			},

			destroy: function () {
				if (this.sourceLayer) {
					this.sourceLayer.removeEventListeners(this);
				}

				this.inherited(arguments);
			}
		}
	);
});
