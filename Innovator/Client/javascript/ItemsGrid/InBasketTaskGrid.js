/*
Used by MainGridFactory.js
*/

function InBasketTaskGrid() {
	InBasketTaskGrid.superclass.constructor();
	var properties = [
		'created_by_id',
		'created_on',
		'modified_by_id',
		'modified_on',
		'locked_by_id',
		'major_rev',
		'release_date',
		'effective_date',
		'generation',
		'state'
	];
	this.propertiesHelper = {
		properties: properties.map(function (propertyId) {
			return {
				id: propertyId,
				label: aras.getResource(
					'',
					'item_info_table.' +
						(propertyId !== 'locked_by_id' ? propertyId : 'claimed_by_id') +
						'_txt'
				)
			};
		}),
		showHeader: true,
		showThumbnails: true
	};
}

inherit(InBasketTaskGrid, BaseItemTypeGrid);

InBasketTaskGrid.prototype.getContextMenuEventState = function InBasketTaskGridEventState(
	rowId,
	col
) {
	return aras.evalMethod('cui_reinit_inbasket_calc_states', '');
};

InBasketTaskGrid.prototype.openCompletionDialog = function InBasketTaskGridOpenCompletionDialog(
	itemId,
	itemTypeName
) {
	//purpose: to delay modal dialog opening when the dialog has controls.
	var showModalDialog = function (
		url,
		paramsObj,
		windowOptions,
		doRepopulateAfterDialog
	) {
		paramsObj.content = url;
		paramsObj.isPopup = true;
		var dialog = window.parent.ArasModules.Dialog.show(
			'iframe',
			Object.assign({}, paramsObj, windowOptions)
		);
		dialog.promise.then(function (data) {
			if (data && data.updated) {
				const itemsGridArray = topWnd.mainLayout.tabsContainer.getSearchGridTabs(
					itemTypeID
				);
				itemsGridArray.forEach(function (itemsGrid) {
					itemsGrid.doSearch();
				});
			}
		});
	};

	function getItemFromServer(amlQuery) {
		var tmpRes = arasObj.soapSend('ApplyItem', amlQuery);
		if (tmpRes.getFaultCode() !== 0) {
			arasObj.AlertError(tmpRes);
			return null;
		}
		return tmpRes.getResult().selectSingleNode('Item');
	}

	var item = new Item(itemTypeName, 'get');
	item.setID(itemId);
	item = item.apply();
	var itemNd = item.node;
	var lockedById = arasObj.getItemProperty(itemNd, 'locked_by_id');
	var wndOptions;
	var params;

	if (lockedById !== '' && lockedById !== userID) {
		return arasObj.getResource(
			null,
			'itemsgrid.unable_complete_task_claimed_by_someone_else'
		);
	}

	if (itemNd.getAttribute('type') === 'Workflow Task') {
		params = {
			aras: arasObj,
			activity: getItemFromServer(
				"<Item type='Activity' action='get'>" +
					'<Relationships>' +
					"<Item type='Activity Assignment' action='get'><id>" +
					itemNd.getAttribute('id') +
					'</id></Item>' +
					"<Item type='Activity Task' action='get'/>" +
					"<Item type='Activity Variable' action='get'/>" +
					"<Item type='Workflow Process Path' action='get'/>" +
					'</Relationships>' +
					'</Item>'
			),
			wflName: arasObj.getItemPropertyAttribute(
				itemNd,
				'container',
				'keyed_name'
			),
			wflId: arasObj.getItemProperty(itemNd, 'container'),
			assignmentId: itemNd.getAttribute('id'),
			itemId: arasObj.getItemProperty(itemNd, 'item')
		};
		wndOptions = { dialogHeight: 550, dialogWidth: 700 };

		showModalDialog('InBasket/InBasket-VoteDialog.aspx', params, wndOptions);
	} else if (itemNd.getAttribute('type') === 'Project Task') {
		var acwFormNd = arasObj.getFormForDisplay(
			'Activity Completion Worksheet',
			'by-name',
			false
		);
		var formWidth;
		var formHeight;
		if (acwFormNd && acwFormNd.node) {
			formWidth = parseInt(aras.getItemProperty(acwFormNd.node, 'width'));
			formHeight = parseInt(aras.getItemProperty(acwFormNd.node, 'height'));
		}
		var tmpRes = getItemFromServer(
			"<Item type='Activity2' action='get' select='id'>" +
				'<OR>' +
				'<id>' +
				itemNd.getAttribute('id') +
				'</id>' +
				"<id condition='in'>SELECT source_id FROM Activity2_Assignment WHERE id='" +
				itemNd.getAttribute('id') +
				"'</id>" +
				'</OR>' +
				'</Item>'
		);
		if (tmpRes) {
			wndOptions = { dialogWidth: formWidth || 700, dialogHeight: 800 };

			window.focus();
			showModalDialog(
				'../Solutions/Project/scripts/ActivityCompletionWorksheet/ACWDialog.html',
				[window, tmpRes.getAttribute('id')],
				wndOptions
			);
		}
	} else if (itemNd.getAttribute('type') === 'FMEA Task') {
		var fmeaAction = getItemFromServer(
			"<Item type='FMEA Action' action='get' select='milestone_comment,milestone_name," +
				"milestone_due_date' id='" +
				itemNd.getAttribute('id') +
				"'></Item>"
		);
		params = {
			aras: arasObj,
			itemId: itemNd.getAttribute('id'),
			itemName: arasObj.getItemProperty(fmeaAction, 'milestone_name'),
			itemComments: arasObj.getItemProperty(fmeaAction, 'milestone_comment'),
			itemParent: arasObj.getItemPropertyAttribute(
				itemNd,
				'container',
				'keyed_name'
			),
			itemParentId: arasObj.getItemProperty(itemNd, 'container'),
			itemParentType: arasObj.getItemPropertyAttribute(
				itemNd,
				'container',
				'type'
			),
			itemDueDate: arasObj.getItemProperty(fmeaAction, 'milestone_due_date'),
			part_number: arasObj.getItemPropertyAttribute(
				itemNd,
				'item',
				'keyed_name'
			),
			lockedById: arasObj.getItemProperty(itemNd, 'locked_by_id')
		};
		wndOptions =
			params.itemParentType === 'Process Planner'
				? { dialogHeight: 695, dialogWidth: 700 }
				: { dialogHeight: 510, dialogWidth: 700 };
		showModalDialog(
			arasObj.getScriptsURL() +
				'../Solutions/QP/scripts/MyTasksCompletionDialog.html',
			params,
			wndOptions,
			true
		);
	} else {
		var formTypeCompleteValue = 'complete';
		var formId = arasObj.uiGetFormID4ItemEx(itemNd, formTypeCompleteValue);

		if (!formId) {
			arasObj.AlertError(
				arasObj.getResource(
					'',
					'ui_methods_ex.form_not_specified_for_you',
					formTypeCompleteValue
				)
			);
			return null;
		}

		var formNd = arasObj.getFormForDisplay(formId);

		formNd = formNd ? formNd.node : null;

		var param = {
			aras: arasObj,
			title: arasObj.getResource('', 'itemsgrid.completion_dialog'),
			item: item,
			formId: formId
		};

		var width = aras.getItemProperty(formNd, 'width') || 400;
		var height = aras.getItemProperty(formNd, 'height') || 300;
		showModalDialog('ShowFormAsADialog.html', param, {
			dialogHeight: height,
			dialogWidth: width
		});
	}
};

InBasketTaskGrid.prototype.onEditCommand = function InBasketTaskGridOnEditCommand(
	itemId
) {
	return !this.showError(this.openCompletionDialog(itemId, itemTypeName));
};

InBasketTaskGrid.prototype.onDoubleClick = function InBasketTaskGridOnDoubleClick(
	itemId
) {
	return !this.showError(this.openCompletionDialog(itemId, itemTypeName));
};

InBasketTaskGrid.prototype.onLink = function InBasketTaskGridOnLink(
	typeName,
	id
) {
	switch (typeName) {
		case 'Workflow Process':
			var item = arasObj.getItemById(typeName, id, 0);
			var params = {};
			params.aras = arasObj;
			params.processID = id;
			params.processName = arasObj.getItemProperty(item, 'name');
			params.dialogWidth = 850;
			params.dialogHeight = 470;
			params.content = 'WorkflowProcess/WflProcessViewer.aspx';

			var win = arasObj.getMostTopWindowWithAras(window);
			win.ArasModules.MaximazableDialog.show('iframe', params);
			break;
		case 'InBasket Task':
			this.showError(this.openComplitionDialog(id, typeName));
			break;
		default:
			InBasketTaskGrid.superclass.onLink(typeName, id);
	}
};

window[
	'onAction:1020CBF7E25E4479A260FA5AF4E4A378:9DC36DF7F0234A3E8CFFE2A20AB78CCECommand'
] = function () {
	var itemId = grid.getSelectedId();
	var item = new Item(itemTypeName, 'get');
	item.setAttribute('select', 'config_id, container');
	item.setID(itemId);
	item = item.apply();

	var idActivity = item.getProperty('config_id');
	var projectId = item.getProperty('container');

	var projectNumber;
	var wbsId;
	var wbs;

	var project = aras.getItem(
		'Project',
		"@id='" + projectId + "'",
		'<id>' + projectId + '</id>'
	);
	if (project) {
		wbsId = aras.getItemProperty(project, 'wbs_id');
		projectNumber = aras.getItemProperty(project, 'project_number');
	}

	eval(
		aras.getFileText(
			aras.getBaseURL() + '/Solutions/Project/javascript/gantt_methods.js'
		)
	);
	eval(
		aras.getFileText(
			aras.getBaseURL() + '/Solutions/Project/javascript/scheduling_methods.js'
		)
	);

	function showGanttChart(wbsId, projectNumber) {
		wbs = getWBS(wbsId);
		initActNums();
		sortItems(wbs.documentElement);
		showGanttInternal(wbs, projectNumber);
	}

	function getWBS(wbsId) {
		var xml = aras.createXMLDocument();
		var query = aras.createXMLDocument();

		query.load(
			aras.getI18NXMLResource(
				'query.xml',
				aras.getScriptsURL() + '../Solutions/Project/'
			)
		);
		query.selectSingleNode('//*[@repeatTimes]').setAttribute('repeatTimes', -1);
		query.documentElement.setAttribute('id', wbsId);
		var result = aras.applyItem(query.documentElement.xml);

		xml.loadXML(result);
		return xml;
	}

	showGanttChart(wbsId, projectNumber);
};
