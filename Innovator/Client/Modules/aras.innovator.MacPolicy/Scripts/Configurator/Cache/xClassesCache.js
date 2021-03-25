define(function () {
	'use strict';
	const cacheStorage = [];
	cacheStorage.set = function (fullName, name, id) {
		const alreadyExists = cacheStorage.some(function (i) {
			return i.id === id;
		});
		if (!alreadyExists) {
			cacheStorage.push({ name: name, fullName: fullName, id: id });
		}
	};
	cacheStorage.getCountXClassesWithSimilarName = function (name) {
		return cacheStorage.filter(function (i) {
			return i.name.toLowerCase().indexOf(name.toLowerCase()) === 0;
		}).length;
	};
	cacheStorage.getCountXClassesWithSimilarFullName = function (name) {
		return cacheStorage.filter(function (i) {
			return i.fullName.toLowerCase().indexOf(name.toLowerCase()) === 0;
		}).length;
	};

	const XClassesCache = (function () {
		function XClassesCache() {}

		XClassesCache.prototype.getXClassByName = function (name) {
			const cacheCountByName = cacheStorage.getCountXClassesWithSimilarName(
				name
			);
			const cacheCountByFullName = cacheStorage.getCountXClassesWithSimilarFullName(
				name
			);
			if (
				cacheCountByName === 0 &&
				cacheCountByFullName === 0 &&
				name.length > 0
			) {
				const requestAml =
					'<Item type="xClass" action="get" select="keyed_name, name" maxRecords="5">' +
					'<OR>' +
					'<name condition="like">' +
					ArasModules.xml.escape(name) +
					'*</name>' +
					'<keyed_name condition="like">' +
					ArasModules.xml.escape(name) +
					'*</keyed_name>' +
					'</OR>' +
					'</Item>';
				let item = aras.newIOMItem();
				item.loadAML(requestAml);
				item = item.apply();
				if (!item.isError() && !item.isEmpty()) {
					for (let i = 0; i < item.getItemCount(); i++) {
						const xClass = item.getItemByIndex(i);
						cacheStorage.set(
							xClass.getProperty('keyed_name'),
							xClass.getProperty('name'),
							xClass.getID()
						);
					}
				}
			}
			let xClass = cacheStorage.find(function (i) {
				return i.name.toLowerCase() === name.toLowerCase();
			});
			if (!xClass) {
				xClass = cacheStorage.find(function (i) {
					return i.fullName.toLowerCase() === name.toLowerCase();
				});
			}
			return xClass;
		};
		XClassesCache.prototype.getXClassById = function (id) {
			const xClassCache = cacheStorage.find(function (i) {
				return i.id === id;
			});
			if (!xClassCache) {
				let item = aras.newIOMItem('xClass', 'get');
				item.setAttribute('select', 'keyed_name, name');
				item.setProperty('id', id);
				item = item.apply();
				if (!item.isError() && !item.isEmpty()) {
					cacheStorage.set(
						item.getProperty('keyed_name'),
						item.getProperty('name'),
						item.getID()
					);
				}
			}
			return cacheStorage.find(function (i) {
				return i.id === id;
			});
		};
		return XClassesCache;
	})();
	return XClassesCache;
});
