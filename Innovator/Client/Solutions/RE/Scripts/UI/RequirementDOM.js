define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM',
],
function(declare, TechDocDOMapi) {
	return declare('Aras.Client.Controls.RE.UI.RequirementDOM', [TechDocDOMapi], {
		getObject: function(/*DomNode*/ node) {
			const targetObject = this.inherited(arguments);
			return targetObject && this._structuredDocument.isImmutableElement(targetObject) ? targetObject.Parent : targetObject;
		}
	});
});
