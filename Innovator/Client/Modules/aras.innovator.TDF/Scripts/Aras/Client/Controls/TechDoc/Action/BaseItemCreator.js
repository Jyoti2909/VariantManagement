define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer'
], function (declare, BaseItemInitializer) {
	return declare(null, {
		aras: null,
		actionsHelper: null,
		_itemInitializer: null,

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};

			this.aras = initialParameters.aras;
			this.actionsHelper = initialParameters.actionsHelper;
			this._itemInitializer =
				initialParameters.itemInitializer ||
				new BaseItemInitializer({
					aras: this.aras
				});
		},

		createItem: function (itemTypeName, optionalParameters) {
			optionalParameters = optionalParameters || {};

			const creationResult = this._createIOMItem(itemTypeName).then(
				function (createdItem) {
					if (createdItem) {
						const itemInitializer =
							optionalParameters.itemInitializer || this._itemInitializer;

						if (itemInitializer) {
							const initParameters = optionalParameters.initializerParameters;

							return itemInitializer.initItem(createdItem, initParameters);
						}
					}

					return createdItem;
				}.bind(this)
			);

			return Promise.resolve(creationResult);
		},

		setInitializer: function (initializerInstance) {
			this._itemInitializer = initializerInstance;
		},

		_createIOMItem: function (itemTypeName) {
			// newItem method can return Promise so itemNode need to be processed after resolving
			return Promise.resolve(this.aras.newItem(itemTypeName)).then(
				function (itemNode) {
					const itemId = itemNode.getAttribute('id');
					const itemsCache = this.aras.itemsCache;

					if (itemsCache.hasItem(itemId)) {
						itemsCache.deleteItem(itemId);
					}

					return this._createIOMItemFromNode(itemNode);
				}.bind(this)
			);
		},

		_createIOMItemFromNode: function (itemNode) {
			if (itemNode) {
				const iomItem = this.aras.newIOMItem();
				iomItem.dom = itemNode.ownerDocument;
				iomItem.node = itemNode;

				return iomItem;
			}
		}
	});
});
