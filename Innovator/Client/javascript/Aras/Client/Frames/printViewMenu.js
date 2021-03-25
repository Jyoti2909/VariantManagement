define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/has',
	'Aras/Client/Controls/Public/ToolBar'
], function (declare, connect, has, ToolBar) {
	return declare('Aras.Client.Frames.printViewMenu', null, {
		contentWindow: null,
		activeToolbar: null,
		printStr: null,
		aras: null,

		constructor: function (args) {
			if (!args.aras) {
				return;
			}
			this.aras = args.aras;
			this.contentWindow = this;
			var self = this;
			if (!document.frames) {
				document.frames = [];
			}
			document.frames.printViewMenu = this;

			this.printStr = frames.printBody ? 'item' : 'itemsGrid';
			this.activeToolbar = new ToolBar({ connectId: args.connectId });

			connect.connect(this.activeToolbar, 'onClick', function (tbItem) {
				self.onClickItem(tbItem.getId());
			});

			this.initToolbar();
		},

		initToolbar: function () {
			this.activeToolbar.loadXml(
				this.aras.getI18NXMLResource('printview_toolbar.xml')
			);
			this.activeToolbar.showToolbar(this.printStr);
			this.activeToolbar.showLabels(
				this.aras.getPreferenceItemProperty(
					'Core_GlobalLayout',
					null,
					'core_show_labels'
				) === 'true'
			);

			if (has('mac')) {
				var printPreviewButton = this.activeToolbar.getItem('print_preview');
				printPreviewButton.setEnabled(false);
			}
		},

		getFrameToPrint: function () {
			var frame = 'item' === this.printStr ? 'printBody' : 'printGrid';
			return document.getElementById(frame).contentWindow;
		},

		onClickItem: function (cmdID) {
			switch (cmdID) {
				case 'print_item':
					this.aras.printFrame(
						document.getElementById('printBody').contentWindow
					);
					break;
				case 'print_itemsGrid':
					this.aras.printFrame(
						document.getElementById('printGrid').contentWindow
					);
					break;
				case 'print_preview':
					this.aras.printPreview(this.getFrameToPrint());
					break;
				case 'setup_itemsGrid':
					var printFrame = this.getFrameToPrint();
					var toolbarItem = this.activeToolbar.getItem('setup_itemsGrid');
					printFrame.settingsHelper.populateMenu(
						toolbarItem._item_Experimental.dropDown
					);
					break;
			}
		}
	});
});
