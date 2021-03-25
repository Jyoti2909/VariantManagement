define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, Enums) {
	return declare('Aras.Client.Controls.TechDoc.Helper.TableHelper', null, {
		constructor: function (args) {
			this._viewmodel = args.viewmodel;
			this._tableNodeStructure = {};
		},

		GetOriginCellNameForRow: function (
			/*XmlSchemaElement*/ xmlSchemaRowElement
		) {
			var nStruct = this._tableNodeStructure;
			var rowNodeName = xmlSchemaRowElement.nodeName;

			if (!nStruct[rowNodeName]) {
				nStruct[rowNodeName] = this._GetNodeNameFromServer(
					xmlSchemaRowElement,
					Enums.XmlSchemaElementType.TableCell,
					'aras:tablecell'
				);
			}

			return nStruct[rowNodeName];
		},

		GetNodeOriginNameForStructure: function (
			/*XmlSchemaElement*/ xmlSchemaElement
		) {
			var nStruct = this._tableNodeStructure;
			var rootNodeName = xmlSchemaElement.nodeName;

			if (!nStruct[rootNodeName]) {
				nStruct[rootNodeName] = {};

				if (xmlSchemaElement.is('ArasTableXmlSchemaElement')) {
					var rowName = this._GetNodeNameFromServer(
						xmlSchemaElement,
						Enums.XmlSchemaElementType.TableRow,
						'aras:tablerow'
					);
					var cellXmlElement = this._viewmodel.CreateElement('element', {
						type: rowName
					});

					nStruct[rootNodeName].row = rowName;
					nStruct[rootNodeName].cell = this._GetNodeNameFromServer(
						cellXmlElement,
						Enums.XmlSchemaElementType.TableCell,
						'aras:tablecell'
					);
				}
			}

			return nStruct[rootNodeName];
		},

		_GetNodeNameFromServer: function (
			xmlElement,
			schemaElementType,
			defaultNodeName
		) {
			var scheme = this._viewmodel.Schema();
			var expectedElements = scheme.GetExpectedElements(xmlElement);
			var nodeName;

			if (expectedElements && expectedElements.insert) {
				var expectedNames = expectedElements.insert;
				var insertName;
				var elementType;
				var i;

				for (i = 0; i < expectedNames.length; i++) {
					insertName = expectedNames[i];
					elementType = scheme.GetSchemaElementType(insertName);

					if ((elementType & schemaElementType) == schemaElementType) {
						nodeName = insertName;
						break;
					}
				}
			}

			return nodeName || defaultNodeName;
		}
	});
});
