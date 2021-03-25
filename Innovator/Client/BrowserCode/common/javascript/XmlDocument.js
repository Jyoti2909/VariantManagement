function XmlDocument() {
	const xmlDoc = document.implementation.createDocument('', '', null);
	xmlDoc.async = false;
	xmlDoc.preserveWhiteSpace = true;
	return xmlDoc;
}
