define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaElementRenderer'
], function (declare, XmlSchemaElementRenderer) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.ArasBlockXmlSchemaElementRenderer',
		XmlSchemaElementRenderer,
		{
			constructor: function (initialArguments) {
				this.ResourceString(
					'newDocVersionExists',
					'../Modules/aras.innovator.TDF',
					'rendering.newdocversionexists'
				);
			},

			GetClassList: function (schemaElement, elementState) {
				var result = this.inherited(arguments);

				if (
					elementState &&
					elementState.isInactive &&
					schemaElement.inactiveContentCollapsed
				) {
					result.push('ContentCollapsed');
				}

				return result;
			},

			prepareElementState: function (schemaElement, parentState) {
				const resultState = this.inherited(arguments);

				if (schemaElement) {
					resultState.isExternal = schemaElement.isExternal();
				}

				return resultState;
			},

			RenderInnerContent: function (schemaElement, elementState) {
				return elementState.isBlocked
					? 'Content is blocked'
					: this.inherited(arguments);
			},

			GetTreeName: function (schemaElement, elementState) {
				var isUpdatable = elementState.isUpdatable;
				var namePostfix = isUpdatable
					? this.wrapInTag(
							' [' +
								schemaElement.getReferenceProperty('majorVersion') +
								'.' +
								schemaElement.getReferenceProperty('minorVersion') +
								']',
							'span',
							{
								style: 'font-size:smaller;'
							}
					  )
					: '';

				if (elementState.isExternal) {
					treeName = elementState.isBlocked
						? 'Technical Document is blocked'
						: schemaElement.GetProperty('name');
				} else if (schemaElement.ownerDocument && !schemaElement.Parent) {
					// if rendered block is root element
					treeName = schemaElement.ownerDocument.getDocumentProperty('name');
				} else {
					treeName = 'Group';
				}

				return this.wrapInTag(treeName + namePostfix, 'span', {
					class: 'ArasXmlSchemaElementTypeNode',
					title: isUpdatable ? this.ResourceString('newDocVersionExists') : ''
				});
			},

			GetTreeType: function (schemaElement, elementState) {
				var isDocumentBlock = !schemaElement.Parent || elementState.isExternal;

				return (
					'ArasBlockXmlSchemaElement' + (isDocumentBlock ? 'Document' : 'Group')
				);
			},

			GetTreeStyle: function (schemaElement) {}
		}
	);
});
