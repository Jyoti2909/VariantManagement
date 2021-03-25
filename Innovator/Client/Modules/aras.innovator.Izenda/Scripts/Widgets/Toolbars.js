require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!Izenda/Views/Widgets/DesignerToolbar.html',
	'Aras/Client/Controls/Public/ToolBar',
	'dojo/NodeList-traverse',
	'dijit/layout/BorderContainer'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template
) {
	var aras = Izenda.Utils.getAras();

	var toolbarMethods = {
		editReport: function (reportId, callback) {
			var existingWnd = aras.uiFindAndSetFocusWindowEx(aras.SsrEditorWindowId);
			if (existingWnd) {
				return existingWnd.showMultipleReportsError(reportId);
			}

			var itemNode = aras.getItemById(
				'SelfServiceReport',
				reportId,
				0,
				'',
				'locked_by_id'
			);
			var reload = false;
			var lockedById = aras.getItemProperty(itemNode, 'locked_by_id');

			itemNode.setAttribute('use_custom_form', 1);

			if (!lockedById) {
				reload = aras.lockItemEx(itemNode); // discard result because view mode should be supported
			}

			if (reload || (lockedById && lockedById == aras.getUserID())) {
				// reload after successful locking
				var mainWnd = aras.getMainWindow();
				// IE: script falls if setTimeout callback defined here as function() { ... }
				mainWnd.setTimeout(
					"var itemNode = aras.getItemById('SelfServiceReport', " +
						JSON.stringify('' + reportId) +
						'); ' +
						"itemNode.setAttribute('use_custom_form', 1); " +
						"aras.uiShowItemEx(itemNode, 'tab view')",
					0
				);
				window.close();
			} else {
				if (callback) {
					callback();
				}
			}
		},

		createNewReport: function () {
			aras.uiNewItemEx('SelfServiceReport');
			window.close();
		},

		deleteReport: function (selectedId, report, callback) {
			var reportName = '';
			if (!report) {
				report = aras.getItemById('SelfServiceReport', selectedId);
				reportName = aras.getItemProperty(report, 'keyed_name');
			} else {
				reportName = report.getProperty('name');
			}

			if (
				aras.confirm(
					Izenda.Utils.GetResource(
						'myreports.context_menu.delete_report_confirmation'
					).Format(reportName),
					window
				) !== true
			) {
				return false;
			}

			var deleteItem = Izenda.Utils.getAras().newIOMItem(
				'SelfServiceReport',
				'delete'
			);
			deleteItem.setID(selectedId);
			deleteItem = deleteItem.apply();
			if (deleteItem.isError()) {
				return false;
			} else {
				if (callback) {
					callback();
				}
				return true;
			}
		},

		saveAsReport: function (aras, reportToCopyId) {
			var copiedItem = aras.copyItem('SelfServiceReport', reportToCopyId);

			var itemNode = aras.getItemById(
				'SelfServiceReport',
				copiedItem.getAttribute('id'),
				0
			);
			var notLocked;
			notLocked =
				!aras.isTempEx(itemNode) &&
				aras.getItemProperty(itemNode, 'locked_by_id') === '';
			if (notLocked) {
				if (!aras.lockItemEx(itemNode)) {
					return false;
				}
				itemNode = aras.getItemById(
					'SelfServiceReport',
					copiedItem.getAttribute('id'),
					0
				);
			}
			aras.uiShowItemEx(itemNode, 'tab view');
		}
	};
	dojo.setObject('Izenda.ToolbarMethods', toolbarMethods);

	var toolbar = declare(
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			templateString: template,

			constructor: function (args) {
				this.args = args;
			},

			handleExport: function (type) {
				responseServer.OpenUrlWithModalDialogNewCustomRsUrl(
					'rs.aspx?' +
					'itemid=' +
					document.querySelector("input[name='ITEMID']").value + // itemId param can be removed because itemid/account map is not actual
						'&access_token=' +
						aras.OAuthClient.getToken() +
						'&CLIENTURL=' +
						encodeURIComponent(Izenda.Utils.clientUrl) +
						'&output=' +
						type,
					'aspnetForm',
					'reportFrame',
					responseServer.ResponseServerUrl
				);
			},

			onToolbarItemClick: function (tItem) {
				var callbacksDictionary = this.getToolbarCallbacks(
					this.args.djUiSqlBridge
				);
				var tItemId = tItem.GetId();
				callbacksDictionary[tItemId]();
				return true;
			},

			onToolbarItemChange: function (tItem) {
				var tItemId = tItem.GetId();
				if (tItemId === 'results') {
					this.changeIzResults(tItem.getSelectedItem());
				}
				return true;
			},

			init: function () {
				this.arasToolbar = new Aras.Client.Controls.Public.Toolbar({
					id: 'designerToolbar',
					connectId: 'designerToolbar'
				});
				clientControlsFactory.on(this.arasToolbar, {
					onClick: this.onToolbarItemClick.bind(this),
					onChange: this.onToolbarItemChange.bind(this)
				});

				var toolbarXml = aras.getI18NXMLResource(
					'report_designer_toolbar.xml',
					aras.getScriptsURL() + '../Modules/aras.innovator.Izenda/'
				);
				this.arasToolbar.loadXml(toolbarXml);
				this.arasToolbar.show();

				if (
					!aras.getItemProperty(window.parent.item, 'locked_by_id') &&
					!aras.isTempEx(window.parent.item)
				) {
					var reportId = aras.getItemProperty(window.parent.item, 'id');
					aras.lockItem(reportId, 'SelfServiceReport');
				}

				//sync results controls count
				var results = this.arasToolbar.getElement('results');
				if (results) {
					var izResults = document.getElementById(
						'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_ddlTopCount'
					);
					var izResultsValue = izResults.value;
					results.SetSelected(izResultsValue);
				}
			},

			refreshToolbar: function (hideButtons, disableButtons) {
				for (var i = 0; i < hideButtons.length; i++) {
					this.arasToolbar.hideItem(hideButtons[i]);
				}

				for (var j = 0; j < disableButtons.length; j++) {
					var btnObj = disableButtons[j];
					var button = this.arasToolbar.getElement(btnObj.id);
					if (button) {
						button.SetEnabled(btnObj.isEnabled);
					}
				}
			},

			changeIzResults: function (value) {
				var izResults = document.getElementById(
					'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_ddlTopCount'
				);
				if (izResults.value !== value) {
					izResults.value = value;
					izResults.onchange();
				}
			}
		}
	);
	dojo.setObject('Izenda.UI.Widgets.Toolbar', toolbar);

	function saveReport(djUiSqlBridge, callback) {
		function fixReportName() {
			var reportNameElement = document.getElementById('_SavedReportName');
			var repName = reportNameElement.value;

			if (repName.trim().length === 0) {
				repName = '';
			}

			var _itemID = window.parent.itemID;
			if (repName.toUpperCase().indexOf(_itemID) < 0) {
				repName = format('{0} ({1})', repName, _itemID);
			}
			reportNameElement.value = repName;
		}

		if (djUiSqlBridge.allowNullsDirty) {
			djUiSqlBridge.applyJoins();
		}

		var validationMessage = djUiSqlBridge.validateReport();
		if (validationMessage) {
			arasObj.AlertError(validationMessage);
			return;
		}
		fixReportName();

		var ssrItem = window.parent.item;
		arasObj.setItemProperty(ssrItem, 'name', djUiSqlBridge.getReportName());

		function RemoveNodeThatUpdatedOnServer(nodeName) {
			var node = ssrItem.selectSingleNode(nodeName);
			if (node) {
				ssrItem.removeChild(node); // can be already updated on server, so do not send
			}
		}

		RemoveNodeThatUpdatedOnServer('thumbnail');
		//definition is updated on server side.
		RemoveNodeThatUpdatedOnServer('definition');

		if (!isEditUrl()) {
			arasObj.setItemProperty(
				ssrItem,
				'base_item_type',
				djUiSqlBridge.getBaseItemTypeId()
			);
			arasObj.setItemProperty(
				ssrItem,
				'owned_by_id',
				arasObj.getIsAliasIdentityIDForLoggedUser()
			);
		}
		arasObj.setItemProperty(
			ssrItem,
			'extension',
			djUiSqlBridge.getReportExtension()
		);

		window.parent.onSaveCommand().then(function () {
			window.parent.isNew = false;

			// before Izenda save call to skip window onUnLoad warning
			djUiSqlBridge.typesDirty = false;
			djUiSqlBridge.propsDirty = false;
			djUiSqlBridge.dirty = false;

			document.getElementById('forceSaveChangedReport').value = 'yes';

			theForm.__EVENTTARGET.value =
				'ctl00$PlaceHolder$Adhocreportdesigner1$ctl01$SaveButton_TitleAnchor';
			theForm.__EVENTARGUMENT.value = '';

			window['EBC_RenameControls']();
			try {
				Izenda.Utils.submitFormByAjax('aspnetForm', callback);
			} finally {
				//undo renaming form fileds
				window['EBC_RenameControls'](true);
			}
		});
	}

	var designerToolbar;
	declare('Izenda.UI.Widgets.DesignerToolbar', toolbar, {
		saveAndReportsEnabled: false,

		init: function () {
			designerToolbar = this;
			this.inherited(arguments);
			DisableEnableToolbar = Izenda.Utils.extendMethodWithFuncs(
				DisableEnableToolbar,
				null,
				function () {
					this.toggleSaveAndExports(arguments[1]);
				}.bind(this)
			);

			if (this.args.isEdit) {
				//this.enableEmailButton(); will be implemented in S11-0-SP4
				this.enableUnlockAndCloseWithDelete();
				this.toggleSaveAndExports(true);
			}
		},

		getToolbarCallbacks: function (djUiSqlBridge) {
			return {
				new_report: function () {
					if (window.parent.itemTypeName) {
						aras.uiNewItemEx(window.parent.itemTypeName);
					}
				},
				save_report: function () {
					saveReport(djUiSqlBridge, function () {
						designerToolbar.enableUnlockAndCloseWithDelete();
						djUiSqlBridge.cleanDirty();
					});
				},
				save_as_report: function () {
					// enabled only if changes were saved
					var _aras = window.parent.opener.aras;
					window.parent.close();
					Izenda.ToolbarMethods.saveAsReport(_aras, window.parent.itemID);
				},
				print_report: responseServer.OpenUrl.bind(
					this,
					'rs.aspx?access_token=' +
						aras.OAuthClient.getToken() +
						'&CLIENTURL=' +
						encodeURIComponent(Izenda.Utils.clientUrl) +
						'&p=htmlreport&print=1',
					'aspnetForm',
					''
				),
				export_pdf: this.handleExport.bind(this, 'PDF'),
				export_excel: this.handleExport.bind(this, 'XLS(MIME)'),
				export_word: this.handleExport.bind(this, 'DOC'),
				export_csv: this.handleExport.bind(this, 'CSV'),
				export_xml: this.handleExport.bind(this, 'XML'),
				export_sql: this.handleExport.bind(this, 'SQL'),
				export_aml: function () {
					var expimp = new Aras.Client.Izenda.ExpImpSSReport({
						id: 'eissr',
						arasObj: Izenda.Utils.getAras(),
						parentNode: reportDesignerContainerId()
					});
					expimp.exportReports(
						"'" + document.querySelector("input[name='ITEMID']").value + "'"
					);
				},
				//'email': function () {}, will be implemented in S11-0-SP4
				help: function () {
					var displayStyle;
					var nodes = document.querySelectorAll("td[adhochelpcontrol='true']");
					var node = document.getElementById('item_types_help');
					node.innerHTML = nodes[0].innerHTML;
					for (var i = 0; i < nodes.length; ++i) {
						displayStyle = nodes[i].style.display.toLowerCase();
						nodes[i].style.display =
							!displayStyle || displayStyle == 'none' ? 'inline-block' : 'none';
					}
					displayStyle = node.style.display.toLowerCase();
					node.style.display =
						!displayStyle || displayStyle == 'none' ? 'inline-block' : 'none';
				},
				unlock_close: function () {
					if (djUiSqlBridge.isDirty()) {
						var itemNode = window.parent.item;
						var params = {
							aras: aras,
							message: aras.getResource(
								'',
								'item_methods_ex.changes_not_saved',
								window.parent.itemTypeName,
								aras.getKeyedNameEx(itemNode)
							),
							buttons: {
								btnDiscard: aras.getResource('', 'common.discard'),
								btnSaveAndUnlock: aras.getResource(
									'',
									'item_methods_ex.save_first'
								),
								btnCancel: aras.getResource('', 'common.cancel')
							},
							defaultButton: 'btnCancel',
							dialogWidth: 400,
							dialogHeight: 200,
							center: true
						};

						params.content = 'groupChgsDialog.html';
						aras
							.uiFindWindowEx2(itemNode)
							.ArasModules.Dialog.show('iframe', params)
							.promise.then(function (returnedValue) {
								if (returnedValue === 'btnCancel') {
									return;
								} else {
									if (returnedValue === 'btnSaveAndUnlock') {
										saveReport(djUiSqlBridge, function () {
											window.parent.onUnlockCommand();
											window.parent.onbeforeunload = null;
											window.parent.close();
										});
									} else {
										defaultActions();
									}
								}
							});
					} else {
						defaultActions();
					}

					function defaultActions() {
						window.parent.onUnlockCommand();
						djUiSqlBridge.allowDiscardChanges = true;
						window.parent.onbeforeunload = null;
						window.parent.close();
					}
				},
				save_unlock_close: function () {
					saveReport(djUiSqlBridge, function () {
						window.parent.onUnlockCommand();
						window.parent.onbeforeunload = null;
						window.parent.close();
					});
				}
			};
		},

		toggleSaveAndExports: function (isEnabled) {
			if (this.saveAndReportsEnabled == isEnabled) {
				return;
			}
			this.refreshToolbar(
				[],
				[
					{
						id: 'save_report',
						isEnabled: isEnabled
					},
					{
						id: 'print_report',
						isEnabled: isEnabled
					},
					{
						id: 'export_pdf',
						isEnabled: isEnabled
					},
					{
						id: 'export_excel',
						isEnabled: isEnabled
					},
					{
						id: 'export_word',
						isEnabled: isEnabled
					},
					{
						id: 'export_csv',
						isEnabled: isEnabled
					},
					{
						id: 'export_xml',
						isEnabled: isEnabled
					},
					{
						id: 'export_sql',
						isEnabled: isEnabled && aras.isAdminUser()
					},
					//{ id: 'export_aml', isEnabled: isEnabled }, will be imlemented in S11-0-SP4
					{
						id: 'results',
						isEnabled: isEnabled
					},
					{
						id: 'save_unlock_close',
						isEnabled: isEnabled
					}
				]
			);
			this.saveAndReportsEnabled = isEnabled;
		},

		enableEmailButton: function () {
			this.refreshToolbar(
				[],
				[
					{
						id: 'email',
						isEnabled: true
					}
				]
			);
		},

		enableSaveAsButton: function () {
			this.refreshToolbar(
				[],
				[
					{
						id: 'save_as_report',
						isEnabled: arguments.length > 0 ? arguments[0] : true
					}
				]
			);
		},

		enableUnlockAndCloseWithDelete: function () {
			this.refreshToolbar(
				[],
				[
					{
						id: 'unlock_close',
						isEnabled: true
					}
				]
			);
		}
	});
});
