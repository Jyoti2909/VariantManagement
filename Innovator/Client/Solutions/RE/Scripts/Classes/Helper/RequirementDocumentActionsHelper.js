define([
	'dojo/_base/declare',
	'RE/Scripts/Classes/Helper/ActionsHelper'
],
function(declare, RequirementActionsHelper) {
	return declare('Aras.Client.Controls.RequirementDocument.ActionsHelper', [RequirementActionsHelper], {
		_isNodeRelatedToClassification: function(currentSelectedItems) {
			var reqId = currentSelectedItems.origin.getAttribute('reqId');
			if (!reqId) {
				return false;
			}

			var itemClassification = this.viewmodel.GetRequirementClassification(currentSelectedItems);

			var itemClassification = itemClassification.replace(/ /g, '');
			if (itemClassification == 'Text') {
				itemClassification = 'RequirementText';
			}

			return currentSelectedItems.nodeName == itemClassification;
		}
	});
});
