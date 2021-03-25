(function () {
	const baseLock = window.onLockCommand;
	const baseUnlock = window.onUnlockCommand;
	const baseSave = window.onSaveCommand;
	const baseRefresh = window.onRefresh;

	window.onSaveCommand = async function (saveOptions) {
		if (window.viewModel) {
			await viewModel.render();
		}

		const itemController = new ItemController();
		itemController.dRFItem = item;
		const validationResult = itemController.validate();
		if (!validationResult.isValid) {
			const res = aras.getResource(
				'../Modules/aras.innovator.DomainAccessControl/',
				'unused_derived_relationships_error_msg',
				validationResult.unMapped
			);
			return aras.AlertError(res);
		}
		itemController.onBeforeAction(true);
		const saveResult = await baseSave(saveOptions);
		itemController.dRFItem = item;
		itemController.onAfterAction();
		if (!aras.isTempEx(item) && window.viewModel) {
			window.viewModel.render();
		}

		return saveResult;
	};
	window.onLockCommand = function () {
		const itemController = new ItemController();
		itemController.dRFItem = item;
		itemController.onBeforeAction(false);
		const val = baseLock.apply(this, arguments);

		itemController.dRFItem = item;
		itemController.onAfterAction();
		viewModel.render();
		return val;
	};
	window.onUnlockCommand = function (res) {
		const itemController = new ItemController();
		itemController.dRFItem = item;

		if (res) {
			const validationResult = itemController.validate();

			if (!validationResult.isValid) {
				const res = aras.getResource(
					'../Modules/aras.innovator.DomainAccessControl/',
					'unused_derived_relationships_error_msg',
					validationResult.unMapped
				);
				aras.AlertError(res);
				return;
			}
		}
		itemController.onBeforeAction(res);
		const val = baseUnlock(res);
		itemController.dRFItem = item;
		itemController.onAfterAction();
		viewModel.render();
		return val;
	};
	window.onRefresh = function () {
		const val = baseRefresh.apply(this, arguments);

		if (aras.isTempEx(item)) {
			new ItemController().setViewModeOnRelationships();
		} else {
			viewModel.render();
		}
		return val;
	};
	window.addEventListener('load', function () {
		if (aras.isTempEx(item)) {
			new ItemController().setViewModeOnRelationships();
		}
	});

	document.addEventListener('loadSideBar', () => {
		const sidebar = window.getSidebar();
		const tabClickHandler = (selectedTabId) => {
			const formTabSelected = selectedTabId === 'show_form';
			if (formTabSelected) {
				const relshipIframe =
					relationships.iframesCollection[relationshipsControl.currTabID];
				const relationshipWin = relshipIframe && relshipIframe.contentWindow;
				if (relationshipWin && relationshipWin.grid) {
					relationshipWin.grid._grid.render();
				}
			}
		};
		sidebar.domNode.on('click', (selectedTabId) =>
			tabClickHandler(selectedTabId)
		);
	});
})();
