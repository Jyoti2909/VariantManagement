define([
	'dojo/_base/declare',
	'dojo/aspect'
],
function(declare, aspect) {
	return declare('Aras.Client.Controls.Requirement.ReqDocActionStateController', null, {
		aras: null,
		viewmodel: null,
		_stateObject: null,
		_requirementsHelper: null,

		constructor: function(args) {
			this.aras = args.aras;
			this.viewmodel = args.viewmodel;
			this._requirementsHelper = this.viewmodel.getRequirementsHelper();
		},

		updateStateAfterAddAction: function(newRequirement) {
			const reqId = this._requirementsHelper.getRequirementPropertyValue(newRequirement, 'config_id');
			this._updateStateInRequirementContainer(reqId);
		},

		updateState: function(evnt) {
			let reqId;
			switch (evnt.eventType) {
				case 'delete':
					reqId = evnt.reqsId.prevReq || evnt.reqsId.nextReq;
					this._updateStateInRequirementContainer(reqId);
					break;
				case 'replace':
					reqId = evnt.requirementToReplaceId;
					this._updateStateInRequirementContainer(reqId);
					break;
			}
		},

		_getElementByReqId: function(reqId) {
			let selectedOrigin = this.viewmodel.origin.selectSingleNode('/aras:document/aras:content/aras:block/*[@reqId="' + reqId + '"]');
			return this.viewmodel.GetElementsByOrigin(selectedOrigin);
		},

		_updateStateInRequirementContainer: function(reqId) {
			this._stateObject = {
				targetElement: this._getElementByReqId(reqId)
			};
		},

		getState: function() {
			return this._stateObject;
		},

		clearState: function() {
			this._stateObject = null;
		}
	});
});
