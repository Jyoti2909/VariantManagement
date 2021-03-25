export default class GraphDataLoader {
	constructor(initialArguments) {
		this.arasObject = initialArguments.arasObject;
		this.templatesHash = {};
		this.gvdListHash = {};
		this.defaultTemplate = {
			container: {
				type: 'grid',
				style: {
					width: 200,
					height: 90,
					color: '#F7F7F7',
					padding: {
						left: 12,
						right: 12,
						top: 12,
						bottom: 12
					},
					rows: [
						{ height: 20 },
						{ height: 16 },
						{ height: 16 },
						{ height: 16 }
					],
					cols: [{ width: 22 }, { width: 120 }, { width: 35 }],
					border: {
						width: 1,
						color: '#555555',
						cornerRadius: 2,
						shadow: {
							horizontal: 1,
							vertical: 2,
							color: '#000000',
							opacity: 0.24
						}
					},
					cells: [
						{
							content: 'image',
							content_binding: 'icon',
							col: 0,
							row: 0
						},
						{
							content: 'text',
							content_binding: 'keyed_name',
							col: 1,
							row: 0
						},
						{
							content: 'text',
							content_binding: 'generation',
							col: 2,
							row: 0,
							style: {
								'vertical-alignment': 'top',
								'horizontal-alignment': 'end',
								font: {
									size: 10,
									family: 'Tahoma',
									weight: 'normal',
									color: '#777777'
								}
							}
						},
						{
							content: 'text',
							content_binding: 'name',
							col: 1,
							row: 1,
							style: {
								font: {
									size: 12,
									family: 'Tahoma',
									weight: 'normal',
									color: '#333333'
								}
							}
						},
						{
							content: 'text',
							content_binding: 'classification',
							col: 1,
							row: 2,
							style: {
								font: {
									size: 10,
									family: 'Tahoma',
									weight: 'normal',
									color: '#333333'
								}
							}
						},
						{
							content: 'text',
							content_binding: 'state',
							col: 1,
							row: 3,
							style: {
								font: {
									size: 10,
									family: 'Tahoma',
									weight: 'normal',
									color: '#777777'
								}
							}
						}
					]
				}
			},
			style: {
				arrowhead: {
					height: 17,
					width: 7
				}
			}
		};
	}

	setGvdId(newGvdId) {
		if (newGvdId) {
			this.gvdId = newGvdId;
		}
	}

	loadData(id, itemTypeName, gvdId) {
		if (!id || !itemTypeName) {
			return;
		}

		const gvdList = this.getGVDList(itemTypeName);
		const level = gvdList.find((gvd) => gvd.id === gvdId).level;

		return this._requestGraphData({
			id,
			level,
			type: itemTypeName,
			action: 'GetGraph',
			definition: gvdId
		});
	}

	extendData(id, itemTypeName, gvdId, connectorKeys) {
		if (id && itemTypeName) {
			return this._requestGraphData({
				id: id,
				type: itemTypeName,
				action: 'GetNeighbors',
				definition: gvdId || this.gvdId,
				...connectorKeys
			});
		}
	}

	getGVDList(itemTypeName) {
		if (!itemTypeName) {
			return [];
		}

		if (this.gvdListHash[itemTypeName]) {
			return this.gvdListHash[itemTypeName];
		}

		let requestItem = this.arasObject.newIOMItem('Method', 'gn_GetGVDList');
		requestItem.setPropertyItem(
			'item',
			this.arasObject.getItemTypeDictionary(itemTypeName)
		);
		requestItem = requestItem.apply();
		if (requestItem.isError()) {
			return this._alertError(requestItem);
		}

		const resultGVDList = [
			{
				id: '',
				name: this._getResource('gvd_list.default'),
				level: 0
			}
		];
		const viewDefinitionsCount = requestItem.getItemCount();
		for (let i = 0; i < viewDefinitionsCount; i++) {
			const viewDefinition = requestItem.getItemByIndex(i);

			resultGVDList.push({
				id: viewDefinition.getProperty('id'),
				name: viewDefinition.getProperty('name'),
				level: viewDefinition.getProperty('auto_expand_levels')
			});
		}

		return (this.gvdListHash[itemTypeName] = resultGVDList);
	}

	_requestGraphData(requestData) {
		if (requestData) {
			let requestItem = this.arasObject.newIOMItem(
				'Method',
				'gn_GraphNavigation'
			);
			requestItem.setProperty('item_type', requestData.type);
			requestItem.setProperty('item_ids', requestData.id);
			requestItem.setProperty('case', requestData.action);
			requestItem.setProperty('definition', requestData.definition);
			requestItem.setProperty('level', requestData.level);

			requestData.outgoingConnectorKeys &&
				requestData.outgoingConnectorKeys.forEach((connectorKey) => {
					const outgoingConnector = this.arasObject.newIOMItem(
						'outgoing_connector'
					);
					outgoingConnector.setProperty('key', JSON.stringify(connectorKey));
					requestItem.addRelationship(outgoingConnector);
				});

			requestData.incomingConnectorKeys &&
				requestData.incomingConnectorKeys.forEach((connectorKey) => {
					const incomingConnector = this.arasObject.newIOMItem(
						'incoming_connector'
					);
					incomingConnector.setProperty('key', JSON.stringify(connectorKey));
					requestItem.addRelationship(incomingConnector);
				});

			requestItem = requestItem.apply();
			if (requestItem.isError()) {
				return this._alertError(requestItem);
			}

			const jsonData = requestItem.getResult();
			try {
				const graphJson = JSON.parse(jsonData);
				return this.prepareGraphData(graphJson);
			} catch (exception) {
				const message = this._getResource('invalid_json_message');
				return this._alertError(message);
			}
		}
	}

	_getNodeKey(nodeCompositeKey) {
		if (nodeCompositeKey && typeof nodeCompositeKey === 'object') {
			const objectKeys = Object.keys(nodeCompositeKey.nid).sort();
			let compositeKey = nodeCompositeKey.gvnid + '_';

			for (let i = 0, length = objectKeys.length; i < length; i++) {
				const key = objectKeys[i];
				compositeKey += String.prototype.concat(
					key,
					':',
					nodeCompositeKey.nid[key]
				);
			}
			return compositeKey;
		}
	}

	prepareGraphData(graphData) {
		if (!graphData) {
			return null;
		}

		graphData.nodes.forEach((node) => {
			node.id = this._getNodeKey(node.node_key);
			node.itemId = node.node_key.tiid;
			node.type = this.arasObject.getItemTypeName(node.node_key.titid);
			node.typeId = node.node_key.titid;
			node.graphViewNodeId = node.node_key.gvnid;
			if (
				node.outgoing_connectors &&
				node.outgoing_connectors.connector_keys &&
				node.outgoing_connectors.connector_keys.length
			) {
				node.activeOutgoingConnectors = node.outgoing_connectors.connector_keys;
				node.hiddenOutgoingConnectors = [];
			}
			if (
				node.incoming_connectors &&
				node.incoming_connectors.connector_keys &&
				node.incoming_connectors.connector_keys.length
			) {
				node.activeIncomingConnectors = node.incoming_connectors.connector_keys;
				node.hiddenIncomingConnectors = [];
			}

			try {
				this._applyNodeTemplate(node);
			} catch (e) {
				this._applyNodeTemplate(node, this.defaultTemplate);
			}
		});

		graphData.connectors.forEach((connector) => {
			connector.source = this._getNodeKey(connector.source_node_key);
			connector.target = this._getNodeKey(connector.target_node_key);

			const connectorKey = connector.connector_key;
			const connectorType = connectorKey.rname;
			const connectorCompositeId = connectorKey.cid;
			if (connectorType && connectorCompositeId) {
				connector.type = connectorType;
				connector.itemId = Object.values(connectorCompositeId)[0];
			}
			try {
				this._applyConnectorTemplate(connector);
			} catch (e) {
				this._applyConnectorTemplate(connector, this.defaultTemplate);
			}
		});

		return graphData;
	}

	_resolveViewCardTemplate(templateId, itemTypeName) {
		if (templateId) {
			if (this.templatesHash[templateId]) {
				return this.templatesHash[templateId];
			}

			let viewCardItem = this.arasObject.newIOMItem('gn_ViewCard', 'get');
			viewCardItem.setAttribute('select', 'template_definition');
			viewCardItem.setID(templateId);
			viewCardItem = viewCardItem.apply();
			if (!viewCardItem.isError()) {
				const jsonTemplateDefinition = viewCardItem.getProperty(
					'template_definition'
				);
				try {
					return (this.templatesHash[templateId] = JSON.parse(
						jsonTemplateDefinition
					));
				} catch (e) {
					console.log(
						'Invalid template JSON for View Card with id: ' + templateId
					);
				}
			}
		}

		if (itemTypeName) {
			const itemTypeId = this.arasObject
				.getItemTypeDictionary(itemTypeName)
				.getID();

			if (this.templatesHash[itemTypeId + this.gvdId]) {
				return this.templatesHash[itemTypeId + this.gvdId];
			}

			let viewCardItem = this.arasObject.newIOMItem('Method', 'gn_GetViewCard');
			viewCardItem.setProperty('gvd_id', this.gvdId);
			viewCardItem.setProperty('item_type_id', itemTypeId);
			viewCardItem = viewCardItem.apply();
			if (!viewCardItem.isError()) {
				const jsonTemplateDefinition = viewCardItem.getProperty(
					'template_definition'
				);
				try {
					return (this.templatesHash[itemTypeId + this.gvdId] = JSON.parse(
						jsonTemplateDefinition
					));
				} catch (e) {
					console.log(
						'Invalid template JSON for View Card with id: ' +
							viewCardItem.getID()
					);
				}
			}
		}

		return this.defaultTemplate;
	}

	_applyNodeTemplate(nodeData, template) {
		const nodeTemplate =
			template ||
			this._resolveViewCardTemplate(nodeData.template_id, nodeData.type);
		const containerStyle = nodeTemplate.container.style;

		nodeData.width = containerStyle.width;
		nodeData.height = containerStyle.height;
		nodeData.fill = containerStyle.color;
		if (containerStyle.border) {
			nodeData.rx = containerStyle.border.cornerRadius;
			nodeData.stroke = containerStyle.border.color;
			nodeData.strokeWidth = containerStyle.border.width;
			nodeData.shadow = containerStyle.border.shadow;
		}

		this._applyNodeContentTemplate(nodeData, nodeTemplate);
	}

	_applyNodeContentTemplate(nodeData, nodeTemplate) {
		this.prebuildNodeStyles(nodeData, nodeTemplate);

		const computedCellPositions = this._applyGridCellPositions(
			nodeData,
			nodeTemplate
		);

		this._applyCellStyles(nodeData, nodeTemplate, computedCellPositions);
	}

	prebuildNodeStyles(nodeData, nodeTemplate) {
		const containerStyle = nodeTemplate.container.style;
		const padding = containerStyle.padding || 0;

		containerStyle.padding = {
			left: padding.left || padding,
			right: padding.right || padding,
			top: padding.top || padding,
			bottom: padding.bottom || padding
		};
	}

	_applyGridCellPositions(nodeData, nodeTemplate) {
		const containerStyle = nodeTemplate.container.style;
		const nodePadding = containerStyle.padding;
		const computedCellPositions = [];
		let xPos = nodePadding.left;
		let yPos = nodePadding.top;

		const nonEmptyRows = {};
		const nonEmptyCols = {};
		containerStyle.cells.forEach((cell) => {
			if (nodeData.data_bindings[cell.content_binding]) {
				nonEmptyRows[cell.row] = true;
				nonEmptyCols[cell.col] = true;
			}
		});
		containerStyle.rows.forEach((row, rowIndex) => {
			computedCellPositions.push([]);

			containerStyle.cols.forEach((col, colIndex) => {
				computedCellPositions[rowIndex].push({
					x: xPos,
					y: yPos,
					width: col.width,
					height: row.height
				});

				if (nonEmptyCols[colIndex]) {
					xPos += col.width;
				} else {
					nodeData.width -= col.width;
					nonEmptyCols[colIndex] = true;
				}
			});

			xPos = nodePadding.left;
			if (nonEmptyRows[rowIndex]) {
				yPos += row.height;
			} else {
				nodeData.height -= row.height;
			}
		});

		return computedCellPositions;
	}

	_applyCellStyles(nodeData, nodeTemplate, computedCellStyles) {
		nodeData.cells = nodeTemplate.container.style.cells.map((cell) => {
			const cellData = computedCellStyles[cell.row][cell.col];

			cellData.type = cell.content;
			cellData.value = nodeData.data_bindings[cell.content_binding];
			cellData.connections = cell.connections;

			cell.style = cell.style || {};
			cellData.font = cell.style.font || {};
			cellData.backgroundColor = cell.style.backgroundColor;
			cellData.horizontalAlignment = cell.style.horizontalAlignment;
			cellData.verticalAlignment = cell.style.verticalAlignment;
			cellData.textDecoration = cell.style.textDecoration || {};
			cellData.contentWidth = cell.style.width;
			cellData.contentHeight = cell.style.height;

			if (cell.style.border) {
				cellData.rx = cell.style.border.cornerRadius;
				cellData.stroke = cell.style.border.color;
				cellData.strokeWidth = cell.style.border.width;
			}

			return cellData;
		});
	}

	_applyConnectorTemplate(connectorData) {
		const connectorTemplate = this._resolveViewCardTemplate(
			connectorData.template_id
		);
		const connectorStyle = connectorTemplate.style;

		connectorData.connectorColor = connectorStyle.color;
		connectorData.connectorWeight = connectorStyle.weight;
		connectorData.connectorShadow = connectorStyle.shadow;
		connectorData.arrowhead = connectorStyle.arrowhead;

		if (connectorData.data_bindings) {
			this._applyNodeTemplate(connectorData, connectorTemplate);
		}
	}

	_alertError(message) {
		// eslint-disable-next-line new-cap
		return this.arasObject.AlertError(message);
	}

	_getResource(key) {
		return this.arasObject.getResource(
			'../Modules/aras.innovator.GraphView',
			key
		);
	}
}
