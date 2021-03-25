define([
	'dojo/aspect',
	'TreeGridView/Scripts/Configurator/TreeGridViewDefinitionController',
	'TreeGridView/Scripts/Configurator/TooltipDialog/TooltipDialogUtils'
], function (aspect, TreeGridViewDefinitionController, TooltipDialogUtils) {
	'use strict';
	var controller = new TreeGridViewDefinitionController(aras, getItem());
	controller.load();
	window.treeGridViewDefinitionController = controller;
	window.configuratorView = controller.view;
	aspect.after(
		window,
		'setEditMode',
		function () {
			controller.reload(getItem());
		},
		true
	);
	aspect.after(
		window,
		'setViewMode',
		function () {
			controller.reload(getItem());
		},
		true
	);
	var onBeforeUnloadRbConfigurator = function () {
		var tooltipDialogUtils = new TooltipDialogUtils({ aras: aras });
		var currentTooltipDialog = tooltipDialogUtils.getCurrentTooltipDialog();
		if (currentTooltipDialog && currentTooltipDialog.isActive()) {
			currentTooltipDialog.cancel();
		}
		window.removeEventListener('beforeunload', onBeforeUnloadRbConfigurator);
		window.removeEventListener('resize', onWindowResize);
	};
	var onWindowResize = function () {
		controller.onResizeWindow();
	};
	window.addEventListener('beforeunload', onBeforeUnloadRbConfigurator);
	window.addEventListener('resize', onWindowResize);

	var qd = aras.getItemProperty(item, 'query_definition');
	var paramQuery = aras.newIOMItem('qry_QueryParameter', 'get');
	paramQuery.setProperty('source_id', qd);
	paramQuery.setAttribute('select', 'name');
	var existsParams = paramQuery.apply();

	var parameterMapping = item.selectNodes(
		'Relationships/Item[@type="rb_QueryDefinitionParameterMap"]'
	);
	if (!parameterMapping.length) {
		var mappingQuery = aras.newIOMItem('rb_TreeGridViewDefinition', 'get');
		mappingQuery.setID(item.getAttribute('id'));
		mappingQuery.setAttribute('select', 'id');
		var parameterMapQuery = aras.newIOMItem(
			'rb_QueryDefinitionParameterMap',
			'get'
		);
		mappingQuery.addRelationship(parameterMapQuery);
		var mappingQueryResult = mappingQuery.apply();
		if (mappingQueryResult.node) {
			aras.mergeItemRelationships(item, mappingQueryResult.node);
		}
	}

	var countExistsParams = existsParams.getItemCount();

	var exitsParamName = [];
	for (var i = 0; i < countExistsParams; i++) {
		exitsParamName.push(existsParams.getItemByIndex(i).getProperty('name'));
	}

	var visibleParams = item.selectNodes(
		'Relationships/Item[@type="rb_QueryDefinitionParameterMap"]'
	);
	for (i = 0; i < visibleParams.length; i++) {
		var visibleParamName = visibleParams[i].selectSingleNode(
			'qd_parameter_name'
		).text;
		if (exitsParamName.indexOf(visibleParamName) === -1) {
			aras.AlertWarning(
				aras.getResource(
					'../Modules/aras.innovator.TreeGridView',
					'initilize.bad_parameters'
				)
			);
			break;
		}
	}
});
