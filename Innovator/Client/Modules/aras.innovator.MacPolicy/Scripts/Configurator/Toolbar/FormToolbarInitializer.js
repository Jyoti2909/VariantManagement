define(['Aras/Client/Controls/Public/Toolbar', 'dojo/aspect'], function (
	Toolbar,
	aspect
) {
	'use strict';
	const FormToolbarInitializer = (function () {
		function FormToolbarInitializer(connectId, formController) {
			this.connectId = connectId;
			this.formController = formController;
			this.toolbar = new Toolbar({
				connectId: this.connectId,
				id: 'form_toolbar'
			});
			this.toolbar.loadXml(
				aras.getI18NXMLResource(
					'form_toolbar.xml',
					aras.getScriptsURL() + '../Modules/aras.innovator.MacPolicy/'
				)
			);
			this.toolbar.show();
			const self = this;
			aspect.after(
				this.toolbar,
				'onClick',
				function (button) {
					self.formController.formToolbarAction(button);
				},
				true
			);
		}
		return FormToolbarInitializer;
	})();
	return FormToolbarInitializer;
});
