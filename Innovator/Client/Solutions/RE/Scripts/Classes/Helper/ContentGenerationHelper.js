define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ContentGenerationHelper'
],
function(declare, TechDocContentGenerationHelper) {
	return declare('Aras.Client.Controls.RE.Helper.ContentGenerationHelper', [TechDocContentGenerationHelper], {
		sendContentGenerationRequest: function(actionName, requestProperties) {
			if (actionName && requestProperties) {
				var methodItem = this.aras.newIOMItem('Method', 'tp_GenerateElementContent');
				var schemaId = this.aras.getItemProperty(this.viewmodel.getDocumentItem(), 'req_document_type');
				var currentLanguage = this.viewmodel.CurrentLanguageCode();
				var propertyNames = Object.getOwnPropertyNames(requestProperties);
				var propertyName;
				var i;

				methodItem.setProperty('generationAction', actionName);
				methodItem.setProperty('xml_schema', schemaId);
				methodItem.setProperty('language_code', currentLanguage);
				//Added to enable access to Document Id
				methodItem.setProperty('document_id', this.viewmodel.GetActiveRequirementId());

				for (i = 0; i < propertyNames.length; i++) {
					propertyName = propertyNames[i];
					methodItem.setProperty(propertyName, requestProperties[propertyName]);
				}

				methodItem = methodItem.apply();

				if (!methodItem.isError()) {
					var resultString = methodItem.getResult();
					var resultXml = new XmlDocument();

					if (this.aras.Browser.isIe()) {
						resultXml.setProperty('SelectionNamespaces', 'xmlns:aras="http://aras.com/ArasTechDoc"');
					}

					if (resultXml.loadXML(resultString)) {
						var contentNode = resultXml.selectSingleNode('aras:document/aras:content');
						var referencesNode = resultXml.selectSingleNode('aras:document/aras:references');
						var generatedContentNode = resultXml.selectSingleNode('aras:document/aras:generatedContent');

						this.viewmodel.OriginExternalProvider().Update(referencesNode);

						// if there is information about dynamic content, then update dynamic content cache
						if (generatedContentNode && generatedContentNode.hasChildNodes()) {
							var contentCache = this.getContentCache(this.viewmodel.CurrentLanguageCode());
							var childNode;
							var nodeUid;

							generatedContentNode = this.viewmodel.origin.ownerDocument.importNode(generatedContentNode, true);

							for (i = 0; i < generatedContentNode.childNodes.length; i++) {
								childNode = generatedContentNode.childNodes[i];
								nodeUid = childNode.getAttribute('aras:id');

								contentCache[nodeUid] = childNode;
							}
						}

						return contentNode;
					}
				} else {
					this.aras.AlertError(methodItem.getErrorString());
				}
			}
		}
	});
});
