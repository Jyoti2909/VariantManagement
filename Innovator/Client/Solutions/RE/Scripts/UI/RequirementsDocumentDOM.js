define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM',
],
function(declare, TechDocDOMapi) {
	return declare('Aras.Client.Controls.RE.UI.RequirementsDocumentDOM', [TechDocDOMapi], {
		getObject: function(/*DomNode*/ node) {
			let targetObject = this.inherited(arguments);
			if (targetObject && this._structuredDocument.isImmutableElement(targetObject)) {
				targetObject = this._structuredDocument._getClassifiedParentElement(targetObject);
			}
			return targetObject;
		}
	});
});
