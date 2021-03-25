(function (externalParent) {
	if (!window.ArasModules.Dialog) {
		return;
	}

	const selectPackageDefinition = function (arrayOfPackage) {
		const dialogTitle = aras.getResource(
			'',
			'item_methods.add_selected_items_to_a_package'
		);

		const selectPackageDialog = new ArasModules.Dialog('html', {
			title: dialogTitle
		});

		const selectPackageContainer = document.createElement('div');
		const selectPackage = document.createElement('div');
		const selectElement = document.createElement('select');
		if (arrayOfPackage.length > 0) {
			selectElement.add(
				new Option(aras.getResource('', 'item_methods.select_package'))
			);
		}
		selectElement.add(
			new Option(aras.getResource('', 'item_methods.create_new'), 'create new')
		);
		arrayOfPackage.forEach(function (item, arrayOfPackage) {
			selectElement.add(new Option(item));
		});

		selectPackage.appendChild(selectElement);
		selectPackageContainer.textContent = aras.getResource(
			'',
			'item_methods.selected_package_from_list'
		);
		selectPackageContainer.appendChild(selectPackage);

		const buttonsContainer = document.createElement('div');
		const okButton = document.createElement('button');
		okButton.textContent = aras.getResource('', 'common.ok');
		okButton.addEventListener(
			'click',
			function () {
				this.close(selectElement.value);
			}.bind(selectPackageDialog)
		);
		okButton.classList.add('aras-btn');
		const cancelButton = document.createElement('button');
		cancelButton.textContent = aras.getResource('', 'common.cancel');
		cancelButton.classList.add('aras-btn', 'btn_cancel');
		cancelButton.addEventListener(
			'click',
			selectPackageDialog.close.bind(selectPackageDialog, null)
		);
		buttonsContainer.appendChild(okButton);
		buttonsContainer.appendChild(cancelButton);

		selectPackageDialog.contentNode.appendChild(selectPackageContainer);
		selectPackageDialog.contentNode.appendChild(buttonsContainer);
		selectPackageDialog.dialogNode.classList.add(
			'aras-dialog_select-package-definition',
			'aras-form'
		);

		selectPackageDialog.show();

		return selectPackageDialog.promise;
	};

	externalParent.Dialogs = externalParent.Dialogs || {};
	externalParent.Dialogs.selectPackageDefinition = selectPackageDefinition;
	window.ArasCore = window.ArasCore || externalParent;
})(window.ArasCore || {});
