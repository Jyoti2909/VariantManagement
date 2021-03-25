define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
], function (declare, ActionBase) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.MakeBlockInternalAction',
		ActionBase,
		{
			constructor: function (args) {},

			Execute: function (/*Object*/ context) {
				var selectedItem = context.selectedItem;
				selectedItem.MakeBlockInternal();
			}
		}
	);
});
