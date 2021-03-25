var item = window.opener[paramObjectName].item;
var itemID = window.opener[paramObjectName].itemID;
var itemTypeName = window.opener[paramObjectName].itemTypeName;
var itemType = window.opener[paramObjectName].itemType;
var viewMode = window.opener[paramObjectName].viewMode;
var isEditMode = window.opener[paramObjectName].isEditMode;
var isTearOff = window.opener[paramObjectName].isTearOff;
var isNew = window.opener[paramObjectName].isNew;
var itemTypeLabel = window.opener[paramObjectName].itemTypeLabel;

require(['dojo/dom-construct', 'dojo/ready'], function (domConstruct, ready) {
	ready(function () {
		aras.uiRegWindowEx(aras.SsrEditorWindowId, window);

		// hide tearoff menu & toolbar
		document.getElementById('top').style.display = 'none';
		document.getElementById('BorderContainer').style.height =
			'calc(100% - 21px)';
		window.isMenuHidden = true;

		function needReportToSave() {
			// get SelfServiceReporting Designer frame window
			const reportFrame = document.getElementById('SSRReportDesigner')
				.contentWindow;
			return (
				(isNew ||
					(reportFrame &&
						reportFrame.djUiSqlBridge &&
						!reportFrame.djUiSqlBridge.allowDiscardChanges &&
						reportFrame.djUiSqlBridge.isDirty())) &&
				!window['logout_confirmed']
			);
		}

		if (window.frameElement) {
			const oldClose = window.close;
			window.close = function (callback) {
				if (callback && needReportToSave()) {
					callback(
						window.confirm(
							aras.getResource(
								'../Modules/aras.innovator.Izenda',
								'reportdesigner.onclosewarning'
							)
						)
					);
				} else {
					oldClose(callback);
				}
			};
		} else {
			window.onbeforeunload = function () {
				if (needReportToSave()) {
					return aras.getResource(
						'../Modules/aras.innovator.Izenda',
						'reportdesigner.onclosewarning'
					);
				}
			};
		}
		window.showMultipleReportsError = function (itemId) {
			const name = aras.getItemProperty(window.item, 'name') || '';
			window.opener.aras.AlertError(
				aras
					.getResource('', 'ui_methods_ex.create_only_one_report_at_a_time')
					.replace('{0}', name || window.itemID)
			);
			return false;
		};
		const i18nSessionContext = aras.IomInnovator.getI18NSessionContext();
		const row = domConstruct.toDom(
			'<iframe id="SSRReportDesigner" src="' +
				adhocReportingBaseUrl +
				'/ReportDesigner.aspx?_random=' +
				Date.now() +
				'&' +
				(isNew ? 'clear=1&tab=Data+Sources' : 'rn=' + itemID) +
				'&access_token=' +
				aras.OAuthClient.getToken() +
				'&ITEMID=' +
				encodeURIComponent(itemID) +
				'&LOCALE=' +
				i18nSessionContext.getLocale() +
				'&TIMEZONE_NAME=' +
				i18nSessionContext.getTimeZone() +
				(isNew
					? '&ITEMTYPEMODE=' +
					  (adhocReportingDebug ? 'itm_all' : 'itm_featured')
					: '') +
				'&CLIENTURL=' +
				encodeURIComponent(
					location.href.substring(
						0,
						location.href.toLowerCase().indexOf('/modules/')
					)
				) +
				'" scrolling="yes" frameborder="0" style="width: 100%;"></iframe>' // necessary to reload on item type mode switch
		);
		domConstruct.place(row, 'innReportDesignerContainer');
	});
});
