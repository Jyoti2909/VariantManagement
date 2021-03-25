define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.ResolveConflictModule', null, {
		_controlEnabled: true,

		constructor: function (mediator) {
			this._mediator = mediator;
			this._initControl();
		},

		update: function (items, targetState) {
			if (!this._controlEnabled) {
				return;
			}

			var hasInvalidItems = items.some(function (item) {
				return item.getProperty('mpo_isItemValid') === '0';
			});
			this._setControlState(!hasInvalidItems);
			this._setVisibility(hasInvalidItems);
		},

		_onResolveConflicts: function _onResolveConflicts() {
			this._mediator.onResolveConflicts({
				resolveConflictsMethod: this._getSelectedResolveConflictsMethod()
			});
		},

		_getSelectedResolveConflictsMethod: function _getSelectedResolveConflictsMethod() {
			var selectedMethod = this._resolveConflictsMethodsRadio.find(function (
				item
			) {
				return item.checked;
			});

			return selectedMethod.value;
		},

		_setControlState: function (disabled) {
			this._applyButton.disabled = disabled;

			this._resolveConflictsMethodsRadio.forEach(function (item) {
				item.disabled = disabled;
			});
		},

		_setVisibility: function (isVisible) {
			document
				.getElementById('resolveConflicts')
				.classList.toggle('aras-hide', !isVisible);
		},

		_initControl: function _initControl() {
			this._applyButton = document.getElementById('apply');
			this._applyButton.addEventListener(
				'click',
				this._onResolveConflicts.bind(this)
			);
			this._resolveConflictsMethodsRadio = Array.prototype.slice.call(
				document.getElementsByName('resolveConflictsMethod')
			);
			this._setLabels();
		},

		freeze: function () {
			this._controlEnabled = false;
		},

		_setLabels: function () {
			const moduleElement = document.getElementById('resolveConflicts');
			const headerLabel = moduleElement.getElementsByClassName(
				'mpo-settings-module-header'
			)[0];
			headerLabel.textContent = this._mediator.getResource('all_invalid_items');
			this._applyButton.textContent = this._mediator.getResource('apply');

			document.getElementById(
				'mpo_removeInvalid'
			).textContent = this._mediator.getResource('remove_from_selection');
			document.getElementById(
				'mpo_moveToAnotherSession'
			).textContent = this._mediator.getResource(
				'move_to_another_promote_session'
			);
		}
	});
});
