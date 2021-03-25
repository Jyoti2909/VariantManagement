require([
	'dojo/_base/declare',
	'dojo/text!../styles/DynamicModelBrowser/one_level_tree_constructor.xslt'
], function (declare, oneLevelTreeXSLT) {
	return dojo.setObject(
		'VC.DynamicModelBrowser.TreeNodesManager',
		declare(null, {
			treeXmlDocument: null,
			plainTreeXmlDocument: null,

			constructor: function () {
				Object.defineProperty(this, 'treeXml', {
					set: function (value) {
						this.treeXmlDocument = VC.Utils.createXMLDocument();
						this.treeXmlDocument.loadXML(value);
					}
				});
			},

			generatePlainTreeXml: function (treeXml) {
				var plainTreeXml = VC.Utils.convertXsltToHtml(
					treeXml,
					oneLevelTreeXSLT,
					''
				);
				this.plainTreeXmlDocument = VC.Utils.createXMLDocument();
				this.plainTreeXmlDocument.loadXML(plainTreeXml);
			}
		})
	);
});
