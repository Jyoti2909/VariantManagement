define(['dojo/_base/declare'], function (declare) {
	return declare('Aras.Client.Controls.Experimental.LazyLoaderBase', null, {
		constructor: function () {
			this.isLazyLoaderWidget = true;
		},

		onloaded: function () {}
	});
});
