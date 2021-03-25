define(['dijit/TooltipDialog', 'dijit/popup'], function (TooltipDialog, popup) {
	const tooltipId = 'xClassTooltipDialog';
	const tooltipIframeId = 'tooltipDialogFormIframe';
	const formId = '5293F5866F6746CEB2DD9F32DCE8AA79';

	let targetItemNode;
	let itemTypeNode;
	let formUrl;

	let arasDialogIsOpened;

	let tooltipDialog;
	let tooltipIframe;
	let mutationObserver;

	let resolvePromiseFunction;
	let iframes;

	const closeTooltipDialog = function () {
		mutationObserver.disconnect();
		tooltipIframe.contentWindow.removeEventListener('blur', iframeBlurHandler);
		document.body.removeEventListener('mousedown', onMouseDownHandler);
		iframes.forEach(function (curFrame) {
			curFrame.contentWindow.removeEventListener(
				'mousedown',
				onMouseDownHandler
			);
		});
		popup.close(tooltipDialog);
		tooltipDialog.destroyRecursive();
		tooltipDialog = null;
	};

	const validate = function () {
		if (tooltipIframe.contentDocument.activeElement) {
			tooltipIframe.contentDocument.activeElement.blur();
		}
		if (!aras.getItemProperty(targetItemNode, 'name')) {
			ArasModules.Dialog.alert(
				aras.getResource(
					'../Modules/aras.innovator.ExtendedClassification/',
					'classEditor.tree.dialog.nameRequired'
				)
			).then(function () {
				tooltipIframe.contentDocument.body
					.querySelector('input[name="name"]')
					.focus();
			});
			return false;
		}
		return true;
	};

	const tryCloseTooltipDialog = function (isDeclined) {
		if (tooltipDialog && !arasDialogIsOpened) {
			if (isDeclined) {
				closeTooltipDialog();
				resolvePromiseFunction();
			} else if (validate()) {
				closeTooltipDialog();
				resolvePromiseFunction(targetItemNode);
			}
		}
	};

	const onKeyDownHandler = function (event) {
		switch (event.key) {
			case 'Enter':
				tryCloseTooltipDialog(false);
				break;
			case 'Escape':
			case 'Esc':
				tryCloseTooltipDialog(true);
				break;
			default:
				break;
		}
	};

	const onMouseDownHandler = function (event) {
		if (!event.target.closest('.dijitTooltipDialog')) {
			tryCloseTooltipDialog(false);
		}
	};

	/* In Firefox, when the iframe loses focus, the iframe.contentDocument.activeElement remains on the last active element,
	while the other browsers set the iframe.contentDocument.body as the active element of the iframe document.
	Therefore, in Firefox, if the last active element was an input, then when the focus is returned back to the iframe
	(using iframe.contentWindow.focus()), the focus will be in the input, although it is expected that in iframe.contentDocument.body.
	So need to explicitly blur the active element of the iframe document when iframe loses focus. */
	const iframeBlurHandler = function (e) {
		if (tooltipIframe.contentDocument.activeElement) {
			tooltipIframe.contentDocument.activeElement.blur();
		}
	};

	const xClassTooltipDialog = {
		show: function (item, rowId) {
			return new Promise(function (resolve) {
				iframes = (function getIframes(currentDocument) {
					return Array.prototype.reduce.call(
						currentDocument.getElementsByTagName('iframe'),
						function (result, curFrame) {
							let contentDocument;
							// check the same-origin policy
							try {
								contentDocument = curFrame.contentDocument;
							} catch (error) {}
							if (contentDocument) {
								result.push(curFrame);
								return result.concat(getIframes(curFrame.contentDocument));
							}
							return result;
						},
						[]
					);
				})(document);

				const formDisplay = aras.getFormForDisplay(formId);
				const formNd = formDisplay.node;
				const formHeight = aras.getItemProperty(formNd, 'height');
				const formWidth = aras.getItemProperty(formNd, 'width');

				resolvePromiseFunction = resolve;
				targetItemNode = item.node;
				itemTypeNode = aras.getItemTypeDictionary(
					targetItemNode.getAttribute('type')
				).node;

				aras.uiPopulatePropertiesOnWindow(
					window,
					targetItemNode,
					itemTypeNode,
					formNd,
					true
				);
				formUrl = aras.uiDrawFormEx(formNd, 'edit', itemTypeNode);

				arasDialogIsOpened = false;

				tooltipDialog = new TooltipDialog({
					id: tooltipId,
					content:
						"<iframe id='" +
						tooltipIframeId +
						"' src='" +
						formUrl +
						"' style='width: 100%; height: 100%;" +
						(formHeight && formHeight > 0
							? 'min-height:' + formHeight + 'px; height: ' + formHeight + 'px;'
							: '') +
						(formWidth && formWidth > 0 ? ' width: ' + formWidth + 'px;' : '') +
						" display: block;' frameborder='0'></iframe>"
				});
				tooltipDialog.domNode.addEventListener('focus', function (e) {
					setTimeout(function () {
						tooltipIframe.contentWindow.focus();
					}, 0);
				});
				tooltipDialog.domNode.style.outline = 'none';

				let around = xClassEditorTree.tree.dom.querySelector(
					"li[data-key='" + rowId + "']"
				);
				if (around.firstElementChild.tagName === 'DIV') {
					around = around.firstElementChild;
				}

				popup.open({
					popup: tooltipDialog,
					around: around,
					orient: ['after-centered']
				});

				tooltipIframe = document.getElementById(tooltipIframeId);
				tooltipIframe.contentWindow.addEventListener('load', function () {
					tooltipIframe.contentWindow.addEventListener(
						'blur',
						iframeBlurHandler
					);
					tooltipIframe.contentWindow.addEventListener(
						'keydown',
						onKeyDownHandler
					);
					tooltipIframe.contentDocument.body
						.querySelector('input[name="name"]')
						.focus();
				});

				document.body.addEventListener('mousedown', onMouseDownHandler);
				iframes.forEach(function (curFrame) {
					curFrame.contentWindow.addEventListener(
						'mousedown',
						onMouseDownHandler
					);
				});

				mutationObserver = new MutationObserver(function (mutations) {
					mutations.forEach(function (mutation) {
						Array.prototype.forEach.call(mutation.addedNodes, function (
							addedNode
						) {
							if (
								addedNode.tagName.toLowerCase() === 'dialog' &&
								addedNode.classList.contains('aras-dialog')
							) {
								arasDialogIsOpened = true;
							}
						});
						Array.prototype.forEach.call(mutation.removedNodes, function (
							removedNode
						) {
							if (
								removedNode.tagName.toLowerCase() === 'dialog' &&
								removedNode.classList.contains('aras-dialog')
							) {
								arasDialogIsOpened = false;
								tooltipIframe.contentWindow.focus();
							}
						});
					});
				});
				mutationObserver.observe(document.body, { childList: true });
			});
		}
	};

	return xClassTooltipDialog;
});
