define(function () {
	'use strict';
	const MacPolicyFormHelper = (function () {
		function MacPolicyFormHelper(aras) {
			this._aras = aras;
		}
		MacPolicyFormHelper.prototype.removeConditionFromPolicyRules = function (
			item,
			refId
		) {
			const propertyArray = [
				'show_permissions_warning',
				'can_discover',
				'can_get',
				'can_update',
				'can_delete'
			];
			for (let i = 0; i < propertyArray.length; i++) {
				const currValue = item.getProperty(propertyArray[i]);
				if (currValue === refId) {
					item.setProperty(propertyArray[i], '');
				}
			}
		};
		MacPolicyFormHelper.prototype.isConditionExists = function (
			item,
			conditionId
		) {
			const conditions = this.getMacConditions(item);
			let conditionRefId;
			const propertyArray = [
				'show_permissions_warning',
				'can_discover',
				'can_get',
				'can_update',
				'can_delete'
			];
			if (conditions.getItemCount() > 0) {
				for (let i = 0; i < conditions.getItemCount(); i++) {
					const condition = conditions.getItemByIndex(i);
					if (condition.getId() === conditionId) {
						conditionRefId = condition.getProperty('ref_id');
					}
				}
				if (conditionRefId) {
					for (let i = 0; i < propertyArray.length; i++) {
						const currValue = item.getProperty(propertyArray[i]);
						if (currValue === conditionRefId) {
							return true;
						}
					}
				} else {
					return false;
				}
			}
			return false;
		};
		MacPolicyFormHelper.prototype.getMacConditions = function (item) {
			aras.getItemRelationshipsEx(
				item.node,
				'mp_MacCondition',
				undefined,
				undefined,
				undefined,
				false
			);
			const result = item.getRelationships('mp_MacCondition');
			return result;
		};
		return MacPolicyFormHelper;
	})();
	return MacPolicyFormHelper;
});
