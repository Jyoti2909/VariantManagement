/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'Aras/Client/Controls/Experimental/LazyLoaderBase'
], function (declare, _WidgetBase, LazyLoaderBase) {
	return declare(
		'Aras.Client.Controls.Experimental.FormInstance',
		[_WidgetBase, LazyLoaderBase],
		{
			args: null,
			_formSize: {},

			constructor: function (args) {
				this.args = args;
			},

			postCreate: function () {
				this.inherited(arguments);
				this._formSize = { h: this.args.formHeight, w: this.args.formWidth };
			},

			getFormSize: function () {
				return this._formSize;
			},

			startup: function () {
				this.inherited(arguments);
				this.showItemInFrame();
			},

			showItemInFrame: function () {
				var args = this.args;
				var arasObj = args.aras;
				var isNew = args.isNew;
				var item = args.item;
				var isEditMode = args.isEditMode;
				var url = args.url;

				var formFrame = document.createElement('iframe');
				formFrame.setAttribute('id', 'instance');
				formFrame.setAttribute('frameborder', '0');
				formFrame.setAttribute('width', '100%');
				formFrame.setAttribute('height', '100%');
				this.domNode.appendChild(formFrame);

				if (isNew) {
					arasObj.uiShowItemInFrameEx(formFrame.contentWindow, item, 'add', 0);
				} else {
					arasObj.uiShowItemInFrameEx(
						formFrame.contentWindow,
						item,
						isEditMode ? 'edit' : 'view',
						0
					);
				}

				var that = this;

				formFrame.onload = function () {
					that.onloaded();
					window.returnBlockerHelper.attachBlocker(formFrame.contentWindow);
				};
			}
		}
	);
});
