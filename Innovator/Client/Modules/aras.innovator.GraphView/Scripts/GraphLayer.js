export default class GraphLayer {
	constructor(initialArguments) {
		this.isVertical = false;
		this._nodesHash = {};
		this._connectorsHash = {};
		this._vaultIconsHash = {};
		this.ownerControl = initialArguments.owner;
		this.contentNode = this.ownerControl.domNode;
		this.layerData = { nodes: [], connectors: [] };
		this.defaultSettings = {
			borderWidth: 3,
			node: {
				rx: 2,
				width: 45,
				height: 45,
				color: '#F7F7F7',
				borderColor: '#555555'
			},
			connector: {
				color: '#555555',
				width: 1
			},
			shadow: {
				dx: 4,
				dy: 4,
				color: '#555555',
				opacity: 0.5
			},
			image: {
				width: 16,
				height: 16
			},
			text: {
				size: 14,
				weight: 'bold',
				family: 'Tahoma',
				color: '#333333',
				verticalAlignment: 'middle'
			},
			expandButton: {
				radius: 8,
				states: {
					nothingToExpand: 0,
					allCollapsed: 1,
					allExpanded: 2,
					someExpanded: 3,
					neverExtended: 9
				}
			},
			_dragMinDistance: 4
		};

		this._initializeProperties(initialArguments);
	}

	setData(layerData) {
		this.layerData = this._preprocessData(layerData);
		this.renderHandler();
	}

	getActualLayerBounds() {
		const dataItems = this._getExpandedNodes();

		if (!dataItems || !dataItems.length) {
			return { x: 0, right: 0, y: 0, bottom: 0, width: 0, height: 0 };
		}

		const layerBounds = {
			x: dataItems[0].x - dataItems[0].width / 2,
			right: dataItems[0].x + dataItems[0].width / 2,
			y: dataItems[0].y - dataItems[0].height / 2,
			bottom: dataItems[0].y + dataItems[0].height / 2
		};

		for (let i = 0; i < dataItems.length; i++) {
			const xCoor = dataItems[i].x - dataItems[i].width / 2;
			const yCoor = dataItems[i].y - dataItems[i].height / 2;

			if (xCoor < layerBounds.x) {
				layerBounds.x = xCoor;
			} else {
				layerBounds.right = Math.max(
					layerBounds.right,
					xCoor + dataItems[i].width
				);
			}

			if (yCoor < layerBounds.y) {
				layerBounds.y = yCoor;
			} else {
				layerBounds.bottom = Math.max(
					layerBounds.bottom,
					yCoor + dataItems[i].height
				);
			}
		}

		layerBounds.width = layerBounds.right - layerBounds.x;
		layerBounds.height = layerBounds.bottom - layerBounds.y;

		return layerBounds;
	}

	getRootNode(graphData) {
		if (graphData && graphData.nodes) {
			return graphData.nodes.find((node) => {
				return node.id === this.ownerControl.contextItemId;
			});
		} else {
			return this._nodesHash[this.ownerControl.contextItemId];
		}
	}

	setGraphLayout(newLayout) {
		if (newLayout) {
			this.activeGraphLayout = newLayout;
			this.isVertical = newLayout.isVertical;

			const allNodes = (this.layerData && this.layerData.nodes) || [];
			allNodes.forEach((nodeData) => {
				nodeData.inputExpandPosition = this._getInputExpandButtonCoordinates(
					nodeData
				);
				nodeData.outputExpandPosition = this._getOutputExpandButtonCoordinates(
					nodeData
				);
			});
		}
	}

	_initializeProperties(initialArguments) {
		this.d3 = initialArguments.d3Framework;
		this._uniqueDefinitionIdCounter = 0;
		this._definitionHash = {};
		this._connectorGenerator = this.d3.line().curve(this.d3.curveBasis);

		this.setGraphLayout(initialArguments.graphLayout);
	}

	_appendIconDefinition(iconData) {
		if (iconData && iconData.value) {
			const defKey = this._getDefinitionKey(iconData);
			const storedDefinition = this._definitionHash[defKey];
			if (storedDefinition) {
				return storedDefinition;
			}

			this.ownerControl.svgDefs
				.append('image')
				.attr('id', ++this._uniqueDefinitionIdCounter)
				.attr('href', this._getImageUrl(iconData.value))
				.attr(
					'width',
					iconData.contentWidth ||
						iconData.width ||
						this.defaultSettings.image.width
				)
				.attr(
					'height',
					iconData.contentHeight ||
						iconData.height ||
						this.defaultSettings.image.height
				);

			return (this._definitionHash[defKey] =
				window.location.href + '#' + this._uniqueDefinitionIdCounter);
		}
		return '';
	}

	_getImageUrl(imageData) {
		if (
			imageData &&
			imageData.toLowerCase().indexOf('vault:///?fileid=') != -1
		) {
			// jshint ignore:line
			const fileId = imageData.substr(imageData.length - 32);
			return this._vaultIconsHash[fileId];
		}
		return imageData;
	}

	_getExpandButtonClass(expandButtonState) {
		if (isFinite(expandButtonState)) {
			const buttonStates = this.defaultSettings.expandButton.states;

			switch (expandButtonState) {
				case buttonStates.allExpanded:
					return 'allExpanded';
				case buttonStates.someExpanded:
					return 'someExpanded';
				case buttonStates.allCollapsed:
				case buttonStates.neverExtended:
					return 'nothingExpanded';
				default:
					return 'emptyButton';
			}
		}
		return 'emptyButton';
	}

	_calculateOutgoingExpandButtonClass(nodeData) {
		if (nodeData) {
			const calculatedExpandButtonState = this._getNodeExpandState(nodeData);

			return (
				'outgoingCollapseButton ' +
				this._getExpandButtonClass(calculatedExpandButtonState)
			);
		}
	}

	_calculateIncomingExpandButtonClass(nodeData) {
		if (nodeData) {
			const calculatedExpandButtonState = this._getNodeExpandState(
				nodeData,
				true
			);

			return (
				'incomingCollapseButton ' +
				this._getExpandButtonClass(calculatedExpandButtonState)
			);
		}
	}

	_getNodeExpandState(nodeData, calculateParentsState) {
		const expandButtonStates = this.defaultSettings.expandButton.states;
		const canBeExpanded = calculateParentsState
			? Boolean(nodeData.activeIncomingConnectors)
			: Boolean(nodeData.activeOutgoingConnectors);

		if (!nodeData.children || !nodeData.parents || !canBeExpanded) {
			return expandButtonStates.nothingToExpand;
		}

		const hasUncollapsedItems = calculateParentsState
			? nodeData.parents.size > 0
			: nodeData.children.size > 0;
		const hasCollapsedItems = calculateParentsState
			? nodeData.collapsedParents.size > 0
			: nodeData.collapsedChildren.size > 0;
		const wasAlreadyExpanded = calculateParentsState
			? nodeData.wasParentsExtended
			: nodeData.wasChildrenExtended;

		if (hasUncollapsedItems) {
			if (hasCollapsedItems) {
				return expandButtonStates.someExpanded;
			}

			return wasAlreadyExpanded
				? expandButtonStates.allExpanded
				: expandButtonStates.someExpanded;
		}

		if (hasCollapsedItems) {
			return wasAlreadyExpanded
				? expandButtonStates.allCollapsed
				: expandButtonStates.neverExtended;
		}

		return wasAlreadyExpanded
			? expandButtonStates.nothingToExpand
			: expandButtonStates.neverExtended;
	}

	_appendArrowHeadDefinition(arrowSettings) {
		if (!arrowSettings) {
			return '';
		}
		const defKey = 'arrowhead_' + this._getDefinitionKey(arrowSettings);
		const storedDefinition = this._definitionHash[defKey];
		if (storedDefinition) {
			return storedDefinition;
		}

		arrowSettings.width = arrowSettings.width || 12;
		arrowSettings.height = arrowSettings.height || 24;

		this.ownerControl.svgDefs
			.append('marker')
			.attr('id', ++this._uniqueDefinitionIdCounter)
			.attr('markerUnits', 'userSpaceOnUse')
			.attr(
				'viewBox',
				'-0 -' +
					arrowSettings.width / 2 +
					' ' +
					arrowSettings.height +
					' ' +
					arrowSettings.height
			)
			.attr('refX', arrowSettings.height)
			.attr('refY', 0)
			.attr('orient', 'auto')
			.attr('markerWidth', Math.max(arrowSettings.width, arrowSettings.height))
			.attr('markerHeight', Math.max(arrowSettings.width, arrowSettings.height))
			.append('svg:path')
			.attr('d', this._getArrowHeadPath(arrowSettings))
			.attr(
				'fill',
				arrowSettings.color || this.defaultSettings.connector.color
			);

		return (this._definitionHash[defKey] =
			'url(' +
			window.location.href +
			'#' +
			this._uniqueDefinitionIdCounter +
			')');
	}

	_getArrowHeadPath(arrowSettings) {
		if (!arrowSettings) {
			return '';
		}

		return (
			'M 0,-' +
			arrowSettings.width / 2 +
			' L ' +
			arrowSettings.height +
			' ,0' +
			'L 0,' +
			arrowSettings.width / 2
		);
	}

	_appendShadowDefinition(shadowSettings) {
		if (!shadowSettings) {
			return '';
		}

		const defKey = this._getDefinitionKey(shadowSettings);
		const storedDefinition = this._definitionHash[defKey];
		if (storedDefinition) {
			return storedDefinition;
		}

		const filter = this.ownerControl.svgDefs
			.append('filter')
			.attr('id', ++this._uniqueDefinitionIdCounter)
			.attr('height', '120%')
			.attr('width', '120%');
		filter
			.append('feGaussianBlur')
			.attr('in', 'SourceAlpha')
			.attr('stdDeviation', 1.8)
			.attr('result', 'blur');
		filter
			.append('feOffset')
			.attr('in', 'blur')
			.attr('dx', shadowSettings.horizontal || this.defaultSettings.shadow.dx)
			.attr('dy', shadowSettings.vertical || this.defaultSettings.shadow.dy)
			.attr('result', 'offsetBlur');
		filter
			.append('feFlood')
			.attr(
				'flood-color',
				shadowSettings.color || this.defaultSettings.shadow.color
			)
			.attr(
				'flood-opacity',
				shadowSettings.opacity || this.defaultSettings.shadow.opacity
			)
			.attr('result', 'offsetColor');
		filter
			.append('feComposite')
			.attr('in', 'offsetColor')
			.attr('in2', 'offsetBlur')
			.attr('operator', 'in')
			.attr('result', 'offsetBlur');
		const feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode').attr('in', 'offsetBlur');
		feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

		return (this._definitionHash[defKey] =
			'url(' +
			window.location.href +
			'#' +
			this._uniqueDefinitionIdCounter +
			')');
	}

	_getDefinitionKey(dataSettings) {
		if (dataSettings && typeof dataSettings === 'object') {
			const objectKeys = Object.keys(dataSettings).sort();
			let compositeKey = '';

			for (let i = 0, length = objectKeys.length; i < length; i++) {
				const key = objectKeys[i];
				compositeKey += String.prototype.concat(key, ':', dataSettings[key]);
			}
			return compositeKey;
		}
	}

	_getConnectorHashKey(connectorData) {
		if (connectorData && connectorData.source && connectorData.target) {
			const sourceId = connectorData.source.id || connectorData.source;
			const targetId = connectorData.target.id || connectorData.target;

			return connectorData.id || String.prototype.concat(sourceId, targetId);
		}
	}

	_getVaultSecurityTokens(fileIDs) {
		const arasObj = this.ownerControl.arasObject;
		const dbName = arasObj.getDatabase();
		const parameters = fileIDs.map((fileId) => ({
			fileId,
			dbName
		}));
		const body = JSON.stringify({ parameters });

		const url =
			arasObj.getServerBaseURL() +
			'AuthenticationBroker.asmx/GetFilesDownloadTokens';
		const xmlHttpRequest = new XMLHttpRequest();
		xmlHttpRequest.open('POST', url, false);
		const headers = arasObj.getHttpHeadersForSoapMessage(
			'GetFilesDownloadTokens'
		);
		Object.keys(headers).forEach((headerName) =>
			xmlHttpRequest.setRequestHeader(headerName, headers[headerName])
		);
		xmlHttpRequest.setRequestHeader('content-type', 'application/json');
		xmlHttpRequest.withCredentials = true;
		xmlHttpRequest.send(body);
		return JSON.parse(xmlHttpRequest.responseText).d;
	}

	_preprocessData(layerData) {
		if (!layerData) {
			return { nodes: [], connectors: [] };
		}

		const expandStates = this.defaultSettings.expandButton.states;
		const foundVaultIconFileIds = [];
		for (let i = 0, length = layerData.nodes.length; i < length; i++) {
			const node = layerData.nodes[i];
			this._nodesHash[node.id] = node;
			node.children = new Set();
			node.collapsedChildren = new Set();
			node.parents = new Set();
			node.collapsedParents = new Set();
			node.level = Infinity;

			const outgoingConnectorsState =
				node['outgoing_connectors']?.['connectors_state'];
			const areAllNodeChildrenExpanded =
				outgoingConnectorsState === expandStates.allExpanded;
			if (areAllNodeChildrenExpanded) {
				node.wasChildrenExtended = node.isChildrenExpanded = true;
			}

			const incomingConnectorsState =
				node['incoming_connectors']?.['connectors_state'];
			const areAllNodeParentsExpanded =
				incomingConnectorsState === expandStates.allExpanded;
			if (areAllNodeParentsExpanded) {
				node.wasParentsExtended = node.isParentsExpanded = true;
			}

			this._applyInitialNodeState(node);
			this._lookupVaultIconsFiles(node, foundVaultIconFileIds);
		}
		for (let i = 0, length = layerData.connectors.length; i < length; i++) {
			const connector = layerData.connectors[i];
			const sourceId =
				connector.source.id ||
				(connector.source = this._nodesHash[connector.source]).id;
			const targetId =
				connector.target.id ||
				(connector.target = this._nodesHash[connector.target]).id;

			this._nodesHash[sourceId].children.add(this._nodesHash[targetId]);
			this._nodesHash[targetId].parents.add(this._nodesHash[sourceId]);
			this._connectorsHash[this._getConnectorHashKey(connector)] = connector;
			this._lookupVaultIconsFiles(connector, foundVaultIconFileIds);
		}

		if (foundVaultIconFileIds.length > 0) {
			const vaultIconUrls = this.ownerControl.arasObject.IomInnovator.getFileUrls(
				foundVaultIconFileIds
			)[0];
			const securityTokens = this._getVaultSecurityTokens(
				foundVaultIconFileIds
			);

			for (let i = 0; i < foundVaultIconFileIds.length; i++) {
				this._vaultIconsHash[foundVaultIconFileIds[i]] =
					vaultIconUrls[i] + '&token=' + securityTokens[i];
			}
		}

		return layerData;
	}

	_lookupVaultIconsFiles(itemData, vaultFileIds) {
		if (!itemData || !itemData.cells) {
			return;
		}

		itemData.cells.forEach((itemCell) => {
			if (
				itemCell.value &&
				itemCell.type === 'image' &&
				itemCell.value.toLowerCase().indexOf('vault:///?fileid=') != -1
			) {
				// jshint ignore:line
				vaultFileIds.push(itemCell.value.substr(itemCell.value.length - 32));
			}
		});
	}

	_applyInitialNodeState(nodeData) {
		if (nodeData) {
			nodeData.x = nodeData.x || 0;
			nodeData.y = nodeData.y || 0;
			nodeData.width = nodeData.width
				? Math.max(nodeData.width, this.defaultSettings.node.width)
				: this.defaultSettings.node.width;
			nodeData.height = nodeData.height
				? Math.max(nodeData.height, this.defaultSettings.node.height)
				: this.defaultSettings.node.height;
			nodeData.inputExpandPosition = this._getInputExpandButtonCoordinates(
				nodeData
			);
			nodeData.outputExpandPosition = this._getOutputExpandButtonCoordinates(
				nodeData
			);
		}
	}

	normalizeText(textContent, maxLength) {
		if (!textContent || !maxLength || textContent.length <= maxLength) {
			return textContent || '';
		}
		return textContent.substring(0, maxLength) + '\u2026';
	}

	_getNormalizedText(text, textData) {
		if (text && textData) {
			const requiredSpace = this._getTextLength(
				text,
				textData.font && textData.font.size
			);
			const availableSpace = textData.width - 12;

			return this.normalizeText(
				text,
				Math.floor(availableSpace / (requiredSpace / text.length))
			);
		}
	}

	_getTextLength(text, fontSize) {
		const canvas =
			this._getTextLength.canvas ||
			(this._getTextLength.canvas = document.createElement('canvas'));
		const context = canvas.getContext('2d');
		context.font =
			(fontSize || this.defaultSettings.text.size) + 'px sans-serif';
		return context.measureText(text).width;
	}

	_getNodeTransform(nodeData) {
		return (
			'translate(' +
			(nodeData.x - nodeData.width / 2) +
			',' +
			(nodeData.y - nodeData.height / 2) +
			')'
		);
	}

	_getNodeImageTransform(imageData) {
		return 'translate(' + (imageData.x + ',' + imageData.y) + ')';
	}

	_getNodeTextTransform(textData) {
		const xPos =
			textData.x +
			(textData.horizontalAlignment === 'middle'
				? textData.width / 2
				: textData.horizontalAlignment === 'end'
				? textData.width
				: 0);
		const yPos = textData.y + textData.height / 2;

		return 'translate(' + xPos + ',' + yPos + ')';
	}

	_getConnectorPath(connectorData) {
		this._computeConnectorLabelDefaultPosition(connectorData);
		const interpolationPoints = this._getConnectorInterpolationPoints(
			connectorData
		);

		return this._connectorGenerator(interpolationPoints);
	}

	_getConnectorLabelTransform(connectorData) {
		this._computeConnectorLabelDefaultPosition(connectorData);

		return this._getNodeTransform(connectorData);
	}

	_getConnectorInterpolationPoints(connectorData) {
		const points = [];

		if (connectorData && connectorData.source && connectorData.target) {
			const sourceConnectorMargin = Math.max(
				50,
				(this.isVertical
					? connectorData.source.height
					: connectorData.source.width) / 2
			);
			const targetConnectorMargin = Math.max(
				50,
				(this.isVertical
					? connectorData.target.height
					: connectorData.target.width) / 2
			);

			const startX =
				connectorData.source.x +
				(this.isVertical ? 0 : connectorData.source.width / 2);
			const startY =
				connectorData.source.y +
				(this.isVertical ? connectorData.source.height / 2 : 0);
			const endX =
				connectorData.target.x -
				(this.isVertical ? 0 : connectorData.target.width / 2);
			const endY =
				connectorData.target.y -
				(this.isVertical ? connectorData.target.height / 2 : 0);

			points.push([startX, startY]);
			points.push([
				startX + (this.isVertical ? 0 : sourceConnectorMargin),
				startY + (this.isVertical ? sourceConnectorMargin : 0)
			]);

			if (this._isLabelShiftRequired(connectorData)) {
				points.push([
					this.isVertical ? connectorData.x : startX + sourceConnectorMargin,
					this.isVertical ? startY + sourceConnectorMargin : connectorData.y
				]);
				points.push([connectorData.x, connectorData.y]);
				points.push([
					this.isVertical ? connectorData.x : endX - targetConnectorMargin,
					this.isVertical ? endY - targetConnectorMargin : connectorData.y
				]);
			}

			points.push([
				endX - (this.isVertical ? 0 : targetConnectorMargin),
				endY - (this.isVertical ? targetConnectorMargin : 0)
			]);
			if (connectorData.arrowhead) {
				points.push([
					endX - (this.isVertical ? 0 : connectorData.arrowhead.height),
					endY - (this.isVertical ? connectorData.arrowhead.height : 0)
				]);
			}

			const targetNodeExpandState = this._getNodeExpandState(
				connectorData.target,
				true
			);
			const isExpandButtonVisible =
				targetNodeExpandState !==
				this.defaultSettings.expandButton.states.nothingToExpand;
			const outOfNodeExpandButtonSize = isExpandButtonVisible
				? this.defaultSettings.expandButton.radius
				: 0;
			points.push([
				endX - (this.isVertical ? 0 : outOfNodeExpandButtonSize),
				endY - (this.isVertical ? outOfNodeExpandButtonSize : 0)
			]);
		}

		return points;
	}

	_computeConnectorLabelDefaultPosition(connectorData) {
		connectorData.x = (connectorData.source.x + connectorData.target.x) * 0.5;
		connectorData.y = (connectorData.source.y + connectorData.target.y) * 0.5;

		if (this._isLabelShiftRequired(connectorData)) {
			if (this.isVertical) {
				const horizontalShift =
					connectorData.source.x - connectorData.target.x < 0
						? -connectorData.source.width
						: connectorData.source.width;
				connectorData.x = connectorData.source.x + horizontalShift;
			} else {
				const verticalShift =
					connectorData.source.y - connectorData.target.y < 0
						? -connectorData.source.height
						: connectorData.source.height;
				connectorData.y = connectorData.source.y + verticalShift;
			}
		}
	}

	_isLabelShiftRequired(connectorData) {
		if (this.isVertical) {
			return (
				Math.abs(connectorData.source.x - connectorData.target.x) <
					2 * connectorData.target.width &&
				connectorData.source.y >= connectorData.target.y
			);
		} else {
			return (
				Math.abs(connectorData.source.y - connectorData.target.y) <
					2 * connectorData.target.height &&
				connectorData.source.x >= connectorData.target.x
			);
		}
	}

	_getInputExpandButtonCoordinates(dataItem) {
		if (dataItem) {
			return this.isVertical
				? { x: dataItem.width / 2, y: 0 }
				: { x: 0, y: dataItem.height / 2 };
		}
	}

	_getOutputExpandButtonCoordinates(dataItem) {
		if (dataItem) {
			return this.isVertical
				? { x: dataItem.width / 2, y: dataItem.height }
				: { x: dataItem.width, y: dataItem.height / 2 };
		}
	}

	getFirstParentWithData(domNode) {
		while (domNode && domNode !== this.containerNode) {
			if (this.d3.select(domNode).datum()) {
				return domNode;
			}
			domNode = domNode.parentNode;
		}
	}

	_buildExpandButton() {
		const outerCircleHtml = this.wrapInTag('', 'circle', {
			r: this.defaultSettings.expandButton.radius,
			class: 'outerExpandButtonCircle'
		});
		const innerCircleHtml = this.wrapInTag('', 'circle', {
			r: this.defaultSettings.expandButton.radius / 2,
			class: 'innerExpandButtonCircle'
		});
		return outerCircleHtml + innerCircleHtml;
	}

	_buildNode(dataItem) {
		const title = this._buildTitle(dataItem);
		const resultNode = title + this._buildNodeContent(dataItem);

		return this.wrapInTag(resultNode, 'g', {
			transform: this._getNodeTransform(dataItem)
		});
	}

	_buildNodeContent(dataItem) {
		if (!dataItem) {
			return '';
		}

		let resultHTML = '';
		const defaultSettings = this.defaultSettings;

		resultHTML += this.wrapInTag('', 'rect', {
			width: dataItem.width,
			height: dataItem.height,
			rx: dataItem.rx || defaultSettings.node.rx,
			fill: dataItem.fill || defaultSettings.node.color,
			stroke: dataItem.stroke || defaultSettings.node.borderColor,
			'stroke-width': dataItem.strokeWidth || defaultSettings.borderWidth,
			filter: this._appendShadowDefinition(dataItem.shadow)
		});

		if (dataItem.cells) {
			for (let i = 0, length = dataItem.cells.length; i < length; i++) {
				const cellData = dataItem.cells[i];
				if (cellData.strokeWidth || cellData.backgroundColor) {
					resultHTML += this.wrapInTag('', 'rect', {
						x: cellData.x,
						y: cellData.y,
						width: cellData.width,
						height: cellData.height,
						fill: cellData.backgroundColor || 'none',
						rx: cellData.rx,
						stroke: cellData.stroke,
						'stroke-width': cellData.strokeWidth || 0
					});
				}
				if (cellData.type === 'image') {
					resultHTML += this.wrapInTag('', 'use', {
						href: this._appendIconDefinition(cellData),
						transform: this._getNodeImageTransform(cellData)
					});
				} else if (cellData.type === 'text') {
					resultHTML += this.wrapInTag(
						this._getNormalizedText(cellData.value, cellData) || '',
						'text',
						{
							'text-decoration':
								cellData.textDecoration && cellData.textDecoration.line,
							'text-anchor': cellData.horizontalAlignment,
							'alignment-baseline':
								cellData.verticalAlignment ||
								defaultSettings.text.verticalAlignment,
							'font-size':
								(cellData.font && cellData.font.size) ||
								defaultSettings.text.size,
							'font-family':
								(cellData.font && cellData.font.family) ||
								defaultSettings.text.family,
							'font-weight':
								(cellData.font && cellData.font.weight) ||
								defaultSettings.text.weight,
							fill:
								(cellData.font && cellData.font.color) ||
								defaultSettings.text.color,
							filter: this._appendShadowDefinition(
								cellData.textDecoration && cellData.textDecoration.shadow
							),
							transform: this._getNodeTextTransform(cellData)
						}
					);
				}
			}
		}

		const incomingButtonState = this._getNodeExpandState(dataItem, true);
		const incomePosition = this._getInputExpandButtonCoordinates(dataItem);
		resultHTML += this.wrapInTag(this._buildExpandButton(), 'g', {
			transform: 'translate(' + [incomePosition.x, incomePosition.y] + ')',
			class:
				'incomingCollapseButton ' +
				this._getExpandButtonClass(
					incomingButtonState.status || incomingButtonState
				)
		});

		if (
			dataItem.activeOutgoingConnectors &&
			dataItem.hiddenOutgoingConnectors
		) {
			const outgoingButtonState = this._getNodeExpandState(dataItem);
			const outgoingPosition = this._getOutputExpandButtonCoordinates(dataItem);
			resultHTML += this.wrapInTag(this._buildExpandButton(), 'g', {
				transform:
					'translate(' + [outgoingPosition.x, outgoingPosition.y] + ')',
				class:
					'outgoingCollapseButton ' +
					this._getExpandButtonClass(
						outgoingButtonState.status || outgoingButtonState
					)
			});
		}

		return resultHTML;
	}

	_buildConnectorLabel(dataItem) {
		return this.wrapInTag(this._buildNodeContent(dataItem), 'g', {
			transform: this._getConnectorLabelTransform(dataItem)
		});
	}

	_buildConnectorPath(dataItem) {
		if (!dataItem) {
			return '';
		}

		const title = this._buildTitle(dataItem);
		return this.wrapInTag(title, 'path', {
			d: this._getConnectorPath(dataItem),
			stroke: dataItem.connectorColor,
			'stroke-width': dataItem.connectorWeight,
			'marker-end': this._appendArrowHeadDefinition(dataItem.arrowhead)
		});
	}

	_buildTitle(dataItem) {
		if (dataItem && dataItem.data_bindings) {
			const title = Object.values(dataItem.data_bindings)
				.filter((value) => !!value)
				.join('\n');

			if (title) {
				return `<title>${title}</title>`;
			}
		}

		return '';
	}

	_renderItems(graphData) {
		if (
			!graphData ||
			!graphData.nodes ||
			!graphData.connectors ||
			graphData.nodes.length + graphData.connectors.length === 0
		) {
			return;
		}

		const tempSvgContainer = this.contentNode.ownerDocument.createElement(
			'div'
		);
		let nodesContent = '';
		let connectorsContent = '';
		let labelsContent = '';
		let i;

		for (i = 0; i < graphData.nodes.length; i++) {
			nodesContent += this._buildNode.call(this, graphData.nodes[i]);
		}
		for (i = 0; i < graphData.connectors.length; i++) {
			if (
				graphData.connectors[i].data_bindings &&
				Object.keys(graphData.connectors[i].data_bindings).length
			) {
				labelsContent += this._buildConnectorLabel.call(
					this,
					graphData.connectors[i]
				);
			}
			connectorsContent += this._buildConnectorPath.call(
				this,
				graphData.connectors[i]
			);
		}

		tempSvgContainer.innerHTML =
			'<svg>' +
			'<g id="connectors">' +
			connectorsContent +
			'</g>' +
			'<g id="labels">' +
			labelsContent +
			'</g>' +
			'<g id="nodes">' +
			nodesContent +
			'</g></svg>';

		const connectorContainer = tempSvgContainer.firstChild.childNodes[0];
		const labelContainer = tempSvgContainer.firstChild.childNodes[1];
		const nodeContainer = tempSvgContainer.firstChild.childNodes[2];

		this.connectors = this.d3
			.selectAll(connectorContainer.childNodes)
			.data(graphData.connectors)
			.each(function (d, i, domNodes) {
				d.connectorDomNode = domNodes[i];
			});
		this._appendNodeContent(connectorContainer);

		if (labelContainer.childNodes.length) {
			const graphConnectorsWithData =
				labelContainer.childNodes.length === graphData.connectors.length
					? graphData.connectors
					: graphData.connectors.filter(function (connector) {
							return connector.data_bindings;
					  });

			this.labels = this.d3
				.selectAll(labelContainer.childNodes)
				.data(graphConnectorsWithData)
				.each(function (d, i, domNodes) {
					d.labelDomNode = domNodes[i];
				});
			this._appendNodeContent(labelContainer);
		}

		this.nodes = this.d3
			.selectAll(nodeContainer.childNodes)
			.data(graphData.nodes)
			.on('click', this._nodeClick.bind(this))
			.each(function (nodeData, i, domNodes) {
				nodeData.domNode = domNodes[i];
			})
			.call(
				this.d3
					.drag()
					.subject(function (d) {
						return { x: d[0], y: d[1] };
					})
					.on('start', this._nodeDragStart.bind(this))
					.on('drag', this._nodeDrag.bind(this))
					.on('end', this._nodeDragEnd.bind(this))
			);

		this.d3
			.selectAll(nodeContainer.childNodes)
			.selectAll('.incomingCollapseButton')
			.data(function (d) {
				return [d];
			})
			.on('contextmenu', this.onShowExpandSettingsMenu.bind(this));

		this.d3
			.selectAll(nodeContainer.childNodes)
			.selectAll('.outgoingCollapseButton')
			.data(function (d) {
				return [d];
			})
			.on('contextmenu', this.onShowExpandSettingsMenu.bind(this));

		this._appendNodeContent(nodeContainer);

		return graphData;
	}

	renderHandler() {
		this.activeGraphLayout.updateGraphLayout(
			this.layerData.nodes,
			this.layerData.connectors,
			this.isVertical
		);

		this._renderItems(this.layerData);
	}

	_appendNodeContent(nodeToAppend) {
		if (nodeToAppend) {
			const existingNode = this.contentNode.querySelector(
				'#' + nodeToAppend.getAttribute('id')
			);
			if (existingNode) {
				for (
					let i = 0, length = nodeToAppend.childElementCount;
					i < length;
					i++
				) {
					existingNode.appendChild(nodeToAppend.childNodes[0]);
				}
			} else {
				this.contentNode.appendChild(nodeToAppend);
			}
		}
	}

	_nodeClick(nodeData) {
		if (nodeData) {
			this.ownerControl.centerNode(nodeData.domNode);
		}
	}

	_nodeDragStart(nodeData) {
		this.ownerControl.hideExpandSettingsMenu();

		const svgWidth = this.ownerControl.svgNode.attr('width');
		const svgHeight = this.ownerControl.svgNode.attr('height');
		const offsetX = this.ownerControl.currentTransform.x;
		const offsetY = this.ownerControl.currentTransform.y;
		this._dragBounds = {
			startX: nodeData.x,
			startY: nodeData.y,
			x: -offsetX / this.ownerControl.currentTransform.k + nodeData.width,
			y: -offsetY / this.ownerControl.currentTransform.k + nodeData.height,
			right:
				(svgWidth - offsetX) / this.ownerControl.currentTransform.k -
				nodeData.width,
			bottom:
				(svgHeight - offsetY) / this.ownerControl.currentTransform.k -
				nodeData.height
		};
	}

	_nodeDrag(nodeData) {
		if (nodeData) {
			const newX = nodeData.x + this.d3.event.dx;
			const newY = nodeData.y + this.d3.event.dy;
			if (this._dragBounds.x < newX && this._dragBounds.right > newX) {
				nodeData.fx = nodeData.x = newX;
			}
			if (this._dragBounds.y < newY && this._dragBounds.bottom > newY) {
				nodeData.fy = nodeData.y = newY;
			}

			nodeData.domNode.setAttribute(
				'transform',
				this._getNodeTransform(nodeData)
			);

			this.layerData.connectors.forEach((connectorData) => {
				if (
					connectorData.target.id === nodeData.id ||
					connectorData.source.id === nodeData.id
				) {
					const pathLength = connectorData.connectorDomNode.getTotalLength();
					const centerPoint = connectorData.connectorDomNode.getPointAtLength(
						pathLength / 2
					);

					connectorData.x = centerPoint.x;
					connectorData.y = centerPoint.y;
					if (connectorData.labelDomNode) {
						connectorData.labelDomNode.setAttribute(
							'transform',
							this._getConnectorLabelTransform(connectorData)
						);
					}
					connectorData.connectorDomNode.setAttribute(
						'd',
						this._getConnectorPath(connectorData)
					);
				}
			});
		}
	}

	_nodeDragEnd(nodeData) {
		const dx = nodeData.x - this._dragBounds.startX;
		const dy = nodeData.y - this._dragBounds.startY;
		if (
			dx * dx + dy * dy <
			this.defaultSettings._dragMinDistance *
				this.defaultSettings._dragMinDistance
		) {
			const dataNode = this.getFirstParentWithData(
				this.d3.event.sourceEvent.target
			);
			if (dataNode === nodeData.domNode) {
				this._nodeClick(nodeData);
			} else if (
				dataNode.getAttribute('class').indexOf('outgoingCollapseButton') > -1
			) {
				this.onToggleChildren(nodeData);
			} else {
				this.onToggleParents(nodeData);
			}
		}
	}

	wrapInTag(sourceString, tagName, tagAttributes) {
		if (tagName) {
			let attributeString = '';

			if (tagAttributes) {
				for (const attributeName in tagAttributes) {
					if (
						tagAttributes[attributeName] !== '' &&
						tagAttributes[attributeName] !== undefined
					) {
						attributeString +=
							' ' + attributeName + '="' + tagAttributes[attributeName] + '"';
					}
				}
			}

			return (
				'<' +
				tagName +
				attributeString +
				'>' +
				sourceString +
				'</' +
				tagName +
				'>'
			);
		} else {
			return sourceString || '';
		}
	}

	_setNodesLevel(graphData) {
		const root = this.getRootNode(graphData);
		root.level = 0;

		this._bypassStructure(root, (dataItem) => {
			[...dataItem.children, ...dataItem.parents].forEach((item) => {
				dataItem.level = Math.min(dataItem.level, item.level + 1);
				item.level = Math.min(item.level, dataItem.level + 1);
			});
		});
	}

	_bypassStructure(dataItem, bypassMethod, visitedNodes) {
		visitedNodes = visitedNodes || {};
		if (dataItem && bypassMethod) {
			[...dataItem.children, ...dataItem.parents].forEach((currentItem) => {
				if (!visitedNodes[currentItem.id]) {
					visitedNodes[currentItem.id] = true;

					bypassMethod(currentItem);
					this._bypassStructure(currentItem, bypassMethod, visitedNodes);
				}
			});
		}
	}

	_getConnectedSubGraph(dataItem, visitedNodes) {
		visitedNodes = visitedNodes || [];

		if (dataItem && visitedNodes.indexOf(dataItem) === -1) {
			visitedNodes.push(dataItem);

			[...dataItem.children, ...dataItem.parents].forEach((currentItem) =>
				this._getConnectedSubGraph(currentItem, visitedNodes)
			);
		}

		return visitedNodes;
	}

	_getExpandedNodes() {
		const root = this.getRootNode();
		return this._getConnectedSubGraph(root);
	}

	_getExpandedConnectors(expandedNodes) {
		expandedNodes = expandedNodes || this._getExpandedNodes();

		return this.layerData.connectors.filter(
			(d) =>
				expandedNodes.indexOf(d.source) !== -1 &&
				expandedNodes.indexOf(d.target) !== -1 &&
				d.source.children.has(d.target) &&
				d.target.parents.has(d.source)
		);
	}

	_dataItemComparer(dataItem) {
		return (dataItem && dataItem.id) || dataItem.source.id + dataItem.target.id;
	}

	invalidateLayer(nodeData) {
		const d3ContenNode = this.d3.select(this.contentNode);

		const allNodes = d3ContenNode.selectAll('#nodes>g');
		const allConnectors = d3ContenNode.selectAll('#connectors>path');
		const allLabels = d3ContenNode.selectAll('#labels>g');

		const visibleNodes = this._getExpandedNodes();
		const visibleConnectors = this._getExpandedConnectors(visibleNodes);

		this.activeGraphLayout.updateGraphLayout(
			visibleNodes,
			visibleConnectors,
			this.isVertical
		);

		const visibleDomNodes = allNodes.data(visibleNodes, this._dataItemComparer);
		const visibleDomLabels = allLabels.data(
			visibleConnectors,
			this._dataItemComparer
		);
		const visibleDomConnectors = allConnectors.data(
			visibleConnectors,
			this._dataItemComparer
		);

		// hiding and deleting collapsed nodes
		visibleDomNodes.exit().remove();
		visibleDomLabels.exit().remove();
		visibleDomConnectors.exit().remove();

		// positioning visible nodes
		visibleDomNodes.attr('transform', this._getNodeTransform);
		visibleDomNodes
			.select('g.outgoingCollapseButton')
			.attr('class', this._calculateOutgoingExpandButtonClass.bind(this))
			.attr('transform', function (nodeData) {
				return (
					'translate(' +
					[
						nodeData.outputExpandPosition && nodeData.outputExpandPosition.x,
						nodeData.outputExpandPosition && nodeData.outputExpandPosition.y
					] +
					')'
				);
			});
		visibleDomNodes
			.select('g.incomingCollapseButton')
			.attr('class', this._calculateIncomingExpandButtonClass.bind(this))
			.attr('transform', function (nodeData) {
				return (
					'translate(' +
					[
						nodeData.inputExpandPosition && nodeData.inputExpandPosition.x,
						nodeData.inputExpandPosition && nodeData.inputExpandPosition.y
					] +
					')'
				);
			});
		visibleDomLabels.attr(
			'transform',
			this._getConnectorLabelTransform.bind(this)
		);
		visibleDomConnectors.attr('d', this._getConnectorPath.bind(this));

		// creating expanded nodes
		const nodes = visibleDomNodes.enter().data();
		const connectors = visibleDomConnectors.enter().data();

		this._renderItems({
			nodes,
			connectors
		});

		this.ownerControl.adjustViewBounds();
		if (nodeData) {
			this.ownerControl.centerNode(nodeData.domNode);
		}
	}

	onShowExpandSettingsMenu(nodeData) {
		this.d3.event.stopPropagation();
		this.d3.event.preventDefault();

		const expandSettingsMenu = this.ownerControl.expandSettingsMenu;
		let activeConnectors;
		let hiddenConnectors;

		if (this.d3.event.target.closest('.incomingCollapseButton')) {
			activeConnectors = nodeData.activeIncomingConnectors;
			hiddenConnectors = nodeData.hiddenIncomingConnectors;
			expandSettingsMenu.onApplyButtonClick = () => {
				this.handleParentNodes(nodeData);
			};
		} else {
			activeConnectors = nodeData.activeOutgoingConnectors;
			hiddenConnectors = nodeData.hiddenOutgoingConnectors;
			expandSettingsMenu.onApplyButtonClick = () => {
				this.handleChildNodes(nodeData);
			};
		}

		activeConnectors = activeConnectors || [];
		hiddenConnectors = hiddenConnectors || [];

		if (!activeConnectors.length && !hiddenConnectors.length) {
			return;
		}

		expandSettingsMenu.showPopupWindow(
			activeConnectors,
			hiddenConnectors,
			this.d3.event.pageX,
			this.d3.event.pageY
		);
	}

	handleChildNodes(nodeData) {
		this.extendChildNodes(nodeData);
		this.expandChildNodes(nodeData);
		this.invalidateLayer();
	}

	handleParentNodes(nodeData) {
		this.extendParentNodes(nodeData);
		this.expandParentNodes(nodeData);
		this.invalidateLayer();
	}

	onToggleChildren(nodeData) {
		if (nodeData.isChildrenExpanded === false) {
			this.expandChildNodes(nodeData);
		} else if (nodeData.isChildrenExpanded === true) {
			this.collapseChildNodes(nodeData);
		} else {
			this.extendChildNodes(nodeData);
			nodeData.isChildrenExpanded = true;
		}

		this.invalidateLayer(nodeData);
	}

	collapseChildNodes(nodeData) {
		this._setNodesLevel(this.layerData);

		const childrenToCollapse = [...nodeData.children].filter(
			(item) => nodeData.level - 1 !== item.level
		);

		this._swapItemsBetweenArrays(
			nodeData,
			childrenToCollapse,
			'parents',
			'collapsedParents'
		);

		nodeData.collapsedChildren = new Set([
			...nodeData.collapsedChildren,
			...childrenToCollapse
		]);
		nodeData.children = new Set(
			[...nodeData.children].filter((item) => nodeData.level - 1 === item.level)
		);
		nodeData.isChildrenExpanded = false;
	}

	expandChildNodes(nodeData) {
		if (!nodeData.activeOutgoingConnectors) {
			const childrenToExpand = nodeData.collapsedChildren;

			this._swapItemsBetweenArrays(
				nodeData,
				childrenToExpand,
				'collapsedParents',
				'parents'
			);

			nodeData.children = new Set([...nodeData.children, ...childrenToExpand]);
			nodeData.collapsedChildren = new Set();
		} else {
			const allRelatedItems = [
				...nodeData.collapsedChildren,
				...nodeData.children
			];
			nodeData.children = new Set();
			nodeData.collapsedChildren = new Set();
			const hiddenItemIds = nodeData.hiddenOutgoingConnectors.map((item) => {
				return item.gvcid || this._getDefinitionKey(item);
			});

			allRelatedItems.forEach((relatedItem) => {
				const connectorBetweenNodes = this._connectorsHash[
					this._getConnectorHashKey({
						source: nodeData,
						target: relatedItem
					})
				].connector_key;
				if (
					hiddenItemIds.indexOf(
						connectorBetweenNodes.gvcid ||
							this._getDefinitionKey(connectorBetweenNodes)
					) === -1
				) {
					nodeData.children.add(relatedItem);

					this._swapItemsBetweenArrays(
						nodeData,
						[relatedItem],
						'collapsedParents',
						'parents'
					);
				} else {
					nodeData.collapsedChildren.add(relatedItem);

					this._swapItemsBetweenArrays(
						nodeData,
						[relatedItem],
						'parents',
						'collapsedParents'
					);
				}
			});
		}
		nodeData.isChildrenExpanded = true;
	}

	extendChildNodes(nodeData) {
		const extendedGraph = this.ownerControl.onItemExtend(nodeData, {
			outgoingConnectorKeys: nodeData.activeOutgoingConnectors
		});

		this.mergeNewItemsToDataSet(extendedGraph);

		if (
			!nodeData.hiddenOutgoingConnectors ||
			nodeData.hiddenOutgoingConnectors.length === 0
		) {
			nodeData.wasChildrenExtended = true;
		}
	}

	extendAllNodes(nodeData) {
		const extendedGraph = this.ownerControl.onItemExtend(nodeData, {
			outgoingConnectorKeys: nodeData.activeOutgoingConnectors,
			incomingConnectorKeys: nodeData.activeIncomingConnectors
		});

		this.mergeNewItemsToDataSet(extendedGraph);

		nodeData.wasChildrenExtended =
			!nodeData.hiddenOutgoingConnectors ||
			nodeData.hiddenOutgoingConnectors.length === 0;

		nodeData.wasParentsExtended =
			!nodeData.hiddenIncomingConnectors ||
			nodeData.hiddenIncomingConnectors.length === 0;
	}

	mergeNewItemsToDataSet(extendedGraph) {
		if (!extendedGraph) {
			return;
		}

		const graphNodeSet = [];
		const graphConnectorSet = [];

		for (let i = 0; i < extendedGraph.nodes.length; i++) {
			const extendedNode = extendedGraph.nodes[i];

			if (!this._nodesHash[extendedNode.id]) {
				graphNodeSet.push(extendedNode);
			}
		}

		for (let i = 0; i < extendedGraph.connectors.length; i++) {
			const connector = extendedGraph.connectors[i];
			const connectorHashId = this._getConnectorHashKey(connector);

			if (!this._connectorsHash[connectorHashId]) {
				graphConnectorSet.push(connector);
				this._connectorsHash[connectorHashId] = connector;
			}
		}

		this._preprocessData({
			nodes: graphNodeSet,
			connectors: graphConnectorSet
		});
		this.layerData.nodes = this.layerData.nodes.concat(graphNodeSet);
		this.layerData.connectors = this.layerData.connectors.concat(
			graphConnectorSet
		);
	}

	onToggleParents(nodeData) {
		if (nodeData.isParentsExpanded === false) {
			this.expandParentNodes(nodeData);
		} else if (nodeData.isParentsExpanded === true) {
			this.collapseParentNodes(nodeData);
		} else {
			this.extendParentNodes(nodeData);
			nodeData.isParentsExpanded = true;
		}

		this.invalidateLayer(nodeData);
	}

	collapseParentNodes(nodeData) {
		this._setNodesLevel(this.layerData);

		const parentsToCollapse = [...nodeData.parents].filter(
			(item) => nodeData.level - 1 !== item.level
		);

		this._swapItemsBetweenArrays(
			nodeData,
			parentsToCollapse,
			'children',
			'collapsedChildren'
		);

		nodeData.collapsedParents = new Set([
			...nodeData.collapsedParents,
			...parentsToCollapse
		]);
		nodeData.parents = new Set(
			[...nodeData.parents].filter((item) => nodeData.level - 1 === item.level)
		);

		nodeData.isParentsExpanded = false;
	}

	expandParentNodes(nodeData) {
		if (!nodeData.activeIncomingConnectors) {
			const parentsToExpand = nodeData.collapsedParents;

			this._swapItemsBetweenArrays(
				nodeData,
				parentsToExpand,
				'collapsedChildren',
				'children'
			);

			nodeData.parents = new Set([...nodeData.parents, ...parentsToExpand]);
			nodeData.collapsedParents = new Set();
		} else {
			const allRelatedItems = [
				...nodeData.collapsedParents,
				...nodeData.parents
			];
			nodeData.parents = new Set();
			nodeData.collapsedParents = new Set();
			const hiddenItemIds = nodeData.hiddenIncomingConnectors.map((item) => {
				return item.gvcid || this._getDefinitionKey(item);
			});

			allRelatedItems.forEach((relatedItem) => {
				const connectorBetweenNodes = this._connectorsHash[
					this._getConnectorHashKey({
						source: relatedItem,
						target: nodeData
					})
				].connector_key;
				if (
					hiddenItemIds.indexOf(
						connectorBetweenNodes.gvcid ||
							this._getDefinitionKey(connectorBetweenNodes)
					) === -1
				) {
					nodeData.parents.add(relatedItem);

					this._swapItemsBetweenArrays(
						nodeData,
						[relatedItem],
						'collapsedChildren',
						'children'
					);
				} else {
					nodeData.collapsedParents.add(relatedItem);

					this._swapItemsBetweenArrays(
						nodeData,
						[relatedItem],
						'children',
						'collapsedChildren'
					);
				}
			});
		}

		nodeData.isParentsExpanded = true;
	}

	extendParentNodes(nodeData) {
		const extendedGraph = this.ownerControl.onItemExtend(nodeData, {
			incomingConnectorKeys: nodeData.activeIncomingConnectors
		});

		this.mergeNewItemsToDataSet(extendedGraph);

		if (
			!nodeData.hiddenIncomingConnectors ||
			nodeData.hiddenIncomingConnectors.length === 0
		) {
			nodeData.wasParentsExtended = true;
		}
	}

	collapseConnector(connectorData) {
		this._swapItemsBetweenArrays(
			connectorData.source,
			[connectorData.target],
			'parents',
			'collapsedParents'
		);
		this._swapItemsBetweenArrays(
			connectorData.target,
			[connectorData.source],
			'children',
			'collapsedChildren'
		);
	}

	_swapItemsBetweenArrays(
		rootNode,
		itemsToProcess,
		sourceArrayName,
		targetArrayName
	) {
		itemsToProcess.forEach((itemToProcess) => {
			const containsNodeInCollection = itemToProcess[sourceArrayName].has(
				rootNode
			);

			if (containsNodeInCollection) {
				itemToProcess[sourceArrayName].delete(rootNode);
				itemToProcess[targetArrayName].add(rootNode);
			}
		});
	}
}
