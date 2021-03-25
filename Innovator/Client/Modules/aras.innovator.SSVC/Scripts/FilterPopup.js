define([
	'dojo/_base/declare',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!SSVC/Views/FilterPopup.html',
	'SSVC/Scripts/Utils'
], function (declare, on, _WidgetBase, _TemplatedMixin, template, ssvcUtils) {
	function FilterPopupLogic(filterPopupWidgetPar) {
		const fpWidget = filterPopupWidgetPar;
		let cmbMessageType;
		let cmbTimeFrame;
		let cmbDateUnits;
		let cmbSourceType;
		let filteringMessage = [];

		this.onChangeTimeFrame = function () {
			const value = this.options[this.selectedIndex].value;
			fpWidget.TimeframeLastNode.style.display = value === 'last' ? '' : 'none';
			fpWidget.TimeframeRangeNode.style.display =
				value === 'range' ? '' : 'none';
		};

		this.onClickCalendarShow = function () {
			let widget = null;
			if (this.id === 'btnDStartCalendarShow') {
				widget = fpWidget.edtDateStartNode;
			} else if (this.id === 'btnDFinishCalendarShow') {
				widget = fpWidget.edtDateFinishNode;
			}

			const param = {
				date: widget.value,
				aras: aras,
				format: aras.getDotNetDatePattern('short_date'),
				type: 'Date'
			};
			const wndRect = aras.uiGetElementCoordinates(widget);
			const dialog = window.parent.ArasModules.Dialog.show('iframe', param);
			dialog.move(
				wndRect.left - wndRect.screenLeft,
				wndRect.top - wndRect.screenTop
			);
			dialog.promise.then(function (newDate) {
				widget.value = newDate || '';
			});
		};

		this.Load = function () {
			function setupSelect(listName, id) {
				const select = fpWidget[id];
				ssvcUtils.fillListByName(listName, select);
				return select;
			}
			cmbMessageType = setupSelect('VC_MessageFilterType', 'cmbMessageType');
			cmbSourceType = setupSelect('VC_SourceFilterType', 'cmbSourceType');
			cmbTimeFrame = setupSelect('VC_TimeframeFilterType', 'cmbTimeFrame');
			cmbDateUnits = setupSelect('VC_RangeSelector', 'cmbDateUnits');

			cmbTimeFrame.addEventListener('change', this.onChangeTimeFrame);
			fpWidget.btnDStartCalendarShowNode.addEventListener(
				'click',
				this.onClickCalendarShow
			);
			fpWidget.btnDFinishCalendarShowNode.addEventListener(
				'click',
				this.onClickCalendarShow
			);
		};

		this.sourceSelectState = function (isEnabled) {
			const cmbSourceType = fpWidget.cmbSourceType;
			if (cmbSourceType) {
				cmbSourceType.disabled = !isEnabled;
			}
		};

		this.validate = function () {
			const validationErrors = [];

			if (fpWidget.TimeframeLastNode.style.display != 'none') {
				if (!isPositiveInteger(fpWidget.edtDateCountNode.value)) {
					validationErrors.push(
						ssvcUtils.GetResource('fp_incorrect_x_times') +
							' ' +
							cmbDateUnits.options[cmbDateUnits.selectedIndex].value
					);
				}
			}

			if (fpWidget.TimeframeRangeNode.style.display != 'none') {
				if (fpWidget.edtDateStartNode.value.trim() === '') {
					validationErrors.push(ssvcUtils.GetResource('fp_val_no_start_date'));
				}
				if (fpWidget.edtDateFinishNode.value.trim() === '') {
					validationErrors.push(ssvcUtils.GetResource('fp_val_no_finish_date'));
				}
			}

			if (validationErrors.length) {
				aras.AlertError(validationErrors.join('\r\n'));
				return false;
			}
			return true;
		};

		this.composeFilter = function (context) {
			const filterItem = { '@attrs': { type: 'SecureMessage', action: 'get' } };
			filteringMessage = [];
			/*+++criteria values+++*/
			const type = cmbMessageType.options[cmbMessageType.selectedIndex].value;
			const typeLabel =
				cmbMessageType.options[cmbMessageType.selectedIndex].innerHTML;
			const source = cmbSourceType.options[cmbSourceType.selectedIndex].value;
			const sourceLabel =
				cmbSourceType.options[cmbSourceType.selectedIndex].innerHTML;
			const from = fpWidget.edtFromUserNameNode.value;
			const revision = fpWidget.edtRevisionNode.value;
			const state = fpWidget.edtStateNode.value;
			/*---criteria values---*/

			if (type !== 'all') {
				if (type === 'neHistory') {
					filterItem.classification = {
						'@attrs': {
							condition: 'ne'
						},
						'@value': 'History'
					};
				} else {
					filterItem.classification = type;
				}
				filteringMessage.push(typeLabel);
			}

			if (context && source !== 'all') {
				const configId = context.getProperty('config_id');
				filterItem['item_config_id'] = configId;
				filteringMessage.push(sourceLabel);
			}

			if (from) {
				filterItem['created_by_id'] = {
					Item: {
						'@attrs': {
							type: 'User'
						},
						keyed_name: {
							'@attrs': {
								condition: 'like'
							},
							'@value': '%' + from + '%'
						}
					}
				};
				filteringMessage.push(
					ssvcUtils.GetResource('fp_from').toLowerCase() + ' "' + from + '"'
				);
			}
			if (revision) {
				filterItem['item_major_rev'] = revision;
				filteringMessage.push(
					ssvcUtils.GetResource('fp_revision').toLowerCase() +
						' "' +
						revision +
						'"'
				);
			}
			if (state) {
				filterItem['item_state'] = state;
				filteringMessage.push(
					ssvcUtils.GetResource('fp_state').toLowerCase() + ' "' + state + '"'
				);
			}
			switch (cmbTimeFrame.options[cmbTimeFrame.selectedIndex].value) {
				case 'last':
					var units = cmbDateUnits.options[cmbDateUnits.selectedIndex].value;
					var value = fpWidget.edtDateCountNode.value;
					setLastXCriteria(filterItem, units, value);
					break;
				case 'range':
					setRangeValue(
						filterItem,
						fpWidget.edtDateStartNode.value,
						fpWidget.edtDateFinishNode.value
					);
					break;
			}

			function setLastXCriteria(item, units, value) {
				const startDate = new Date();
				startDate.setUTCMinutes(
					startDate.getUTCMinutes() + aras.getCorporateToLocalOffset()
				);
				switch (units) {
					case 'minutes':
						startDate.setMinutes(startDate.getMinutes() - value);
						break;
					case 'hours':
						startDate.setHours(startDate.getHours() - value);
						break;
					case 'days':
						startDate.setDate(startDate.getDate() - value);
						break;
					case 'months':
						startDate.setMonth(startDate.getMonth() - value);
						break;
				}
				const propertyValue = ssvcUtils.GetDateTimeInNeutralFormat(startDate);
				item['created_on'] = {
					'@attrs': {
						condition: 'ge'
					},
					'@value': propertyValue
				};
				filteringMessage.push(
					ssvcUtils.GetResource('fp_last') + ' ' + value + ' ' + units
				);
			}

			function setRangeValue(item, startDate, endDate) {
				const start = aras.convertToNeutral(
					startDate,
					'date',
					aras.getDotNetDatePattern('short_date')
				);
				let end = aras.convertToNeutral(
					endDate,
					'date',
					aras.getDotNetDatePattern('short_date')
				);
				end = aras.parse2NeutralEndOfDayStr(new Date(end));
				item.and = {
					created_on: [
						{
							'@attrs': {
								condition: 'ge'
							},
							'@value': start
						},
						{
							'@attrs': {
								condition: 'le'
							},
							'@value': end
						}
					]
				};
				filteringMessage.push(
					startDate + ' ' + ssvcUtils.GetResource('fp_to') + ' ' + endDate
				);
			}
			return filteringMessage.length === 0 ? null : filterItem;
		};

		this.resetFields = function () {
			const evt = document.createEvent('Event');
			evt.initEvent('change', false, true);

			[cmbMessageType, cmbSourceType, cmbTimeFrame, cmbDateUnits].forEach(
				function (select) {
					select.selectedIndex = cmbDateUnits === select ? 2 : 0;
					select.dispatchEvent(evt);
				}
			);
			[
				fpWidget.edtFromUserNameNode,
				fpWidget.edtDateStartNode,
				fpWidget.edtDateFinishNode,
				fpWidget.edtRevisionNode,
				fpWidget.edtStateNode
			].forEach(function (input) {
				input.value = '';
			});
		};

		this.getFilteringMessages = function () {
			return filteringMessage;
		};

		function isPositiveInteger(cand) {
			const n = ~~Number(cand);
			return String(n) === cand && n > 0;
		}
	}

	return dojo.setObject(
		'SSVC.UI.FilterPopup',
		declare([_WidgetBase, _TemplatedMixin], {
			templateString: template,

			TypeLabel: ssvcUtils.GetResource('fp_type'),
			SourceLabel: ssvcUtils.GetResource('fp_source'),
			FromLabel: ssvcUtils.GetResource('fp_from'),
			FromDefValue: ssvcUtils.GetResource('fp_anyone'),
			TimeframeLabel: ssvcUtils.GetResource('fp_timeframe'),
			ToLabel: ssvcUtils.GetResource('fp_to'),
			RevisionLabel: ssvcUtils.GetResource('fp_revision'),
			RevisionDefValue: ssvcUtils.GetResource('fp_all'),
			RangeLabel: ssvcUtils.GetResource('fp_range_indicator'),
			StateLabel: ssvcUtils.GetResource('fp_state'),
			StateDefValue: ssvcUtils.GetResource('fp_all'),
			SearchButtonLabel: ssvcUtils.GetResource('fp_search'),
			CancelButtonLabel: ssvcUtils.GetResource('fp_cancel'),

			fpl: null,

			constructor: function () {
				this.fpl = new FilterPopupLogic(this);
			},

			postCreate: function () {
				this.fpl.Load();

				this.own(
					on(
						this.btnSearchNode,
						'click',
						this['btnSearchNode_OnClick'].bind(this)
					),
					on(
						this.btnCancelNode,
						'click',
						this['btnCancelNode_OnClick'].bind(this)
					)
				);
			},

			composeFilter: function (context) {
				return this.fpl.composeFilter(context);
			},

			validate: function () {
				return this.fpl.validate();
			},

			getFilteringMessages: function () {
				return this.fpl.getFilteringMessages();
			},

			resetFields: function () {
				return this.fpl.resetFields();
			},

			OnBtnSearchNodeClick: function () {},
			OnBtnCancelNodeClick: function () {},

			btnSearchNode_OnClick: function (event) {
				this.OnBtnSearchNodeClick(event);
			},
			btnCancelNode_OnClick: function (event) {
				this.OnBtnCancelNodeClick(event);
			},

			sourceSelectState: function (isEnabled) {
				this.fpl.sourceSelectState(isEnabled);
			}
		})
	);
});
