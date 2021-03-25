define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/OptionalContentHelper'
],
function(declare, Enums, TechDocOptionalContentHelper) {
	return declare('Aras.Client.Controls.Requirement.OptionalContentHelper', [TechDocOptionalContentHelper], {
		_GetAllOptionFamilies: function() {
			this._optionFamiliesHash = {};
		}
	});
});
