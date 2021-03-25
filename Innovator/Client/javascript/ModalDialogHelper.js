function ModalDialogHelper(baseUrl) {
	this.baseUrl = baseUrl;
}

ModalDialogHelper.prototype._getOptionsStr = function (options) {
	options = Object.assign(
		{ dialogWidth: 250, dialogHeight: 100, center: true },
		options || {}
	);

	if (!options.dialogLeft && !options.dialogTop) {
		options.dialogLeft = (screen.width - options.dialogWidth) / 2;
		options.dialogTop = (screen.height - options.dialogHeight) / 2;
	}

	return ''.concat(
		options.dialogWidth ? 'dialogWidth:' + options.dialogWidth + 'px;' : '',
		'',
		options.dialogHeight
			? 'dialogHeight:' + options.dialogHeight + 'px; '
			: ' ',
		options.dialogLeft ? 'dialogLeft:' + options.dialogLeft + 'px;' : '',
		' ',
		options.dialogTop ? 'dialogTop:' + options.dialogTop + 'px;' : '',
		' ',
		'center:',
		options.center ? 'yes' : 'no',
		'; ',
		'resizable:',
		options.resizable ? 'yes' : 'no',
		'; ',
		'status:',
		options.status ? 'yes' : 'no',
		'; ',
		'scroll:',
		options.scroll ? 'yes' : 'no',
		'; ',
		'help:',
		options.help ? 'yes' : 'no',
		';'
	);
};

ModalDialogHelper.prototype.show = function (
	type,
	aWindow,
	params,
	options,
	file,
	callbacks
) {
	var callback = params.callback || function () {};
	params.callback = function () {};

	var args = Object.assign({ content: file, type: type }, params, options);

	aWindow.dialogArguments = args;
	var dialog = aWindow.ArasModules.Dialog.show('iframe', args);
	if (
		options &&
		(typeof options.top === 'number' || typeof options.top === 'string') &&
		(typeof options.left === 'number' || typeof options.left === 'string')
	) {
		dialog.move(options.left, options.top);
	}
	dialog.content = dialog.dialogNode.querySelector('.aras-dialog__iframe');

	dialog.promise.then(function (res) {
		res = res || dialog.result;
		dialog.result = res;
		if (callbacks && callbacks.oncancel) {
			callbacks.oncancel(dialog);
		}
		callback(res);
		aWindow.dialogArguments = null;
	});
	if (callbacks && callbacks.onload) {
		callbacks.onload(dialog);
	}
};
