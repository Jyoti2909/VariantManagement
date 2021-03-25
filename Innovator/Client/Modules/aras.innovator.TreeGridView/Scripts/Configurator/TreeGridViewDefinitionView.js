define([
	'dojo/dom',
	'dijit/registry',
	'TreeGridView/Scripts/Configurator/FormView'
], function (dom, registry, FormView) {
	'use strict';
	var TreeGridViewDefinitionView = (function () {
		function TreeGridViewDefinitionView(contextDocument) {
			this.contextDocument = contextDocument;
		}
		TreeGridViewDefinitionView.prototype.initialize = function (
			viewDictionary
		) {
			this.initializeChildViews(viewDictionary);
		};
		TreeGridViewDefinitionView.prototype.showConfigurator = function () {
			var containerWidget = registry.byId('TreeGridViewDefinitionConfigurator');
			containerWidget.resize();
			this.configuratorView.initialize();
		};
		TreeGridViewDefinitionView.prototype.initializeChildViews = function (
			viewDictionary
		) {
			if (viewDictionary.configurator) {
				this.configuratorView = viewDictionary.configurator;
				this.configuratorView.setNode(dom.byId('configuratorTree'));
			}
			if (viewDictionary.form) {
				var formNode = dom.byId('CenterBorderContainer');
				this.form = new FormView(formNode);
			}
		};
		return TreeGridViewDefinitionView;
	})();
	return TreeGridViewDefinitionView;
});
