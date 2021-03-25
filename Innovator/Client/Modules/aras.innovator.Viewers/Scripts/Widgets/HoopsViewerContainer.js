require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!../Views/HoopsTemplate.html'
], dojo.hitch(this, function (declare, _WidgetBase, _TemplatedMixin, template) {
	return dojo.setObject(
		'VC.Widgets.ViewerContainer',
		declare([_WidgetBase, _TemplatedMixin], {
			templateString: template
		})
	);
}));
