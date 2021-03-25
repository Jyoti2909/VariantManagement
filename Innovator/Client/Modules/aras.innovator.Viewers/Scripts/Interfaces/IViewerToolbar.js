dojo.setObject(
	'VC.Interfaces.IViewerToolbar',
	(function () {
		return dojo.declare('IViewerToolbar', null, {
			name: null,
			isOpened: false,

			init: function (/*string*/ toolbarTypeName) {
				throw new Error('IViewerToolbar: init must be overloaded');
			},

			bindButtonBehaviour: function (/*string*/ btnEventName, eventHandler) {
				throw new Error(
					'IViewerToolbar: bindButtonBehaviour must be overloaded'
				);
			},

			enableBtn: function (/*string*/ btnName) {
				throw new Error('IViewerToolbar: enableBtn must be overloaded');
			},

			disableBtn: function (/*string*/ btnName) {
				throw new Error('IViewerToolbar: disableBtn must be overloaded');
			},

			pressBtn: function (/*string*/ btnName) {
				throw new Error('IViewerToolbar: pressBtn must be overloaded');
			},

			unpressBtn: function (/*string*/ btnName) {
				throw new Error('IViewerToolbar: unpressBtn must be overloaded');
			},

			show: function () {
				throw new Error('IViewerToolbar: show must be overloaded');
			},

			hide: function () {
				throw new Error('IViewerToolbar: hide must be overloaded');
			},

			bindPropertyBehaviour: function (textboxName, property, value) {
				if (textboxName && this[textboxName] && typeof value !== 'undefined') {
					this[textboxName][property] = value;
				}
			},

			getElementPropertyValue: function (textboxName, property) {
				if (textboxName && this[textboxName]) {
					return this[textboxName][property];
				}
			}
		});
	})()
);
