import GraphDataLoader from './GraphDataLoader';
import GraphControl from './GraphControl';
import GraphLayoutsEnum from './GraphLayouts/GraphLayoutsEnum';

export default class GraphViewApplicationCore {
	constructor(initialArguments) {
		this.mouseButtonClickCount = 0;
		this.gvdToolbarItemPrefix = 'toolbar_';
		this.layoutEnums = GraphLayoutsEnum;
		this.arasObject = initialArguments.arasObject;
		this.contextItem = initialArguments.contextItem;
		this.contextItemType = initialArguments.contextItem.getAttribute('type');
		this.dataLoader = new GraphDataLoader({
			arasObject: this.arasObject
		});
		this.graphViewDefinitionId = initialArguments.gvdId;
		if (!this.graphViewDefinitionId) {
			const gvdList = this.dataLoader.getGVDList(this.contextItemType);
			this.graphViewDefinitionId = gvdList.length ? gvdList[0].id : '';
		}
		this.dataLoader.setGvdId(this.graphViewDefinitionId);
		this.graphControl = new GraphControl({
			connectId: 'graphView',
			graphLayout: GraphLayoutsEnum.LayoutType.Horizontal,
			arasObject: this.arasObject
		});

		this.containerNode = document.querySelector('#graphView');
		this.svgNode = this.containerNode.firstChild;
	}

	init() {
		this.graphControl.onItemExtend = this.onItemExtend.bind(this);

		window.addEventListener('resize', this.onWindowResize.bind(this));
		window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
		this.svgNode.addEventListener(
			'selectstart',
			this.onViewerSelectStart.bind(this)
		);
		this.svgNode.addEventListener('wheel', this.onWheelEventHandler.bind(this));
		this.svgNode.addEventListener(
			'mousedown',
			this.onViewerStartPan.bind(this)
		);
		this.svgNode.addEventListener(
			'mouseup',
			this.onDoubleClickHandler.bind(this)
		);
		document.addEventListener('mousemove', this.onViewerPan.bind(this));
		document.addEventListener('mouseleave', this.onViewerEndPan.bind(this));
		document.addEventListener('mouseup', this.onViewerEndPan.bind(this));
	}

	loadView(contextItemId, contextItemType) {
		const graphData = this.dataLoader.loadData(
			contextItemId,
			contextItemType,
			this.graphViewDefinitionId
		);

		if (graphData && graphData.nodes && graphData.nodes.length) {
			this.graphControl.setContextItemId(graphData.nodes[0].id);
			this.graphControl.loadGraph(graphData);
		}
	}

	_isConnectorItem(itemData) {
		return itemData && itemData.source && itemData.target;
	}

	onGVDDropdownClick(gvdId) {
		if (gvdId) {
			gvdId = gvdId.replace(this.gvdToolbarItemPrefix, '');
			this.arasObject.evalItemMethod('gn_ShowGraph', this.contextItem, {
				gvdId: gvdId
			});
		}
	}

	onItemExtend(nodeData, connectorKeys) {
		if (nodeData) {
			const nodeId = JSON.stringify(nodeData.node_key);
			return this.dataLoader.extendData(
				nodeId,
				nodeData.type,
				this.graphViewDefinitionId,
				connectorKeys
			);
		}
	}

	onWindowResize() {
		this.graphControl.adjustViewBounds();
	}

	onViewerSelectStart(targetEvent) {
		this._stopEvent(targetEvent);
	}

	_stopEvent(targetEvent) {
		targetEvent.stopPropagation();
		targetEvent.preventDefault();
	}

	setGraphScale(newScale) {
		const currentCenterX =
			(this.containerNode.scrollLeft + this.containerNode.clientWidth / 2) /
			this.containerNode.scrollWidth;
		const currentCenterY =
			(this.containerNode.scrollTop + this.containerNode.clientHeight / 2) /
			this.containerNode.scrollHeight;

		this.graphControl.setGraphScale(newScale);

		this.containerNode.scrollLeft =
			currentCenterX * this.containerNode.scrollWidth -
			this.containerNode.clientWidth / 2;
		this.containerNode.scrollTop =
			currentCenterY * this.containerNode.scrollHeight -
			this.containerNode.clientHeight / 2;
	}

	onViewerStartPan(mouseEvent) {
		this.panCoordinates = { x: mouseEvent.clientX, y: mouseEvent.clientY };

		if (mouseEvent.button === 1) {
			// prevent default behavior for middle mouse button
			this._stopEvent(mouseEvent);
		}
	}

	onViewerPan(mouseEvent) {
		if (this.panCoordinates) {
			const containerNode = this.containerNode;
			const deltaX = mouseEvent.clientX - this.panCoordinates.x;
			const deltaY = mouseEvent.clientY - this.panCoordinates.y;

			if (deltaX) {
				containerNode.scrollLeft -= deltaX * 2;
			}
			if (deltaY) {
				containerNode.scrollTop -= deltaY * 2;
			}

			this.panCoordinates.x = mouseEvent.clientX;
			this.panCoordinates.y = mouseEvent.clientY;
		}
	}

	onViewerEndPan() {
		this.panCoordinates = null;
	}

	onDoubleClickHandler(mouseEvent) {
		if (mouseEvent.button < 2) {
			this.mouseButtonClickCount++;

			if (!this.doubleClickTimeout) {
				this.doubleClickTimeout = setTimeout(
					function () {
						clearTimeout(this.doubleClickTimeout);
						this.doubleClickTimeout = null;

						if (this.mouseButtonClickCount >= 2) {
							this.graphControl.centerView();
						}
						this.mouseButtonClickCount = 0;
					}.bind(this),
					250
				);
			}
		} else {
			this.mouseButtonClickCount = 0;
		}
	}

	onWheelEventHandler(wheelEvent) {
		const scaleStep = wheelEvent.deltaY > 0 ? -0.1 : 0.1;
		const actualGraphScale = this.graphControl.getGraphScale();

		this.setGraphScale(actualGraphScale + scaleStep);
		this._stopEvent(wheelEvent);
	}

	onBeforeUnload() {
		window.removeEventListener('resize', this.onWindowResize);
		this.svgNode.removeEventListener('selectstart', this.onViewerSelectStart);
		this.svgNode.removeEventListener('wheel', this.onWheelEventHandler);
		this.svgNode.removeEventListener('mousedown', this.onViewerStartPan);
		this.svgNode.removeEventListener('mousedown', this.onDoubleClickHandler);
		document.removeEventListener('mousemove', this.onViewerPan);
		document.removeEventListener('mouseleave', this.onViewerEndPan);
		document.removeEventListener('mouseup', this.onViewerEndPan);
	}
}
