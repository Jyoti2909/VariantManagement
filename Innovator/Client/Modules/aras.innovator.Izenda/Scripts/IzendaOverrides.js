function overrideIzendaMethods() {
	window['SC_LoadColumns'] = function (id, path, options, columnName) {
		if (window['JTCS_Init_executes']) {
			return;
		}
		var cName = 'Column';
		if (columnName && columnName !== '') {
			cName = columnName;
		}
		var table = document.getElementById(id);
		var body = table.tBodies[0];
		var callback = function (path, numOfLoadedTables, selectName, rows) {
			function isAllOptionsInsertedToSelect() {
				var lastRowSelect = Izenda.Utils.getOperatingLastRowSelect(
					'Properties'
				);
				var count = lastRowSelect.querySelectorAll('optgroup').length;
				if (globalJoinsLengthCounter !== count) {
					setTimeout(isAllOptionsInsertedToSelect, 200);
				} else {
					Izenda.Utils.fireCustomEvent('allItemTypesLoaded');
				}
			}
			// globalJoinsLengthCounter set in applyJoins method, on report desiger init it is 0
			if (
				path === 'CombinedColumnList' &&
				numOfLoadedTables === globalJoinsLengthCounter
			) {
				if (selectName === 'Column') {
					[].forEach.call(rows, function (row) {
						const columnSel = window['EBC_GetSelectByName'](row, 'Column');
						if (
							columnSel.selectedIndex <= 0 &&
							row.getAttribute('userchanged') != null
						) {
							window['EBC_RemoveRow'](row);
						}
					});
				} else if (selectName === 'ExtraColumn') {
					isAllOptionsInsertedToSelect();
				}
			}
		};
		for (var i = 0; i < body.rows.length; i++) {
			loadCalled[i] = 1;
			var row = body.rows[i];
			var columnSel = window['EBC_GetSelectByName'](row, cName);
			if (columnSel) {
				var value = columnSel.value;
				if (options.indexOf('&' + 'addExpression=true') === -1) {
					options += '&' + 'addExpression=true';
				}
				window['EBC_LoadData'](
					path,
					options,
					columnSel,
					true,
					callback.bind(this, path, options.split("'").length, cName, body.rows)
				);
			}
		}
	};

	window['CC_OnColumnChangedHandler'] = function (e) {
		if (e) {
			ebc_mozillaEvent = e;
		}
		var row = window['EBC_GetRow']();

		if (row != null) {
			var columnSel = window['EBC_GetSelectByName'](row, 'Column');
			var operatorSel = window['EBC_GetSelectByName'](row, 'Operator');
			if (
				operatorSel &&
				(operatorSel.value == 'Equals_Select' ||
					operatorSel.value == 'NotEquals_Select' ||
					operatorSel.value == 'Equals_Multiple' ||
					operatorSel.value == 'NotEquals_Multiple' ||
					operatorSel.value == 'Equals_CheckBoxes' ||
					operatorSel.value == 'Equals_TreeView' ||
					operatorSel.value == 'NotEquals_TreeView')
			) {
				window['CC_LoadValues'](row);
			}
			var dataType = null;
			var dataTypeGroup = null;
			var expressionType = null;
			var colFullName = null;

			// add remove blank filter rows on ItemType properties change
			if (columnSel.selectedIndex <= 0 && row.nextSibling) {
				// row is not valid, but do not remove row here as it breaks logic
				return;
			}
			if (columnSel.selectedIndex != -1) {
				dataType = columnSel.options[columnSel.selectedIndex].getAttribute(
					'datatype'
				);
				dataTypeGroup = columnSel.options[columnSel.selectedIndex].getAttribute(
					'dataTypeGroup'
				);
				expressionType = columnSel.options[
					columnSel.selectedIndex
				].getAttribute('expressionType');
				colFullName = columnSel.options[columnSel.selectedIndex].value;
			}
			if (dataType == null || dataType == 'Unknown') {
				dataType = '';
			}
			if (dataTypeGroup == null) {
				dataTypeGroup = '';
			}
			if (colFullName == null) {
				colFullName = '';
			}
			var id = window['EBC_GetParentTable'](row).id;
			var tables = 'tables=' + tablesSave[id];
			window['EBC_LoadData'](
				'OperatorList',
				'typeGroup=' + dataType + '&' + tables + '&colFullName=' + colFullName,
				operatorSel
			);
			if (
				CC_allowNewFilters != null &&
				(CC_allowNewFilters == null || CC_allowNewFilters)
			) {
				var columnSel2 = window['EBC_GetSelectByName'](row, 'Column');
				if (columnSel2.value != '' && columnSel2.value != '...') {
					window['EBC_AddEmptyRow'](row);
				}
			}
			window['CC_CheckShowReportParameters'](window['EBC_GetParentTable'](row));

			var formatSel = window['EBC_GetSelectByName'](row, 'DisplayFormat');
			if (formatSel != null) {
				window['EBC_LoadData'](
					'FormatList',
					'typeGroup=' +
						(expressionType && expressionType != '...'
							? expressionType
							: dataTypeGroup) +
						'&onlySimple=true&forceSimple=true&colFullName=' +
						colFullName,
					formatSel
				);
			}
		}
	};

	window['SC_CallOnColumnFunctionChangeHandlers'] = function (
		id,
		columnName,
		functionName
	) {
		if (columnName === null) {
			columnName = 'Column';
		}
		if (functionName === null) {
			functionName = 'Function';
		}
		var handlers = window['SC_onColumnFunctionChangedHandlers'][id];
		var fields = window['SC_GetFieldsList'](id, columnName, functionName);

		for (var j = 0; j < fields.length; j++) {
			if (fields[j] && fields[j].description) {
				fields[j].description = fields[j].description
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
			}
		}

		window['EBC_CheckFieldsCount'](id, fields.length);
		if (handlers) {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i].func(handlers[i].id, fields);
			}
		}
	};

	window['SC_OnGroupFunctionChangeHandler'] = function (
		e,
		el,
		isNeedToSetDescription,
		functionName
	) {
		if (e) {
			window['ebc_mozillaEvent'] = e;
		}
		var row = window['EBC_GetRow']();
		var groupCheckbox = window['EBC_GetElementByName'](row, 'Group', 'INPUT');
		var funcSelect = window['EBC_GetSelectByName'](
			row,
			functionName || 'Function'
		);

		var src;
		if (isNetscape || !window.event) {
			src = window['ebc_mozillaEvent'];
		} else {
			src = window.event.srcElement;
		}
		var element = el || e.target || e.srcElement;

		if (groupCheckbox) {
			if (element == groupCheckbox && groupCheckbox.checked) {
				window['EBC_SetSelectedIndexByValue'](funcSelect, 'None');
			}

			if (element == funcSelect && funcSelect.value != 'None') {
				groupCheckbox.checked = false;
			}
		}

		window['EBC_SetDescription'](row);
		var parentTable = window['EBC_GetParentTable'](row);
		var id = parentTable.id;

		// Second argument specifies whether grouping should "TURN ON" or "TURN OFF"
		if (!parentTable.skipAutogrouping && !element.Loading) {
			window['SC_SmartMarkingGroupingAndFunctions'](
				id,
				(element == funcSelect && element.value != 'None') ||
					(element == groupCheckbox && element.checked)
			);
		}

		window['SC_CheckGroupingAndFunctions'](id);
	};

	window['SC_SmartMarkingGroupingAndFunctions'] = function (id, groupOn) {
		var table = document.getElementById(id);
		var body = table.tBodies[0];
		var rowCount = body.rows.length;
		var groupCount = 0;
		var functionsCount = 0;
		var notEmptyRowCount = 0;

		var makeActionForeachNonEmptyRow = function (action) {
			for (var i = 0; i < rowCount; i++) {
				var row = body.rows[i];
				var columnSelect = window['EBC_GetSelectByName'](row, 'Column');
				var operationElem = new AdHoc.MultivaluedCheckBox(
					'ArithmeticOperation',
					row
				);
				if (operationElem.ElementExists() && !operationElem.isDefault()) {
					continue;
				}
				if (!columnSelect || columnSelect.value == '...') {
					continue;
				}

				var groupCheckbox = window['EBC_GetElementByName'](
					row,
					'Group',
					'INPUT'
				);
				var funcSelect = window['EBC_GetSelectByName'](row, 'Function');

				action(funcSelect, groupCheckbox);
			}
		};

		var countFunctionsAndGroups = function () {
			makeActionForeachNonEmptyRow(function (funcSelect, groupCheckbox) {
				var isScalar =
					funcSelect.selectedIndex < 0
						? null
						: funcSelect.options[funcSelect.selectedIndex].getAttribute(
								'isScalar'
						  );

				if (
					(groupCheckbox && groupCheckbox.checked) ||
					funcSelect.value == 'GROUP'
				) {
					groupCount++;
				} else if (
					funcSelect.value != 'None' &&
					(!isScalar || isScalar === '0' || isScalar.length === 0)
				) {
					functionsCount++;
				}

				notEmptyRowCount++;
			});
		};

		var makeGroupOn = function () {
			makeActionForeachNonEmptyRow(function (funcSelect, groupCheckbox) {
				if (funcSelect.value != 'None') {
					return;
				}
				if (groupCheckbox) {
					groupCheckbox.checked = true;
				} else {
					window['EBC_SetSelectedIndexByValue'](funcSelect, 'GROUP');
				}
			});
		};

		var makeGroupOff = function () {
			makeActionForeachNonEmptyRow(function (funcSelect, groupCheckbox) {
				if (groupCheckbox) {
					groupCheckbox.checked = false;
				} else {
					window['EBC_SetSelectedIndexByValue'](funcSelect, 'None');
				}
			});
		};

		countFunctionsAndGroups();

		if (
			groupOn &&
			((functionsCount === 1 && groupCount === 0) ||
				(functionsCount === 0 && groupCount === 1))
		) {
			makeGroupOn();
		} else if (
			!groupOn &&
			functionsCount === 0 &&
			groupCount === notEmptyRowCount - 1
		) {
			makeGroupOff();
		}
	};

	window[
		'HORR_UpdateContentInternalCallback'
	] = Izenda.Utils.extendMethodWithFuncs(
		window['HORR_UpdateContentInternalCallback'],
		null,
		Izenda.Utils.improveReportLinks.bind(this, null, null)
	);
}
