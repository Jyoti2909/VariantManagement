define(['dojo/_base/declare', 'ES/Scripts/Classes/Utils'], function (
	declare,
	Utils
) {
	return declare('ES.ServiceRequestBase', null, {
		_errorMessageMaxLength: 200,

		_arasObj: null,

		_utils: null,

		_queryItm: null,

		_responseItm: null,

		constructor: function (args) {
			this._arasObj = args.arasObj;
			this._utils = new Utils({
				arasObj: this._arasObj
			});
		},

		_buildQueryItem: function () {},

		_onAfterSuccessRun: function () {},

		run: function () {
			this._responseItm = null;

			this._buildQueryItem();
			if (!this._utils.isNullOrUndefined(this._queryItm)) {
				this._responseItm = this._queryItm.apply();

				if (this._responseItm.isError()) {
					var errorMessage = this._responseItm.getErrorString();

					this._arasObj.AlertError(
						this._utils.truncateString(
							errorMessage,
							this._errorMessageMaxLength
						),
						errorMessage,
						''
					);
				} else {
					this._onAfterSuccessRun();
				}
			} else {
				this._onAfterSuccessRun();
			}
		},

		isError: function () {
			return !this._utils.isNullOrUndefined(this._responseItm)
				? this._responseItm.isError()
				: true;
		}
	});
});
