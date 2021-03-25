define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasListXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			GetTreeType: function (schemaElement, elementState) {
				var listType = schemaElement.Attribute('type');
				return (
					'ArasListXmlSchemaElementTreeNode' +
					(listType ? ' ' + listType + 'ListType' : '')
				);
			}
		}
	);
});
