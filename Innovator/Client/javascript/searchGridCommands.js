function initializeSearchGridCommandsFuntions(container) {
	const itemLockListener = (params) => {
		const { itemNd } = params;
		const itemTypeNode = container.currItemType;
		const itemType = itemNd.getAttribute('type');

		const isPolymorphic = aras.isPolymorphic(itemTypeNode);
		const isTargetItemType = isPolymorphic
			? aras.getMorphaeList(itemTypeNode).some(({ name }) => name === itemType)
			: container.itemTypeName === itemType;

		if (!isTargetItemType) {
			return;
		}

		container.updateRow(itemNd);
	};

	const itemVersionChangeListener = (params) => {
		const { itemLastVersion, itemPreviousVersion } = params;

		container.deleteRow(itemPreviousVersion);
		container.insertRow(itemLastVersion);
	};

	container.initializeSearchGridCommand = function () {
		container.onRegisterEventHandler();
		container.addEventListener('unload', () =>
			container.onUnregisterEventHandler()
		);
	};

	container.onUnregisterEventHandler = function () {
		aras.unregisterEventHandler('ItemLock', container, itemLockListener);
		aras.unregisterEventHandler(
			'ItemVersion',
			container,
			itemVersionChangeListener
		);
	};

	container.onRegisterEventHandler = function () {
		aras.registerEventHandler('ItemLock', container, itemLockListener);
		aras.registerEventHandler(
			'ItemVersion',
			container,
			itemVersionChangeListener
		);
	};

	container.updateItemInQueryCache = function (itemNode) {
		const queryItem = currQryItem.getResult();
		const oldItem = queryItem.selectSingleNode(
			`Item[@id="${itemNode.getAttribute('id')}"]`
		);

		if (oldItem) {
			queryItem.replaceChild(itemNode.cloneNode(true), oldItem);
		} else {
			queryItem.appendChild(itemNode.cloneNode(true));
		}
	};

	container.insertRow = function (itemNode, skipMenuUpdate) {
		if (itemNode && itemNode.getAttribute('type') === itemTypeName) {
			const itemId = itemNode.getAttribute('id');
			if (grid._grid.rows.has(itemId)) {
				return false;
			}
			container.updateItemInQueryCache(itemNode);

			// this global variable exist only for itemsGrid
			if (container.addRowInProgress_Number !== undefined) {
				container.addRowInProgress_Number++;
			}

			const rowsInfo = window.adaptGridRowsFromXml(
				'<Result>' + itemNode.xml + '</Result>',
				{
					headMap: grid._grid.head,
					indexHead: grid._grid.settings.indexHead
				}
			);
			rowsInfo.rowsMap.forEach(function (row, key) {
				grid._grid.rows._store.set(key, row);
			});
			grid._grid.settings.indexRows.push(itemId);
			grid._grid.render();
			container.onXmlLoaded.call(grid, true);

			return true;
		}

		return false;
	};

	container.updateRow = function (itemNode, skipMenuUpdate) {
		if (!itemNode) {
			return false;
		}

		const itemId = itemNode.getAttribute('id');

		if (grid.getRowIndex(itemId) === -1) {
			return container.insertRow(itemNode, skipMenuUpdate);
		}

		container.updateItemInQueryCache(itemNode);

		const rowsInfo = window.adaptGridRowsFromXml(
			`<Result>${itemNode.xml}</Result>`,
			{
				headMap: grid._grid.head,
				indexHead: grid._grid.settings.indexHead
			}
		);

		const itemType = itemNode.getAttribute('type');

		const localChanges =
			window.layout && window.layout.props && window.layout.props.localChanges;

		const itemChanges =
			localChanges && localChanges[itemType] && localChanges[itemType][itemId];

		if (itemChanges) {
			const currentItem = rowsInfo.rowsMap.get(itemId);
			const adaptedItem = window.adaptGridRowFromStore(
				itemChanges,
				grid._grid.head
			);

			rowsInfo.rowsMap.set(itemId, {
				...currentItem,
				...adaptedItem
			});
		}

		rowsInfo.rowsMap.forEach(function (row, key) {
			grid._grid.rows._store.set(key, row);
		});
		grid._grid.render();

		if (itemId === grid.getSelectedId()) {
			container.onSelectItem(itemId, undefined, skipMenuUpdate);
		}

		if (container.previewPane) {
			container.previewPane.updateForm(itemId, itemTypeName);
		}

		return true;
	};

	container.deleteRow = function (deleteTarget, skipQuery) {
		if (!deleteTarget) {
			aras.uiPopulateInfoTableWithItem(null, document);
			return false;
		}

		let itemId;

		if (typeof deleteTarget === 'string') {
			itemId = deleteTarget;
		} else {
			if (deleteTarget.getAttribute('type') !== container.itemTypeName) {
				return false;
			}

			itemId = deleteTarget.getAttribute('id');
		}

		if (itemId === grid.getSelectedId()) {
			aras.uiPopulateInfoTableWithItem(null, document);
		}

		grid.deleteRow(itemId);

		if (container.previewPane) {
			container.previewPane.clearForm(itemId);
		}

		if (!skipQuery) {
			const queryResult = currQryItem.getResult();
			const itemNode = queryResult.selectSingleNode(`Item[@id="${itemId}"]`);

			// If we delete versionable item, all previous versions should be removed to.
			// IR-008031 "The previous version is shown after manual version".
			const configId = aras.getItemProperty(itemNode, 'config_id');
			const isVersionableIT =
				aras.getItemProperty(container.currItemType, 'is_versionable') === '1';

			if (!isVersionableIT || !configId) {
				itemNode.parentNode.removeChild(itemNode);
				return;
			}

			const nodesToDelete = queryResult.selectNodes(
				`Item[@type="${container.itemTypeName}"][config_id="${configId}"]`
			);

			nodesToDelete.forEach((node) => {
				node.parentNode.removeChild(node);
			});
		}
	};
}
