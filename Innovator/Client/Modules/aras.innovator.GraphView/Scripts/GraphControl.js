import GraphLayer from './GraphLayer';
import getLayoutInstance from './GraphLayouts/GraphLayoutFactory';
import ExpandSettingsMenu from './ExpandSettingsMenu';

export default class GraphControl {
	constructor(initialParameters) {
		initialParameters = initialParameters || {};

		if (initialParameters.connectId) {
			this.containerNode =
				typeof initialParameters.connectId === 'string'
					? document.getElementById(initialParameters.connectId)
					: initialParameters.connectId;

			this.d3 = window.d3;
			this.arasObject = initialParameters.arasObject;
			this.activeLayoutType = initialParameters.graphLayout;
			this.zoomListener = this.d3
				.zoom()
				.scaleExtent([0.1, 2])
				.on('zoom', this._zoomHandler.bind(this));

			this._createDom();
			this.initPromise = this._createContextMenu();
			this.expandSettingsMenu = new ExpandSettingsMenu(this.arasObject);
			this._attachDomEventListeners();

			this.graphLayer = new GraphLayer({
				d3Framework: this.d3,
				owner: this,
				graphLayout: getLayoutInstance(this.activeLayoutType)
			});
		}
	}

	setLayoutType(layoutType) {
		const newGraphLayout = getLayoutInstance(layoutType);

		this.activeLayoutType = layoutType;
		this.graphLayer.setGraphLayout(newGraphLayout);
		this.graphLayer.invalidateLayer();
	}

	_createDom() {
		if (this.containerNode) {
			this.svgNode = this.d3.select(this.containerNode).append('svg');
			this.svgDefs = this.svgNode.append('defs');
			this.domNode = this.svgNode
				.append('g')
				.attr('class', 'ViewContent')
				.node();
		}
	}

	_attachDomEventListeners() {
		this.svgNode.on('click', this.hideExpandSettingsMenu.bind(this));

		this.d3
			.select(this.svgNode.node())
			.call(this.zoomListener)
			.on('.zoom', null);
	}

	async _createContextMenu() {
		this.contextMenu = new ArasModules.ContextMenu();
		const cuiContextMenu = await window.cuiContextMenu(
			this.contextMenu,
			'GraphView.PopupMenu'
		);

		this.containerNode.addEventListener('contextmenu', (event) => {
			event.preventDefault();

			let targetNode = event.target;
			let targetNodeData;
			do {
				targetNodeData = this.d3.select(targetNode).datum();
				targetNode = targetNode.parentNode;
			} while (!targetNodeData && targetNode !== this.containerNode);

			cuiContextMenu.show(
				{
					x: event.clientX,
					y: event.clientY
				},
				{
					targetNodeData
				}
			);

			this.hideExpandSettingsMenu();
		});
	}

	hideExpandSettingsMenu() {
		this.expandSettingsMenu.hidePopupWindow();
	}

	_zoomHandler() {
		const eventTransform = this.d3.event.transform;

		this.domNode.setAttribute('transform', eventTransform.toString());
		this.currentTransform = eventTransform;
	}

	onItemExtend(nodeData, connectorKeys) {}

	loadGraph(graphData) {
		const containerBounds = this.containerNode.getBoundingClientRect();

		this.graphLayer.setData(graphData);
		this.centerView(containerBounds);
	}

	setContextItemId(contextItemId) {
		if (contextItemId) {
			this.contextItemId = contextItemId;
		}
	}

	setTransform(scale, offsetX, offsetY) {
		const zoomTransform = this.d3.zoomTransform(this.svgNode.node());

		zoomTransform.k = scale;
		zoomTransform.x = offsetX;
		zoomTransform.y = offsetY;

		this.zoomListener.transform(this.svgNode, zoomTransform);
	}

	setGraphScale(newScale, containerBounds) {
		this.hideExpandSettingsMenu();

		if (newScale > 0) {
			this.zoomListener.scaleTo(this.svgNode, newScale);
			this.adjustViewBounds(containerBounds);
		}
	}

	getGraphScale() {
		const zoomTransform = this.d3.zoomTransform(this.svgNode.node());
		return zoomTransform.k;
	}

	expandNode(nodeData) {
		if (nodeData) {
			this.graphLayer.extendAllNodes(nodeData);
			this.graphLayer.expandChildNodes(nodeData);
			this.graphLayer.expandParentNodes(nodeData);
			this.graphLayer.invalidateLayer(nodeData);
		}
	}

	collapseNode(nodeData) {
		if (nodeData) {
			this.graphLayer.collapseChildNodes(nodeData);
			this.graphLayer.collapseParentNodes(nodeData);
			this.graphLayer.invalidateLayer(nodeData);
		}
	}

	collapseConnector(connectorData) {
		if (connectorData) {
			this.graphLayer.collapseConnector(connectorData);
			this.graphLayer.invalidateLayer(connectorData.source);
		}
	}

	centerCINode() {
		const rootNode = this.graphLayer.getRootNode();

		this.centerNode(rootNode.domNode);
	}

	centerNode(targetNode) {
		if (targetNode) {
			if (
				this.containerNode.scrollHeight > this.containerNode.offsetHeight &&
				this.containerNode.scrollWidth > this.containerNode.offsetWidth
			) {
				const boundingRect = targetNode.getBoundingClientRect();
				this.containerNode.scrollLeft +=
					boundingRect.left -
					(this.containerNode.clientWidth - boundingRect.width) / 2;
				this.containerNode.scrollTop +=
					boundingRect.top -
					this.containerNode.offsetTop -
					(this.containerNode.clientHeight - boundingRect.height) / 2;
			} else {
				this.adjustViewBounds();
			}
		}
	}

	centerView(precalculatedContainerBounds) {
		const containerBounds =
			precalculatedContainerBounds ||
			this.containerNode.getBoundingClientRect();
		const viewBounds = this.graphLayer.getActualLayerBounds();
		const requiredScale = Math.min(
			(containerBounds.width - 20) / (viewBounds.width + 300),
			(containerBounds.height - 20) / (viewBounds.height + 200)
		);

		this.setGraphScale(requiredScale, containerBounds);
	}

	adjustViewBounds(containerBounds) {
		containerBounds = containerBounds || {};

		const currentScale = this.currentTransform.k;
		const svgDomNode = this.svgNode.node();
		const viewBounds = this.graphLayer.getActualLayerBounds();

		const calculatedViewHeight = (viewBounds.height + 200) * currentScale;
		const calculatedViewWidth = (viewBounds.width + 300) * currentScale;
		const calculatedTopPosition = (Math.abs(viewBounds.y) + 100) * currentScale;
		const containerHeight =
			(containerBounds.height || this.containerNode.offsetHeight) - 20;
		const containerWidth =
			(containerBounds.width || this.containerNode.offsetWidth) - 20;

		const newWidth = Math.max(calculatedViewWidth, containerWidth);
		const newHeight = Math.max(calculatedViewHeight, containerHeight);

		svgDomNode.setAttribute('width', newWidth);
		svgDomNode.setAttribute('height', newHeight);

		if (calculatedViewHeight < containerHeight) {
			const viewCenterOffset =
				(calculatedTopPosition * 2 - calculatedViewHeight) / 2;

			this.setTransform(
				currentScale,
				(newWidth - (viewBounds.width + 2 * viewBounds.x) * currentScale) / 2,
				newHeight / 2 + viewCenterOffset
			);
		} else {
			this.setTransform(
				currentScale,
				(newWidth - (viewBounds.width + 2 * viewBounds.x) * currentScale) / 2,
				calculatedTopPosition
			);
		}
	}
}
