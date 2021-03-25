/* global thisItem */
define([
	'MacPolicy/Scripts/Configurator/Controllers/MacConditionGridController',
	'MacPolicy/Scripts/Configurator/Controllers/MacConditionFormController',
	'MacPolicy/Scripts/Configurator/MacCondition',
	'MacPolicy/Scripts/Configurator/MacPolicyFormHelper',
	'MacPolicy/Scripts/Configurator/Dialogs/showConditionRemoveWarning',
	'dojo/aspect'
], function (
	MacConditionGridController,
	MacConditionFormController,
	MacCondition,
	MacPolicyFormHelper,
	showConditionRemoveWarning,
	aspect
) {
	'use strict';
	const MacConditionEditor = (function () {
		function MacConditionEditor() {
			this.formHelper = new MacPolicyFormHelper(aras);
			this.grid = new MacConditionGridController();
			this.form = new MacConditionFormController();
			const self = this;
			aspect.after(
				this.grid,
				'onEditCondition',
				function (conditionId) {
					self.editCondition(conditionId);
				},
				true
			);
			aspect.after(
				this.grid,
				'onNewCondition',
				function () {
					self.newCondition();
				},
				true
			);
			aspect.after(
				this.grid,
				'onDeleteCondition',
				function (conditionId) {
					self.deleteCondition(conditionId);
				},
				true
			);
			aspect.after(
				this.form,
				'onSaveCondition',
				function () {
					self.saveCondition();
				},
				true
			);
			aspect.after(
				this.form,
				'onCancelCondition',
				function () {
					self.load();
				},
				true
			);
		}
		MacConditionEditor.prototype.load = function () {
			this.grid.populateGrid(thisItem);
			if (!this.form.formWindow) {
				this.form.initForm(null);
			}
		};
		MacConditionEditor.prototype.reload = function () {
			this.grid.populateGrid(thisItem);
			this.form.initForm(null);
		};
		MacConditionEditor.prototype.editCondition = function (conditionId) {
			if (!conditionId) {
				return;
			}
			const formItem = this.form.getItem();
			if (formItem && aras.isDirtyEx(formItem.node)) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_editor.unsaved'
					)
				);
				return;
			}
			const condition = thisItem.node.selectSingleNode(
				'Relationships/Item[@id="' + conditionId + '"]'
			);
			if (!condition) {
				return;
			}
			const item = aras.newIOMItem();
			item.loadAML(condition.xml);
			this.form.initForm(item.node);
			thisItem.setAttribute('isDirty', '1');
		};
		MacConditionEditor.prototype.newCondition = function () {
			const formItem = this.form.getItem();
			if (formItem && aras.isDirtyEx(formItem.node)) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_editor.unsaved'
					)
				);
				return;
			}
			const newItem = aras.newIOMItem('mp_MacCondition');
			newItem.setNewID();
			newItem.setProperty('ref_id', aras.generateNewGUID());
			this.form.initForm(newItem.node);
			this.grid.conditionGrid.grid.addRow(newItem.getId(), '', true);
			this.grid.conditionGrid.grid.setSelectedRow(newItem.getId());
			thisItem.setAttribute('isDirty', '1');
		};
		MacConditionEditor.prototype.deleteCondition = function (conditionId) {
			if (!conditionId) {
				return;
			}
			const formItem = this.form.getItem();
			if (formItem && formItem.getId() == conditionId) {
				aras.AlertWarning(
					aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_editor.delete_when_edit'
					)
				);
				return;
			}
			let message;
			if (this.formHelper.isConditionExists(thisItem, conditionId)) {
				message = aras.getResource(
					'../Modules/aras.innovator.MacPolicy/',
					'policy.used_condition_remove_warning'
				);
			} else {
				const name = thisItem.node.selectSingleNode(
					'Relationships/Item[@id="' + conditionId + '"]/name'
				);
				message = aras.getResource(
					'../Modules/aras.innovator.MacPolicy/',
					'policy.condition_remove_warning',
					name.text
				);
			}
			const self = this;
			showConditionRemoveWarning(message)
				.then(function (result) {
					if (result) {
						const rel = thisItem.node.selectSingleNode(
							'Relationships/Item[@id="' + conditionId + '"]'
						);
						if (!rel) {
							self.grid.conditionGrid.grid.deleteRow(conditionId);
							self.grid.updateControls();
							return false;
						}
						const refId = rel.selectSingleNode('ref_id').text;
						self.formHelper.removeConditionFromPolicyRules(thisItem, refId);
						const act = rel.getAttribute('action');
						if (act === 'add') {
							rel.parentNode.removeChild(rel);
							self.grid.conditionGrid.grid.deleteRow(conditionId);
						} else {
							rel.setAttribute('action', 'delete');
							self.grid.conditionGrid.grid.deleteRow(conditionId);
							thisItem.setAttribute('isDirty', '1');
						}
						self.grid.updateControls();
					}
				})
				.catch(function (e) {
					const message = e || aras.getResource('', 'common.client_side_err');
					aras.AlertError(message);
				});
		};
		MacConditionEditor.prototype.saveCondition = function () {
			const formItem = this.form.getItem();
			const newConditionXml = this.form.formWindow.rulesEditor.getCondition();
			if (!newConditionXml) {
				return false;
			}
			let currentConditionXml = formItem.getProperty('condition_xml');
			let queryDefinitionItem = aras.newIOMItem();
			if (!currentConditionXml) {
				currentConditionXml = MacCondition.getDefaultConditionXml();
			}
			queryDefinitionItem.loadAML(currentConditionXml);
			const condition = aras.createXMLDocument();
			condition.loadXML(newConditionXml);
			queryDefinitionItem = MacCondition.prepareToSaveOnServer(
				queryDefinitionItem,
				condition
			);
			formItem.setProperty('condition_xml', queryDefinitionItem.node.xml);
			if (
				aras.checkItem(formItem.node, window) &&
				MacCondition.checkName(formItem)
			) {
				thisItem.setAttribute('isDirty', '1');
				formItem.node.setAttribute('isDirty', '0');
				const oldCondition = thisItem.node.selectSingleNode(
					'Relationships/Item[@id="' + formItem.getId() + '"]'
				);
				if (oldCondition) {
					if (formItem.isNew()) {
						formItem.setAction('add');
					} else {
						formItem.setAction('update');
					}
					oldCondition.parentNode.replaceChild(formItem.node, oldCondition);
				} else {
					formItem.setAction('add');
					formItem.setAttribute('isDirty', '0');
					thisItem.addRelationship(formItem);
				}
				this.reload();
			} else {
				return false;
			}
			return true;
		};
		return MacConditionEditor;
	})();
	return MacConditionEditor;
});
