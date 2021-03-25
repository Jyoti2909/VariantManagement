define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaNode',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasTextHighlightning'
], function (declare, XmlSchemaNode, ArasTextHighlightning) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.XmlSchemaText',
		XmlSchemaNode,
		{
			_textHighlightning: null,

			constructor: function (args) {
				this.registerType('XmlSchemaText');

				if (!args.origin) {
					throw new Error(
						"Origin is not defined, don't know what type of origin should be created"
					);
				}

				this._textHighlightning = new ArasTextHighlightning(this);
			},

			getTextHighlightning: function () {
				return this._textHighlightning;
			},

			_parseOriginInternal: function () {},

			updateFromDom: function (targetDomNode) {
				var normalizedText = this._getNormalizedTextContent(targetDomNode);

				this.Text(normalizedText);
			},

			Text: function (/*String*/ value) {
				if (value === undefined) {
					return this.origin.nodeValue;
				} else {
					if (this.origin.nodeValue !== value) {
						this.origin.nodeValue = value;
						this.NotifyChanged();
					}
				}
			}
		}
	);
});
