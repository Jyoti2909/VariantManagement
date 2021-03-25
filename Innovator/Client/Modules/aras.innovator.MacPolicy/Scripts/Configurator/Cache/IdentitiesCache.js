define(function () {
	'use strict';
	const cacheStorage = [];
	cacheStorage.set = function (name, id) {
		const alreadyExists = cacheStorage.some(function (i) {
			return i.name === name;
		});
		if (!alreadyExists) {
			cacheStorage.push({ name: name, id: id });
		}
	};
	cacheStorage.getCountIdentitiesWithSimilarName = function (name) {
		return cacheStorage.filter(function (i) {
			return i.name.toLowerCase().indexOf(name.toLowerCase()) === 0;
		}).length;
	};

	const IdentitiesCache = (function () {
		function IdentitiesCache() {}

		IdentitiesCache.prototype.getIdentityByName = function (name) {
			const cacheCount = cacheStorage.getCountIdentitiesWithSimilarName(name);
			if (cacheCount === 0 && name.length > 0) {
				let item = aras.newIOMItem('Identity', 'get');
				item.setAttribute('select', 'name');
				item.setAttribute(
					'where',
					"classification != 'system' AND " +
						"classification != 'team' OR classification is null"
				);
				item.setAttribute('maxRecords', '5');
				item.setProperty('name', name + '*');
				item.setPropertyAttribute('name', 'condition', 'like');
				item = item.apply();
				if (!item.isError() && !item.isEmpty()) {
					for (let i = 0; i < item.getItemCount(); i++) {
						const identity = item.getItemByIndex(i);
						cacheStorage.set(identity.getProperty('name'), identity.getID());
					}
				}
			}
			return cacheStorage.find(function (i) {
				return i.name.toLowerCase() === name.toLowerCase();
			});
		};
		IdentitiesCache.prototype.getIdentityById = function (id) {
			const identity = cacheStorage.find(function (i) {
				return i.id === id;
			});
			if (!identity) {
				let item = aras.newIOMItem('Identity', 'get');
				item.setAttribute('select', 'name');
				item.setAttribute(
					'where',
					"classification != 'system' AND " +
						"classification != 'team' OR classification is null"
				);
				item.setProperty('id', id);
				item = item.apply();
				if (!item.isError() && !item.isEmpty()) {
					cacheStorage.set(item.getProperty('name'), item.getID());
				}
			}
			return cacheStorage.find(function (i) {
				return i.id === id;
			});
		};
		return IdentitiesCache;
	})();
	return IdentitiesCache;
});
