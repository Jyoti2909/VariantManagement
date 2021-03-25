(function () {
	var xClassEditor = {};

	var baseUnlock = window.onUnlockCommand;
	window.onUnlockCommand = function (saveChanges) {
		var baseUnlockResult = baseUnlock(saveChanges);
		var xClasses = aras.getItemRelationships(
			'xClassificationTree',
			aras.getItemProperty(item, 'id'),
			'xClass'
		);
		const xClassEditorTab = document.getElementById('xClass-editor');
		if (!xClassEditorTab.classList.contains('dijitHidden')) {
			window.xClassEditorTree.init(document.querySelector('.class-tree'), item);
			window.xClassEditorGrid.init(
				document.querySelector('.properties-grid'),
				xClasses[0]
			);
			window.xClassEditorTree.tree.select(
				aras.getItemProperty(xClasses[0], 'ref_id')
			);
		}
		window.xClassEditorTree.disableButtonsToolbar();
		return baseUnlockResult;
	};

	var baseLock = window.onLockCommand;
	window.onLockCommand = function (saveChanges) {
		var baseLockResult = baseLock(saveChanges);
		var xClasses = aras.getRelationships(item, 'xClass');
		if (xClasses.length === 0) {
			xClasses = aras.getItemRelationships(
				'xClassificationTree',
				aras.getItemProperty(item, 'id'),
				'xClass'
			);
		}
		window.xClassEditorTree.item = item;
		const xClassEditorTab = document.getElementById('xClass-editor');
		if (!xClassEditorTab.classList.contains('dijitHidden')) {
			window.xClassEditorGrid.init(
				document.querySelector('.properties-grid'),
				xClasses[0]
			);
			window.xClassEditorTree.tree.select(
				aras.getItemProperty(xClasses[0], 'ref_id')
			);
		}
		window.xClassEditorTree.disableButtonsToolbar();
		return baseLockResult;
	};

	var baseSave = window.onSaveCommand;
	window.onSaveCommand = function (optionalParameters) {
		var permissions = window.item.selectNodes(
			'Relationships/Item/Relationships/Item[@type="xClass_xPropValue_Perm" or @type="xClass_Classification_Perm"]'
		);
		Array.prototype.forEach.call(permissions, function (perm) {
			var related = aras.getItemProperty(perm, 'related_id');
			if (!related) {
				perm.parentNode.removeChild(perm);
			}
		});
		var baseSaveResult = baseSave(optionalParameters);
		return baseSaveResult.then(function (saveItem) {
			aras.getItemRelationships(
				'xClassificationTree',
				aras.getItemProperty(item, 'id'),
				'xClass'
			);
			window.xClassEditorTree.item = item;
			var loadedClassId = window.xClassEditorGrid.getCurrentLoadedClassId();
			if (loadedClassId) {
				var xClassItem = window.item.selectSingleNode(
					'Relationships/Item[@id="' +
						window.xClassEditorGrid.getCurrentLoadedClassId() +
						'"]'
				);
				window.xClassEditorGrid.loadRelationships(xClassItem);
				window.xClassEditorTree.tree.select(
					aras.getItemProperty(xClassItem, 'ref_id')
				);
			}
			return saveItem;
		});
	};

	xClassEditor.init = function (node) {
		var xClasses = aras.getItemRelationships(
			'xClassificationTree',
			aras.getItemProperty(item, 'id'),
			'xClass'
		);
		window.xClassEditorTree.init(document.querySelector('.class-tree'), item);
		window.xClassEditorGrid.init(
			document.querySelector('.properties-grid'),
			xClasses[0]
		);
		window.xClassEditorTree.tree.select(
			aras.getItemProperty(xClasses[0], 'ref_id')
		);
		window.xClassEditorTree.disableButtonsToolbar();

		window.xClassEditorTree.onSelectNode = function (xClassId) {
			if (window.xClassEditorGrid.getCurrentLoadedClassId() != xClassId) {
				var xClassItem = window.item.selectSingleNode(
					'Relationships/Item[@id="' + xClassId + '"]'
				);
				window.xClassEditorGrid.loadRelationships(xClassItem);
				window.xClassEditorTree.tree.select(
					aras.getItemProperty(xClassItem, 'ref_id')
				);
			}
		};
		window.xClassEditorTree.onDeleteNode = function (deletedId, parentClass) {
			if (window.xClassEditorGrid.getCurrentLoadedClassId() === deletedId) {
				window.xClassEditorGrid.loadRelationships(parentClass);
				window.xClassEditorTree.tree.select(
					aras.getItemProperty(parentClass, 'ref_id')
				);
			}
		};
	};

	xClassEditor.showEditor = function () {
		xClassEditor.init();
	};

	window.xClassEditor = xClassEditor;
})();
