var viewerPath =
	'dojo/text!' +
	top.aras.getBaseURL() +
	'/Modules/aras.innovator.Viewers/Views/ViewerTemplate.html';
require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	viewerPath
], dojo.hitch(this, function (declare, _WidgetBase, _TemplatedMixin, template) {
	return dojo.setObject(
		'VC.Widgets.ViewerContainer',
		declare([_WidgetBase, _TemplatedMixin], {
			templateString: template
		})
	);
}));
