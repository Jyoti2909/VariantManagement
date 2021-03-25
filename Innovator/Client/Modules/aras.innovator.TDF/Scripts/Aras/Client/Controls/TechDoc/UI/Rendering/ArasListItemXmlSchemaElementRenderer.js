define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasListItemXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			GetClassList: function (schemaElement, elementState) {
				var result = this.inherited(arguments);
				var listItemType = this.getListItemType(schemaElement);

				result.push(listItemType);
				return result;
			},

			GetTreeType: function (schemaElement, elementState) {
				return (
					'ArasListItemXmlSchemaElementTreeNode' +
					' ' +
					this.getListItemType(schemaElement)
				);
			},

			GetTreeName: function (schemaElement, elementState) {
				return (
					this.inherited(arguments) +
					' - <i class="ArasListItemPointContainer"></i>'
				);
			},

			getListItemType: function (schemaElement) {
				var parentList = schemaElement.List();
				var listType = parentList ? parentList.Attribute('type') : '';

				return (listType ? listType : 'default') + 'ListItem';
			}
		}
	);
});
