define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.TechDoc.Helper.Clipboard', null, {
		aras: null,

		constructor: function (initialArguments) {
			this.aras = initialArguments.aras;
		},

		setData: function (type, value) {
			this.clearData();

			switch (type) {
				case 'StructureXml':
					this.setStructureXmlData(value);
					break;
				case 'ArasTextXmlSchemaElement':
					this._setClipboardData('Text', value.plainText);
					this._setClipboardData(type, value);
					break;
				default:
					this._setClipboardData(type, value);
					break;
			}
		},

		getData: function (type) {
			var clipboardData = this._getClipboardData(type);
			var result;

			switch (type) {
				case 'Text':
					if (!this.getStructureXmlData(clipboardData)) {
						result = clipboardData;
					}
					break;
				case 'StructureXml':
					result = this.getStructureXmlData(clipboardData);
					break;
				default:
					result = clipboardData;
					break;
			}

			return result;
		},

		_getClipboardData: function (dataType) {
			var clipboardData = aras.getCommonPropertyValue('tdClipboardData');

			if (!clipboardData) {
				clipboardData = aras.newObject();
				aras.setCommonPropertyValue('tdClipboardData', clipboardData);
			}

			return dataType ? clipboardData[dataType] : clipboardData;
		},

		_setClipboardData: function (dataType, inputData) {
			if (dataType) {
				var clipboardData = this._getClipboardData();

				clipboardData[dataType] = inputData;
			}
		},

		getStructureXmlData: function (xmlString) {
			if (xmlString) {
				var xmlDoc = new XmlDocument();
				// this RegExp required for xmlString check and needed just to avoid console error in Firefox,
				// error appeared if loadXML method called with invalid xml string (for examplew with simple text) and can't be suppressed with "try..catch"
				var structureXmlRE = /<copiedContent\b[^>]*>(.*?)<\/copiedContent>/i;

				xmlDoc.preserveWhiteSpace = true;

				if (structureXmlRE.test(xmlString) && xmlDoc.loadXML(xmlString)) {
					var rootNode = xmlDoc.documentElement;
					var contentRootNode = rootNode.selectSingleNode('copiedContent');

					if (contentRootNode) {
						var resultData = { content: [], references: {} };
						var contentNodes = contentRootNode.childNodes;
						var refencesRootNode = rootNode.selectSingleNode(
							'copiedReferences'
						);
						var referenceNodes = refencesRootNode
							? refencesRootNode.childNodes
							: [];
						var referenceId;
						var currentNode;
						var i;

						for (i = 0; i < contentNodes.length; i++) {
							currentNode = contentNodes[i];
							resultData.content.push(currentNode.cloneNode(true));
						}

						for (i = 0; i < referenceNodes.length; i++) {
							currentNode = referenceNodes[i];

							referenceId = currentNode.getAttribute('ref-id');
							resultData.references[referenceId] = currentNode.cloneNode(true);
						}
						resultData.references._rootNode = refencesRootNode;

						return resultData;
					}
				}
			}

			return null;
		},

		setStructureXmlData: function (data) {
			var dataArray = data.content || [];

			if (dataArray.length) {
				var xmlDoc = new XmlDocument();
				var rootNode;
				var contentNode;
				var refencesNode;
				var importedNode;
				var referenceId;
				var i;

				xmlDoc.preserveWhiteSpace = true;
				xmlDoc.loadXML('<root xmlns:aras="http://aras.com/ArasTechDoc"/>');

				rootNode = xmlDoc.documentElement;
				contentNode = xmlDoc.createElement('copiedContent');
				refencesNode = xmlDoc.createElement('copiedReferences');

				for (i = 0; i < dataArray.length; i++) {
					importedNode = xmlDoc.importNode(dataArray[i], true);
					contentNode.appendChild(importedNode);
				}
				rootNode.appendChild(contentNode);

				for (referenceId in data.references) {
					importedNode = xmlDoc.importNode(data.references[referenceId], true);
					refencesNode.appendChild(importedNode);
				}

				rootNode.appendChild(refencesNode);
				this._setClipboardData('StructureXml', xmlDoc.xml);
			}
		},

		clearData: function () {
			var cliboardData = this._getClipboardData();
			var dataType;

			for (dataType in cliboardData) {
				delete cliboardData[dataType];
			}
		}
	});
});
