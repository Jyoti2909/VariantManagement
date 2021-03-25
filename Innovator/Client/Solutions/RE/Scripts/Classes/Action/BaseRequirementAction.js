define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.RE.Action.BaseRequirementAction', ActionBase, {

		constructor: function(args) {
		},

		Execute: function(args) {
		},

		_updateDocumentExternalReferences: function(content) {
			var references = content.selectNodes('//@ref-id');
			if (references.length) {
				var blockId = content.getAttribute('reqId');
				var reqItem = this._viewmodel._getRequirementById(blockId);
				var documentXml = this._viewmodel.GetDocumentBlockXml(reqItem.getId(), this._viewmodel.CurrentLanguageCode(), null, true);
				if (!documentXml) {
					return;
				}
				var documentXmlDom = new XmlDocument();
				var externalProvider = this._viewmodel.OriginExternalProvider();

				documentXmlDom.preserveWhiteSpace = true;
				documentXmlDom.loadXML(documentXml);
				var rootNode = documentXmlDom.documentElement;

				if (this.aras.Browser.isIe()) {
					documentXmlDom.setProperty('SelectionNamespaces', 'xmlns:aras=\'http://aras.com/ArasTechDoc\'');
				} else {
					rootNode.setAttribute('xmlns:aras', 'http://aras.com/ArasTechDoc');
				}

				var newReferencesNode = rootNode.selectSingleNode('aras:references');
				externalProvider.Update(newReferencesNode);
			}
		}
	});
});
