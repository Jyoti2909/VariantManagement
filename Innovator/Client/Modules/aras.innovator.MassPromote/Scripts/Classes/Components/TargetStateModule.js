define([
	'dojo/_base/declare',
	'MassPromote/Scripts/Classes/Controls/Dropdown'
], function (declare, Dropdown) {
	return declare('MassPromote.TargetStateModule', null, {
		_controlEnabled: true,

		constructor: function (mediator) {
			this._mediator = mediator;
			this._initControls();
		},

		update: function (lifeCycleInfo) {
			if (!this._controlEnabled) {
				return;
			}

			if (!lifeCycleInfo) {
				this._clearControl();
				this._comboBox.setDisabled(true);
				return;
			}

			var targetStates = lifeCycleInfo.getAllTargetStates();
			this._comboBox.setDisabled(false);
			this._comboBox.setData(targetStates);
		},

		_clearControl: function () {
			var selectedItem = this.getCurrent();
			this._comboBox.setData([]);
			if (selectedItem) {
				this._mediator.onTargeStateChanged({});
			}
		},

		getCurrent: function () {
			return this._comboBox.getSelectedObject();
		},

		freeze: function () {
			this._controlEnabled = false;
			this._comboBox.setDisabled(true);
		},

		_initControls: function () {
			this._setHeaderLabel();
			var self = this;

			this._comboBox = new Dropdown({
				connectId: 'targetStateSelect',
				placeholder: this._mediator.getResource('dropdown_select'),
				store: [],
				onchange: function (element) {
					self._mediator.onTargeStateChanged({ selectedItem: element });
				}
			});
		},

		_setHeaderLabel: function () {
			const moduleElement = document.getElementById('targetState');
			const header = moduleElement.getElementsByClassName(
				'mpo-settings-module-header'
			)[0];
			header.textContent = this._mediator.getResource('target_state');
		}
	});
});
