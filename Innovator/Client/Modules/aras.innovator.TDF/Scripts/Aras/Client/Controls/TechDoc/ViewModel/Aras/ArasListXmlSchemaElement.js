define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement'
], function (declare, XmlSchemaElement) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasListXmlSchemaElement',
		XmlSchemaElement,
		{
			constructor: function (args) {
				this.registerType('ArasListXmlSchemaElement');
			},

			SetNewStyleOfList: function (/*string*/ style) {
				this.Attribute('type', style);
			}
		}
	);
});
