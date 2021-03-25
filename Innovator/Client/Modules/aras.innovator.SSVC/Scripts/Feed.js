define([
	'dojo/_base/declare',
	'dojo/on',
	'dojo/aspect',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!SSVC/Views/feed.html',
	'SSVC/Scripts/Controls/AttachMenu',
	'SSVC/Scripts/Controls/IdentitySelector',
	'SSVC/Scripts/IdentitySelectorPopup',
	'Viewers/SketchViewer',
	'Viewers/ImageViewer',
	'Viewers/DynamicHOOPSViewer',
	'SSVC/Scripts/MessageManager',
	'SSVC/Scripts/Mention',
	'SSVC/Scripts/Mention/MessageContentConverter',
	'SSVC/Scripts/Utils',
	'SSVC/Scripts/ReplyToolbar',
	'SSVC/Scripts/FilterPopup',
	'SSVC/Scripts/UserControl'
], function (
	declare,
	on,
	aspect,
	_WidgetBase,
	_TemplatedMixin,
	template,
	AttachMenu,
	IdentitySelector,
	IdentitySelectorPopup,
	SketchViewer,
	ImageViewer,
	DynamicHoopsViewer,
	MessageManager,
	Mention,
	MessageContentConverter,
	ssvcUtils,
	ReplyToolbar,
	FilterPopup,
	UserControl
) {
	const aras = window.aras;
	let self = null;
	const topWnd = aras.getMostTopWindowWithAras(window);
	const placeholderIsSupported = function () {
		const test = document.createElement('input');
		return 'placeholder' in test;
	};

	const ssvcResourceUrl = '../Modules/aras.innovator.ssvc/';

	const feedResources = {
		'.ssvc-toolbar > div > label': aras.getResource(
			ssvcResourceUrl,
			'feed_title_base'
		),
		'.ssvc-toolbar-addComment > input.btn': aras.getResource(
			ssvcResourceUrl,
			'feed_add_comment'
		),
		'.ssvc-toolbar .ssvc-toolbar-search input': aras.getResource(
			ssvcResourceUrl,
			'feed_tb_def_message_search'
		),
		'.ssvc-toolbar .ssvc-display-settings-popup span.ssvc-toolbar-sortingLabel': aras.getResource(
			ssvcResourceUrl,
			'feed_tb_sort_mode_label'
		),
		'.ssvc-toolbar .ssvc-display-settings-popup span.ssvc-toolbar-modeLabel': aras.getResource(
			ssvcResourceUrl,
			'feed_tb_display_mode_label'
		),
		'.ssvc-toolbar .ssvc-preferences-popup .ssvc-preferences-popup-title': aras.getResource(
			ssvcResourceUrl,
			'pp_title'
		),
		'.ssvc-toolbar .ssvc-preferences-popup #enable_in_app_notifications + label': aras.getResource(
			ssvcResourceUrl,
			'pp_enable_in_app_notifications'
		),
		'.ssvc-toolbar .ssvc-preferences-popup #enable_immediate_notifications + label': aras.getResource(
			ssvcResourceUrl,
			'pp_enable_immediate_notifications'
		),
		'.ssvc-toolbar .ssvc-preferences-popup #enable_email_digest_notification + label': aras.getResource(
			ssvcResourceUrl,
			'pp_enable_email_digest_notification'
		),
		'.ssvc-filter a': aras.getResource(
			ssvcResourceUrl,
			'feed_show_all_messages'
		)
	};

	const activateViewerInVersionedMode = async function (viewer, message, win) {
		const info = await win.viewManager.getViewerInfoById(message.markup.fileId);
		const setUpViewer = function (viewer) {
			viewer.applyOutOfContextMode.call(viewer, message);
		};

		const tempViewer = this.getSelectViewerByTabId(
			message.markup.fileId + '_' + info.name,
			setUpViewer,
			win
		);
		if (tempViewer === false) {
			const self = this;
			const markupHolderTypeId = message.markup.item.getProperty(
				'markup_holder_type_id'
			);
			const viewerParams = {
				fileId: message.markup.fileId,
				fileSelectorTypeId: message.markup.item.getProperty(
					'file_selector_type_id'
				),
				fileSelectorId: message.markup.item.getProperty('file_selector_id'),
				markupHolderId: message.markup.documentId,
				markupHolderItemtypeName: aras.getItemTypeName(markupHolderTypeId)
			};

			win.viewManager
				.createViewer(info.module, info.name, viewerParams)
				.then(function (tempViewer) {
					win
						.getViewersTabs()
						.createTab(tempViewer, message.markup.fileId + '_' + info.name);
					self.getSelectViewerByTabId(
						message.markup.fileId + '_' + info.name,
						setUpViewer,
						win
					);
				});
		}
	};

	const createTempViewer = function (tabsControl, previousTabId) {
		const newId = window.aras.generateNewGUID();

		const viewer = new SketchViewer({
			baseClass: 'dijitContentPaneNoPadding',
			style: 'height:100%;width:100%;',
			params: {
				id: null,
				markupHolderId: self.params.itemID,
				markupHolderItemtypeName: self.params.itemTypeName,
				isTempViewer: true,
				previousTab: previousTabId
			}
		});
		tabsControl.createTab(viewer, newId);

		return newId;
	};

	const bindPreSelectTabHandler = function (tabsControl, tabId, needToClose) {
		const lostMessage = window.aras.getResource(
			'../Modules/aras.innovator.Viewers/',
			'mark_tb_lose_unsaved_markup'
		);
		if (needToClose === undefined) {
			needToClose = true;
		}
		require(['dojo/aspect'], function (aspect) {
			aspect.after(tabsControl, 'onPreSelectTab', function () {
				if (!tabsControl.getTabById(tabId)) {
					return false;
				}
				const viewerControl = tabsControl.getTabById(tabId).getChildren()[0];
				const viewer = viewerControl.viewerFrame.contentWindow.SSVCViewer;

				if (viewer.markupPage && viewer.markupPage.hasNotations()) {
					if (window.aras.confirm(lostMessage, window) !== true) {
						return true;
					} else {
						if (!needToClose) {
							viewer.markupPage.removeAllNotations();
						}
					}
				}
				if (needToClose) {
					self.unbindPasteEventHandler(viewerControl);
					tabsControl.closeTab(tabId);
				}
				return false;
			});
		});
	};

	const events = {
		commentBtnState: function (event) {
			const target = event.target.parentNode.parentNode;
			const area = target.querySelector('.ssvc-toolbar-addComment-area');
			const isBtnDisabled = !(
				area.textContent ||
				target.querySelector('input.arasCheckboxOrRadio').checked
			);
			target.querySelector('input.btn').disabled = isBtnDisabled;
			if (self.onChangeIncludeSnapshotState) {
				self.onChangeIncludeSnapshotState(!isBtnDisabled);
			}
		},
		changeDisplayMode: function (event) {
			const mode = event.target.options[event.target.selectedIndex].value;
			this.messageManager.setDisplayMode(mode);
		},
		changeSortingMode: function (event) {
			const sort = event.target.options[event.target.selectedIndex].value;
			this.messageManager.sortMessages(sort);
		},
		showFilterOptions: function (popup, event) {
			const tollbarButton = document.querySelector(
				'.ssvc-toolbar .ssvc-toolbar-buttons .MoreOptionsButton'
			);
			tollbarButton.classList.toggle('fpActive');

			if (popup.style.display !== 'none') {
				popup.style.display = 'none';
				return;
			}

			const con = popup.parentNode.getBoundingClientRect();
			const search = event.target.parentNode.getBoundingClientRect();
			const key = 'top'; //to explicitly allow "top" usage
			popup.style.right = con.right - search.right + 'px';
			popup.style[key] = search[key] + search.height - con[key] + 'px';
			popup.style.display = '';
			if (!placeholderIsSupported()) {
				Array.prototype.forEach.call(
					popup.querySelectorAll("input[type='text']"),
					function (input) {
						const placeholder = input.getAttribute('placeholder') || '';
						input.setAttribute('placeholder', '');
						input.setAttribute('placeholder', placeholder);
					}
				);
			}
		},
		filterMessages: function (event) {
			if (
				event.type === 'click' ||
				(event.type === 'keyup' && event.keyCode === 13)
			) {
				this.filterByMessageText();
			}
		},
		addComment: function (event) {
			const area = event.target.parentNode.querySelector(
				'.ssvc-toolbar-addComment-area'
			);
			const contentConverter = new MessageContentConverter();
			const text = contentConverter.parseFromHtml(area);
			const checkbox = event.target.parentNode.querySelector(
				'input.arasCheckboxOrRadio'
			);
			if (!text.trim() && !checkbox.checked) {
				return;
			}
			area.innerHTML = '';

			const visibleToIdentity = self.identitySelector.selectedIdentityId;
			on.emit(area, 'keyup', { bubbles: true, cancelable: true });
			this.onSendCommentEventHandler(text, visibleToIdentity, checkbox.checked);
		},
		displaySketch: function (event) {
			const tabsControl = topWnd.getViewersTabs();
			const previousTabId = tabsControl.getCurrentTabId();
			const tabId = createTempViewer(tabsControl, previousTabId);
			const viewerControl = tabsControl.getTabById(tabId).getChildren()[0];
			viewerControl.args.params.previousTab = previousTabId;

			self.getSelectViewerByTabId(tabId, function (viewer) {
				viewer.OnLoaded = function () {
					viewer.fileUrl = null;
					viewer.toolbarContainer.btnView.enable(false);
				};
				viewer.displaySketch();
				self.bindPasteEventHandler(viewerControl);
			});

			bindPreSelectTabHandler(tabsControl, tabId);
		},
		togglePreferencesPopup: function (event) {
			event.target.parentElement.classList.toggle(
				'ssvc-preferences-button-active'
			);
			// disable control if notification disabled
			let query = aras.IomInnovator.newItem('Variable', 'get');
			query.setProperty('name', 'Force.Disable.SSVC.Notifications');
			query = query.apply();
			if (query.isError()) {
				aras.AlertError(query);
				return;
			}
			preferenceDisabled = query.getProperty('value');

			const checkBoxes = event.target.parentElement.getElementsByTagName(
				'input'
			);
			for (let i = 0; i < checkBoxes.length; i++) {
				checkBoxes[i].disabled = preferenceDisabled === '1' ? true : false;
			}
		},
		toggleDisplaySettingsPopup: function (event) {
			event.target.parentElement.classList.toggle(
				'ssvc-display-settings-button-active'
			);
		},
		updatePreferencesItem: function (e) {
			const properties = {};
			properties[e.target.id] = +e.target.checked;
			aras.setPreferenceItemProperties('SSVC_Preferences', null, properties);
			aras.savePreferenceItems();
		},
		selectFile: function (fileUrl) {
			const tabsControl = topWnd.getViewersTabs();
			const previousTabId = tabsControl.getCurrentTabId();
			const tabId = createTempViewer(tabsControl, previousTabId);
			const viewerControl = tabsControl.getTabById(tabId).getChildren()[0];
			viewerControl.args.params.previousTab = previousTabId;

			self.getSelectViewerByTabId(tabId, function (viewer) {
				viewer.OnLoaded = function () {
					viewer.fileUrl = null;
					viewer.toolbarContainer.btnView.enable(false);
				};
				viewer.displaySelectedFile(fileUrl);
			});

			bindPreSelectTabHandler(tabsControl, tabId);
		}
	};

	const Feed = declare([_WidgetBase, _TemplatedMixin], {
		templateString: template,
		ReplyToolbar: null,
		FilterPopup: null,
		TopMost: null,
		messageManager: null,
		filterArr: null, //array filter = [{name:value, text:value, condition:value}...]
		_topMessageIndex: 0,
		_prevToTopMessageIsShownPartially: false,
		_scrollToMessagePending: false,
		_prevScrollTop: 0,
		_currScrollTop: 0,

		constructor: function () {
			self = this;
		},

		resize: function () {
			const con = this.MessageContainer;
			const parentCont = con.parentNode;
			con.style.height =
				parentCont.parentNode.offsetHeight -
				this.TopContainerNode.offsetHeight -
				this.ShowMoreMessages.offsetHeight +
				'px';
			this.onContainerScrollEventHandler({
				target: con,
				isDisabled: this.ShowMoreMessages.disabled,
				isMock: true
			});
			if (this.messageManager) {
				this.messageManager.correctShowBtnMore();
			}
		},

		resizeTextArea: function (event) {
			const area = event.target.parentNode.querySelector('div');
			const rect = area.getBoundingClientRect();
			var moveEvent = on(
				document,
				'mousemove',
				function (docEvent) {
					if (docEvent.button === 0) {
						const key = 'top'; //to explicitly allow "top" usage
						area.style.height = docEvent.clientY - rect[key] + 'px';
						this.resize();
					} else {
						moveEvent.remove();
					}
				}.bind(this)
			);
			on.once(document, 'mouseup', moveEvent.remove);
		},

		postCreate: function () {
			this.inherited(arguments);
			window.setTimeout(this.resize.bind(this), 0);
			window.addEventListener('resize', this.resize.bind(this));

			// may cause resize() call that uses messageManager assigned below
			ssvcUtils.fillListByName(
				'VC_MessageDisplayMode',
				this.domNode.querySelector(
					'.ssvc-toolbar .ssvc-display-settings-popup select.ssvc-toolbar-mode'
				)
			);
			ssvcUtils.fillListByName(
				'VC_MessageSortMode',
				this.domNode.querySelector(
					'.ssvc-toolbar .ssvc-display-settings-popup select.ssvc-toolbar-sorting'
				)
			);

			this.ReplyToolbar = new ReplyToolbar('ssvc-toolbar-addComment-area');
			this.ReplyToolbar.onReplyButtonClick = this.onSendReplyEventHandler;

			if (window.aras.getLanguageDirection() === 'rtl') {
				this.domNode.classList.add('text_rtl_container');
			}

			this.FilterPopup = new FilterPopup().placeAt(
				this.FilteringPopupContainer
			);
			this.FilterPopup.OnBtnSearchNodeClick = this.applyFilter.bind(this);
			this.FilterPopup.OnBtnCancelNodeClick = events.showFilterOptions.bind(
				this,
				this.FilteringPopupContainer
			);

			const userControl = new UserControl(aras);
			userControl.draw(this.UserInfoContainer);
			this.messageManager = new MessageManager(
				window.aras,
				this.MessageContainer,
				this.ReplyToolbar,
				userControl
			);

			this.own(
				on(
					this.ShowMoreMessages,
					'click',
					this.showModeMessagesEventHandler.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-filter a:click',
					this.onClickClearFilter.bind(this)
				),
				on(
					this.MessageContainer,
					'keydown',
					this.onKeyDownTopMessageMove.bind(this)
				),
				on(
					this.MessageContainer,
					'scroll',
					this.onContainerScrollEventHandler.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar-addComment-resize:mousedown',
					this.resizeTextArea.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar-addComment .arasCheckboxOrRadio:change, ' +
						'.ssvc-toolbar-addComment:not(.ssvc-messageEditor) .ssvc-toolbar-addComment-area:keyup',
					events.commentBtnState
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-display-settings-popup select.ssvc-toolbar-mode:change',
					events.changeDisplayMode.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-display-settings-popup select.ssvc-toolbar-sorting:change',
					events.changeSortingMode.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-toolbar-buttons .RefreshFeedButton:click',
					this.executeFilter.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-toolbar-buttons .MoreOptionsButton:click',
					events.showFilterOptions.bind(this, this.FilteringPopupContainer)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-toolbar-buttons .LoupeButton:click, .ssvc-toolbar .ssvc-toolbar-search input:keyup',
					events.filterMessages.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-toolbar-addComment input.btn:click',
					events.addComment.bind(this)
				),
				on(
					this.domNode,
					'.ssvc-toolbar .ssvc-toolbar-buttons .ssvc-display-settings-icon:click',
					events.toggleDisplaySettingsPopup
				)
			);

			this.messageManager.onTumbnailClick = this.onDisplayMarkupEventHandler.bind(
				this
			);
			this.messageManager.onMoreMessagesShow = this.onMoreMessagesShowEventHandler.bind(
				this
			);
			const addCommentNode = self.domNode.querySelector(
				'.ssvc-toolbar .ssvc-toolbar-addComment'
			);

			const identitySelectorPopup = new IdentitySelectorPopup();
			const identitySelector = new IdentitySelector();
			identitySelector.setPopupWidget(identitySelectorPopup);
			self.identitySelector = identitySelector;

			identitySelector.placeAt(addCommentNode);
			identitySelectorPopup.placeAt(self.domNode);

			self.attachMenu = new AttachMenu();
			self.attachMenu.onSketchButtonClick = events.displaySketch.bind(this);
			self.attachMenu.onSelectFileButtonClick = events.selectFile.bind(this);
			addCommentNode.appendChild(self.attachMenu.domNode);
			self.replyAttachMenu = new AttachMenu();
			self.replyAttachMenu.onSketchButtonClick = events.displaySketch.bind(
				this
			);
			self.replyAttachMenu.onSelectFileButtonClick = events.selectFile.bind(
				this
			);
			self.ReplyToolbar.domNode.appendChild(self.replyAttachMenu.domNode);

			self.MessageContainer.scrollTop = 0;
			ssvcUtils.setResources(feedResources, self.domNode);
			self.resize();

			Mention.init(self.domNode.querySelector('.ssvc-toolbar-addComment-area'));
		},

		load: function () {},

		onMoreMessagesShowEventHandler: function (/*bool*/ hasMoreMessages) {
			this.ShowMoreMessages.value = ssvcUtils.GetResource(
				hasMoreMessages ? 'feed_show_more_messages' : 'feed_no_secure_messages'
			);
			this.ShowMoreMessages.disabled = !hasMoreMessages;
			this.onContainerScrollEventHandler({
				target: this.MessageContainer,
				isMock: true
			});
		},

		getCurrentSortingMode: function () {
			return this.ftSortingSelector.options[
				this.ftSortingSelector.selectedIndex
			].value;
		},

		_normalizeTopMessageIndex: function (messagesCount) {
			if (this._topMessageIndex >= messagesCount) {
				this._topMessageIndex--;
			} else if (0 > this._topMessageIndex) {
				this._topMessageIndex = 0;
			}
		},

		_calculateTopMessageIndex: function (container) {
			const containerOffsetScrollTop =
				container.offsetTop + container.scrollTop;
			const messages = container.childNodes;
			const messagesCount = messages.length;
			let messageOffsetTop;
			let i;

			this._prevToTopMessageIsShownPartially = false;
			this._prevScrollTop = this._currScrollTop;
			this._currScrollTop = container.scrollTop;

			if (0 < this._currScrollTop - this._prevScrollTop) {
				//container is scrolled down
				for (i = this._topMessageIndex; i < messagesCount; i++) {
					messageOffsetTop = messages[i].offsetTop;
					if (messageOffsetTop > containerOffsetScrollTop) {
						//"top" border of this message is visible to client
						this._prevToTopMessageIsShownPartially = true;
						this._topMessageIndex = i;
						break;
					} else if (messageOffsetTop === containerOffsetScrollTop) {
						this._topMessageIndex = i;
						break;
					}
				}
			} else {
				//container is scrolled up
				if (0 === container.scrollTop) {
					//scroll is at the "top" of the container
					this._topMessageIndex = 0;
				} else {
					for (i = this._topMessageIndex; i >= 0; i--) {
						messageOffsetTop = messages[i].offsetTop;
						if (messageOffsetTop < containerOffsetScrollTop) {
							//"top" border of this message is not visible to client
							this._prevToTopMessageIsShownPartially = true;
							this._topMessageIndex = i + 1;
							break;
						} else if (messageOffsetTop === containerOffsetScrollTop) {
							this._topMessageIndex = i + 1;
							break;
						}
					}
				}
			}

			this._normalizeTopMessageIndex(messagesCount);
		},

		onContainerScrollEventHandler: function (event) {
			const container = event.target;
			const isScrollExists = container.scrollHeight > container.clientHeight;
			const isScrollPositionOnBottom =
				isScrollExists &&
				container.scrollTop === container.scrollHeight - container.offsetHeight;

			if (this._scrollToMessagePending) {
				this._scrollToMessagePending = false;
			} else if (!event.isMock) {
				this._calculateTopMessageIndex(container);
			}

			this.ShowMoreMessages.style.visibility =
				isScrollPositionOnBottom || (!isScrollExists && !container.disabled)
					? 'visible'
					: 'hidden';
		},

		showModeMessagesEventHandler: function () {
			const mode = self.getCurrentSortingMode();
			switch (mode) {
				case 'thread_date':
				case 'message_date':
					self.messageManager.showMoreMessages();
					break;
				default:
					self.messageManager.showMoreMessages(true);
					break;
			}
		},

		update: function () {
			this.messageManager.clearContainer();
			this.messageManager.showMoreMessages(false);
		},

		filterByMessageText: function () {
			this.FilterPopup.resetFields();
			const value = this.ftFilterByMessageText.value;
			if (!value) {
				return;
			}
			this.filterMessage("'" + value + "'");
			this.messageManager.setFilter({
				'@attrs': {
					type: 'SecureMessage',
					action: 'get'
				},
				comments: {
					'@attrs': {
						condition: 'like'
					},
					'@value': '%' + value + '%'
				}
			});
			this.messageManager.sortMessages(this.getCurrentSortingMode());
		},

		executeFilter: function () {
			if (!this.FilterPopup.validate()) {
				return;
			}
			let context;
			if (this.controller) {
				context = this.controller.getItem();
			}
			let filterItem = this.FilterPopup.composeFilter(context);

			const filteringMessages = this.FilterPopup.getFilteringMessages();
			const textFilter = this.ftFilterByMessageText.value.trim();
			if (textFilter) {
				filterItem = filterItem || {
					'@attrs': { type: 'SecureMessage', action: 'get' }
				};
				filteringMessages.push("'" + textFilter + "'");
				filterItem.comments = {
					'@attrs': {
						condition: 'like'
					},
					'@value': '%' + textFilter + '%'
				};
			}
			this.messageManager.setFilter(filterItem);
			if (filteringMessages.length > 0) {
				this.filterMessage(filteringMessages.join(', '));
			} else {
				this.filterMessage();
			}
			this.messageManager.sortMessages(this.getCurrentSortingMode());
		},

		refreshPanel: function () {
			this.executeFilter();
		},

		applyFilter: function (event) {
			this.executeFilter();
			events.showFilterOptions(this.FilteringPopupContainer, event);
		},

		onClickClearFilter: function () {
			this.filterMessage();
			this.FilterPopup.resetFields();

			this.messageManager.clearFilter();
			this.messageManager.sortMessages(self.getCurrentSortingMode());
		},

		filterMessage: function (message) {
			const filter = this.domNode.querySelector('div.ssvc-filter');
			if (message) {
				filter.firstChild.textContent =
					ssvcUtils.GetResource('feed_showing_filter_results') + ': ' + message;
			}
			filter.style.display = message ? 'block' : 'none';
			this.resize();
		},

		onKeyDownTopMessageMove: function (event) {
			const container = event.currentTarget;
			let messageIndexDelta;

			if (container.clientHeight !== container.scrollHeight) {
				//scrollbar is visible
				messageIndexDelta = 0;
				if (33 === event.keyCode && 0 !== container.scrollTop) {
					//PageUp pressed and scroll is not at the "top" of container
					messageIndexDelta = -1;
				} else if (
					34 === event.keyCode &&
					container.scrollTop + container.clientHeight < container.scrollHeight
				) {
					//PageDown pressed and scroll is not at the bottom of container
					if (this._prevToTopMessageIsShownPartially) {
						this._prevToTopMessageIsShownPartially = false;
					} else {
						messageIndexDelta = 1;
					}
				}

				if (33 === event.keyCode || 34 === event.keyCode) {
					this._topMessageIndex += messageIndexDelta;
					this._normalizeTopMessageIndex(container.childNodes.length);

					this._prevScrollTop = this._currScrollTop;
					this._currScrollTop = container.scrollTop;
					this._scrollToMessagePending = true;

					container.childNodes[this._topMessageIndex].scrollIntoView();
					event.preventDefault();
				}
			}
		},

		onSendReplyEventHandler: function () {
			const message = {
				text: self.ReplyToolbar.GetMessageText(),
				itemId: self.ReplyToolbar.parentMessage.itemId,
				replyToId: self.ReplyToolbar.parentMessage.id,
				itemType: self.ReplyToolbar.parentMessage.itemType,
				visibleToIdentity: self.ReplyToolbar.parentMessage.visibleToIdentityId
			};

			const secureMessage = self.sendReply(message);
			if (secureMessage) {
				const messageControl = self.messageManager.addMessage(
					secureMessage,
					true
				);
				self.messageManager.scrollToMessage(messageControl);
				self.ReplyToolbar.clearMessageText();
				self.ReplyToolbar.disableSendBtn();
				self.ReplyToolbar.setVisibility('none');
				self.ReplyToolbar.parentMessage = null;
			}
		},

		getSelectViewerByTabId: function (tabId, callback, win) {
			let tabsControl;
			if (!win) {
				if (topWnd.getViewersTabs) {
					tabsControl = topWnd.getViewersTabs();
				} else {
					const mainWin = aras.getCurrentWindow();
					tabsControl = mainWin.topWnd.getViewersTabs();
				}
			} else {
				tabsControl = win.getViewersTabs();
			}

			let viewerContainer;

			if (tabId) {
				if (tabsControl.hasTab(tabId)) {
					if (tabsControl.getCurrentTabId() !== tabId) {
						tabsControl.selectTab(tabId);
					}
					viewerContainer = tabsControl.getTabById(tabId);
				}
			} else {
				viewerContainer = tabsControl.getTabById(tabsControl.getCurrentTabId());
			}
			if (viewerContainer) {
				if (!viewerContainer.getChildren()[0]) {
					return;
				}
				if (callback) {
					const frame = viewerContainer.getChildren()[0].viewerFrame;
					if (frame && frame.contentWindow.SSVCViewer) {
						callback(frame.contentWindow.SSVCViewer);
					} else {
						aspect.after(frame.contentWindow, 'onViewerIsReady', function () {
							callback(frame.contentWindow.SSVCViewer);
						});
					}
					return true;
				} else if (viewerContainer.getChildren()[0].viewerFrame) {
					return viewerContainer.getChildren()[0].viewerFrame.contentWindow
						.SSVCViewer;
				}
			}
			return false;
		},

		_getTooltipTemplateMarker: function (markerKey, message) {
			const viewData = message.markup.getViewData();
			const viewDataDocument = aras.createXMLDocument();
			viewDataDocument.loadXML(viewData);

			const element = viewDataDocument.getElementsByTagName(markerKey)[0];

			return element ? element.textContent : null;
		},

		_createViewer: function (message, args) {
			const self = this;
			const tryToCreateSketch = function (message, args) {
				const isSketch = self._getTooltipTemplateMarker(
					'sketchTooltipTemplate',
					message
				);

				return isSketch ? new SketchViewer(args) : null;
			};
			const tryToCreateDynamicViewer = function (message, args) {
				const isDynamic = self._getTooltipTemplateMarker(
					'dynamicTooltipTemplate',
					message
				);

				return isDynamic ? new DynamicHOOPSViewer(args) : null;
			};

			return (
				tryToCreateSketch(message, args) ||
				tryToCreateDynamicViewer(message, args) ||
				new ImageViewer(args)
			);
		},

		_getViewerModuleName: function (message) {
			const self = this;
			const tryToGetSketch = function (message) {
				const isSketch = self._getTooltipTemplateMarker(
					'sketchTooltipTemplate',
					message
				);

				return isSketch ? 'Viewers/SketchViewer' : null;
			};
			const tryToGetDynamic = function (message) {
				const isDynamic = self._getTooltipTemplateMarker(
					'dynamicTooltipTemplate',
					message
				);

				return isDynamic ? 'Viewers/DynamicHoopsViewer' : null;
			};

			return (
				tryToGetSketch(message) ||
				tryToGetDynamic(message) ||
				'Viewers/ImageViewer'
			);
		}
	});

	dojo.setObject(
		'SSVC.UI.Feed.MyFeed',
		declare(Feed, {
			currentCommunityId: null,
			controller: null,
			aras: null,
			args: null,

			constructor: function (args) {
				this.args = args;
				this.id = 'MyFeed';
				this.aras = args.aras ? args.aras : window.aras;
				const itemType = args.params.itemTypeName;
				const itemId = args.params.itemID;
				this.controller =
					args.controller || this.createController(itemType, itemId);
			},

			createController: function (itemType, itemId) {
				let result = null;
				switch (itemType) {
					case 'ForumSearch':
						result = new ForumSearchController(this.aras, itemType, itemId);
						break;
					case 'ForumMessageGroup':
						result = new ForumMessageGroupController(
							this.aras,
							itemType,
							itemId
						);
						break;
					case 'Forum':
						result = new ForumController(this.aras, itemType, itemId);
						break;
					case 'TocCategory':
						result = new TocCategoryController(this.aras, itemType, itemId);
						break;
					default:
						result = new BaseController(this.aras, itemType, itemId);
						break;
				}

				if (this.FilterPopup) {
					this.FilterPopup.sourceSelectState(
						itemType !== 'TocCategory' &&
							itemType !== 'ForumMessageGroup' &&
							itemType !== 'ForumSearch'
					);
				}

				return result;
			},

			postCreate: function () {
				this.inherited(arguments);
				this.domNode.querySelector('.ssvc-toolbar').className +=
					' ssvc-toolbar-myDisscusion';
				this.MessageContainer.className +=
					' ssvc-messageContainer-myDisscusion';

				this.own(
					on(
						this.domNode,
						'.ssvc-toolbar .ssvc-toolbar-buttons .ssvc-preferences-popup:change',
						events.updatePreferencesItem
					),
					on(
						this.domNode,
						'.ssvc-toolbar .ssvc-toolbar-buttons .ssvc-preferences-button-icon:click',
						events.togglePreferencesPopup
					)
				);

				const preferencesProperties = this.domNode.querySelectorAll(
					'.ssvc-toolbar .ssvc-preferences-popup input'
				);

				for (let i = 0; i < preferencesProperties.length; i++) {
					const property = aras.getPreferenceItemProperty(
						'SSVC_Preferences',
						null,
						preferencesProperties[i].id
					);
					preferencesProperties[i].checked = window.isNaN(+property)
						? property === 'true'
						: +property;
				}

				this.attachMenu.setDisplay(false);
				this.replyAttachMenu.setDisplay(false);
			},

			load: function () {
				const itemType = this.args.params.itemTypeName;
				const itemId = this.args.params.itemID;
				const title = getFeedTitile(itemType, itemId);
				ssvcUtils.setResources(
					{
						'.ssvc-toolbar > div > label':
							ssvcUtils.GetResource('feed_title_base') +
							(title ? ' - ' + title : '')
					},
					this.domNode
				);

				function getFeedTitile(itemType, itemId) {
					if (itemType === 'ForumMessageGroup' && itemId === 'allmessages') {
						return ssvcUtils.GetResource('feed_all_messages');
					}

					const reqItem = self.aras.newIOMItem(itemType, 'get');
					reqItem.setID(itemId);
					const item = reqItem.apply();
					if (item.isError()) {
						return '';
					}

					let label;
					if (itemType === 'ForumMessageGroup') {
						if (
							item.getProperty('user_criteria_id') === self.aras.getUserID()
						) {
							return ssvcUtils.GetResource('feed_my_messages');
						} else {
							return ssvcUtils
								.GetResource('feed_created_by')
								.Format(item.getProperty('label'));
						}
					} else if (itemType === 'Forum') {
						const name =
							"'" +
							(item.getProperty('label') || item.getProperty('name')) +
							"'";
						return ssvcUtils.GetResource('feed_forum').Format(name);
					} else if (itemType === 'ForumSearch') {
						const ss =
							"'" +
							item.getPropertyItem('related_id').getProperty('label') +
							"'";
						return ssvcUtils.GetResource('feed_saved_search').Format(ss);
					}
					//ForumItem
					const it = self.aras.getItemTypeForClient(item.getType());
					label = it.getProperty('label') || it.getProperty('name');
					return label + " '" + item.getProperty('keyed_name') + "'";
				}

				function setModeOfAddCommentArea(isDisabled) {
					const addCommentNode = self.domNode.querySelector(
						'.ssvc-toolbar .ssvc-toolbar-addComment'
					);

					let itemResult;
					if (!isDisabled) {
						const currentItemRequest = aras.newIOMItem(itemType, 'get');
						currentItemRequest.setAttribute('id', itemId);
						itemResult = currentItemRequest.apply();
						itemResult = itemResult.dom.selectSingleNode('//Item');
					}
					self.identitySelector.initForItem(itemResult);

					const area = addCommentNode.querySelector(
						'.ssvc-toolbar-addComment-area'
					);
					area.innerHTML = isDisabled ? '' : area.innerHTML;
					area.readOnly = isDisabled;
					area.contentEditable = !isDisabled;
					on.emit(area, 'keyup', { bubbles: true, cancelable: true });
				}

				function setModeOfSortingSelector(isDisabled) {
					const select = self.domNode.querySelector(
						'.ssvc-toolbar .ssvc-display-settings-popup select.ssvc-toolbar-sorting'
					);
					select.selectedIndex = isDisabled ? select.length - 1 : 0;
					select.disabled = isDisabled;
					events.changeSortingMode.call(self, { target: select });
				}

				this.filterMessage();
				this.FilterPopup.resetFields();
				this.ftFilterByMessageText.value = '';
				this.messageManager.loadMessages(self.controller);
				const isFMG = 'ForumMessageGroup' === itemType;
				setModeOfAddCommentArea(isFMG || 'ForumSearch' === itemType);
				setModeOfSortingSelector(isFMG);
			},

			reload: function (args) {
				const itemType = args.itemTypeName;
				const itemId = args.itemID;
				this.args.params = args;
				this.controller = this.createController(itemType, itemId);
				this.load();
			},

			sendReply: function (message) {
				const secureMessage = this.controller.sendReply(
					message.itemType,
					message.itemId,
					message.replyToId,
					message.text,
					message.visibleToIdentity
				);
				if (!secureMessage.isError()) {
					return secureMessage;
				}

				return false;
			},

			onSendCommentEventHandler: function (textContent, visibleToIdentity) {
				const secureMessage = self.controller.sendMessage(
					textContent,
					visibleToIdentity
				);
				if (secureMessage) {
					self.messageManager.addMessage(secureMessage, true);
					self.messageManager.scrollToTop();
				}
			},

			onDisplayMarkupEventHandler: function (message) {
				if (!message.markup.item) {
					return;
				}
				const itemId = message.context.id;
				const itemTypeName = message.context.type;
				const typeItemNode = window.aras.getItemById(itemTypeName, itemId);

				let showItemResult;
				if (
					typeItemNode &&
					typeItemNode.getAttribute('discover_only') !== '1'
				) {
					showItemResult = window.aras.uiShowItemEx(typeItemNode, 'tab view');
				}
				if (typeof showItemResult !== 'object') {
					window.aras.AlertWarning(
						window.aras.getResource('', 'ssvc.secure_message.no_get_permission')
					);
					return;
				}

				showItemResult.then(function (win) {
					var listner = function () {
						win.document.removeEventListener('ssvcSideBarTabsLoaded', listner);
						const tabsControl = win.getViewersTabs();
						const viewerContainer = tabsControl.getTabById(
							message.markup.fileId
						);
						if (!viewerContainer) {
							const markupHolderTypeId = message.markup.item.getProperty(
								'markup_holder_type_id'
							);
							const params = {
								baseClass: 'dijitContentPaneNoPadding',
								style: 'height:100%;width:100%;',
								params: {
									id: null,
									fileId: message.markup.fileId,
									fileSelectorTypeId: message.markup.item.getProperty(
										'file_selector_type_id'
									),
									fileSelectorId: message.markup.item.getProperty(
										'file_selector_id'
									),
									markupMessageId: message.markup.id,
									markupHolderId: message.markup.documentId,
									markupHolderItemtypeName: window.aras.getItemTypeName(
										markupHolderTypeId
									),
									itemWindow: window
								}
							};

							const viewerModuleName = self._getViewerModuleName(message);

							//it's important to require 'ImageViewer' exactly from the 'win' (TearOff) so that both creation and adding of the elements were in the same window
							win.require([viewerModuleName], function (Viewer) {
								const viewer = new Viewer(params);
								tabsControl.createTab(viewer, message.markup.fileId);
								self.getSelectViewerByTabId(
									message.markup.fileId,
									function (viewer) {
										viewer.onActivateViewerInVersionedMode = activateViewerInVersionedMode.bind(
											self,
											viewer,
											message,
											win
										);
										viewer.setupViewerInOutOfContextMode(message);
									},
									win
								);
							});
						} else {
							self.getSelectViewerByTabId(
								message.markup.fileId,
								function (viewer) {
									viewer.setupViewer(message);

									const params = viewerContainer.getChildren()[0].args.params;
									params.markupMessageId = message.markup.id;
								},
								win
							);
						}
					};
					win.document.addEventListener('ssvcSideBarTabsLoaded', listner);
				});
			}
		})
	);

	dojo.setObject(
		'SSVC.UI.Feed.DiscussionFeed',
		declare('DiscussionFeed', Feed, {
			args: null,
			controller: null,
			aras: null,

			constructor: function (args) {
				this.args = args;
				this.id = 'DiscussionFeed';
				this.aras = args.aras || window.aras;
				const itemType = args.params.itemTypeName;
				const itemId = window.itemID;
				this.controller = new BaseController(this.aras, itemType, itemId);
			},

			reload: function (args) {
				const itemType = args.itemTypeName;
				const itemId = window.itemID;
				this.controller = new BaseController(this.aras, itemType, itemId);
				this.load();
			},

			load: function () {
				self.identitySelector.initForItem(window.item);
				self.messageManager.loadMessages(self.controller);
				self.messageManager.sortMessages(self.getCurrentSortingMode());
				const tabs = topWnd.getViewersTabs();
				tabs.onSelectTab = onSelectTabHandler;
				onSelectTabHandler(null, {
					id: topWnd.getViewersTabs().getCurrentTabId()
				});
				this.resize();

				function onSelectTabHandler(sender, args) {
					/*consider id-guid as viewer*/
					const guidRegExp = /^[0-9a-fA-F]{32}$/;
					if (guidRegExp.test(args.id)) {
						self.getSelectViewerByTabId(null, function (viewer) {
							if (
								!sender ||
								(!viewer.onMarkupModeActivate && !viewer.onViewModeActivate)
							) {
								viewer.onMarkupModeActivate = self.onMarkupModeActivateHandler.bind(
									this
								);
								viewer.onViewModeActivate = self.onViewModeActivateHandler.bind(
									this
								);
							}

							if (viewer.mode === viewer.ViewerModes.Markup) {
								self.markupCheckbox(true, viewer.isIncludeSnapshotChecked);
								self.showAttachMenu(false);
								self.setSelectedText(viewer);
							} else if (viewer.mode === viewer.ViewerModes.View) {
								self.markupCheckbox(false);
								self.showAttachMenu(true);
							}
						});
					} else {
						self.markupCheckbox(false);
						self.showAttachMenu(true);
					}
				}
			},

			onMarkupModeActivateHandler: function () {
				self.markupCheckbox(true);
				self.showAttachMenu(false);
			},

			onViewModeActivateHandler: function () {
				self.markupCheckbox(false);
				self.showAttachMenu(true);
				self.markupMessageId = undefined;
				self.getSelectViewerByTabId().args.markupMessageId = undefined;
			},

			markupCheckbox: function (show, checked) {
				const checkbox = self.domNode.querySelector(
					'.ssvc-toolbar .ssvc-toolbar-addComment input.arasCheckboxOrRadio'
				);
				checkbox.parentNode.style.display = show ? 'inline-block' : 'none';
				checkbox.checked = checked !== undefined ? checked : show;
				on.emit(checkbox, 'change', { bubbles: true, cancelable: true });
				if (show) {
					self.ReplyToolbar.showMarkupCheckbox();
				} else {
					self.ReplyToolbar.hideMarkupCheckbox();
				}
			},

			showAttachMenu: function (isDisplay) {
				this.attachMenu.setDisplay(isDisplay);
				this.replyAttachMenu.setDisplay(isDisplay);
			},

			setSelectedText: function (viewer) {
				const highlightText = viewer.getSelectedTextWithPrefix();
				if (
					viewer.onSetHighlightText &&
					highlightText !== null &&
					highlightText !== ''
				) {
					viewer.onSetHighlightText(highlightText);
				}
			},

			// When we save SecureMessage with Markup
			// this operation is asynchronous.
			sendReply: function (message) {
				function onSuccessSave(message) {
					const messageControl = self.messageManager.addMessage(message, true);
					self.messageManager.scrollToMessage(messageControl);
					self.ReplyToolbar.clearMessageText();
					self.ReplyToolbar.setVisibility('none');
					self.ReplyToolbar.parentMessage = null;
				}

				let secureMessage;

				const viewer = this.getSelectViewerByTabId();

				if (viewer && this.ReplyToolbar.doIncludeImage()) {
					//-start-VC changes
					const tabsControl = topWnd.getViewersTabs();
					const args = tabsControl
						.getTabById(tabsControl.getCurrentTabId())
						.getChildren()[0].args.params;
					if (args.markupMessageId !== undefined) {
						self.markupMessageId = args.markupMessageId;
						args.markupMessageId = undefined;
					}

					const markupObject = this._createMarkupObject(args, viewer);

					//-end-VC changes
					secureMessage = this.controller.sendMarkupReply(
						message.text,
						message.replyToId,
						markupObject,
						message.visibleToIdentity
					);
					if (secureMessage) {
						this._openViewerInCorrectMode(args, self.markupMessageId, viewer);
					}
				} else {
					if (message.text.trim() === '') {
						return;
					}

					secureMessage = this.controller.sendReply(
						message.itemType,
						message.itemId,
						message.replyToId,
						message.text,
						message.visibleToIdentity
					);

					if (!secureMessage.isError()) {
						return secureMessage;
					}
				}
				if (secureMessage) {
					onSuccessSave(secureMessage);
				}
			},

			produceSnapshotThumbnailFiles: function (fileId, pngData) {
				fileId = fileId !== undefined ? fileId : '';
				const body =
					'<file_id>' +
					fileId +
					'</file_id>' +
					'<png_data>' +
					pngData +
					'</png_data>';
				const inn = window.aras.newIOMInnovator();
				const imgItm = inn.applyMethod('VC_SaveThumbnail', body);

				if (imgItm.isError()) {
					window.aras.AlertError(imgItm.getErrorString());
					return null;
				}

				return imgItm.getResult().split(',');
			},

			// When we save SecureMessage with Markup
			// this operation is asynchronous.
			onSendCommentEventHandler: function (
				textContent,
				visibleToIdentity,
				checked
			) {
				function onSuccessSave(message) {
					self.messageManager.addMessage(message, true);
					self.messageManager.scrollToTop();
				}

				self.ReplyToolbar.style.display = 'none';
				const viewer = self.getSelectViewerByTabId();
				let secureMessage;
				if (viewer && checked) {
					//-start-VC changes
					const tabsControl = topWnd.getViewersTabs();
					const args = tabsControl
						.getTabById(tabsControl.getCurrentTabId())
						.getChildren()[0].args.params;
					if (args.markupMessageId !== undefined) {
						self.markupMessageId = args.markupMessageId;
						args.markupMessageId = undefined;
					}

					const markupObject = this._createMarkupObject(args, viewer);

					if (viewer.highlightedText) {
						markupObject.highlightedText = viewer.highlightedText;
						viewer.highlightedText = '';
					}

					//-end-VC changes
					secureMessage = self.controller.sendMarkupMessage(
						textContent,
						markupObject,
						visibleToIdentity
					);
					if (secureMessage) {
						this._openViewerInCorrectMode(args, self.markupMessageId, viewer);
					}
				} else {
					secureMessage = self.controller.sendMessage(
						textContent,
						visibleToIdentity
					);
				}
				if (secureMessage) {
					onSuccessSave(secureMessage);
				}
			},

			onDisplayMarkupEventHandler: function (message) {
				if (!message.markup.item) {
					return;
				}
				self.markupMessageId = message.markup.id;
				const hasViewer = self.getSelectViewerByTabId(
					message.markup.fileId,
					function (viewer) {
						viewer.setupViewer(message);

						const params = topWnd
							.getViewersTabs()
							.getTabById(message.markup.fileId)
							.getChildren()[0].args.params;
						params.markupMessageId = message.markup.id;
					}
				);
				if (hasViewer === false) {
					const markupHolderTypeId = message.markup.item.getProperty(
						'markup_holder_type_id'
					);

					const initParams = {
						baseClass: 'dijitContentPaneNoPadding',
						style: 'height:100%;width:100%;',
						params: {
							id: null,
							fileId: message.markup.fileId,
							fileSelectorTypeId: message.markup.item.getProperty(
								'file_selector_type_id'
							),
							fileSelectorId: message.markup.item.getProperty(
								'file_selector_id'
							),
							markupMessageId: message.markup.id,
							markupHolderId: message.markup.documentId,
							markupHolderItemtypeName: window.aras.getItemTypeName(
								markupHolderTypeId
							),
							itemWindow: window
						}
					};

					const viewer = this._createViewer(message, initParams);

					topWnd.getViewersTabs().createTab(viewer, message.markup.fileId);
					self.getSelectViewerByTabId(message.markup.fileId, function (viewer) {
						viewer.onActivateViewerInVersionedMode = activateViewerInVersionedMode.bind(
							self,
							viewer,
							message,
							window
						);
						viewer.setupViewerInOutOfContextMode(message);
					});
					bindPreSelectTabHandler(
						topWnd.getViewersTabs(),
						message.markup.fileId,
						false
					);
				}
			},

			onChangeIncludeSnapshotState: function (isChecked) {
				const viewer = self.getSelectViewerByTabId();
				if (viewer) {
					viewer.isIncludeSnapshotChecked = isChecked;
				}
			},

			bindPasteEventHandler: function (viewerControl) {
				if (viewerControl) {
					topWnd.require(
						[
							'../Modules/aras.innovator.Viewers/Scripts/Managers/PasteImageManager.js'
						],
						function () {
							const viewer = viewerControl.viewerFrame.contentWindow.SSVCViewer;
							const viewerDocument = viewerControl.viewerFrame.contentDocument;

							VC.PasteImageManager.bindPasteEventTo(document);
							VC.PasteImageManager.bindPasteEventTo(viewerDocument);
							VC.PasteImageManager.onPasteImageValidate = dojo.hitch(
								viewer,
								viewer.validatePasteImage
							);
							VC.PasteImageManager.onPasteImage = dojo.hitch(
								viewer,
								viewer.pasteImageHandler
							);
						}
					);
				}
			},

			unbindPasteEventHandler: function (viewerControl) {
				if (viewerControl) {
					topWnd.require(
						[
							'../Modules/aras.innovator.Viewers/Scripts/Managers/PasteImageManager.js'
						],
						function () {
							const viewerDocument = viewerControl.viewerFrame.contentDocument;

							VC.PasteImageManager.unbindPasteEventTo(document);
							VC.PasteImageManager.unbindPasteEventTo(viewerDocument);
						}
					);
				}
			},

			_createMarkupObject: function (args, viewer) {
				const markupObject = {
					snapshot: viewer.snapshot,
					markupData: viewer.markupData
				};

				markupObject.topMarkupMessageId = this.markupMessageId;
				markupObject.fileSelectorTypeId = args.fileSelectorTypeId;
				markupObject.fileSelectorId = args.fileSelectorId;
				markupObject.fileId = args.fileId;
				markupObject.markupHolderId = args.markupHolderId;
				markupObject.markupHolderItemtypeName = args.markupHolderItemtypeName;

				const idArray = this.produceSnapshotThumbnailFiles(
					args.fileId,
					markupObject.snapshot
				);
				const snapshotId = idArray[0];
				const thumbnailId = idArray[1];
				markupObject.thumbnail = thumbnailId;
				markupObject.snapshot = snapshotId;

				// IR-036596 "Improve handling of markup messages with no base file"
				// remove this code after this required fields(fileId, fileSelectorId, fileSelectorTypeId) were made unrequired.
				if (args.isTempViewer) {
					markupObject.fileId = snapshotId;
					markupObject.fileSelectorId = snapshotId;
					markupObject.fileSelectorTypeId = snapshotId;
				}

				return markupObject;
			},

			_openViewerInCorrectMode: function (args, markupMessageId, viewer) {
				if (args.isTempViewer) {
					const tabsControl = topWnd.getViewersTabs();
					const tabId = tabsControl.getCurrentTabId();
					self.unbindPasteEventHandler(
						tabsControl.getTabById(tabId).getChildren()[0]
					);
					tabsControl.closeTab(tabId);
					tabsControl.selectTab(args.previousTab);
				} else {
					if (markupMessageId === undefined) {
						// Dynamic assembly file is fake file item, because no real file exists.
						// So, fake URL "DynamicCadAssemblyFileUrl" is used for such files.
						if (viewer.args.fileUrl === 'DynamicCadAssemblyFileUrl') {
							viewer.clearViewState(viewer.viewStateData);
						}
						viewer.displayFile(viewer.fileUrl);
					} else {
						viewer.displayMarkup(viewer.snapshotUrl);
					}
				}
			}
		})
	);
});
