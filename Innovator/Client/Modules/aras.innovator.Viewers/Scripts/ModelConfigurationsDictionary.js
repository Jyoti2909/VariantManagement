require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.Viewers.ModelConfigurationsDictionary',
		declare(null, {
			_dictionary: null,

			constructor: function () {
				this._dictionary = [];
			},

			addPair: function (configId, modelXml) {
				var configuration = { configId: configId, modelXml: modelXml };
				this._dictionary.push(configuration);
			},

			getModelXml: function (configId) {
				var returnedValue = null;

				if (configId && this._dictionary.length > 0) {
					var result = this._dictionary.Find('configId', configId);
					if (result) {
						returnedValue = result.modelXml;
					}
				}

				return returnedValue;
			},

			clearDictinary: function () {
				while (this._dictionary.length) {
					this._dictionary.pop();
				}
			},

			isEmpty: function () {
				return this._dictionary.length === 0 ? true : false;
			}
		})
	);
});
