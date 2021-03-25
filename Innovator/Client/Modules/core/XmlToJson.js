import xml from './Xml';
const xmlToJsonModule = {
	xmlToJson: function (data) {
		let xmlData = null;
		if (typeof data == 'string') {
			xmlData = xml.parseString(data);
		} else {
			xmlData = data;
		}

		return xmlToJsonModule.parseXml(xmlData);
	},

	parseXml: function (xml) {
		const node = {};
		let isComplex = false;
		let nodeValue = xml.nodeValue || '';

		const childNodes = xml.childNodes;
		let length = childNodes.length;

		for (let i = 0; i < length; i++) {
			const childNode = childNodes[i];
			const childNodeValue = childNode.nodeValue;

			if (!/\S/gm.test(childNodeValue)) {
				continue;
			}

			/* 3 for Text nodes, 4 for CData nodes, 1 for common nodes*/
			if (childNode.nodeType === 3 || childNode.nodeType === 4) {
				nodeValue += childNodeValue;
			} else if (childNode.nodeType === 1) {
				isComplex = true;
				if (
					node[childNode.nodeName] &&
					Array.isArray(node[childNode.nodeName])
				) {
					node[childNode.nodeName].push(xmlToJsonModule.parseXml(childNode));
				} else if (
					node[childNode.nodeName] &&
					!Array.isArray(node[childNode.nodeName])
				) {
					const temp = node[childNode.nodeName];
					node[childNode.nodeName] = [
						temp,
						xmlToJsonModule.parseXml(childNode)
					];
				} else {
					node[childNode.nodeName] = xmlToJsonModule.parseXml(childNode);
				}
			}
		}

		if (xml.attributes && xml.attributes.length > 0) {
			isComplex = true;
			const nodeAttrsObj = {};
			length = xml.attributes.length;
			for (let j = 0; j < length; j++) {
				const attr = xml.attributes.item(j);
				const attrName = attr.name;
				const attrValue = attr.value;
				nodeAttrsObj[attrName] = attrValue;
			}
			node['@attrs'] = nodeAttrsObj;
			if (nodeValue) {
				node['@value'] = nodeValue;
			}
		}

		return isComplex ? node : nodeValue;
	}
};

const jsonToXmlModule = {
	buildStringsHelper: {
		openTag: function (key) {
			return '<' + key;
		},

		closeTag: function (key) {
			return '</' + key + '>';
		},

		addAttr: function (key, val) {
			return ' ' + key + '="' + xml.escape(val) + '"';
		},

		addAttrs: function (obj) {
			const attrKeys = Object.keys(obj);
			let tempStr = '';
			for (let i = 0, length = attrKeys.length; i < length; i++) {
				tempStr += this.addAttr(attrKeys[i], obj[attrKeys[i]]);
			}
			return tempStr;
		},

		addTextContent: function (text) {
			return '>' + text;
		}
	},

	compileNode: function (nodeName, attrs, content) {
		let tempStr = '';
		tempStr += this.buildStringsHelper.openTag(nodeName);
		if (attrs) {
			tempStr += this.buildStringsHelper.addAttrs(attrs);
		}

		if (typeof content == 'string') {
			tempStr += this.buildStringsHelper.addTextContent(content);
		}

		tempStr += this.buildStringsHelper.closeTag(nodeName);
		return tempStr;
	},

	parseJson: function (obj) {
		const keys = Object.keys(obj);
		let tempStr = '';
		for (let i = 0, length = keys.length; i < length; i++) {
			const key = keys[i];
			const value = obj[key];
			const isArray = Array.isArray(value);
			const type = typeof value;

			if (key != '@attrs' && key != '@value' && key.indexOf('@') !== 0) {
				if (type == 'string' || type == 'number' || type == 'boolean') {
					tempStr += this.compileNode(key, null, xml.escape(value));
				} else if (isArray) {
					for (let j = 0, valueLength = value.length; j < valueLength; j++) {
						const tempNode = {};
						tempNode[key] = value[j];
						tempStr += this.parseJson(tempNode);
					}
				} else {
					tempStr += this.compileNode(
						key,
						getProperties(value),
						value['@value']
							? xml.escape(value['@value'])
							: this.parseJson(value)
					);
				}
			}
		}

		function getProperties(obj) {
			const attrs = obj['@attrs'] || {};
			const attrKeys = Object.keys(obj);
			for (let i = 0, length = attrKeys.length; i < length; i++) {
				if (
					attrKeys[i] != '@attrs' &&
					attrKeys[i] != '@value' &&
					attrKeys[i].indexOf('@') === 0
				) {
					attrs[attrKeys[i].substring(1)] = obj[attrKeys[i]];
				}
			}
			return attrs;
		}

		return tempStr;
	},

	jsonToXml: function (data) {
		let jsonObj = null;
		if (typeof data == 'string') {
			jsonObj = JSON.parse(data);
		} else {
			jsonObj = data;
		}

		return jsonToXmlModule.parseJson(jsonObj);
	}
};

const xmlToJson = xmlToJsonModule.xmlToJson;
const jsonToXml = jsonToXmlModule.jsonToXml;

export { jsonToXml, xmlToJson };
