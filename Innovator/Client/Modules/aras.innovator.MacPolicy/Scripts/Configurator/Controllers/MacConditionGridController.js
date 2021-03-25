define([
	'MacPolicy/Scripts/Configurator/Grid/MacConditionGridInitializer',
	'MacPolicy/Scripts/Configurator/Toolbar/GridToolbarInitializer',
	'MacPolicy/Scripts/Configurator/MacCondition',
	'MacPolicy/Scripts/Configurator/MacConditionDataLoader',
	'QB/Scripts/qbTreeStore',
	'QB/Scripts/ConditionsTree',
	'dojo/aspect'
], function (
	MacConditionGridInitializer,
	GridToolbarInitializer,
	macCondition,
	DataLoader,
	qbTreeStore,
	ConditionsTree,
	aspect
) {
	'use strict';
	const MacConditionGridController = (function () {
		function MacConditionGridController() {
			this.conditionGrid = new MacConditionGridInitializer(
				'conditionsGrid',
				this
			);
			this.gridToolbar = new GridToolbarInitializer('gridToolbar', this);
			const self = this;
			aspect.after(
				this.conditionGrid.grid,
				'gridClick',
				function () {
					self.updateControls();
				},
				true
			);
			aspect.after(
				this.conditionGrid.grid,
				'gridDoubleClick',
				function (rowId) {
					self.onEditCondition(rowId);
				},
				true
			);
			aspect.after(
				aras,
				'uiReShowItemEx',
				function () {
					self.invalidateCache();
				},
				true
			);
			this.dataLoader = new DataLoader();
		}
		MacConditionGridController.prototype.contextMenuAction = function (
			action,
			conditionId
		) {
			if (!action && !conditionId) {
				return;
			}
			if (action === 'Edit' || action === 'View') {
				this.onEditCondition(conditionId);
			}
			if (action === 'Remove') {
				this.onDeleteCondition(conditionId);
				this.updateControls();
			}
		};
		MacConditionGridController.prototype.invalidateCache = function () {
			if (this.dataLoader) {
				this.dataLoader.invalidateCache();
			}
		};
		MacConditionGridController.prototype.gridToolbarAction = function (button) {
			const action = button.getId();
			const conditionId = this.conditionGrid.grid.getSelectedId();
			if (!action && !conditionId) {
				return;
			}
			if (action === 'NewRow') {
				this.onNewCondition();
			}
			if (action === 'EditRow') {
				this.onEditCondition(conditionId);
			}
			if (action === 'DeleteRow') {
				this.onDeleteCondition(conditionId);
			}
		};
		MacConditionGridController.prototype.onEditCondition = function (
			conditionId
		) {};
		MacConditionGridController.prototype.onNewCondition = function () {};
		MacConditionGridController.prototype.onDeleteCondition = function (
			conditionId
		) {};
		MacConditionGridController.prototype.populateGrid = function (item) {
			// eslint-disable-next-line new-cap
			this.conditionGrid.grid.RemoveAllRows();
			const res = item.getRelationships('mp_MacCondition');
			const tmp = res.nodeList;
			const conditionNds = tmp && tmp.length > 0 ? tmp : null;
			if (conditionNds) {
				const itemsGrid = [];
				for (let i = 0; i < conditionNds.length; i++) {
					const conditionNd = conditionNds[i];
					if (conditionNd.getAttribute('action') !== 'delete') {
						const condition = this.getConditionText(conditionNd);
						itemsGrid.push({
							uniqueId: conditionNd.getAttribute('id'),
							name: aras.getNodeElement(conditionNd, 'name'),
							condition: condition.text,
							description: aras.getNodeElement(conditionNd, 'description'),
							isError: condition.isError
						});
					}
				}
				this.conditionGrid.grid.setArrayData_Experimental(itemsGrid);
			}
			this.updateControls();
		};
		MacConditionGridController.prototype.getConditionText = function (
			conditionNd
		) {
			const conditionXml = aras.getNodeElement(conditionNd, 'condition_xml');
			let queryDefinitionItem = aras.newIOMItem();
			if (conditionXml && conditionXml !== '') {
				queryDefinitionItem.loadAML(conditionXml);
			} else {
				return {
					text: '',
					isError: false
				};
			}
			queryDefinitionItem = macCondition.prepareToUI(queryDefinitionItem);
			const dataStore = this.dataLoader.load(queryDefinitionItem.node);
			qbTreeStore.loadItems(dataStore);
			const conditionsTree = new ConditionsTree();
			const queryReferenceXpath =
				"Relationships/Item[@type='qry_QueryReference' and " +
				"child_ref_id= '11BB8EB866DB47AC858B39845CACC733']";
			const currItem = queryDefinitionItem.node.selectSingleNode(
				queryReferenceXpath
			);
			const filterXml = currItem.selectSingleNode('filter_xml').text;
			if (!macCondition.validateProperties(filterXml)) {
				return {
					text: aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_grid.error_in_condition'
					),
					isError: true
				};
			}
			const conditionDom = new XmlDocument();
			if (filterXml) {
				conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
			}
			try {
				conditionsTree.fromXml(
					conditionDom,
					qbTreeStore.dataStore.treeModelCollection
				);
				macCondition.transformAstBeforeOpen(conditionsTree.root);
				const result = conditionsTree.toString();
				return {
					text: result,
					isError: false
				};
			} catch (e) {
				return {
					text: aras.getResource(
						'../Modules/aras.innovator.MacPolicy/',
						'condition_grid.error_in_condition'
					),
					isError: true
				};
			}
		};
		MacConditionGridController.prototype.updateControls = function () {
			const isEditMode = window.isEditMode;
			const menu = this.conditionGrid.grid.contexMenu_Experimental;
			menu.setHide('Edit', !isEditMode);
			menu.setHide('View', isEditMode);
			menu.setDisable('Remove', !isEditMode);
			const selectedRow = this.conditionGrid.grid.getSelectedItemIds();
			const enabled = isEditMode && selectedRow.length > 0;
			this.setEnabledToolbarButton('NewRow', isEditMode);
			this.setEnabledToolbarButton('EditRow', enabled);
			this.setEnabledToolbarButton('DeleteRow', enabled);
		};
		MacConditionGridController.prototype.setEnabledToolbarButton = function (
			name,
			enabled
		) {
			this.gridToolbar.toolbar.getItem(name).setEnabled(enabled);
		};
		return MacConditionGridController;
	})();
	return MacConditionGridController;
});
