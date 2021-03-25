require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.ViewStateManager',
		declare(null, {
			saveViewStateParameter: function (name, value, persistent) {
				if (navigator.cookieEnabled) {
					var expireDate = null;
					if (persistent) {
						expireDate = new Date();
						expireDate.setDate(expireDate.getDate() + 50 * 365); //Set expiration date in 50 years from now
					}

					SetCookie(name, value, expireDate, '/');
				}
			},

			deleteViewStateParameter: function (name) {
				if (navigator.cookieEnabled) {
					DeleteCookie(name, '/');
				}
			},

			restoreViewStateParameter: function (name) {
				if (navigator.cookieEnabled) {
					return GetCookie(name);
				}

				return null;
			}
		})
	);
});
