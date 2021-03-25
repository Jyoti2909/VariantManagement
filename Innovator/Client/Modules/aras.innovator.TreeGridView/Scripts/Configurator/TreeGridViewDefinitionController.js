define([
	'TreeGridView/Scripts/Configurator/TreeGridViewDefinitionView',
	'TreeGridView/Scripts/Configurator/ConfiguratorView',
	'TreeGridView/Scripts/Configurator/ConfiguratorController',
	'TreeGridView/Scripts/Configurator/ModuleFactory'
], function (
	TreeGridViewDefinitionView,
	ConfiguratorView,
	ConfiguratorController,
	ModuleFactory
) {
	'use strict';
	var TreeGridViewDefinitionController = (function () {
		function TreeGridViewDefinitionController(aras, item) {
			this.view = new TreeGridViewDefinitionView(window.document);
			this._aras = aras;
			this._item = item;
		}
		TreeGridViewDefinitionController.prototype.load = function () {
			var viewDictionary = {
				form: true
			};
			this.initConfiguratorView(viewDictionary);
			this.view.initialize(viewDictionary);
		};
		TreeGridViewDefinitionController.prototype.reload = function (item) {
			this._item = item;
			if (this._configuratorController) {
				this._configuratorController.reload(item);
			} else {
				var viewDictionary = {};
				this.initConfiguratorView(viewDictionary);
				this.view.initializeChildViews(viewDictionary);
			}
		};
		TreeGridViewDefinitionController.prototype.onResizeWindow = function () {
			if (this._configuratorController) {
				this._configuratorController.onResizeWindow();
			}
		};
		TreeGridViewDefinitionController.prototype.initConfiguratorView = function (
			viewDictionary
		) {
			if (this._item.getAttribute('action') !== 'add') {
				var moduleFactory = new ModuleFactory();
				this._configuratorController = new ConfiguratorController(
					this._aras,
					this._item,
					moduleFactory
				);
				var configuratorView = new ConfiguratorView(
					clientControlsFactory,
					aras,
					this._configuratorController,
					moduleFactory
				);
				this._configuratorController.setView(configuratorView);
				viewDictionary.configurator = configuratorView;
			}
		};
		return TreeGridViewDefinitionController;
	})();
	return TreeGridViewDefinitionController;
});
