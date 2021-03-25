(function (externalParent) {
	if (!(window.ArasModules && window.ArasModules.Dialog)) {
		return;
	}
	let aras;
	let dialogNode;
	let itemTypeName;
	let itemNode;
	let itemTypeNode;

	function getItemId(isItemId) {
		const isVersionable =
			aras.getItemProperty(itemTypeNode, 'is_versionable') === '1';
		return aras.getItemProperty(
			itemNode,
			isVersionable && !isItemId ? 'config_id' : 'id'
		);
	}

	function copyToclipboard(text, message) {
		if (aras.utils.isClipboardSupported()) {
			ArasModules.copyTextToBuffer(text, dialogNode);
			const notify = aras.getNotifyByContext(window);
			notify(message, { container: dialogNode });
		} else {
			aras.AlertError(aras.getResource('', 'clipboardmanager.use_ctrl_c'));
		}
	}

	function copyUrl(option, isItemId) {
		const text =
			aras.getInnovatorUrl() +
			'?StartItem=' +
			itemTypeName +
			':' +
			getItemId(isItemId) +
			(option ? ':' + option : '');
		copyToclipboard(
			text,
			aras.getResource('', 'common.copy_notification_link')
		);
	}

	function urlEventHandler(e) {
		const copyObj = {
			latest: copyUrl.bind(null, 'current'),
			'copy-url': copyUrl.bind(null, '', true),
			'latest-released': copyUrl.bind(null, 'released')
		};

		const cssSelector = Object.keys(copyObj)
			.map(function (dataAction) {
				return '*[data-action="' + dataAction + '"]';
			})
			.join(',');

		const targetNode = e.target.closest(cssSelector);
		if (
			!targetNode ||
			targetNode.classList.contains('aras-list-item_disabled')
		) {
			return;
		}
		copyObj[targetNode.dataset.action]();
	}

	function createUrlButtons(container, copyButton) {
		const urlButtonsContainer = document.createElement('div');
		urlButtonsContainer.classList.add('url-buttons-container');
		const copyUrlButton = document.createElement('button');
		copyUrlButton.classList.add('aras-btn', 'copy-url-btn');
		copyUrlButton.textContent = aras.getResource('', 'common.copy_link');
		copyUrlButton.dataset.action = 'copy-url';
		const dropdownContainer = document.createElement('aras-dropdown');
		dropdownContainer.classList.add('aras-dropdown-container');
		dropdownContainer.setAttribute('position', 'bottom-left');
		const dropdownButton = document.createElement('div');
		dropdownButton.classList.add(
			'aras-btn',
			'copy-url-dropdown-btn',
			'aras-icon-arrow',
			'aras-icon-arrow_down'
		);
		dropdownButton.setAttribute('dropdown-button', '');
		const dropdownBox = document.createElement('div');
		dropdownBox.classList.add('aras-dropdown');
		const optionsList = document.createElement('ul');
		optionsList.classList.add('aras-list');
		copyButton.classList.add('copy-id-button');
		urlButtonsContainer.appendChild(copyButton);
		urlButtonsContainer.appendChild(dropdownContainer);
		dropdownContainer.appendChild(copyUrlButton);
		dropdownContainer.appendChild(dropdownButton);
		dropdownContainer.appendChild(dropdownBox);
		dropdownBox.appendChild(optionsList);

		const li = document.createElement('li');
		li.classList.add('aras-list-item');
		if (aras.getItemProperty(itemTypeNode, 'is_versionable') === '0') {
			li.classList.add('aras-list-item_disabled');
		}
		const labelNode = document.createElement('li');
		labelNode.classList.add('aras-list-item__label');
		labelNode.textContent = aras.getResource('', 'common.copy_link_latest');
		li.appendChild(labelNode);
		li.dataset.action = 'latest';
		optionsList.appendChild(li.cloneNode(true));
		li.querySelector('.aras-list-item__label').textContent = aras.getResource(
			'',
			'common.copy_link_latest_released'
		);
		li.dataset.action = 'latest-released';
		optionsList.appendChild(li);

		container.appendChild(urlButtonsContainer);
		urlButtonsContainer.addEventListener('click', urlEventHandler);
	}

	const properties = function (item, itemType, options) {
		options = options || {};
		aras = options.aras || window.aras;
		if (!aras) {
			return Promise.reject(new Error('The "aras" was not found'));
		}

		itemTypeName = aras.getNodeElement(itemType, 'name');
		itemNode =
			aras.getItemById(itemTypeName, item.getAttribute('id'), 0) || item;
		itemTypeNode = itemType;
		const itemTypeLabel = aras.getNodeElement(itemType, 'label');
		const dialogTitle =
			options.title ||
			aras.getResource(
				'',
				'propsdialog.item_type_label__item_keyed_name__properties',
				itemTypeLabel,
				aras.getKeyedNameEx(item)
			);
		const propsDialog = new ArasModules.Dialog('html', {
			title: dialogTitle
		});
		dialogNode = propsDialog.dialogNode;
		const contentNode = propsDialog.contentNode;
		dialogNode.classList.add('aras-dialog_properties');
		const tableNode = document.createElement('div');
		tableNode.classList.add('properties-table-container');
		contentNode.appendChild(tableNode);

		const infoTable = aras.uiDrawItemInfoTable(itemType);
		tableNode.innerHTML = infoTable;

		aras.uiPopulateInfoTableWithItem(
			item,
			propsDialog.dialogNode.ownerDocument
		);
		const copyButton = document.createElement('button');
		copyButton.classList.add('aras-btn');

		const copyButtonTextResourse = 'common.copy_id';
		createUrlButtons(contentNode, copyButton);

		copyButton.textContent = aras.getResource('', copyButtonTextResourse);
		copyButton.addEventListener('click', function () {
			copyToclipboard(
				getItemId(true),
				aras.getResource('', 'common.copy_notification_id')
			);
		});

		propsDialog.show();

		ArasModules.dropdownButton(
			contentNode.querySelector('.aras-dropdown-container'),
			{ buttonSelector: '.copy-url-dropdown-btn' }
		);
		return propsDialog.promise;
	};

	externalParent.Dialogs = externalParent.Dialogs || {};
	externalParent.Dialogs.properties = properties;
	window.ArasCore = window.ArasCore || externalParent;
})(window.ArasCore || {});
