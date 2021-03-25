const xmlFlags = (function () {
	const flags = {
		setDeclaretion: false,
		deleteTrashAttr: false
	};

	// Chrome not added xml declaretion after transform
	const xml = new DOMParser().parseFromString(
		'<?xml version="1.0" encoding="UTF-8" ?><doc/>',
		'text/xml'
	);
	const xsl = new DOMParser().parseFromString(
		'<?xml version="1.0" encoding="UTF-8" ?><xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">' +
			' <xsl:template match="/"><p>1</p></xsl:template>' +
			'</xsl:stylesheet>',
		'text/xml'
	);
	const p = new XSLTProcessor();
	p.importStylesheet(xsl);
	const f = p.transformToDocument(xml);
	const res = new XMLSerializer().serializeToString(f);

	flags.setDeclaretion = res.indexOf('<?xml') === -1;
	flags.deleteTrashAttr =
		res.indexOf('xmlns="http://www.w3.org/1999/xhtml"') !== -1;
	return flags;
})();

const sanitizer = {
	chars: {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'#': '&#35;',
		'(': '&#40;',
		')': '&#41;',
		'"': '&quot;',
		"'": '&apos;'
	},

	escapeRegExp: function (string) {
		return string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
	},

	_replace(inputString, searchValue, newValue) {
		return inputString.replace(
			new RegExp(sanitizer.escapeRegExp(searchValue), 'g'),
			newValue
		);
	},

	/**
	 * By default replaces charaters with special symbols
	 *
	 * @param {string} inputString String to process
	 * @param {bool} doUnsanitize If true, will unescape string
	 */
	processString(inputString, doUnsanitize = false) {
		if (typeof inputString !== 'string') {
			return inputString;
		}

		let processingHandler;

		if (doUnsanitize) {
			processingHandler = (val, key) =>
				this._replace(val, this.chars[key], key);
		} else {
			processingHandler = (val, key) =>
				this._replace(val, key, this.chars[key]);
		}

		return Object.keys(this.chars).reduce(processingHandler, inputString);
	}
};

const xml = {
	parseString: function (xmlString) {
		const domParser = new DOMParser();
		return domParser.parseFromString(xmlString, 'text/xml');
	},
	parseFile: function (fileUrl) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', fileUrl, false);
		xhr.send(null);
		return this.parseString(xhr.responseText);
	},
	selectSingleNode: function (xmlDocument, xPath) {
		const xpe = new XPathEvaluator();
		const ownerDoc = !xmlDocument.ownerDocument
			? xmlDocument.documentElement
			: xmlDocument.ownerDocument.documentElement;
		const nsResolver = xpe.createNSResolver(!ownerDoc ? xmlDocument : ownerDoc);

		return xpe.evaluate(
			xPath,
			xmlDocument,
			nsResolver,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
	},
	selectNodes: function (xmlDocument, xPath) {
		const xpe = new XPathEvaluator();
		const ownerDoc = !xmlDocument.ownerDocument
			? xmlDocument.documentElement
			: xmlDocument.ownerDocument.documentElement;
		const nsResolver = xpe.createNSResolver(!ownerDoc ? xmlDocument : ownerDoc);

		const result = xpe.evaluate(
			xPath,
			xmlDocument,
			nsResolver,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		let res = null;
		if (result) {
			res = [];
			for (let i = 0; i < result.snapshotLength; i++) {
				res.push(result.snapshotItem(i));
			}
		}
		return res;
	},
	/**
	 * Escapes string
	 * @param {string} string String to escape
	 */
	escape: function (string) {
		return sanitizer.processString(string);
	},
	/**
	 * Unescapes string
	 * @param {string} string String to unescape
	 */
	unescape: function (string) {
		return sanitizer.processString(string, true);
	},
	transform: function (transformDoc, stylesheetDoc) {
		const processor = new XSLTProcessor();
		processor.importStylesheet(stylesheetDoc);
		const outputNode = this.selectSingleNode(
			stylesheetDoc,
			'./xsl:stylesheet/xsl:output'
		);
		const isHtml = outputNode && outputNode.getAttribute('method') === 'html';

		const resultDoc = processor.transformToDocument(transformDoc);
		if (
			!isHtml &&
			xmlFlags.setDeclaretion &&
			!(outputNode && outputNode.getAttribute('omit-xml-declaration') === 'yes')
		) {
			const piElem = resultDoc.createProcessingInstruction(
				'xml',
				'version="1.0" encoding="UTF-8"'
			);
			resultDoc.insertBefore(piElem, resultDoc.firstChild);
		}
		let resultString = isHtml
			? resultDoc.documentElement.outerHTML
			: this.getXml(resultDoc);
		if (!isHtml && xmlFlags.deleteTrashAttr) {
			const trashStr = ' xmlns="http://www.w3.org/1999/xhtml"';
			resultString = resultString.split(trashStr).join('');
		}
		return resultString;
	},
	createNode: function (xmlDocument, nodeType, nodeName, namespaceUrl) {
		return xmlDocument.createElementNS(namespaceUrl, nodeName);
	},
	getText: function (xmlNode) {
		return xmlNode.textContent;
	},
	setText: function (xmlNode, value = '') {
		xmlNode.textContent = value;
	},
	getXml: function (xmlDocument) {
		let resultString = new XMLSerializer().serializeToString(xmlDocument);
		// Edge can't read declaration <?xml .. ?>
		if (
			xmlDocument.firstChild &&
			xmlDocument.firstChild.nodeType ===
				xmlDocument.PROCESSING_INSTRUCTION_NODE &&
			resultString.indexOf('<?xml') === -1
		) {
			resultString =
				'<?xml ' + xmlDocument.firstChild.nodeValue + ' ?>' + resultString;
		}
		return resultString;
	},
	getInnerXml: function (xmlNode) {
		return Array.from(xmlNode.childNodes).map(this.getXml).join('');
	},
	getError: function (xmlDocument) {
		let documentNode = xmlDocument.documentElement;
		if (documentNode) {
			let errorChildNum = 0;
			// for Chrome browser that return html instead parseerror xml block
			if (
				documentNode.nodeName === 'html' &&
				documentNode.firstChild &&
				documentNode.firstChild.firstChild
			) {
				documentNode = documentNode.firstChild.firstChild;
				errorChildNum = 1;
			}

			if (documentNode.nodeName === 'parsererror') {
				return {
					errorCode: 1,
					srcText: '',
					reason: documentNode.childNodes[errorChildNum].nodeValue
				};
			}
		}
		return { errorCode: 0 };
	}
};
export default xml;
