define([
	'TreeGridView/Scripts/Configurator/DataLayer/CombiningModule',
	'TreeGridView/Scripts/Configurator/DataLayer/Intellisense',
	'TreeGridView/Scripts/Configurator/DataLayer/ValidationModule',
	'TreeGridView/Scripts/Configurator/DataLayer/BranchBuilder',
	'TreeGridView/Scripts/Configurator/DataLayer/QueryDefinitionFilter',
	'TreeGridView/Scripts/Configurator/Models/TreeGrid/Branch',
	'TreeGridView/Scripts/Configurator/DataLayer/TreeGridMapper',
	'TreeGridView/Scripts/Configurator/DataLayer/TreeGridRepository',
	'TreeGridView/Scripts/Configurator/DataStructureFactory',
	'TreeGridView/Scripts/Configurator/TooltipDialog/TooltipDialogUtils',
	'TreeGridView/Scripts/Configurator/DataLayer/IdentificatorFilter',
	'TreeGridView/Scripts/Configurator/Menu/CellMenu',
	'TreeGridView/Scripts/Configurator/Menu/HeaderMenu',
	'TreeGridView/Scripts/Configurator/Dialogs/CellEditorDialog',
	'TreeGridView/Scripts/Configurator/Menu/MenuConfigurator',
	'TreeGridView/Scripts/Configurator/ConfiguratorCellDefMappper'
], function (
	CombiningModule,
	Intellisense,
	ValidationModule,
	BranchBuilder,
	QueryDefinitionFilter,
	Branch,
	TreeGridMapper,
	TreeGridRepository,
	DataStructureFactory,
	TooltipDialogUtils,
	IdentificatorFilter,
	CellMenu,
	HeaderMenu,
	CellEditorDialog,
	MenuConfigurator,
	ConfiguratorCellDefMappper
) {
	'use strict';
	var ModuleFactory = (function () {
		function ModuleFactory() {}
		ModuleFactory.prototype.getCombiningModule = function (
			viewDefinition,
			queryDefinition
		) {
			return new CombiningModule(viewDefinition, queryDefinition);
		};
		ModuleFactory.prototype.getIntellisenseModule = function (queryDefinition) {
			return new Intellisense(queryDefinition);
		};
		ModuleFactory.prototype.getValidationModule = function (
			viewDefinition,
			queryDefinition,
			intellisense
		) {
			return new ValidationModule(
				viewDefinition,
				queryDefinition,
				intellisense
			);
		};
		ModuleFactory.prototype.getBranchBuilder = function (
			viewDefinition,
			queryDefinition
		) {
			return new BranchBuilder(viewDefinition, queryDefinition);
		};
		ModuleFactory.prototype.getQueryDefinitionFilter = function (
			viewDefinition,
			queryDefinition
		) {
			return new QueryDefinitionFilter(viewDefinition, queryDefinition);
		};
		ModuleFactory.prototype.getTreeGridMapper = function (
			viewDefinition,
			queryDefinition,
			branch
		) {
			return new TreeGridMapper(viewDefinition, queryDefinition, branch);
		};
		ModuleFactory.prototype.getNewBranch = function () {
			return new Branch();
		};
		ModuleFactory.prototype.getTreeGridRepository = function (
			viewDefinition,
			queryDefinition,
			moduleFactory
		) {
			return new TreeGridRepository(
				viewDefinition,
				queryDefinition,
				moduleFactory
			);
		};
		ModuleFactory.prototype.getDataStructureFactory = function (aras, item) {
			return new DataStructureFactory(aras, item);
		};
		ModuleFactory.prototype.getTooltipDialogUtils = function (aras) {
			return new TooltipDialogUtils({ aras: aras });
		};
		ModuleFactory.prototype.getCellDefMappper = function () {
			return new ConfiguratorCellDefMappper();
		};
		ModuleFactory.prototype.getIdentificatorFilter = function () {
			return new IdentificatorFilter(ArasModules.cryptohash.MD5);
		};
		ModuleFactory.prototype.initCellMenu = function (
			controllerContext,
			viewContext
		) {
			return new CellMenu(controllerContext, viewContext);
		};
		ModuleFactory.prototype.initHeaderMenu = function (
			controllerContext,
			viewContext
		) {
			return new HeaderMenu(controllerContext, viewContext);
		};
		ModuleFactory.prototype.getCellEditorDialog = function (
			treeGridRepository,
			tooltipDialogUtils
		) {
			return new CellEditorDialog(aras, treeGridRepository, tooltipDialogUtils);
		};
		ModuleFactory.prototype.getMenuConfigurator = function (
			treeGridRepository
		) {
			return new MenuConfigurator(treeGridRepository);
		};
		return ModuleFactory;
	})();
	return ModuleFactory;
});
