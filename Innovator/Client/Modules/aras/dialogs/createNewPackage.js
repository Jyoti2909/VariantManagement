(function (externalParent) {
	if (!window.ArasModules.Dialog) {
		return;
	}

	const createNewPackage = function (arrayOfPackage) {
		const dialogTitle = aras.getResource('', 'item_methods.create_new_package');

		const createNewPacakgeDialog = new ArasModules.Dialog('html', {
			title: dialogTitle
		});

		const packageNameContainer = document.createElement('div');
		const packageNameLabel = document.createElement('label');
		packageNameLabel.textContent = aras.getResource(
			'',
			'item_methods.package_name'
		);
		packageNameLabel.classList.add('aras-dialog_create-new-package__label');
		const packageNameInput = document.createElement('input');
		packageNameInput.type = 'text';
		packageNameInput.placeholder = 'new name';
		packageNameInput.classList.add(
			'aras-dialog_create-new-package__main-content'
		);
		packageNameContainer.appendChild(packageNameLabel);
		packageNameContainer.appendChild(packageNameInput);

		const dependencyContainer = document.createElement('div');
		const dependencyLabel = document.createElement('label');
		dependencyLabel.textContent = aras.getResource(
			'',
			'item_methods.dependency'
		);
		dependencyLabel.classList.add('aras-dialog_create-new-package__label');
		const dependencyPackageSelect = document.createElement('select');
		dependencyPackageSelect.size = 11;
		dependencyPackageSelect.multiple = true;
		arrayOfPackage.forEach(function (item, arrayOfPackage) {
			dependencyPackageSelect.add(new Option(item));
		});
		dependencyPackageSelect.classList.add(
			'aras-dialog_create-new-package__main-content'
		);
		dependencyContainer.appendChild(dependencyLabel);
		dependencyContainer.appendChild(dependencyPackageSelect);
		dependencyContainer.classList.add(
			'aras-dialog_create-new-package__dependency-container'
		);

		const buttonsContainer = document.createElement('div');
		const okButton = document.createElement('button');
		okButton.textContent = aras.getResource('', 'common.ok');
		okButton.classList.add('aras-btn');
		okButton.addEventListener(
			'click',
			function () {
				const objectPackage = { packageName: packageNameInput.value };
				const dependency = [];
				for (let i = 0; i < dependencyPackageSelect.options.length; i++) {
					if (dependencyPackageSelect.options[i].selected) {
						dependency.push(dependencyPackageSelect.options[i].value);
					}
				}
				objectPackage.dependency = dependency;
				this.close(objectPackage);
			}.bind(createNewPacakgeDialog)
		);
		const cancelButton = document.createElement('button');
		cancelButton.textContent = aras.getResource('', 'common.cancel');
		cancelButton.addEventListener(
			'click',
			createNewPacakgeDialog.close.bind(createNewPacakgeDialog, null)
		);
		cancelButton.classList.add('aras-btn', 'btn_cancel');
		buttonsContainer.appendChild(okButton);
		buttonsContainer.appendChild(cancelButton);

		createNewPacakgeDialog.contentNode.appendChild(packageNameContainer);
		createNewPacakgeDialog.contentNode.appendChild(dependencyContainer);
		createNewPacakgeDialog.contentNode.appendChild(buttonsContainer);
		createNewPacakgeDialog.contentNode.classList.add('aras-form');
		createNewPacakgeDialog.dialogNode.classList.add(
			'aras-dialog_create-new-package'
		);

		createNewPacakgeDialog.show();

		return createNewPacakgeDialog.promise;
	};

	externalParent.Dialogs = externalParent.Dialogs || {};
	externalParent.Dialogs.createNewPackage = createNewPackage;
	window.ArasCore = window.ArasCore || externalParent;
})(window.ArasCore || {});
