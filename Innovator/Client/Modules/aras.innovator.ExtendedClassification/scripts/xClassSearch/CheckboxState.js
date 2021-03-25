function CheckboxState(
	value,
	labelkey,
	key,
	generateAmlFunction,
	markerCheckboxState
) {
	this.value = value;
	this.class = key;
	this.getAml = generateAmlFunction || function () {};
	this.markerCheckboxState = markerCheckboxState;
	Object.defineProperty(this, 'label', {
		get: function () {
			if (!this._label) {
				this._label = aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification',
					labelkey
				);
			}
			return this._label;
		}
	});
}

CheckboxState.prototype.getXClassesIdByMarkerState = function (
	queryNode,
	logicState,
	itemTypeName,
	relItemTypeName
) {
	const ids = [];
	if (!queryNode || !queryNode.xml || !this.markerCheckboxState) {
		return ids;
	}
	const xPath = this.markerCheckboxState(
		logicState,
		itemTypeName,
		relItemTypeName
	);
	const idNodes = ArasModules.xml.selectNodes(queryNode, xPath);

	idNodes.forEach(function (idNode) {
		ids.push(idNode.text);
	});
	return ids;
};

CheckboxState.prototype.getTagNameFromXPathNode = function (xPathNode) {
	const startXpathAxis = xPathNode.lastIndexOf(':');
	if (startXpathAxis > -1) {
		xPathNode = xPathNode.slice(startXpathAxis + 1, xPathNode.length);
	}
	const startXPathParameters = xPathNode.indexOf('[');
	if (startXPathParameters > -1) {
		xPathNode = xPathNode.slice(0, startXPathParameters);
	}
	return xPathNode;
};

CheckboxState.prototype.getTagAttributesFromXPathNode = function (xPathNode) {
	const startParameters = xPathNode.indexOf('[');
	const endParameters = xPathNode.indexOf(']');
	let attributesObj = {};
	if (startParameters > -1 && endParameters > -1) {
		let attributes = xPathNode
			.slice(startParameters + 1, endParameters)
			.replace(/@/g, '')
			.replace(/"/g, '');
		attributes = attributes.split(' and ');
		attributes.forEach(function (attributeString) {
			const atributeParam = attributeString.split('=');
			attributesObj[atributeParam[0]] = atributeParam[1];
		});
	}
	return attributesObj;
};

CheckboxState.prototype.createElementByXPathNode = function (
	parent,
	xPathNode
) {
	const tagName = this.getTagNameFromXPathNode(xPathNode);
	const attributes = this.getTagAttributesFromXPathNode(xPathNode);
	const element = aras.createXmlElement(tagName, parent);
	Object.keys(attributes).forEach(function (nameAttribute) {
		element.setAttribute(nameAttribute, attributes[nameAttribute]);
	});
	return element;
};

CheckboxState.prototype.insertToNode = function (
	xPathToInsertTargetNode,
	targetNode,
	nodeToInsert
) {
	let xPathNodes = xPathToInsertTargetNode.split('/');
	let xPathToCurrentNode = '';
	let nodeToInsertTargetNode = nodeToInsert;
	xPathNodes.forEach(function (xPathNode) {
		if (xPathNode.length > 0) {
			xPathToCurrentNode += xPathNode;
			const node = nodeToInsert.selectSingleNode(xPathToCurrentNode);
			if (!node) {
				nodeToInsertTargetNode = this.createElementByXPathNode(
					nodeToInsertTargetNode,
					xPathNode
				);
			} else {
				nodeToInsertTargetNode = node;
			}
		}
		xPathToCurrentNode += '/';
	}, this);
	nodeToInsertTargetNode.appendChild(targetNode);
};

CheckboxState.prototype.getMarkerCheckboxStateAdditionalPath = function (
	itemTypeName,
	relItemTypeName
) {
	if (relItemTypeName && relItemTypeName !== itemTypeName) {
		return '/related_id/Item[@type="' + itemTypeName + '" and @action="get"]/';
	}
	return '';
};
