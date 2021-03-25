define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/TreeRenderer',
],
function(declare, TechDocTreeRenderer) {
	return declare('Aras.Client.Controls.RE.UI.RequirementTreeRenderer', [TechDocTreeRenderer], {
		RenderModel: function(/*WrappedObject*/ renderObject) {
			const model = this.inherited(arguments);
			// Four first elements ('Requirement-Info', 'Requirement-Chapter', 'Requirement-Title' and 'Requirement-Number')
			// should be removed to not be displayed in Tree panel.
			if (renderObject.Parent && renderObject.Parent.nodeName == 'aras:block') {
				model.splice(1, 4);
			}
			if (renderObject.nodeName == 'aras:block') {
				model.splice(2, 4);
			}
			return model;
		},

		refresh: function() {
			this.inherited(arguments);
			this._setTitle();
		},

		_setTitle: function() {
			const titleWidgetId = this._tree._rootNode.getAttribute('widgetId');
			const titleWidget = dijit.byId(titleWidgetId);
			if (titleWidget) {
				titleWidget.set('label', this._viewmodel.GetRequirementTitle());
			}
		}
	});
});
