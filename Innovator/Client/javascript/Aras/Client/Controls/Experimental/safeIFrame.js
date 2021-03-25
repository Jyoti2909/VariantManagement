define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/_base/connect',
	'dojo/_base/event',
	'dijit/form/Button',
	'dijit/_Widget'
], function (declare, Dom, connect, event, Button, _Widget) {
	return declare('Aras.Client.Controls.Experimental.safeIFrame', _Widget, {
		id: null,
		headerCell: null,
		index: null,
		htmlString: null,
		grid: null,
		iframe: null,
		button: null,

		buildRendering: function () {
			this.inherited(arguments);
			var heightNumber = this.grid.openHTMLCell[this.id];
			var width = this.headerCell.unitWidth || this.headerCell.width;
			var height = 'height: ' + (heightNumber || 50) + 'px;';
			this.iframe = Dom.create('iframe', {
				frameborder: 0,
				framespacing: 0,
				allowTransparency: true,
				style: 'width:' + width + ';' + height
			});
			this.iframe.onload = this.startIframe.bind(this);
			this.domNode.appendChild(this.iframe);
			this.domNode.appendChild(Dom.create('br'));
			var b = new Button({
				class: 'safeIFrameButton',
				iconClass: heightNumber
					? 'dijitArrowButtonDown'
					: 'dijitArrowButtonInner',
				title: 'push view all HTML text',
				style: 'width:' + width + ';margin: 0;margin-left: -3px'
			});
			connect.connect(b, 'onClick', this, this.expand);
			b._destroyOnRemove = true;
			this.button = b;
			this.domNode.appendChild(b.domNode);
			if ('sandbox' in Dom.create('iframe')) {
				this.iframe.sandbox = 'allow-same-origin';
			} else {
				this.htmlString = this.htmlString
					.replace(/([<"']\w*\s*)on\w*\s*=/gi, '$1notvalid=')
					.replace(/<script/gi, '&lt;script');
			}
		},

		startIframe: function (e) {
			this.iframe.onload = null;
			//try for IE Compatibility Mode On
			try {
				if (!this.iframe.contentWindow) {
					setTimeout(
						function () {
							if (this.iframe.contentWindow) {
								this.startup();
							}
						}.bind(this),
						0
					);
					return;
				}
			} catch (error) {
				return;
			}
			var doc = this.iframe.contentWindow.document;
			doc = doc.open();
			doc.write(this.htmlString);
			doc.close();
			doc.ondblclick = this.startEdit.bind(this);
			if (this.iframe.contentWindow.document.body.scrollHeight <= 50) {
				this.button.domNode.style.display = 'none';
			}
		},

		startEdit: function (e) {
			var edit = this.grid.edit.isEditing();
			this.grid.focus.setFocusCell(this.headerCell, this.index);
			if (!edit) {
				this.grid.edit.setEditCell(this.headerCell, this.index);
			}
		},

		expand: function (e) {
			var doc = this.iframe.contentWindow.document;
			this.grid.openHTMLCell[this.id] = this.grid.openHTMLCell[this.id]
				? 0
				: doc.body.scrollHeight;
			this.grid.updateRow(this.index);
			event.stop(e);
		}
	});
});
