define(function () {
	'use strict';
	const MacPolicyUsers = {};
	MacPolicyUsers.getActiveUsersCount = function () {
		return ArasModules.soap('', { method: 'GetUsersList', async: true })
			.then(function (res) {
				res = new SOAPResults(aras, res.ownerDocument.xml);
				if (res.getFaultCode() !== 0) {
					throw new Error(res.getFaultString());
				}
				return res;
			})
			.then(function (res) {
				return MacPolicyUsers.calcUserCount(res.results);
			});
	};
	MacPolicyUsers.calcUserCount = function (resultNd) {
		let countActiveUsers = 0;
		if (resultNd) {
			const users = resultNd.getElementsByTagName('aras_user');
			for (let i = 0; i < users.length; i++) {
				if (users[i].getAttribute('self') !== 'true') {
					countActiveUsers++;
				}
			}
		}
		return countActiveUsers;
	};
	return MacPolicyUsers;
});
