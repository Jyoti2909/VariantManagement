export default class UserNotificationContainer {
	constructor(control, notifyObserver) {
		if (!control) {
			throw new Error(
				"ArgumentException: notification_control can't be undefined"
			);
		}
		const messageCheckInterval = aras.commonProperties.MessageCheckInterval;

		if (!messageCheckInterval) {
			ArasModules.Dialog.alert(
				aras.getResource('', 'user_notifications.failed_get_interval_variable')
			);
			return;
		}

		this.checkInterval = null;
		this.checkTimeout = null;
		this.acknowledge = 'Acknowledge';
		this.closeText = 'Close';
		this.url = aras.getServerBaseURL() + 'Notifications.aspx';
		this.updateInfoDom = null;
		this.popupParametersArray = [];
		this.checkInterval = messageCheckInterval;
		this.checkTimeout = setTimeout(
			this.startIterativeUpdateMessageCollection.bind(this),
			this.checkInterval
		);
		this.notifyObserver = notifyObserver;
		this.notifications = new Map();
		this.extendControlWithNotificationButtonFormatter(control);
		this.updateMessageCollection(true, function () {});
	}
	notificationsButtonFormatter(item) {
		const BUTTON_CLASS = 'aras-button';
		const iconNode = ArasModules.SvgManager.createInfernoVNode(item.image, {
			class: BUTTON_CLASS + '__icon'
		});
		let hasOnceMessages = false;
		item.data &&
			item.data.forEach(function (message) {
				if (message.isOnce) {
					hasOnceMessages = true;
				}
			});
		const buttonNode = iconNode || (
			<span className={BUTTON_CLASS + '__text'} tabindex="-1">
				{item.label}
			</span>
		);
		if (!item.roots.length) {
			return buttonNode;
		}
		const notificationCountModifier = hasOnceMessages
			? 'notifications-count_red'
			: 'notifications-count_gray';
		const notificationCountClass = `aras-header__notifications-count ${notificationCountModifier}`;
		const msgCountNode = (
			<span className={notificationCountClass}>{item.roots.length}</span>
		);
		return [msgCountNode, buttonNode];
	}
	extendControlWithNotificationButtonFormatter(control) {
		control.constructor.extendFormatters({
			notificationsButtonFormatter: this.notificationsButtonFormatter
		});
	}
	updateCuiLayout() {
		this.notifyObserver('UpdateNotifications');
	}
	addMessage(id, text, image, messageItem) {
		const acknowledgeDom =
			messageItem && messageItem.selectSingleNode('acknowledge');
		const isOnceAcknowledge = acknowledgeDom && acknowledgeDom.text === 'Once';
		const type = messageItem.getAttribute('type');

		this.notifications.set(id, {
			id: id,
			type,
			label: text,
			name: id,
			icon: image,
			isOnce: isOnceAcknowledge,
			isOld: false
		});
		this.updateCuiLayout();
	}
	removeMessage(id) {
		if (this.notifications.has(id)) {
			this.notifications.delete(id);
		}
		this.updateCuiLayout();
	}
	clearCollection() {
		this.notifications = new Map();
		this.updateCuiLayout();
	}
	makeAllMessagesOld() {
		this.notifications.forEach((notification) => {
			notification.isOld = true;
		});
		this.updateCuiLayout();
	}
	clearOldMessages() {
		this.notifications.forEach((notification) => {
			if (notification.isOld) {
				this.notifications.delete(notification.id);
			}
		});
		this.updateCuiLayout();
	}
	getMessageQuery() {
		const queryDom = aras.createXMLDocument();

		queryDom.loadXML('<Parameters/>');
		const currentUserIDNode = queryDom.createElement('CurrentUserID');
		const dateTimeNode = queryDom.createElement('DateTime');
		const intlObject = ArasModules.intl;

		currentUserIDNode.text = aras.getCurrentUserID();
		dateTimeNode.text = intlObject.date.toIS0Format(new Date());

		queryDom.documentElement.appendChild(currentUserIDNode);
		queryDom.documentElement.appendChild(dateTimeNode);

		return queryDom.documentElement.xml;
	}
	asyncCheckNewMessages(getCollectionCallback) {
		const resultCallbackHandler = (soapResult) => {
			const messageCollection = this.processSoapResult(soapResult);
			getCollectionCallback(this, messageCollection);
		};

		const soapController = new window.SoapController(resultCallbackHandler);

		const query = this.getMessageQuery();
		window.aras.soapSend(
			'GetNotifications',
			query,
			this.url,
			null,
			soapController
		);
	}
	syncGetMessageCollection() {
		const query = this.getMessageQuery();
		const soapResult = aras.soapSend('GetNotifications', query, this.url);

		return this.processSoapResult(soapResult);
	}
	processSoapResult(soapResult) {
		if (soapResult.getFaultCode() !== 0) {
			ArasModules.Dialog.alert('', {
				type: 'soap',
				data: soapResult
			});
			return null;
		}

		if (soapResult.isFault()) {
			return null;
		}
		return soapResult.getResult();
	}
	refreshUpdateDom(resultDom) {
		if (!resultDom) {
			return;
		}
		this.updateInfoDom = resultDom.selectSingleNode(
			'Item[@id="UpdateInfoMessage"]'
		);
	}
	fillStandardMessageCollection(resultDom, clearBefore) {
		if (clearBefore) {
			this.clearCollection();
		} else {
			this.makeAllMessagesOld();
		}

		if (!resultDom) {
			this.clearCollection();
			return;
		}

		const standardCollection = resultDom.selectNodes(
			'Item[type/text()="Standard"]'
		);

		for (let i = 0; i < standardCollection.length; i++) {
			const messageItem = standardCollection[i];
			const messageId = messageItem.getAttribute('id');
			const title = aras.getItemProperty(messageItem, 'title');
			const imageUrl = aras.getItemProperty(messageItem, 'icon');
			this.addMessage(messageId, title, imageUrl, messageItem);
		}

		this.clearOldMessages();
	}
	showPopupCollection(resultDom, showAsModeless) {
		if (!resultDom) {
			return;
		}

		const popupCollection = resultDom.selectNodes('Item[type/text()="Popup"]');

		const sortedList = this.sortMessagesByPriority(popupCollection);
		let i = 0;

		const nextSortedList = function () {
			if (i >= sortedList.length) {
				return;
			}
			const index = sortedList.length - i - 1;
			if (!sortedList[index]) {
				i++;
				return nextSortedList();
			}
			nextMsgIndex(index, 0);
		};

		const nextMsgIndex = (index, msgIndex) => {
			if (msgIndex >= sortedList[index].length) {
				i++;
				nextSortedList();
			} else {
				this.displayMessageDialog(
					sortedList[index][msgIndex],
					showAsModeless,
					function () {
						setTimeout(function () {
							msgIndex++;
							nextMsgIndex(index, msgIndex);
						}, 0);
					}
				);
			}
		};

		nextSortedList();
	}
	sortMessagesByPriority(messageCollection) {
		const sortedList = [];

		for (let i = 0; i < messageCollection.length; i++) {
			const priority = aras.getItemProperty(messageCollection[i], 'priority');
			if (!sortedList[priority]) {
				sortedList[priority] = [];
			}

			sortedList[priority][sortedList[priority].length] = messageCollection[i];
		}

		return sortedList;
	}
	updateMessageCollection(doAsync, callback) {
		if (!doAsync) {
			doAsync = false;
		}

		if (doAsync) {
			const getCollectionCallback = function (container, messageCollection) {
				container.refreshUpdateDom(messageCollection);
				container.fillStandardMessageCollection(messageCollection);
				container.showPopupCollection(messageCollection, true);
				if (callback) {
					callback();
				}
			};
			this.asyncCheckNewMessages(getCollectionCallback);
		} else {
			const messageCollection = this.syncGetMessageCollection();
			this.refreshUpdateDom(messageCollection);
			this.fillStandardMessageCollection(messageCollection);
			this.showPopupCollection(messageCollection, false);
		}
	}
	startIterativeUpdateMessageCollection() {
		const callback = () => {
			this.checkTimeout = setTimeout(
				this.startIterativeUpdateMessageCollection.bind(this),
				this.checkInterval
			);
		};

		this.updateMessageCollection(true, callback);
	}
	displayMessageDialogById(messageId, showAsModeless) {
		if (messageId === 'UpdateInfoMessage') {
			this.displayMessageDialog(this.updateInfoDom, showAsModeless);
		} else {
			const messageItem = aras.getItemById('Message', messageId);
			if (messageItem) {
				this.displayMessageDialog(messageItem, showAsModeless);
			} else {
				ArasModules.Dialog.alert(
					aras.getResource('', 'user_notifications.message_no_more_available')
				);
				this.removeMessage(messageId);
			}
		}
	}
	displayMessageDialog(messageItem, showAsModeless, callback) {
		if (!messageItem) {
			return;
		}

		const templateUrl = aras.getI18NXMLResource(
			'notification_popup_template.xml',
			aras.getBaseURL()
		);
		const templateDom = aras.createXMLDocument();
		templateDom.load(templateUrl);

		let parameters = this.popupParametersArray[
			aras.getItemProperty(messageItem, 'id')
		];
		if (!parameters) {
			parameters = {};
		}

		const openedMessageWindow = parameters.window;

		parameters.id = aras.getItemProperty(messageItem, 'id');
		parameters.default_template = templateDom.selectSingleNode(
			'template/html'
		).text;
		parameters.custom_html = aras.getItemProperty(messageItem, 'custom_html');

		parameters.dialogWidth = aras.getItemProperty(messageItem, 'width');
		parameters.dialogHeight = aras.getItemProperty(messageItem, 'height');
		parameters.css = aras.getItemProperty(messageItem, 'css');
		parameters.is_standard_template =
			aras.getItemProperty(messageItem, 'is_standard_template') === '1';

		if (!parameters.dialogWidth || parameters.is_standard_template) {
			parameters.dialogWidth = templateDom.selectSingleNode(
				'template/dialog_width'
			).text;
		}

		if (!parameters.dialogHeight || parameters.is_standard_template) {
			parameters.dialogHeight = templateDom.selectSingleNode(
				'template/dialog_height'
			).text;
		}

		parameters.title = aras.getItemProperty(messageItem, 'title');
		parameters.text = aras.getItemProperty(messageItem, 'text');
		parameters.url = aras.getItemProperty(messageItem, 'url');
		parameters.icon = aras.getItemProperty(messageItem, 'icon');

		parameters.OK_IsVisible =
			aras.getItemProperty(messageItem, 'show_ok_button') === '1';
		parameters.Exit_IsVisible =
			aras.getItemProperty(messageItem, 'show_exit_button') === '1';

		parameters.OK_Label = aras.getItemProperty(messageItem, 'ok_button_label');
		parameters.Exit_Label = aras.getItemProperty(
			messageItem,
			'exit_button_label'
		);

		parameters.container = this;
		parameters.opener = window;
		parameters.writeContent = writeContent;
		parameters.aras = aras;

		this.popupParametersArray[parameters.id] = parameters;

		if (!showAsModeless) {
			parameters.content = 'modalDialog.html';

			window.ArasModules.Dialog.show('iframe', parameters)
				.promise.then((res) => {
					if (res === this.acknowledge) {
						return this.acknowledgeMessage(messageItem);
					}
				})
				.then(() => {
					if (callback) {
						return callback();
					}
				});
		} else {
			const sFeatures = `height=${parameters.dialogHeight}, width=${parameters.dialogWidth}`;

			if (openedMessageWindow) {
				openedMessageWindow.close();
			}

			const OnBeforeUnloadHandler = async function () {
				const container = parameters.window.parameters.container;
				if (parameters.window.returnValue === container.acknowledge) {
					await container.acknowledgeMessage(messageItem);
				}

				if (callback) {
					callback();
				}
				parameters.window = null;
			};

			parameters.window = window.open(
				aras.getScriptsURL() + 'blank.html',
				'',
				sFeatures
			);
			parameters.window.focus();
			writeContent(parameters.window);
			parameters.window.parameters = parameters;
			parameters.window.addEventListener('beforeunload', OnBeforeUnloadHandler);
		}

		function uiDrawInputButton(name, value, handlerCode, className) {
			return `<input name="${name}" type="button" value="${value}" onclick="${handlerCode}" class="btn ${className}"/>`;
		}

		function writeContent(w) {
			const doc = w.document;
			let template;
			const titleExpr = new RegExp('{TITLE}', 'g');
			const urlExpr = new RegExp('{URL}', 'g');
			const textExpr = new RegExp('{TEXT}', 'g');
			const iconExpr = new RegExp('{ICON}', 'g');

			if (parameters.icon) {
				parameters.icon = aras.getScriptsURL() + parameters.icon;
			}
			if (!parameters.is_standard_template) {
				template = parameters.custom_html.replace(titleExpr, parameters.title);
				template = template.replace(urlExpr, parameters.url);
				template = template.replace(textExpr, parameters.text);
				template = template.replace(iconExpr, parameters.icon);

				doc.write(template);
			} else {
				template = parameters.default_template.replace(
					titleExpr,
					parameters.title
				);
				template = template.replace(urlExpr, parameters.url);
				template = template.replace(textExpr, parameters.text);
				template = template.replace(iconExpr, parameters.icon);
				doc.write(template);

				if (parameters.css) {
					const style = doc.createElement('style');
					style.innerHTML = parameters.css;
					doc.head.appendChild(style);
				}
				const notificationTitle = doc.getElementById('notification_title');
				const titleElement = notificationTitle.appendChild(
					doc.createElement('h2')
				);
				titleElement.setAttribute('class', 'title');
				if (parameters.url) {
					const urlElement = titleElement.appendChild(doc.createElement('a'));
					urlElement.setAttribute('href', parameters.url);
					urlElement.setAttribute('target', '_about');
					urlElement.setAttribute('class', 'sys_item_link');
					urlElement.textContent = parameters.title;
				} else {
					titleElement.textContent = parameters.title;
				}

				if (!parameters.icon) {
					doc.getElementById('message_icon').style.display = 'none';
				}
			}
			w.returnValue = parameters.container.closeText;
			w.closeWindow = function (value) {
				if (w.dialogArguments && w.dialogArguments.dialog) {
					w.dialogArguments.dialog.close(value);
				} else {
					w.returnValue = value || w.returnValue;
					w.close();
				}
			};
			doc.close();

			let innerHTML = '';
			if (parameters.OK_IsVisible) {
				innerHTML += uiDrawInputButton(
					'OK_button',
					parameters.OK_Label,
					` window.closeWindow('${parameters.container.acknowledge}');`,
					'notification_ok_btn'
				);
			}
			if (parameters.Exit_IsVisible) {
				innerHTML += uiDrawInputButton(
					'Exit_button',
					parameters.Exit_Label,
					` window.closeWindow('${parameters.container.closeText}');`,
					'cancel_button notification_exit_btn'
				);
			}
			if (innerHTML) {
				const el = doc.createElement('center');
				el.innerHTML = innerHTML;
				const source =
					doc.getElementById('btns') || doc.getElementsByTagName('body')[0];
				if (source) {
					source.appendChild(el);
				}
			}
		}
	}
	async acknowledgeMessage(messageItem) {
		const acknowledgeDom =
			messageItem && messageItem.selectSingleNode('acknowledge');
		if (!acknowledgeDom || acknowledgeDom.text !== 'Once') {
			return;
		}

		const messageId = messageItem.getAttribute('id');

		const relsh = `<Item type="Message Acknowledgement" action="add">
				<related_id>${aras.getCurrentUserID()}</related_id>
				<source_id>${messageItem.getAttribute('id')}</source_id>
			</Item>`;

		try {
			await ArasModules.soap(relsh, {
				method: 'ApplyItem',
				async: true
			});
			this.removeMessage(messageId);
		} catch (error) {
			const errorResult = new SOAPResults(aras, error.responseText);
			if (errorResult.getFaultCode() !== 0) {
				await ArasModules.Dialog.alert('', {
					type: 'soap',
					data: errorResult
				});
			}
		}
	}
	dispose() {
		if (this.checkTimeout) {
			clearTimeout(this.checkTimeout);
		}
	}
}
