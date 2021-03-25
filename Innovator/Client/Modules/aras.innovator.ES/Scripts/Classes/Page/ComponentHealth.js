require([
	'dojo/domReady!',
	'ES/Scripts/Classes/Wrappers/WrappedGrid',
	'ES/Scripts/Classes/Utils'
], function (DomReady, WrappedGrid, Utils) {
	//Get aras object
	var aras = parent.parent.aras;
	this.utils = new Utils({
		arasObj: aras
	});
	var self = this;
	var inn = aras.newIOMInnovator();

	var fileProcessorsGrid = null;

	var bgActive = '#59FF7A !important'; //green
	var bgDisabled = '#FF7A7A !important'; //red
	var bgWaitingForResponse = '#F7F488 !important'; //yellow

	var vaultColumns = {
		vault_id: this.utils.getResourceValueByKey('grid.fp.vault'),
		host: this.utils.getResourceValueByKey('grid.fp.ip'),
		port: this.utils.getResourceValueByKey('grid.fp.port'),
		instance_power: this.utils.getResourceValueByKey('grid.fp.instance_power')
	};

	function calculateInstanceBgColor(currentValue, maxValue) {
		var percentage = currentValue / maxValue;
		if (percentage < 0.3) {
			return bgDisabled;
		} else if (percentage < 0.8) {
			return bgWaitingForResponse;
		}
		return bgActive;
	}

	function refreshFileProcessorsStates() {
		fileProcessorsGrid.removeAllRows();

		var fileProcessors = inn.applyMethod('ES_GetFileProcessors', '');
		fileProcessors = fileProcessors.getItemsByXPath('Relationships/Item');
		if (fileProcessors.getItemCount() === 0) {
			return;
		}
		var vaults = checkVaultExistence(fileProcessors);

		if (fileProcessorsGrid.getColumnCount() === 0) {
			initFileProcessorsGrid();
		}

		var fileProcessorsGridCells = fileProcessorsGrid.getCells();

		for (var j = 0, count = fileProcessors.getItemCount(); j < count; j++) {
			var curProc = fileProcessors.getItemByIndex(j);
			var updateDate = new Date(
				parseInt(curProc.getProperty('timestamp', '0'))
			);
			var curDate = new Date();
			if ((curDate - updateDate) / 1000 > 90) {
				continue;
			}
			fileProcessorsGrid.addRow(j, '', false);
			var vaultID = curProc.getProperty('vault_id', '');
			var name = '';
			for (var i = 0, vaultsCount = vaults.length; i < vaultsCount; i++) {
				if (vaults[i].id === vaultID) {
					name = vaults[i].name;
					break;
				}
			}
			for (var column in vaultColumns) {
				var value = curProc.getProperty(column, '');
				if (column === 'vault_id') {
					value = {
						name: name,
						type: 'Vault',
						id: vaultID
					};
				}
				var columnIndex = fileProcessorsGrid.getColumnOrderByName(column);
				if (column === 'instance_power') {
					var freeInstancePower = curProc.getProperty('free_instance_power');
					var isFIPNumber = !isNaN(parseInt(freeInstancePower));
					fileProcessorsGrid.setCellBackgroundColor(
						fileProcessorsGridCells[columnIndex].layoutIndex,
						j,
						calculateInstanceBgColor(
							isFIPNumber ? +freeInstancePower : +value,
							+value
						)
					);
					value = (isFIPNumber ? freeInstancePower : '-') + '/' + value;
				}
				if (!self.utils.isNullOrUndefined(columnIndex)) {
					fileProcessorsGrid.setCellValue(columnIndex, j, value);
				}
			}
		}
	}

	function onLink(linkVal) {
		if (linkVal.length) {
			linkVal = linkVal.replace(/'/g, '');
			var typeName = linkVal.split(',')[0];
			var id = linkVal.split(',')[1];

			var itm = aras.getItemById(typeName, id, 0);
			if (itm) {
				aras.uiShowItemEx(itm, undefined);
			}
		}
	}

	function checkVaultExistence(fileProcessors) {
		var vaults = [];

		for (var i = 0, count = fileProcessors.getItemCount(); i < count; i++) {
			var property = fileProcessors.getItemByIndex(i);
			var vaultID = property.getProperty('vault_id', '');

			var vaultItem = aras.newIOMItem('Vault', 'get');
			vaultItem.setAttribute('select', 'name');
			vaultItem.setID(vaultID);
			vaultItem = vaultItem.apply();

			if (!vaultItem.isError() || !vaultItem.isEmpty()) {
				vaults.push({
					name: vaultItem.getProperty('name', ''),
					id: vaultID
				});
			}
		}

		return vaults;
	}

	function initFileProcessorsGrid() {
		fileProcessorsGrid.on('gridLinkClick', onLink);

		for (var column in vaultColumns) {
			var dataType = column === 'vault_id' ? 'item' : 'text';
			fileProcessorsGrid.addColumn(
				column,
				vaultColumns[column],
				fileProcessorsGrid.getEditType(dataType),
				100
			);
		}

		fileProcessorsGrid.init();
	}

	onload = function () {
		if (!self.utils.isFeatureActivated()) {
			window.location = '../GetLicense.html';
			return;
		}

		fileProcessorsGrid = new WrappedGrid();
		fileProcessorsGrid.createControl('fileProcessorsGrid', function () {
			initFileProcessorsGrid();
			refreshFileProcessorsStates.call(this);
		});

		var gridTitle = self.utils.getResourceValueByKey(
			'dashboard.file_processors_grid_title'
		);
		var refreshButtonValue = self.utils.getResourceValueByKey(
			'buttons.refresh'
		);

		var fileProcessorsRow = document.getElementById('gridLegend');
		var refreshButton = document.getElementById('refreshButton');

		if (!self.utils.isNullOrUndefined(fileProcessorsRow)) {
			fileProcessorsRow.textContent = gridTitle;
		}

		if (!self.utils.isNullOrUndefined(refreshButton)) {
			refreshButton.setAttribute('title', refreshButtonValue);
			refreshButton.querySelector('span').innerText = refreshButtonValue;
			refreshButton.onclick = refreshDashboard;
			refreshButton.classList.remove('hidden');
		}

		setInterval(function () {
			refreshFileProcessorsStates();
		}, 30000);
	};

	function refreshDashboard() {
		self.utils.toggleSpinner(true, function () {
			try {
				refreshFileProcessorsStates();
			} catch (ex) {
				aras.AlertError(ex.message);
			} finally {
				self.utils.toggleSpinner(false);
			}
		});
	}
});
