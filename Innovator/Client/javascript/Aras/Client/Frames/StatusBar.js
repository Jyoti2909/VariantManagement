define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Aras/Client/Controls/Experimental/StatusBar'
], function (declare, connect, StatusBar) {
	return declare('Aras.Client.Frames.StatusBar', null, {
		contentWindow: null,
		statusbar: null,
		dom: null,
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

			document.frames.statusbar = this;
			this.dom = args.statusbar._statusbarxml;
			this.statusbar = args.statusbar;
		},

		setStatus: function (id, text, imagepath, imageposition) {
			return this.statusbar.setStatus(id, text, imagepath, imageposition);
		},

		clearStatus: function (id) {
			return this.statusbar.clearStatus(id);
		},

		containsStatusBarCell: function (id) {
			return !!this.statusbar.listBar[id];
		},

		getStatusBarCell: function (id) {
			return this.statusbar.getStatusBarCell(id);
		}
	});
});
