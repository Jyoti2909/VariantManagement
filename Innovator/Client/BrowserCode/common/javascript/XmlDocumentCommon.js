Document.prototype.loadXML = function XmlDocumentLoadXML(xmlString) {
	if (!xmlString || typeof xmlString !== 'string') {
		return false;
	}
	xmlString = xmlString.replace(
		/xmlns:i18n="http:\/\/www.w3.org\/XML\/1998\/namespace"/g,
		'xmlns:i18n="http://www.aras.com/I18N"'
	);
	var parser = new DOMParser();
	var doc = parser.parseFromString(xmlString, 'text/xml');
	if (!this.documentElement) {
		this.appendChild(this.createElement('oldTeg'));
	}

	this.replaceChild(doc.documentElement, this.documentElement);
	return this.parseError.errorCode === 0;
};

Document.prototype.loadUrl = function XmlDocumentLoadUrl(filename) {
	if (!filename || typeof filename !== 'string') {
		return;
	}

	const xhttp = new XMLHttpRequest();
	xhttp.open('GET', filename, false);
	try {
		xhttp.responseType = 'msxml-document';
	} catch (err) {} // Helping IE11
	xhttp.send('');
	this.loadXML(xhttp.response);
};

Document.prototype.selectSingleNode = function XmlDocumentSelectSingleNode(
	xPath
) {
	var xpe = new XPathEvaluator();
	var ownerDoc =
		this.ownerDocument == null
			? this.documentElement
			: this.ownerDocument.documentElement;
	var nsResolver = xpe.createNSResolver(ownerDoc == null ? this : ownerDoc);

	return xpe.evaluate(
		xPath,
		this,
		nsResolver,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null
	).singleNodeValue;
};
Element.prototype.selectSingleNode = Document.prototype.selectSingleNode;

Document.prototype.selectNodes = function XmlDocumentSelectNodes(xPath) {
	var xpe = new XPathEvaluator();
	var ownerDoc =
		this.ownerDocument == null
			? this.documentElement
			: this.ownerDocument.documentElement;
	var nsResolver = xpe.createNSResolver(ownerDoc == null ? this : ownerDoc);

	var result = xpe.evaluate(
		xPath,
		this,
		nsResolver,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	var res = null;
	if (result) {
		res = [];
		for (var i = 0; i < result.snapshotLength; i++) {
			res.push(result.snapshotItem(i));
		}
	}
	return res;
};
Element.prototype.selectNodes = Document.prototype.selectNodes;

Element.prototype.transformNode = function XmlElementTransformNode(xmlDoc) {
	var outputNode = xmlDoc.selectSingleNode('./xsl:stylesheet/xsl:output');
	var isHtml = outputNode && outputNode.getAttribute('method') === 'html';
	var sourceDoc = document.implementation.createDocument('', '', null);
	var node = sourceDoc.importNode(this, true);
	sourceDoc.appendChild(node);
	var processor = new XSLTProcessor();
	processor.importStylesheet(xmlDoc);
	var resultDoc = processor.transformToDocument(sourceDoc);
	//Microsoft Edge might not properly pefrom transfomration of XML document and we will have 'null' after transfomration.
	//In this case we should return an error message instead of 'null'. The error message corresponds to Chrome error message
	if (!resultDoc) {
		return (
			"<html xmlns='http://www.w3.org/1999/xhtml'><body><parsererror><h3>This page contains the following errors:</h3>" +
			'<div>Document parsing error</div></parsererror></body></html>'
		);
	}
	return isHtml ? resultDoc.documentElement.outerHTML : resultDoc.xml;
};

Document.prototype.transformNode = function XmlDocumentTransformNode(xmlDoc) {
	//In Microsoft Edge when xmlDoc created in other window it's not instance of XMLDocument
	//So we need to create new instance to avoid 'null' after transformToDocument
	if (!(xmlDoc instanceof XMLDocument)) {
		var oldXml = xmlDoc.xml;
		xmlDoc = new XmlDocument();
		xmlDoc.loadXML(oldXml);
	}
	var processor = new XSLTProcessor();
	processor.importStylesheet(xmlDoc);
	var outputNode = xmlDoc.selectSingleNode('./xsl:stylesheet/xsl:output');
	var isHtml = outputNode && outputNode.getAttribute('method') === 'html';
	var resultDoc = processor.transformToDocument(this);
	//Microsoft Edge might not properly pefrom transfomration of XML document and we will have 'null' after transfomration.
	//In this case we should return an error message instead of 'null'. The error message corresponds to Chrome error message
	if (!resultDoc) {
		return (
			"<html xmlns='http://www.w3.org/1999/xhtml'><body><parsererror><h3>This page contains the following errors:</h3>" +
			'<div>Document parsing error</div></parsererror></body></html>'
		);
	}
	return isHtml ? resultDoc.documentElement.outerHTML : resultDoc.xml;
};

Document.prototype.createNode = function XmlDocumentTransformNode(
	nodeType,
	name,
	namespaceUrl
) {
	var newNode = this.createElementNS(namespaceUrl, name);
	return newNode;
};

if (Document.prototype.__defineGetter__) {
	Document.prototype.__defineGetter__('text', function () {
		return this.textContent;
	});

	Document.prototype.__defineSetter__('text', function (value) {
		this.textContent = value;
	});

	Element.prototype.__defineGetter__('text', function () {
		return this.textContent;
	});

	Element.prototype.__defineSetter__('text', function (value) {
		this.textContent = value;
	});

	Text.prototype.__defineGetter__('text', function () {
		return this.textContent;
	});

	Attr.prototype.__defineGetter__('text', function (value) {
		return this.textContent;
	});

	Document.prototype.__defineGetter__('xml', function () {
		return new XMLSerializer().serializeToString(this);
	});

	Element.prototype.__defineGetter__('xml', function () {
		return new XMLSerializer().serializeToString(this);
	});

	Document.prototype.__defineGetter__('parseError', function () {
		if (!this.documentElement) {
			return { errorCode: 0 };
		}

		//for Chrome browser that return html instead parsererror xml block
		var node = this.documentElement;
		if (
			node.nodeName === 'html' &&
			node.firstChild &&
			node.firstChild.firstChild
		) {
			node = node.firstChild.firstChild;
			if (node.nodeName === 'parsererror') {
				return {
					errorCode: 1,
					srcText: '',
					reason: node.childNodes[1].textContent
				};
			}
		}

		if (this.documentElement.nodeName == 'parsererror') {
			return {
				errorCode: 1,
				srcText: '',
				reason: this.documentElement.childNodes[0].nodeValue
			};
		}

		return { errorCode: 0 };
	});
}

XMLDocument.prototype.load = function (docUrl) {
	var xmlhttp = new XmlHttpRequestManager().CreateRequest();
	xmlhttp.open('GET', docUrl, false);
	xmlhttp.send(null);
	this.loadXML(xmlhttp.responseText);
};
