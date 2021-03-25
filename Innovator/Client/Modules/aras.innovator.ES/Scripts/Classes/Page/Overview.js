require([
	'dojo/domReady!',
	'ES/Scripts/Classes/Wrappers/WrappedGrid',
	'ES/Scripts/Classes/Utils',
	'dojo/text!ES/Views/Templates/Legend.html'
], function (DomReady, WrappedGrid, Utils, Legend) {
	//Get aras object
	var aras = parent.parent.aras;
	this.utils = new Utils({
		arasObj: aras
	});
	var self = this;

	var crawlerITName = 'ES_Crawler';
	var agentITName = 'ES_Agent';
	var crawlerStateITName = 'ES_CrawlerState';
	var agentStateITName = 'ES_AgentState';

	var agentItemType = aras.getItemTypeForClient(agentITName, 'name');
	var crawlerItemType = aras.getItemTypeForClient(crawlerITName, 'name');
	var crawlerStateItemType = aras.getItemTypeForClient(
		crawlerStateITName,
		'name'
	);

	var crawlersGrid = null;
	var crawlersGridLegend = null;
	var agentIndicator = null;

	var bgActive = '#59FF7A !important'; //green
	var bgDisabled = '#FF7A7A !important'; //red
	var bgWaitingForResponse = '#F7F488 !important'; //yellow
	var stopCurrentIteration = 'Stop current iteration';
	var fakeDateTime = '0001-01-01T00:00:00';
	var fakeCellValue = 'Not Available';
	var sortCriteria = 'sort_order';

	var crawlerPropsXpath =
		"Relationships/Item[@type='Property' and (name='crawler_state'" +
		" or name='crawler_paging'" +
		" or name='crawler_period'" +
		" or name='crawler_threads'" +
		" or name='crawler_parameters'" +
		" or name='id')]";
	var crawlerStatePropsXpath =
		"Relationships/Item[@type='Property' and (name='ca_start'" +
		" or name='current_action'" +
		" or name='next_action'" +
		" or name='total_to_process'" +
		" or name='currently_processed'" +
		" or name='is_iteration_finished'" +
		" or name='has_errors'" +
		" or name='ca_finish')]";

	var crawlerProps = crawlerItemType.getItemsByXPath(crawlerPropsXpath);
	var crawlerPropsArr = sortItemProps(crawlerProps);

	var crawlerStateProps = crawlerStateItemType.getItemsByXPath(
		crawlerStatePropsXpath
	);
	var crawlerStatePropsArr = sortItemProps(crawlerStateProps);

	var skipCols = ['is_iteration_finished'];

	var actionNameMap = {};

	function sortItemProps(itemProps) {
		var itemPropsArr = [];
		for (var i = 0, propCount = itemProps.getItemCount(); i < propCount; i++) {
			var property = itemProps.getItemByIndex(i);
			itemPropsArr.push({
				name: property.getProperty('name', ''),
				sort_order: property.getProperty('sort_order', ''),
				width: parseInt(property.getProperty('column_width', 100)),
				align: property.getProperty('column_alignment', 'l'),
				data_type: property.getProperty('data_type', ''),
				label: property.getProperty('label', '')
			});
		}
		if (itemPropsArr.length > 1) {
			itemPropsArr.sort(function (a, b) {
				var aOrder = parseInt(a[sortCriteria]);
				var bOrder = parseInt(b[sortCriteria]);
				if (aOrder > bOrder) {
					return 1;
				}
				if (aOrder < bOrder) {
					return -1;
				}
				return 0;
			});
		}
		return itemPropsArr;
	}

	function calculateBgColor(lastUpdate, crawlerState, caFinish, currentAction) {
		if (self.utils.isNullOrUndefined(lastUpdate)) {
			return bgDisabled;
		}

		var dtNow = new Date();
		var dtLastUpdateUTC = new Date(lastUpdate + 'Z');
		var offset = dtNow.getTimezoneOffset() - aras.getCorporateToLocalOffset();
		var dtLastUpdate = new Date(dtLastUpdateUTC.getTime() + offset * 60000);

		if (
			(!self.utils.isNullOrUndefined(caFinish) &&
				crawlerState === 'Disabled') ||
			(dtNow - dtLastUpdate.getTime()) / 1000 > 60
		) {
			return bgDisabled;
		} else if (
			currentAction === 'Pause' ||
			currentAction === 'Finish' ||
			(dtNow - dtLastUpdate.getTime()) / 1000 > 40
		) {
			return bgWaitingForResponse;
		}

		return bgActive;
	}

	function refreshCrawlersStates() {
		// hide RMB menu
		crawlersGrid.blurMenu();

		var crawlersGridCells = crawlersGrid.getCells();

		// change crawlers grid legend
		if (self.utils.isNullOrUndefined(crawlersGridLegend)) {
			crawlersGridLegend = document.getElementById('gridLegend');
		}
		crawlersGridLegend.textContent =
			agentItemType.getProperty('name', '') +
			' ' +
			self.utils.getResourceValueByKey('dashboard.crawler_grid_title');

		// set color for crawlers grid indicator
		var bgColor = '';
		var agentState = aras.newIOMItem(agentStateITName, 'get');
		agentState.setAttribute('select', 'modified_on');
		agentState = agentState.apply();
		if (!agentState.isError()) {
			bgColor = calculateBgColor(agentState.getProperty('modified_on', ''));
			if (self.utils.isNullOrUndefined(agentIndicator)) {
				agentIndicator = document.getElementById('agentIndicator');
			}
			agentIndicator.setAttribute('style', 'background-color: ' + bgColor);
		}

		var crawlersItems = aras.newIOMItem(crawlerITName, 'get');
		var crawlerStates = aras.newIOMItem(crawlerStateITName, 'get');
		crawlersItems.addRelationship(crawlerStates);
		crawlersItems = crawlersItems.apply();
		if (!crawlersItems.isError()) {
			crawlersItems = crawlersItems.getItemsByXPath(
				aras.XPathResult("/Item[@type='ES_Crawler']")
			);
			var crawlers = crawlersItems.getItemCount();
			if (crawlers > 0) {
				var crawler = '';
				var crawlerId = '';

				for (var i = 0; i < crawlers; ++i) {
					crawler = crawlersItems.getItemByIndex(i);
					crawlerId = crawler.getID();
					if (+crawlersGrid.getRowIndex(crawlerId) === -1) {
						crawlersGrid.addRow(crawlerId, '', false);
					}
				}

				for (i = 0; i < crawlers; ++i) {
					crawler = crawlersItems.getItemByIndex(i);
					crawlerId = crawler.getID();
					var stateColumnIndex = crawlersGrid.getColumnOrderByName(
						'crawler_state'
					);
					var value = '';
					var crawlerState = crawlersItems.getItemsByXPath(
						aras.XPathResult(
							"/Item[@type='ES_Crawler' and @id='" +
								crawlerId +
								"']/Relationships/Item[@type='ES_CrawlerState']"
						)
					);
					if (crawlerState.getItemCount() === 0) {
						crawler.setProperty('crawler_state', fakeCellValue);
						crawlerState = aras.newIOMItem('ES_CrawlerState', 'get');
						crawlerState.setProperty('current_action', fakeCellValue);
						crawlerState.setProperty('next_action', fakeCellValue);
						crawlerState.setProperty('ca_start', fakeDateTime);
						crawlerState.setProperty('ca_finish', fakeDateTime);
						crawlerState.setProperty('currently_processed', fakeCellValue);
						crawlerState.setProperty('total_to_process', fakeCellValue);
					}
					var isIterationFinished =
						crawlerState.getProperty('is_iteration_finished', '') === '1';

					for (var j = 0; j < crawlersGridCells.length; j++) {
						var cell = crawlersGridCells[j];
						if (cell.layoutIndex < crawlerPropsArr.length) {
							value = crawler.getProperty(cell.field, '');
						} else {
							value = crawlerState.getProperty(cell.field, '');
						}
						if (cell.editableType === 'item') {
							value = {
								name: crawler.getPropertyAttribute(cell.field, 'keyed_name'),
								type: crawler.getPropertyAttribute(cell.field, 'type'),
								id: crawler.getProperty(cell.field, '')
							};
						}
						if (
							value === stopCurrentIteration ||
							(cell.field === 'current_action' &&
								value === 'Run' &&
								isIterationFinished)
						) {
							value =
								crawlersGrid.getCellValue(stateColumnIndex, crawlerId) ===
								'Active'
									? 'Finish'
									: '';
						}
						if (
							cell.field === 'next_action' &&
							value === 'Restart' &&
							isIterationFinished
						) {
							value =
								crawlersGrid.getCellValue(stateColumnIndex, crawlerId) ===
								'Active'
									? 'Run'
									: '';
						}
						if (cell.field === 'total_to_process' && value === '-1') {
							value = 'N/A';
						}
						crawlersGrid.setCellValue(j, crawlerId, value);
					}

					if (!crawlerState.isError() && !crawlerState.isEmpty()) {
						var currentAction = '';
						if (
							crawlerState.getProperty('current_action', '') === 'Run' &&
							isIterationFinished
						) {
							currentAction = 'Finish';
						} else {
							currentAction = crawlerState.getProperty('current_action', '');
						}

						if (currentAction !== fakeCellValue) {
							bgColor = calculateBgColor(
								crawlerState.getProperty('modified_on', ''),
								crawlersGrid.getCellValue(stateColumnIndex, crawlerId),
								crawlerState.getProperty('ca_finish', ''),
								currentAction
							);

							crawlersGrid.setCellBackgroundColor(
								crawlersGridCells[stateColumnIndex].layoutIndex,
								crawlerId,
								bgColor
							);
						}
					}
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

	function initCrawlersGrid() {
		crawlersGrid.on('gridMenuInit', onShowMenuCrawlersGrid);
		crawlersGrid.on('gridMenuClick', onMenuClickedCrawlersGrid);
		crawlersGrid.on('gridLinkClick', onLink);

		for (var i = 0; i < crawlerPropsArr.length; i++) {
			if (crawlerPropsArr[i].name === 'id') {
				crawlerPropsArr[i].label = 'Crawler';
			}
			crawlersGrid.addColumn(
				crawlerPropsArr[i].name,
				crawlerPropsArr[i].label,
				crawlersGrid.getEditType(crawlerPropsArr[i].data_type),
				crawlerPropsArr[i].width,
				crawlerPropsArr[i].align
			);
		}

		for (i = 0; i < crawlerStatePropsArr.length; i++) {
			if (skipCols.indexOf(crawlerStatePropsArr[i].name) !== -1) {
				continue;
			}
			crawlersGrid.addColumn(
				crawlerStatePropsArr[i].name,
				crawlerStatePropsArr[i].label,
				crawlersGrid.getEditType(crawlerStatePropsArr[i].data_type),
				crawlerStatePropsArr[i].width,
				crawlerStatePropsArr[i].align
			);
		}

		crawlersGrid.init();
		refreshCrawlersStates();
	}

	onload = function () {
		if (!self.utils.isFeatureActivated()) {
			window.location = '../GetLicense.html';
			return;
		}

		loadData();

		crawlersGrid = new WrappedGrid();
		crawlersGrid.createControl('crawlersGrid', initCrawlersGrid);

		var actions = crawlerItemType.getItemsByXPath(
			"Relationships/Item[@type='Item Action']/related_id/Item[@type='Action']"
		);
		for (var i = 0, count = actions.getItemCount(); i < count; i++) {
			var action = actions.getItemByIndex(i);
			var id = action.getID();
			var name = action.getProperty('name', '');
			var label = action.getProperty('label', name);
			actionNameMap[id] = name;
			crawlersGrid.addMenuItem(
				id,
				label === stopCurrentIteration ? 'Finish' : label
			);
		}

		// fill legend grid and other fields with test from resources
		var caption = self.utils.getResourceValueByKey('legend.title');
		var color = self.utils.getResourceValueByKey('legend.color');
		var serviceability = self.utils.getResourceValueByKey(
			'legend.serviceability'
		);
		var greenHint1 = self.utils.getResourceValueByKey('legend.green_hint_1');
		var yellowHint1 = self.utils.getResourceValueByKey('legend.yellow_hint_1');
		var yellowHint2 = self.utils.getResourceValueByKey('legend.yellow_hint_2');
		var redHint1 = self.utils.getResourceValueByKey('legend.red_hint_1');
		var redHint2 = self.utils.getResourceValueByKey('legend.red_hint_2');

		var errorValue = self.utils.getResourceValueByKey(
			'dashboard.error_no_agent'
		);
		var legendMarkup = dojo.replace(Legend, [
			caption,
			color,
			serviceability,
			greenHint1,
			yellowHint1,
			yellowHint2,
			redHint1,
			redHint2
		]);
		var refreshButtonValue = self.utils.getResourceValueByKey(
			'buttons.refresh'
		);

		var legendTable = document.getElementById('legendTable');
		var refreshButton = document.getElementById('refreshButton');
		var errorContainer = document.querySelector('#errorContainer h1');

		legendTable.innerHTML = legendMarkup;
		errorContainer.textContent = errorValue;

		refreshButton.setAttribute('title', refreshButtonValue);
		refreshButton.querySelector('span').innerText = refreshButtonValue;
		refreshButton.onclick = refreshDashboard;
		refreshButton.classList.remove('hidden');

		setInterval(function () {
			refreshCrawlersStates();
		}, 30000);
	};

	function loadData() {
		var qry = aras.newIOMItem(agentITName, 'get');
		qry.setAttribute('select', 'id');
		var res = qry.apply();

		if (res.isError() || res.isEmpty()) {
			document.getElementById('errorContainer').classList.remove('hidden');
			document.getElementById('gridsContainer').className = 'hidden';
		} else {
			document.getElementById('gridsContainer').classList.remove('hidden');
		}
	}

	function onShowMenuCrawlersGrid(rowId) {
		var rowCrawlerState = '';
		var rowCurrentAction = '';
		var occurenceCounter = null;
		var actionsArray = [];
		var availableActions = [];
		var menu = this.GetMenu();
		var selectedRows = this.getSelectedItemIDs();
		var actionsBehavior = {
			Active: {
				Pause: [
					'ES_RestartCrawlerAction',
					'ES_ResumeCrawlerAction',
					'ES_StopCrawlerAction',
					'ES_DisableCrawlerAction'
				],
				Run: [
					'ES_PauseCrawlerAction',
					'ES_RestartCrawlerAction',
					'ES_StopCrawlerAction',
					'ES_DisableCrawlerAction'
				],
				Finish: ['ES_RunCrawlerAction', 'ES_DisableCrawlerAction'],
				Restart: ['ES_StopCrawlerAction', 'ES_DisableCrawlerAction ']
			},
			Disabled: {
				'': ['ES_EnableCrawlerAction']
			}
		};

		// get all actions for selected rows
		for (var i = 0; i < selectedRows.length; i++) {
			rowCrawlerState = crawlersGrid.getCellValue(
				this.getColumnIndex('crawler_state'),
				selectedRows[i]
			);
			rowCurrentAction = crawlersGrid.getCellValue(
				this.getColumnIndex('current_action'),
				selectedRows[i]
			);
			actionsArray[i] = actionsBehavior[rowCrawlerState][rowCurrentAction];
		}

		// show only common actions for all selected rows
		if (actionsArray.length > 1) {
			for (i = 0; i < actionsArray[0].length; i++) {
				occurenceCounter = 0;
				for (var j = 1; j < actionsArray.length; j++) {
					if (
						actionsArray[j] !== undefined &&
						actionsArray[j].indexOf(actionsArray[0][i]) !== -1
					) {
						occurenceCounter++;
					}
				}
				if (occurenceCounter === actionsArray.length - 1) {
					availableActions = availableActions.concat(actionsArray[0][i]);
				}
			}
		} else {
			availableActions = actionsArray[0];
		}

		if (availableActions !== undefined) {
			for (var actionID in menu.collectionMenu) {
				if (menu.collectionMenu.hasOwnProperty(actionID)) {
					menu.setHide(
						actionID,
						availableActions.indexOf(actionNameMap[actionID]) === -1
					);
				}
			}
		}
		return !(rowId === undefined || rowId === 'header_row');
	}

	function onMenuClickedCrawlersGrid(actionId) {
		var selectedIDs = crawlersGrid.getSelectedItemIDs('|').split('|');
		var action = crawlerItemType.getItemsByXPath(
			"Relationships/Item[@type='Item Action']/related_id/Item[@type='Action' and id='" +
				actionId +
				"']"
		);

		// try to unlock crawler items if it is currently locked
		var crawlerItems = aras.newIOMItem('ES_Crawler', 'get');
		crawlerItems.setAttribute('idlist', selectedIDs);
		crawlerItems = crawlerItems.apply();
		if (!crawlerItems.isError() && crawlerItems.getItemCount() > 0) {
			for (var j = 0, count = crawlerItems.getItemCount(); j < count; ++j) {
				var crawlerItem = crawlerItems.getItemByIndex(j);
				if (aras.isLocked(crawlerItem.node)) {
					aras.unlockItemEx(crawlerItem.node, false);
				}
			}
		}

		// perform clicked action(s)
		for (var i = 0; i < selectedIDs.length; i++) {
			aras.invokeAction(action.node, crawlerItemType.getID(), selectedIDs[i]);
		}

		refreshDashboard();
	}

	function refreshDashboard() {
		self.utils.toggleSpinner(true, function () {
			try {
				refreshCrawlersStates();
			} catch (ex) {
				aras.AlertError(ex.message);
			} finally {
				self.utils.toggleSpinner(false);
			}
		});
	}
});
