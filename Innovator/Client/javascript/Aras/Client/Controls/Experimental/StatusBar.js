define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'dijit/layout/ContentPane',
	'./StatusBarItem'
], function (declare, array, ContentPane, StatusBarItem) {
	return declare('Aras.Client.Controls.Experimental.StatusBar', ContentPane, {
		_statusbarxml: null,
		aras: null,
		listBar: null,
		applet: null,
		args: null,

		constructor: function (args) {
			this.args = args;
			this.aras = args.aras;
		},

		postCreate: function () {
			var args = this.args;
			if (!args.style) {
				this.domNode.style.padding = '0px';
			}
			this.domNode.style.overflow = 'hidden';
			this.listBar = [];

			if (args.dom) {
				this._statusbarxml = args.dom;
			} else {
				var xmlhttp = this.aras.XmlHttpRequestManager.CreateRequest();
				xmlhttp.open('GET', args.resourceUrl, false);
				xmlhttp.send(null);
				this._statusbarxml = this.aras.createXMLDocument();
				this._statusbarxml.loadXML(xmlhttp.responseText);
			}

			var divStatusBar = document.createElement('div');
			divStatusBar.setAttribute('id', 'statusBar');
			divStatusBar.setAttribute('style', 'width:100%;');

			var items = this._itemNodes();
			array.forEach(
				items,
				function (item, index) {
					var divPanel = new StatusBarItem({
						item: item,
						aras: this.aras,
						imageBase: args.imageBase,
						imageWidth: args.imageWidth,
						imageHeight: args.imageHeight
					});
					this.listBar[divPanel.itemId] = divPanel;
					divStatusBar.appendChild(divPanel.domNode);
				},
				this
			);

			this.domNode.appendChild(divStatusBar);
		},

		_itemNodes: function () {
			// Search XML for Item Nodes and return Array of Nodes
			var itemnodes = [];

			array.forEach(
				this._statusbarxml.childNodes,
				function (node) {
					if (node.nodeType == '1' && node.nodeName == 'xml') {
						array.forEach(
							node.childNodes,
							function (itemnode) {
								if (itemnode.nodeType == '1' && itemnode.nodeName == 'item') {
									itemnodes.push(itemnode);
								}
							},
							this
						);
					}
				},
				this
			);

			// Sort result in order using index
			itemnodes.sort(function (a, b) {
				return a.getAttribute('index') - b.getAttribute('index');
			});

			return itemnodes;
		},

		clearStatus: function (id) {
			this.listBar[id].ClearStatus();
			return true;
		},

		setDefaultMessage: function (id, text, imagepath) {
			this.listBar[id].SetDefaultMessage(text, imagepath);
			return true;
		},

		setImage: function (id, imagepath) {
			this.listBar[id].SetImage(imagepath);
		},

		setText: function (id, text) {
			this.listBar[id].SetText(text);
		},

		setStatus: function (id, text, imagepath, imageposition) {
			this.listBar[id].SetStatus(text, imagepath, imageposition);
			return id;
		},

		getStatusBarCell: function (id) {
			if (this.listBar[id]) {
				return this.listBar[id];
			}
			return false;
		}
	});
});
