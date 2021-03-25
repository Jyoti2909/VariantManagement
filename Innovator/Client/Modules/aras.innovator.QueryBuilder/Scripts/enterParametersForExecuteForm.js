function initEnterParametersForm(frameElement) {
	var dialogArguments = frameElement.dialogArguments;
	var aras = dialogArguments.conditionArgs.aras;
	var queryDefinition = dialogArguments.queryDefinition;
	var parametersNodes = queryDefinition.selectNodes(
		"Relationships/Item[@type='qry_QueryParameter']"
	);
	var select = document.querySelector('.parameters-list select');
	var parameterValue = document.querySelector('.parameters-list input');
	var parameterName;
	var parameters = {};

	var fillSelect = function () {
		if (parametersNodes.length > 0) {
			parameterValue.addEventListener('input', function () {
				parameters[parameterName] = this.value;
			});
			select.addEventListener('change', function () {
				var arr = this.options[this.selectedIndex].text.split(' ');
				parameterName = arr[0];
				parameterValue.removeAttribute('disabled');
				parameterValue.value =
					parameterName in parameters
						? parameters[parameterName]
						: arr[1].substring(1, arr[1].length - 1);
				parameterValue.focus();
			});
			select.removeAttribute('disabled');
		}

		for (var i = 0; i < parametersNodes.length; i++) {
			var option = document.createElement('option');
			var value = aras.getItemProperty(parametersNodes[i], 'value');
			var name = aras.getItemProperty(parametersNodes[i], 'name');

			option.textContent = name + ' (' + value + ')';
			select.appendChild(option);
		}
	};
	fillSelect();
	var conditionArgs = dialogArguments.conditionArgs;
	var executeBtn = document.getElementById('executeBtn');
	executeBtn.textContent = dialogArguments.executeBtnName;

	conditionNodeFrame = document.getElementById('conditionNodeFrame');

	conditionNodeFrame.addEventListener('load', function () {
		if (!conditionArgs) {
			return;
		}

		var conditionWin = conditionNodeFrame.contentWindow;
		conditionWin.start(conditionArgs);
		editArea = conditionWin.document.querySelector('.edit-area');
		editArea.addEventListener('keyup', function () {
			setTimeout(
				function () {
					if (conditionWin.document.querySelector('.edit-container.invalid')) {
						executeBtn.setAttribute('disabled', 'true');
					} else {
						executeBtn.removeAttribute('disabled');
					}
				}.bind(this)
			);
		});
	});

	function closeWindow(data) {
		if (dialogArguments.dialog) {
			dialogArguments.dialog.close(data);
		} else {
			returnValue = data;
			window.close();
		}
	}

	var resultAsFileCheckBoxLabel = document.getElementById('resultAsFileLabel');
	resultAsFileCheckBoxLabel.textContent =
		dialogArguments.resultAsFileCheckBoxLabel;

	let outpuFormatLabel = document.getElementById('outputFormatLabel');
	outpuFormatLabel.textContent = aras.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'execution.outputFormat'
	);

	let outputFormatSelector = document.getElementById('outputFormat');

	const option_structured = document.createElement('option');
	option_structured.value = 'structured';
	option_structured.textContent = aras.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'execution.structuredFormat'
	);
	const option_flat = document.createElement('option');
	option_flat.value = 'flat';
	option_flat.textContent = aras.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'execution.flatFormat'
	);
	outputFormatSelector.selectedIndex = 0;
	outputFormatSelector.options.add(option_structured, 0);
	outputFormatSelector.options.add(option_flat, 1);

	executeBtn.addEventListener('click', function () {
		var conditionXml = conditionArgs
			? conditionNodeFrame.contentWindow.whereUseEditor.getResult()
			: null;

		var maxCount = document.getElementById('maxCount').value;
		var resultAsFile = document.getElementById('resultAsFile').checked;
		let outputFormatSelector = document.getElementById('outputFormat');
		let outputFormat =
			outputFormatSelector[outputFormatSelector.selectedIndex].value ==
			'structured'
				? null
				: outputFormatSelector[outputFormatSelector.selectedIndex].value;
		let key_properties =
			outputFormat == 'flat' ? 'ID,QB_QUERY_REFERENCE_REF_ID' : null;
		for (var i = 0; i < parametersNodes.length; i++) {
			var name = aras.getItemProperty(parametersNodes[i], 'name');

			if (name in parameters) {
				aras.setItemProperty(
					parametersNodes[i],
					'value',
					parameters[name],
					false
				);
			}
		}

		closeWindow({
			isNeedExecutAction: true,
			maxCount: maxCount,
			conditionXml: conditionXml,
			resultAsFile: resultAsFile,
			outputFormat: outputFormat,
			key_properties: key_properties
		});
	});
}
