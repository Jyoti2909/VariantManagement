/* global thisItem */
define(['MacPolicy/Scripts/Configurator/MacPolicyDefinitionView'], function (
	MacPolicyDefinitionView
) {
	'use strict';
	const controller = new MacPolicyDefinitionView(document);
	window.MacPolicyDefinitionView = controller;

	const baseSave = window.onSaveCommand;
	const baseLock = window.onLockCommand;
	const baseUnlock = window.onUnlockCommand;

	window.onSaveCommand = function (options) {
		if (thisItem.getAction() === 'add') {
			if (!aras.checkItem(thisItem.node)) {
				return;
			}
		}
		const editor = controller.MacConditionEditor;
		if (
			editor.form.formWindow &&
			editor.form.getItem() &&
			!editor.saveCondition()
		) {
			return;
		}
		return baseSave(options);
	};

	window.onLockCommand = function (options) {
		const baseLockResult = baseLock(options);
		controller.MacConditionEditor.reload();
		return baseLockResult;
	};

	window.onUnlockCommand = function (saveChanges, options) {
		if (saveChanges) {
			const editor = controller.MacConditionEditor;
			if (
				editor.form.formWindow &&
				editor.form.getItem() &&
				!editor.saveCondition()
			) {
				return;
			}
		}
		const baseUnlockResult = baseUnlock(saveChanges, options);
		controller.MacConditionEditor.reload();
		return baseUnlockResult;
	};

	document.addEventListener('loadSideBar', () => {
		const sidebar = window.getSidebar();
		sidebar.domNode.on('click', (selectedTabId) => {
			const formTabSelected = selectedTabId === 'show_form';
			if (formTabSelected) {
				aras.uiReShowItemEx(thisItem.getId(), thisItem.node, window.viewMode);
			}
		});
	});
});
