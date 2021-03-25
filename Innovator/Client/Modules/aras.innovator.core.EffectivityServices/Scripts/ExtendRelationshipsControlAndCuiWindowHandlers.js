document.addEventListener('beforeLoadWidgets', function () {
	if (window.itemTypeName !== 'Part') {
		return;
	}

	const relationshipsWithSplitters = new Set([
		// "Part BOM" relationshiptype ID
		'159C6D88795B4A86864420863466F728',
		// "Part MultiLevel BOM" relationshiptype ID
		'567E4149FBF74DACA0B0C4C9B1E79A3B'
	]);

	window.RelationshipsOverriddenFunctions = Object.assign(
		window.RelationshipsOverriddenFunctions || {},
		{
			onTab: function (targetTabId) {
				const relationshipsControl = window.relationshipsControl;

				if (!relationshipsWithSplitters.has(targetTabId)) {
					return;
				}

				const iframesCollection = relationshipsControl.iframesCollection;
				const relationshipMainIframe =
					(iframesCollection && iframesCollection[targetTabId]) ||
					document.getElementById(targetTabId);
				const relationshipIframeContainer =
					relationshipMainIframe.parentElement;

				if (
					relationshipIframeContainer.classList.contains(
						'effs-relationship-container'
					)
				) {
					return;
				}

				relationshipMainIframe.classList.add(
					'effs-relationship-container__pane-container'
				);
				relationshipMainIframe.classList.add(
					'effs-relationship-container__pane-content-iframe'
				);
				relationshipMainIframe.classList.add('aras-flex-grow');

				const splitter = document.createElement('aras-splitter');
				splitter.id = targetTabId + '_splitter';
				splitter.classList.add('aras-hide');

				const rightSplitterPane = document.createElement('div');
				rightSplitterPane.id = targetTabId + '_right_splitter_pane';
				rightSplitterPane.classList.add(
					'effs-relationship-container__pane-container'
				);
				rightSplitterPane.classList.add(
					'effs-relationship-container__pane-container-right'
				);
				rightSplitterPane.classList.add(
					'effs-relationship-container__pane-container_min-width-100'
				);
				rightSplitterPane.classList.add('aras-hide');

				relationshipIframeContainer.classList.add(
					'effs-relationship-container'
				);
				relationshipIframeContainer.appendChild(rightSplitterPane);
				relationshipIframeContainer.insertBefore(splitter, rightSplitterPane);
			}
		}
	);

	if (!window.arasTabsobj) {
		const defaultCuiWindowBeforeUnloadHandler =
			window.cuiWindowBeforeUnloadHandler;
		window.removeEventListener(
			'beforeunload',
			defaultCuiWindowBeforeUnloadHandler
		);

		const getEffectivityExpressionEditorViewController = function () {
			const effectivityExpressionDialog = window.effectivityExpressionDialog;

			if (effectivityExpressionDialog) {
				return effectivityExpressionDialog.contentNode.querySelector('iframe')
					.contentWindow.effectivityExpressionEditorViewController;
			}
		};

		window.addEventListener('beforeunload', function (e) {
			if (window.aras.getCommonPropertyValue('exitInProgress') === true) {
				return;
			}

			const effectivityExpressionEditorViewController = getEffectivityExpressionEditorViewController();

			if (!effectivityExpressionEditorViewController) {
				return defaultCuiWindowBeforeUnloadHandler(e);
			}

			const expressionItemNode =
				effectivityExpressionEditorViewController.expressionItemNode;

			if (
				window.aras.isDirtyEx(expressionItemNode) ||
				window.aras.isDirtyEx(window.item)
			) {
				e.returnValue = window.aras.getResource(
					'',
					'item_methods_ex.unsaved_changes'
				);
			}

			return e.returnValue;
		});

		window.addEventListener('unload', function () {
			const effectivityExpressionEditorViewController = getEffectivityExpressionEditorViewController();

			if (!effectivityExpressionEditorViewController) {
				return;
			}

			const expressionItemNode =
				effectivityExpressionEditorViewController.expressionItemNode;

			if (window.aras.isDirtyEx(expressionItemNode)) {
				window.aras.removeFromCache(expressionItemNode);
			}
		});
	} else {
		window.effsCuiWindowCloseHandler = function (
			removeTabCallback,
			ignorePageCloseHooks
		) {
			const effectivityExpressionDialog = window.effectivityExpressionDialog;

			if (!effectivityExpressionDialog) {
				cuiWindowCloseHandler(removeTabCallback, ignorePageCloseHooks);
				return;
			}

			const effectivityExpressionDialogCloseButtonHandler =
				effectivityExpressionDialog.attachedEvents.onCloseBtn.callback;
			const unsavedChangesDialogInfo = effectivityExpressionDialogCloseButtonHandler();

			if (unsavedChangesDialogInfo.isDialogSkipped) {
				cuiWindowCloseHandler(removeTabCallback, ignorePageCloseHooks);
				return;
			}

			cuiWindowFocusHandler();

			if (unsavedChangesDialogInfo.isDialogAlreadyOpen) {
				removeTabCallback(false);
			} else {
				unsavedChangesDialogInfo.promise.then(function (
					isEffectivityExpressionDialogClosed
				) {
					if (
						isEffectivityExpressionDialogClosed &&
						(ignorePageCloseHooks ||
							(!window.aras.isDirtyEx(window.item) &&
								!window.aras.isTempEx(window.item)))
					) {
						cuiWindowCloseHandler(removeTabCallback, ignorePageCloseHooks);
					} else {
						removeTabCallback(false);
					}
				});
			}
		};

		window.close = window.effsCuiWindowCloseHandler;
	}
});
