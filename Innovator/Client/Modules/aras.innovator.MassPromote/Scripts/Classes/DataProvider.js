define(['dojo/_base/declare'], function (declare) {
	return declare('MassPromote.MassPromoteDataProvider', null, {
		constructor: function (xmlItem, validationModule, lifecycleMapProvider) {
			this._massPromotionItem = aras.newIOMItem();
			this._massPromotionItem.loadAML('<AML>' + xmlItem.xml + '</AML>');
			this._checkOnPolyitems();
			this._validationModule = validationModule;
			this._lifecycleMapProvider = lifecycleMapProvider;
			this._loadLifeCycleMaps(this.getItems());
		},

		addItems: function (itemObjects) {
			let storeWasChanged = false;
			const newItems = [];

			for (let i = 0; i < itemObjects.length; i++) {
				if (!this._isItemAlreadyExist(itemObjects[i].itemID)) {
					const item = aras.newIOMItem();
					item.loadAML('<AML>' + itemObjects[i].item.xml + '</AML>');
					this._massPromotionItem.addRelationship(item);
					newItems.push(item);
					storeWasChanged = true;
				}
			}

			this._checkOnPolyitems();

			const updatedItems = newItems.reduce(
				function (result, el) {
					const node = this._getItemById(el.getId());

					if (node.getItemCount() > 0) {
						result.push(node);
					}

					return result;
				}.bind(this),
				[]
			);

			this._loadLifeCycleMaps(updatedItems);

			return storeWasChanged;
		},

		removeItems: function (ids) {
			let storeWasChanged = false;

			for (let i = 0; i < ids.length; i++) {
				const item = this._getItemById(ids[i]);

				if (item.getItemCount() > 0) {
					this._massPromotionItem.removeRelationship(item);
					storeWasChanged = true;
				}
			}

			return storeWasChanged;
		},

		removeInvalidItems: function () {
			const invalidItems = this.getInvalidItems();

			for (let i = 0; i < invalidItems.length; i++) {
				this._massPromotionItem.removeRelationship(invalidItems[i]);
			}
		},

		updateItem: function (newNode, oldItem) {
			this._replaceItem(newNode, oldItem);
			const updatedItem = this._getItemById(oldItem.getId());
			this._loadLifeCycleMaps([updatedItem]);
		},

		getInvalidItems: function () {
			const invalidItems = [];
			const relationships = this._massPromotionItem.getRelationships();

			for (let j = 0; j < relationships.getItemCount(); j++) {
				const item = relationships.getItemByIndex(j);

				if (item.getProperty('mpo_isItemValid') === '0') {
					invalidItems.push(item);
				}
			}

			return invalidItems;
		},

		validateItems: function (lifecycleMap, targetState) {
			const items = this.getItems();
			this._validationModule.validateItems(items, lifecycleMap, targetState);
		},

		getLifecycleMapProvider: function () {
			return this._lifecycleMapProvider;
		},

		refreshItems: function () {
			const idsByType = this._getItemIdsByType(this.getItems());

			for (let type in idsByType) {
				const ids = idsByType[type];
				const response = this._loadItemsByIdlist(type, ids);
				this._refreshItems(response, ids);
			}

			this._loadLifeCycleMaps(this.getItems());
		},

		updateItemStatus: function (itemId, status) {
			const item = this._getItemById(itemId);

			if (item) {
				item.setProperty('mpo_status', status);
				item.setProperty('mpo_promoted', '1');

				if (status.indexOf('Failed:') > -1) {
					item.setProperty('mpo_isItemValid', '0');
				}
			}
		},

		_loadItemsByIdlist: function (type, ids) {
			const idlist = ids.join(',');
			const item = aras.newIOMItem(type, 'get');
			item.setAttribute('idlist', idlist);

			return item.apply();
		},

		_refreshItems: function (responseItem, ids) {
			const serverError = responseItem.isError();

			for (let i = 0; i < ids.length; i++) {
				const oldItem = this._getItemById(ids[i]);

				if (!serverError) {
					const updatedItem = responseItem.getItemsByXPath(
						'//Item[@id="' + ids[i] + '"]'
					);

					if (updatedItem.getItemCount() > 0) {
						this._replaceItem(updatedItem.node, oldItem);
						continue;
					}
				}

				// if we do not found item on the server, it means that
				// this item is new or deleted, in cache we will find "new" item.
				if (!aras.getFromCache(oldItem.getId())) {
					oldItem.setProperty('mpo_notFound', 'true');
					oldItem.removeAttribute('isTemp');
					oldItem.removeAttribute('action');
				}
			}
		},

		_getItemIdsByType: function (currentItems) {
			const res = {};

			currentItems.forEach(function (el) {
				const type = el.getType();
				const id = el.getId();

				if (!res[type]) {
					res[type] = [];
				}

				res[type].push(id);
			});

			return res;
		},

		_getItemById: function (id) {
			return this._massPromotionItem.getItemsByXPath(
				`./Relationships/Item[@id="${id}"]`
			);
		},

		_isItemAlreadyExist: function (id) {
			const node = this._getItemById(id);

			return node.getItemCount() > 0;
		},

		_loadLifeCycleMaps: function (items) {
			const typeIds = [];

			items.forEach(function (el) {
				const typeId = el.getAttribute('typeId');

				if (typeId) {
					if (typeIds.indexOf(typeId) === -1) {
						typeIds.push(typeId);
					}
				}
			});

			this._lifecycleMapProvider.getLifeCycleMapsByTypeIds(typeIds);
			this._setLifeCyclePerItem(items);

			this._lifecycleMapProvider.fetchAvailableStates(
				items,
				this.getPromoteType()
			);
		},

		_setLifeCyclePerItem: function (items) {
			for (let i = 0; i < items.length; i++) {
				const lifeCycle = this._lifecycleMapProvider.getLifeCycleForItem(
					items[i]
				);

				if (lifeCycle) {
					items[i].setProperty('mpo_life_cycle_map', lifeCycle.name);
					items[i].setPropertyAttribute(
						'mpo_life_cycle_map',
						'id',
						lifeCycle.id
					);
				} else {
					items[i].removeProperty('mpo_life_cycle_map');
				}
			}
		},

		_checkOnPolyitems: function () {
			const polyitems = this._getPolyitems();

			if (polyitems.length > 0) {
				const polysources = this._loadPolysources(polyitems);

				if (polysources.isError()) {
					this._removePolyitems(polyitems);
				} else {
					this._replacePolysourceOnPolyitems(polysources, polyitems);
				}
			}
		},

		_getPolyitems: function () {
			const polyitems = [];
			const relationships = this._massPromotionItem.getRelationships();

			for (let j = 0; j < relationships.getItemCount(); j++) {
				const item = relationships.getItemByIndex(j);
				const itemtype = aras.getItemTypeForClient(item.getType()).node;

				if (aras.isPolymorphic(itemtype)) {
					polyitems.push({
						id: item.getId(),
						typeId: item.getProperty('itemtype')
					});
				}
			}

			return polyitems;
		},

		_replaceItem: function (updatedNode, oldItem) {
			const oldNode = oldItem.node;
			const newNode = oldItem.dom.importNode(updatedNode, true);
			oldNode.parentNode.replaceChild(newNode, oldNode);
		},

		_replacePolysourceOnPolyitems: function (polysources, polyitems) {
			for (let i = 0; i < polyitems.length; i++) {
				const polyitemNode = this._massPromotionItem.node.selectSingleNode(
					'//Item[@id="' + polyitems[i].id + '"]'
				);
				const polysourceNode = polysources.dom.selectSingleNode(
					'//Item[@id="' + polyitems[i].id + '"]'
				);

				if (polyitemNode && polysourceNode) {
					polyitemNode.parentNode.replaceChild(polysourceNode, polyitemNode);
				} else {
					// in case when we didn't find a polysource, we remove polyitem
					if (polyitemNode) {
						polyitemNode.parentNode.removeChild(polyitemNode);
					}
				}
			}
		},

		_removePolyitems: function (polymorphics) {
			const ids = polymorphics.map(function (el) {
				return el.id;
			});

			for (let i = 0; i < ids.length; i++) {
				const node = this._massPromotionItem.node.selectSingleNode(
					'//Item[@id="' + ids[i] + '"]'
				);

				if (node) {
					node.parentNode.removeChild(node);
				}
			}
		},

		_loadPolysources: function (polymorphics) {
			let xml = '';

			for (let i = 0; i < polymorphics.length; i++) {
				const item = aras.newIOMItem();
				item.setAttribute('typeId', polymorphics[i].typeId);
				item.setAction('get');
				item.setID(polymorphics[i].id);
				xml += item.node.xml;
			}

			const responseXml = aras.applyAML('<AML>' + xml + '</AML>');
			const responseItem = aras.newIOMItem();
			responseItem.loadAML(responseXml);

			return responseItem;
		},

		getItems: function () {
			const res = [];
			const relationships = this._massPromotionItem.getRelationships();

			for (let j = 0; j < relationships.getItemCount(); j++) {
				res.push(relationships.getItemByIndex(j));
			}

			return res;
		},

		getItem: function (itemId) {
			const relationships = this._massPromotionItem.getRelationships();

			return relationships.getItemsByXPath(
				'AML/Item/Relationships/Item[@id="' + itemId + '"]'
			);
		},

		getPromoteType: function () {
			return this._massPromotionItem.getProperty('promote_type');
		}
	});
});
