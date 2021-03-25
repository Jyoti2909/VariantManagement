define('Aras/Client/Controls/TechDoc/Plugins/Menu', [
	'dojo/_base/declare',
	'dijit/_editor/_Plugin',
	'dojo/aspect',
	'dijit/Menu',
	'dijit/MenuItem'
], function (declare, _Plugin, aspect, DijitMenu, DijitMenuItem) {
	var privateMethods = {
		setupEditorIframeStyles: function (ifrmDoc) {
			//in order to display menu in the editor iframe we have to setup proper style and theme for iframe body
			var link = ifrmDoc.createElement('link');
			link.setAttribute('rel', 'stylesheet');
			link.setAttribute('href', '../javascript/dijit/themes/claro/claro.css');

			ifrmDoc.head.appendChild(link);
			ifrmDoc.body.setAttribute('class', 'claro');
		},
		getIframeDocument: function (iframeName) {
			var ifrm = document.getElementById(iframeName);
			return ifrm.contentWindow.document;
		}
	};

	return declare('Aras.Client.Controls.TechDoc.Plugins.Menu', _Plugin, {
		constructor: function () {},

		setEditor: function (editor) {
			var self = this;

			this.editor = editor;

			aspect.after(editor, 'onLoad', function () {
				var iframeId = this.id + '_iframe';
				var ifrmDoc = privateMethods.getIframeDocument(iframeId);
				var pMenu;

				privateMethods.setupEditorIframeStyles(ifrmDoc);
				pMenu = new DijitMenu({
					ownerDocument: ifrmDoc,
					targetNodeIds: ['dijitEditorBody']
				});

				pMenu.addChild(
					new DijitMenuItem({
						label: 'p split',
						onClick: function (evt) {
							self.editor.insertParagraphToCurrentPosition();
						}
					})
				);

				pMenu.startup();

				self.menu = pMenu;
			});
		}
	});
});
