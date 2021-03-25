define(['dojo/_base/declare'], function (declare) {
	return declare(null, {
		aras: null,

		scope: null,

		constructor: function (aras) {
			this.aras = aras;
		},

		show: function () {
			return this.aras
				.getMostTopWindowWithAras(window)
				.ArasModules.MaximazableDialog.show('iframe', {
					aras: this.aras,
					presetScope: this.scope,
					title: this.aras.getResource(
						'../Modules/aras.innovator.core.EffectivityServices',
						'effectivity_criteria_dialog.title'
					),
					dialogWidth: 445,
					dialogHeight: 450,
					content:
						this.aras.getBaseURL() +
						'/Modules/aras.innovator.core.EffectivityServices/Views/EffectivityCriteriaDialog.html'
				})
				.promise.then(
					function (scopeObject) {
						if (scopeObject !== undefined) {
							this.scope = scopeObject;
						}

						return scopeObject;
					}.bind(this)
				);
		}
	});
});
