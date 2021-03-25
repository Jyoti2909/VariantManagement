VC.Utils.Page.LoadWidgets(['Dialog', 'Layer']);

require([
	'dojo/_base/declare',
	'dojo/text!../Views/LayersDialog.html'
], function (declare, dialogContent) {
	return dojo.setObject(
		'VC.Widgets.LayersDialog',
		declare(VC.Widgets.Dialog, {
			dialogName: 'layers',
			layers: null,
			layerContainer: null,
			checkAll: null,
			checkAllText: null,
			confirmContainer: null,
			confirmButton: null,
			resetLayersButton: null,
			_shouldActiveReset: false,
			_isEnabledReset: null,
			_strLayers: null,

			onChange: function (strLayers) {},
			onReset: function () {},

			_onChangeLayers: function () {
				var limitedLayers = [];
				var currentLayer = null;
				var strLayers = null;

				for (var layer in this.layers) {
					currentLayer = this.layers[layer];

					limitedLayers.push({
						title: currentLayer.title,
						value: currentLayer.value,
						checked: currentLayer.checked
					});
				}

				strLayers = JSON.stringify(limitedLayers);

				this.onChange(strLayers);
				this.disableApplyButton();

				if (this._shouldActiveReset) {
					this.enableResetButton();
				} else {
					this.disableResetButton();
				}
			},

			_onChangeLayer: function () {
				this.checkAll.removeAttribute('checked');
				this.enableApplyButton();
				this._shouldActiveReset = true;
			},

			_onCheckAll: function () {
				var checked = this.checkAll.getAttribute('checked');

				if (checked) {
					this.checkAll.removeAttribute('checked');

					for (var layer in this.layers) {
						this.layers[layer].uncheck();
					}
				} else {
					this.checkAll.setAttribute('checked', 'checked');

					for (var l in this.layers) {
						this.layers[l].check();
					}
				}

				this.enableApplyButton();
				this._shouldActiveReset = true;
			},

			_onResetButtonClick: function () {
				if (this._isEnabledReset) {
					this.onReset();
					this.enableApplyButton();
					this._shouldActiveReset = false;
				}
			},

			constructor: function (strLayers) {
				this._isEnabledReset = false;
				this._strLayers = strLayers;
				this.replaceDialogTemplate(dialogContent);
			},

			postCreate: function () {
				this.inherited(arguments);

				this.constructLayers(this._strLayers);
				this.checkAll.onclick = dojo.hitch(this, this._onCheckAll);
				this.checkAllText.onclick = dojo.hitch(this, this._onCheckAll);
				this.resetLayersButton.onclick = dojo.hitch(
					this,
					this._onResetButtonClick
				);

				this.disableApplyButton();
				this.disableResetButton();
			},

			constructLayers: function (strLayers) {
				var inputLayers = JSON.parse(strLayers);
				var title = null;
				var value = null;
				var cheched = null;

				this.layers = [];
				while (this.layerContainer.hasChildNodes()) {
					this.layerContainer.removeChild(this.layerContainer.lastChild);
				}

				for (var layer in inputLayers) {
					title = inputLayers[layer].title;
					value = inputLayers[layer].value;
					checked = inputLayers[layer].checked === 'true' ? true : false;
					currentLayer = new VC.Widgets.Layer(title, value, checked);
					currentLayer.onChange = dojo.hitch(this, this._onChangeLayer);
					this.layers.push(currentLayer);

					this.layerContainer.appendChild(currentLayer.domNode);
				}

				this.confirmButton.onclick = dojo.hitch(this, this._onChangeLayers);
			},

			enableApplyButton: function () {
				this.confirmButton.disable(false);
			},

			disableApplyButton: function () {
				this.confirmButton.disable(true);
			},

			enableResetButton: function () {
				this.resetLayersButton.disable(false);
				this._isEnabledReset = true;
			},

			disableResetButton: function () {
				this.resetLayersButton.disable(true);
				this._isEnabledReset = false;
			}
		})
	);
});
