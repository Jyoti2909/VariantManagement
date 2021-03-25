define([
	'MacPolicy/Scripts/Configurator/Toolbar/FormToolbarInitializer'
], function (FormToolbarInitializer) {
	'use strict';
	const MacConditionFormController = (function () {
		function MacConditionFormController() {
			this.formToolbar = new FormToolbarInitializer('formToolbar', this);
		}
		MacConditionFormController.prototype.getItem = function () {
			const item = this.getFormDocument().thisItem;
			if (item) {
				return item;
			}
			return;
		};
		MacConditionFormController.prototype.getFormDocument = function () {
			return this.formWindow.document;
		};
		MacConditionFormController.prototype.initForm = function (item) {
			const formId = aras.getFormId('mp_MacCondition');
			const isEditMode = window.isEditMode;
			const formType = isEditMode && item ? 'edit' : 'view';
			const form = aras.getFormForDisplay(formId, 'id').node;
			const frame = document.getElementById('conditionFormFrame');
			this.formWindow = frame.contentWindow;
			aras.uiShowItemInFrameEx(this.formWindow, item, formType, 0, form);
			this.setEnabledAllToolbarButton(isEditMode && item);
		};
		MacConditionFormController.prototype.setEnabledAllToolbarButton = function (
			enabled
		) {
			this.setEnabledToolbarButton('delete', enabled);
			this.setEnabledToolbarButton('save', enabled);
			this.setEnabledToolbarButton('OperatorAND', enabled);
			this.setEnabledToolbarButton('OperatorOR', enabled);
			this.setEnabledToolbarButton('OperatorNOT', enabled);
		};
		MacConditionFormController.prototype.setEnabledToolbarButton = function (
			name,
			enabled
		) {
			this.formToolbar.toolbar.getItem(name).setEnabled(enabled);
		};
		MacConditionFormController.prototype.formToolbarAction = function (button) {
			const action = button.getId();
			if (action === 'save') {
				this.onSaveCondition();
			}
			if (action === 'delete') {
				const item = this.getItem();
				item.setAttribute('isDirty', '0');
				this.initForm(null);
				this.onCancelCondition();
			}
			if (
				action === 'OperatorNOT' ||
				action === 'OperatorAND' ||
				action === 'OperatorOR'
			) {
				this.formWindow.rulesEditor.addOperator(action.replace('Operator', ''));
			}
		};
		MacConditionFormController.prototype.onSaveCondition = function () {};
		MacConditionFormController.prototype.onCancelCondition = function () {};
		return MacConditionFormController;
	})();
	return MacConditionFormController;
});
