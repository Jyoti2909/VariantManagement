define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin'
], function (declare, _WidgetBase, _TemplatedMixin) {
	declare('CMFViewer', [_WidgetBase, _TemplatedMixin], {
		templateString:
			'<iframe id="qp_editor" src="../Modules/aras.innovator.CMF/Views/DocumentEditor.html"' +
			' frameborder="0" scrolling="auto" style="width: 100%; height: 100%;"></iframe>'
	});
});
