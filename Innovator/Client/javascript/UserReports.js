var userReportsCache = { itemTypeId: '', reports: null };
function getItemTypeUserReports(itemTypeId, reloadCache) {
	if (reloadCache) {
		resetUserReportsCache();
	}
	if (userReportsCache.itemTypeId == itemTypeId) {
		return userReportsCache.reports;
	}
	var userReports = aras.newIOMItem('Method', 'GetSelfServiceReports');
	userReports.setProperty('base_item_type', itemTypeId);
	userReportsCache = { itemTypeId: itemTypeId, reports: userReports.apply() };
	return userReportsCache.reports;
}

function resetUserReportsCache() {
	userReportsCache = { itemTypeId: '', reports: null };
}

function runUserReport(aras, cmdID, instances) {
	///<param name="instances">string like &quot;'item_id1','item_id2'&quot;</param>
	var arr = cmdID.split(':');
	var selectedId = arr[1];
	var report = aras.getItemFromServer('SelfServiceReport', arr[1]);
	if (!report) {
		return;
	}
	runUserReportCommon(selectedId, report, aras, instances);
}

function runUserReportCommon(selectedId, report, aras, instances) {
	///<param name="instances">string like &quot;'item_id1','item_id2'&quot;</param>
	var isreportSetValid = aras.newIOMItem('Method', 'IsOldReportSet');
	isreportSetValid.setID(report.getID());
	isreportSetValid = isreportSetValid.apply();

	if (isreportSetValid.isError()) {
		aras.AlertError(isreportSetValid.getErrorString());
		return;
	}

	if (isreportSetValid.getResult() == '0') {
		aras.AlertWarning(
			aras.getResource(
				'../Modules/aras.innovator.Izenda/',
				'servicereporting.report_definitions_inconsistencies'
			)
		);
		return;
	}

	var win = aras.uiFindAndSetFocusWindowEx(selectedId);
	if (win) {
		return;
	}

	if (hasExcludedProperties(report, aras)) {
		aras.AlertWarning(
			aras.getResource(
				'../Modules/aras.innovator.Izenda/',
				'servicereporting.report_contains_restricted_data'
			)
		);
		return;
	}

	var i18nSessionContext = aras.IomInnovator.getI18NSessionContext();
	var url = aras.getUserReportServiceBaseUrl() + '/ReportViewer.aspx?';
	var params =
		'rn=' +
		encodeURIComponent(selectedId) +
		'&itemid=' +
		encodeURIComponent(selectedId) +
		'&access_token=' +
		aras.OAuthClient.getToken() +
		'&LOCALE=' +
		encodeURIComponent(i18nSessionContext.getLocale()) +
		'&TIMEZONE_NAME=' +
		encodeURIComponent(i18nSessionContext.getTimeZone()) +
		'&ITEMTYPEMODE=itm_all' +
		'&CLIENTURL=' +
		encodeURIComponent(aras.getBaseURL());
	var fullUrl = url + params;

	// REsets context_item_ids in (report item id + authinfo)/params map
	var xmlHttp = new XMLHttpRequest();
	var mapUrl = aras.getUserReportServiceBaseUrl() + '/rs2.aspx';
	xmlHttp.onreadystatechange = function (xhr) {
		if (xmlHttp.readyState == 4) {
			if (xmlHttp.status == 200) {
				win = aras.targetReport(report.node, 'service', fullUrl, '', true);
				win.getItem = function () {
					return report.node;
				};
				setTimeout(function () {
					aras.uiRegWindowEx(selectedId, win);
				}, 0);
			} else {
				aras.AlertError(
					aras
						.getResource('', 'common.web_request_error')
						.replace('{0}', xmlHttp.status)
						.replace('{1}', mapUrl)
						.replace('{2}', xmlHttp.statusText)
				);
				return;
			}
		}
	};
	xmlHttp.open(
		'POST',
		mapUrl +
			'?op=MAP_CONTEXT_ITEM_IDS&_random=' +
			aras.GUIDManager.GetGUID() +
			'&' +
			params,
		false
	);
	if (fullUrl.length > 2000) {
		xmlHttp.setRequestHeader(
			'Content-type',
			'application/x-www-form-urlencoded'
		);
		xmlHttp.setRequestHeader('Content-length', instances.length);
	}
	i18nSessionContext = aras.IomInnovator.getI18NSessionContext();
	xmlHttp.setRequestHeader('LOCALE', i18nSessionContext.getLocale());
	xmlHttp.setRequestHeader('TIMEZONE_NAME', i18nSessionContext.getTimeZone());
	xmlHttp.send(instances);

	var runReportByUser = aras.newIOMItem('Method', 'AddOrEditRunReportByUser');
	runReportByUser.setID(selectedId);
	runReportByUser = runReportByUser.apply();
	if (runReportByUser.isError()) {
		aras.AlertError(runReportByUser.getErrorString());
	}
}

function hasExcludedProperties(report, aras) {
	var reportSet = report.getProperty('definition');
	if (reportSet) {
		var rsXml = aras.createXMLDocument();
		rsXml.loadXML(reportSet);
		var reportXml = rsXml.selectSingleNode('//Report');
		if (reportXml) {
			var selection = reportXml.selectSingleNode('//Selections');
			if (selection) {
				var selections = selection.selectNodes('//Selection');
				if (selections.length) {
					var request = aras.newIOMItem(
						'Method',
						'IsReportContainsExcludedProps'
					);
					for (var i = 0; i < selections.length; i++) {
						var rel = aras.newIOMItem('ItemType');
						rel.setProperty(
							'db_name',
							selections[i].getAttribute('ColumnName')
						);
						request.addRelationship(rel);
					}

					request = request.apply();
					var isReportContainsExcludedProps = request.getResult();
					if (isReportContainsExcludedProps == 'true') {
						return true;
					}
				}
			}
		}
	}

	return false;
}
