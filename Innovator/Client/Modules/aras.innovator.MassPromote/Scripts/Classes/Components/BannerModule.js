define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.BannerModule', null, {
		_controlEnabled: true,

		constructor: function () {},

		update: function (items, promoteType) {
			if (!this._controlEnabled) {
				return;
			}

			if (!this._itemTypePluralLabel) {
				this._getPluralLabel(promoteType);
			}

			document.getElementById('bannerPanel').textContent =
				'Mass Promote ' + items.length + ' ' + this._itemTypePluralLabel;
		},

		freeze: function () {
			// disable module
			this._controlEnabled = false;
		},

		_getPluralLabel: function (promoteType) {
			var itemtype = aras.getItemTypeForClient(promoteType);
			this._itemTypePluralLabel =
				aras.getItemProperty(itemtype.node, 'label_plural', promoteType) ||
				aras.getItemProperty(itemtype.node, 'name', promoteType);
		}
	});
});
