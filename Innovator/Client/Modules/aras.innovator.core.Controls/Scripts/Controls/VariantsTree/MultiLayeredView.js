define('Controls/VariantsTree/MultiLayeredView', [
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'Vendors/d3.min',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'Controls/VariantsTree/TooltipControl'
], function (
	declare,
	connect,
	popup,
	d3Framework,
	ContextMenu,
	TooltipControl
) {
	return declare(null, {
		containerNode: null,
		domNode: null,
		svgNode: null,
		zoomListener: null,
		contextMenu: null,
		_layers: null,
		_layersById: null,
		_definitionsCounter: 0,
		_scaleExtent: null,
		tooltipControl: null,
		_isDomCreated: false,
		_frameworks: null,

		constructor: function (initialArguments) {
			initialArguments = initialArguments || {};

			if (initialArguments.connectId) {
				this.containerNode =
					typeof initialArguments.connectId == 'string'
						? document.getElementById(initialArguments.connectId)
						: initialArguments.connectId;
				this._layers = [];
				this._layersById = {};
				this._frameworks = { d3: d3Framework };

				this._createDom();
				this._createContextMenu();
				this.tooltipControl = new TooltipControl({
					containerNode: this.containerNode,
					contentType: 'labeled'
				});

				this.zoomListener = d3Framework
					.zoom()
					.on('zoom', this._zoomHandler.bind(this));
				this.setScaleExtent(initialArguments.scaleExtent || [0.2, 2]);

				this._attachDomEventListeners();
			}
		},

		_createDom: function () {
			if (this.containerNode) {
				this.svgNode = d3Framework
					.select(this.containerNode)
					.append('svg')
					.attr('class', 'MultiLayeredView');
				this.defsNode = this.svgNode.append('defs');
				this.domNode = this.svgNode
					.append('g')
					.attr('class', 'ViewContent')
					.node();

				this._isDomCreated = true;
			}
		},

		_attachDomEventListeners: function () {
			if (this._isDomCreated) {
				this.svgNode.on('mouseover', this.hideTooltip.bind(this));

				d3Framework
					.select(this.containerNode)
					.call(this.zoomListener)
					.on('.zoom', null);
			}
		},

		getFramework: function (frameworkName) {
			return frameworkName && this._frameworks[frameworkName];
		},

		getScaleExtent: function () {
			/// <summary>
			/// Returns 2-element array, which contains min scale value as first element and max scale as second.
			/// </summary>
			/// <returns>Array (length = 2)</returns>
			return this._scaleExtent;
		},

		setScaleExtent: function (newScaleExtent) {
			/// <summary>
			/// Sets scale extent (bounds) for the view.
			/// </summary>
			/// <param name="newScaleExtent" type="Array"> Two elements array with min and max scale values</param>
			if (newScaleExtent && newScaleExtent.length == 2) {
				var minScale = newScaleExtent[0];
				var maxScale = newScaleExtent[1];

				this._scaleExtent =
					minScale <= maxScale ? [minScale, maxScale] : [maxScale, minScale];
				this.zoomListener.scaleExtent(this._scaleExtent);
			}
		},

		showTooltip: function (targetLayer, targetItem, tooltipItems) {
			/// <summary>
			/// Shows tooltip with tooltipItems rows.
			/// </summary>
			/// <param name="targetLayer" type="[Object, VisualizationLayer, Nullable]">View layer, that forced tooltip showing</param>
			/// <param name="targetItem" type="[Object, Nullable]">Data item, which is a target for tooltip</param>
			/// <param name="tooltipItems" type="Array of Strings|Objects">Items, which contain information for tooltip rows</param>
			/// <example>
			///  <code lang="javascript">
			///    this.showTooltip(null, null, ['First TooltipRow', {value: 'SecondTooltipRow', label: 'RowLabel', cssClass: 'CustomRowClass'}]);
			///  </code>
			/// </example>
			if (targetItem) {
				var tooltipData = this.tooltipControl.tooltipData || {};

				if (targetItem !== tooltipData.targetItem) {
					tooltipData.positionX =
						d3Framework.event.pageX -
						this.containerNode.offsetLeft +
						this.containerNode.scrollLeft +
						15;
					tooltipData.positionY =
						d3Framework.event.pageY -
						this.containerNode.offsetTop +
						this.containerNode.scrollTop +
						5;
					tooltipData.tooltipItems = tooltipItems;
					tooltipData.targetItem = targetItem;

					this.tooltipControl.showTooltip(tooltipData);
				}
			} else {
				this.hideTooltip();
			}
		},

		hideTooltip: function () {
			/// <summary>
			/// Hides active tooltip.
			/// </summary>
			this.tooltipControl.hideTooltip();
		},

		getNewDefinitionIndex: function () {
			/// <summary>
			/// Resturns new index for definition nodes.
			/// </summary>
			/// <returns>Number</returns>
			return this._definitionsCounter++;
		},

		cleanupView: function () {
			/// <summary>
			/// Remove all registered layers from view.
			/// </summary>
			var currentLayer;
			var layerId;

			for (layerId in this._layersById) {
				currentLayer = this._layersById[layerId];
				currentLayer.destroy();
			}

			this._layers = [];
			this._layersById = {};
		},

		addLayer: function (visualizationLayer) {
			/// <summary>
			/// Add new visualization layer to the view.
			/// </summary>
			/// <param name="visualizationLayer" type="[Object, VisualizationLayer, Nullable]">Instance of VisualizationLayer</param>
			if (visualizationLayer) {
				var layerId = visualizationLayer.id;

				if (!this._layersById[layerId]) {
					var layerD3DomNode;

					this._layers.push(visualizationLayer);
					this._layersById[layerId] = visualizationLayer;

					visualizationLayer.setOwner(this);
					visualizationLayer.renderLayer();
					visualizationLayer.domNode.setAttribute('layerId', layerId);
				} else {
					console.log('Layer with id "' + layerId + '" is already exists.');
				}
			}
		},

		removeLayer: function (layerId) {
			/// <summary>
			/// Remove existing visualization layer from the view.
			/// </summary>
			/// <param name="layerId" type="String|Index">Id or index of target visualization layer.</param>
			var existingLayer = this.getLayer(layerId);

			if (existingLayer) {
				existingLayer.setOwner(null);

				delete this._layersById[layerId];
				this._layers.splice(this._layers.indexOf(existingLayer), 1);
			}
		},

		getLayer: function (layerId) {
			/// <summary>
			/// Returns registed visualization layer.
			/// </summary>
			/// <param name="layerId" type="String|Index">Id or index of target visualization layer.</param>
			/// <returns>Found [Object, VisualizationLayer]</returns>
			return typeof layerId == 'number'
				? layerId >= 0 && layerId < this._layers.length && this._layers[layerId]
				: this._layersById[layerId];
		},

		showLayer: function (layerId) {
			/// <summary>
			/// Show registed visualization layer.
			/// </summary>
			/// <param name="layerId" type="String|Index">Id or index of target visualization layer.</param>
			var existingLayer = this.getLayer(layerId);

			if (existingLayer) {
				existingLayer.showLayer();
				this.adjustViewBounds();
			}
		},

		hideLayer: function (layerId) {
			/// <summary>
			/// Hide registed visualization layer.
			/// </summary>
			/// <param name="layerId" type="String|Index">Id or index of target visualization layer.</param>
			var existingLayer = this.getLayer(layerId);

			if (existingLayer) {
				existingLayer.hideLayer();
				this.adjustViewBounds();
			}
		},

		isLayerVisible: function (layerId) {
			/// <summary>
			/// Returns current layer visibility state.
			/// </summary>
			/// <param name="layerId" type="String|Index">Id or index of target visualization layer.</param>
			/// <returns>Boolean</returns>
			var existingLayer = this.getLayer(layerId);

			return existingLayer && existingLayer.isVisible;
		},

		_createContextMenu: function () {
			this.contextMenu = new ContextMenu(this.containerNode);
			this.containerNode.oncontextmenu = this._showContextMenu.bind(this);
		},

		onMenuItemClick: function (commandId, nodeId) {},

		onMenuInit: function (menuEvent, targetLayer, targetDataNode, menuItems) {},

		onMenuSetup: function (
			menuEvent,
			targetLayer,
			targetDataNode,
			menuItems
		) {},

		getDataNodeByDomNode: function (targetDomNode) {
			/// <summary>
			/// Gets data item which is bound to the target dom Node.
			/// </summary>
			/// <param name="targetDomNode" type="Node">Dom Node which have bounded data item</param>
			/// <returns>Object</returns>
			var foundNode = null;

			if (targetDomNode) {
				while (
					!foundNode &&
					targetDomNode &&
					targetDomNode !== this.containerNode
				) {
					foundNode = d3Framework.select(targetDomNode).datum();
					targetDomNode = targetDomNode.parentNode;
				}
			}

			return foundNode;
		},

		getLayerIndex: function (targetLayer) {
			/// <summary>
			/// Get index of view layer.
			/// </summary>
			/// <param name="targetLayer" type="[Object, VisualizationLayer]">Registered view layer.</param>
			/// <returns>Number. Returns -1 if layer wasn't found.</returns>
			return this._layers.indexOf(targetLayer);
		},

		getFirstLayer: function () {
			/// <summary>
			/// Get first view layer.
			/// </summary>
			/// <returns>VisualizationLayer</returns>
			return this._layers.length && this._layers[0];
		},

		getLayersList: function () {
			/// <summary>
			/// Get list of registered view layers.
			/// </summary>
			/// <returns>Array of VisualizationLayers</returns>
			return this._layers.slice();
		},

		getLastLayer: function () {
			/// <summary>
			/// Get last view layer.
			/// </summary>
			/// <returns>VisualizationLayer</returns>
			return this._layers.length && this._layers[this._layers.length - 1];
		},

		getLayersCount: function () {
			/// <summary>
			/// Get count of registered view layers.
			/// </summary>
			/// <returns>Number</returns>
			return this._layers.length;
		},

		moveLayer: function (layerId, newPosition) {
			/// <summary>
			/// Move registered view layer to the new position.
			/// </summary>
			/// <param name="layerId" type="String|Number">Id or index of target visualization layer.</param>
			/// <param name="newPosition" type="Number">Layer index after move operation.</param>
			var targetLayer = this.getLayer(layerId);

			if (targetLayer && targetLayer.isRegistered()) {
				var layerIndex = this.getLayerIndex(targetLayer);
				var layersCount = this.getLayersCount();

				if (layerIndex !== newPosition && layersCount) {
					var layerNode;

					newPosition = Math.max(0, Math.min(this._layers.length, newPosition));

					// physically switching layer nodes
					if (newPosition) {
						if (newPosition == this._layers.length) {
							this.domNode.appendChild(targetLayer.domNode);
						} else {
							var referenceLayer = this.getLayer(
								layerIndex < newPosition ? newPosition + 1 : newPosition
							);

							if (referenceLayer) {
								this.domNode.insertBefore(
									targetLayer.domNode,
									referenceLayer.domNode
								);
							} else {
								this.domNode.appendChild(targetLayer.domNode);
							}
						}
					} else {
						this.domNode.insertBefore(
							targetLayer.domNode,
							this.domNode.firstChild
						);
					}

					// update layers list after node switching
					layerNode = this.domNode.firstChild;
					this._layers = [];

					while (layerNode) {
						layerId = layerNode.getAttribute('layerId');
						this._layers.push(this._layersById[layerId]);

						layerNode = layerNode.nextSibling;
					}
				}
			}
		},

		getLayerByDomNode: function (targetDomNode) {
			/// <summary>
			/// Get owner visualization layer for target DOM Node.
			/// </summary>
			/// <param name="targetDomNode" type="DOM Node">Descendant view content Node.</param>
			/// <returns>VisualizationLayer</returns>
			if (targetDomNode) {
				var layerDomNode;

				while (targetDomNode) {
					if (
						targetDomNode.nodeName === 'g' &&
						targetDomNode.getAttribute('groupType') === 'layer'
					) {
						layerDomNode = targetDomNode;
						break;
					}

					targetDomNode = targetDomNode.parentNode;
				}

				return (
					layerDomNode && this.getLayer(layerDomNode.getAttribute('layerId'))
				);
			}
		},

		_showContextMenu: function (menuEvent, additionalSettings) {
			var targetNode = menuEvent.target;
			var ownerLayer = this.getLayerByDomNode(targetNode);
			var dataNode = this.getDataNodeByDomNode(targetNode);

			if (!this.contextMenu.menuInited) {
				var menuModel = this.onMenuInit();

				if (menuModel && menuModel.length) {
					this.contextMenu.addRange(menuModel);

					connect.connect(
						this.contextMenu,
						'onItemClick',
						function (commandId, nodeData) {
							this.onMenuItemClick(commandId, nodeData && nodeData.data);
							this._hideContextMenu();
						}.bind(this)
					);

					connect.connect(
						this.contextMenu.menu,
						'onBlur',
						function () {
							this._hideContextMenu();
						}.bind(this)
					);

					connect.connect(
						this.contextMenu.menu,
						'onKeyPress',
						function (keyEvent) {
							if (keyEvent.keyCode == 27) {
								this._hideContextMenu();
							}
						}.bind(this)
					);
				}

				this.contextMenu.menuInited = true;
			}

			this.contextMenu.rowId = { data: dataNode };
			this.onMenuSetup(this.contextMenu, ownerLayer, dataNode);

			popup.open({
				popup: this.contextMenu.menu,
				x: menuEvent.clientX,
				y: menuEvent.clientY
			});

			this._stopEvent(menuEvent);
		},

		adjustViewBounds: function () {
			/// <summary>
			/// Recalculate size for svg Node based on current scale and layers content bounds.
			/// </summary>
			var currentScale = this.currentTransform.k;
			var viewBounds = this.getViewBounds();
			var svgDomNode = this.svgNode.node();
			var calculatedViewHeight = (viewBounds.height + 200) * currentScale;
			var calculatedViewWidth = (viewBounds.width + 300) * currentScale;
			var calculatedTopPosition = (Math.abs(viewBounds.y) + 100) * currentScale;
			var containerHeight = this.containerNode.offsetHeight - 20;
			var containerWidth = this.containerNode.offsetWidth - 20;
			var newWidth = Math.max(calculatedViewWidth, containerWidth);
			var newHeight = Math.max(calculatedViewHeight, containerHeight);

			svgDomNode.setAttribute('width', newWidth);
			svgDomNode.setAttribute('height', newHeight);

			if (calculatedViewHeight < containerHeight) {
				var viewCenterOffset =
					(calculatedTopPosition * 2 - calculatedViewHeight) / 2;

				this.setTransform(
					currentScale,
					(newWidth - viewBounds.width * currentScale) / 2,
					newHeight / 2 + viewCenterOffset
				);
			} else {
				this.setTransform(
					currentScale,
					(newWidth - viewBounds.width * currentScale) / 2,
					calculatedTopPosition
				);
			}
		},

		_stopEvent: function (targetEvent) {
			if (targetEvent) {
				targetEvent.preventDefault();
				targetEvent.stopPropagation();
			}
		},

		_hideContextMenu: function () {
			popup.close(this.contextMenu.menu);
		},

		onScaleChanged: function (newScale) {
			/// <summary>
			/// Event fired when scale was changed.
			/// </summary>
		},

		_zoomHandler: function () {
			var eventTransform = d3Framework.event.transform;

			this.domNode.setAttribute('transform', eventTransform.toString());
			this.currentTransform = eventTransform;
		},

		setScale: function (newScale) {
			/// <summary>
			/// Change view current scale value.
			/// </summary>
			/// <param name="newScale" type="Number">New scale value between min and max values(ScaleExtent).</param>
			this.zoomListener.scaleTo(this.svgNode, newScale);
			this.adjustViewBounds();

			this.onScaleChanged(newScale);
		},

		setTransform: function (scale, offsetX, offsetY) {
			/// <summary>
			/// Manually set view transformation parameters.
			/// </summary>
			/// <param name="scale" type="Number">Required view scale value.</param>
			/// <param name="offsetX" type="Number">X-axis offset in pixels.</param>
			/// <param name="offsetY" type="Number">Y-axis offset in pixels.</param>
			var zoomTransform = d3Framework.zoomTransform(this.svgNode.node());

			zoomTransform.k = scale;
			zoomTransform.x = offsetX;
			zoomTransform.y = offsetY;

			this.zoomListener.transform(this.svgNode, zoomTransform);
		},

		getScale: function () {
			/// <summary>
			/// Get view current scale value.
			/// </summary>
			/// <returns>Number</returns>
			var zoomTransform = d3Framework.zoomTransform(this.svgNode.node());
			var currentScale = zoomTransform.k;
			return currentScale;
		},

		centerNode: function (targetNode) {
			/// <summary>
			/// Calculate and set view offset transformation coordinates to get target data item in the center of viewport.
			/// </summary>
			/// <param name="targetNode" type="[Object]">Layer data item.</param>
			var zoomTransform = d3Framework.zoomTransform(this.svgNode.node());
			var currentScale = zoomTransform.k;
			var x = -targetNode.y;
			var y = -targetNode.x;

			x = x * currentScale + this.containerNode.clientWidth / 2;
			y = y * currentScale + this.containerNode.clientHeight / 2;

			zoomTransform = zoomTransform.translate(x, y);
			this.zoomListener.transform(this.svgNode, zoomTransform);
		},

		getViewBounds: function (actualBounds) {
			/// <summary>
			/// Get view bounds recteangle.
			/// </summary>
			/// <param name="actualBounds" type="Boolean">Flag, that affects particular layer bounds calculation. If true, then bounds wull be calculated
			///  based on current layer content, in other case max layer bounds will be used for calculation.
			/// </param>
			/// <returns>DOMRect</returns>
			var currentLayer;
			var layerBounds;
			var viewBounds;
			var layerId;

			for (layerId in this._layersById) {
				currentLayer = this._layersById[layerId];

				if (currentLayer.isVisible) {
					layerBounds = actualBounds
						? currentLayer.getActualLayerBounds()
						: currentLayer.getMaxLayerBounds();

					if (layerBounds) {
						if (!viewBounds) {
							viewBounds = layerBounds;
						} else {
							viewBounds.x = Math.min(viewBounds.x, layerBounds.x);
							viewBounds.y = Math.min(viewBounds.y, layerBounds.y);
							viewBounds.width = Math.max(viewBounds.width, layerBounds.width);
							viewBounds.height = Math.max(
								viewBounds.height,
								layerBounds.height
							);
						}
					}
				}
			}

			return viewBounds || this.svgNode.node().getBBox();
		},

		centerView: function () {
			/// <summary>
			/// Calculates and sets optimal view scale, when layers content fits client viewport.
			/// </summary>
			var viewBounds = this.getViewBounds();
			var containerBounds = this.containerNode.getBoundingClientRect();
			var requiredScale = Math.min(
				(containerBounds.width - 20) / (viewBounds.width + 300),
				(containerBounds.height - 20) / (viewBounds.height + 200)
			);

			this.setScale(requiredScale);
		}
	});
});
