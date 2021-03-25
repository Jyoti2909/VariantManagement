define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/UI/SideBySideView/BaseViewPanel'
], function (declare, BaseViewPanel) {
	return declare([BaseViewPanel], {
		_frameNode: null,
		_frameURL: null,
		isFrameLoaded: false,

		constructor: function (viewController, panelConfig) {},

		_constructorInitProperties: function (viewController, panelConfig) {
			this.inherited(arguments);

			this._frameURL = this._panelConfig.URL || '#';
		},

		_buildPanelContent: function () {
			var panelNode = this.panelWidget && this.panelWidget.domNode;

			this.inherited(arguments);

			panelNode.innerHTML = this.wrapInTag('', 'iframe', {
				src: this._frameURL,
				style: 'width:100%; height: 100%;',
				frameborder: 0
			});

			this._frameNode = panelNode.firstChild;
			this._frameNode.ownerViewPanel = this;

			this._frameNode.addEventListener(
				'load',
				function () {
					this.isFrameLoaded = true;
					this.raiseEvent('onFrameContentLoaded', this);
				}.bind(this)
			);
		},

		setURL: function (newURL) {
			if (newURL !== this._frameURL) {
				this._frameURL = newURL;
				this.isFrameLoaded = false;

				if (this.isDomCreated) {
					this._frameNode.setAttribute('src', newURL);
				}
			}
		},

		getFrameWindow: function () {
			return this._frameNode && this._frameNode.contentWindow;
		}
	});
});
