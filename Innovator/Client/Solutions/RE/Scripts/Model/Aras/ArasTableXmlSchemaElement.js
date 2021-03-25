define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTableXmlSchemaElement',
],
function(declare, TechDocArasTableXmlSchemaElement) {
	return declare('Aras.Client.Controls.Requirement.ViewModel.Aras.ArasTableXmlSchemaElement', [TechDocArasTableXmlSchemaElement], {
		_checkRowBelongExternal: function(row) {
			return false;
		}
	});
});
