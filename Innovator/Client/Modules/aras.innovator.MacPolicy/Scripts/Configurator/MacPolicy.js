define(function () {
	'use strict';
	const MacPolicy = (function () {
		function MacPolicy(aras, item) {
			this.aras = aras;
			this.item = item;
		}
		MacPolicy.prototype.activate = function () {
			let item = this.aras.newIOMItem();
			item.loadAML(this.item.node.xml);
			item.setProperty('nextstate', 'Active');
			const result = item.apply('mp_PromoteItem');
			if (result.isError()) {
				throw new Error(result.getErrorString());
			}
			item.setAction('get');
			item = item.apply();
			return item;
		};
		MacPolicy.prototype.deactivate = function () {
			let item = this.aras.newIOMItem();
			item.loadAML(this.item.node.xml);
			item.setProperty('nextstate', 'Inactive');
			const result = item.apply('mp_PromoteItem');
			if (result.isError()) {
				throw new Error(result.getErrorString());
			}
			item.setAction('get');
			item = item.apply();
			return item;
		};
		MacPolicy.prototype.newVersion = function () {
			const item = this.aras.newIOMItem();
			item.loadAML(this.item.node.xml);
			const result = item.apply('mp_NewVersion');
			return result;
		};
		return MacPolicy;
	})();
	return MacPolicy;
});
