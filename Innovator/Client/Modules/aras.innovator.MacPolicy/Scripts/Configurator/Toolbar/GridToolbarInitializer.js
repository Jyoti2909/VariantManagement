define(['Aras/Client/Controls/Public/Toolbar', 'dojo/aspect'], function (
	Toolbar,
	aspect
) {
	'use strict';
	const GridToolbarInitializer = (function () {
		function GridToolbarInitializer(connectId, gridController) {
			this.connectId = connectId;
			this.gridController = gridController;
			this.toolbar = new Toolbar({
				connectId: this.connectId,
				id: 'grid_toolbar'
			});
			this.toolbar.loadXml(
				aras.getI18NXMLResource(
					'grid_toolbar.xml',
					aras.getScriptsURL() + '../Modules/aras.innovator.MacPolicy/'
				)
			);
			this.toolbar.show();
			const self = this;
			aspect.after(
				this.toolbar,
				'onClick',
				function (button) {
					self.gridController.gridToolbarAction(button);
				},
				true
			);
		}
		return GridToolbarInitializer;
	})();
	return GridToolbarInitializer;
});
