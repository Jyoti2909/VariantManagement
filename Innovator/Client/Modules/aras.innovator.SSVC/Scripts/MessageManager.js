define([
	'dijit/Tooltip',
	'dojo/_base/fx',
	'./MessageControl',
	'./Utils'
], function (Tooltip, baseFx, MessageControl, ssvcUtils) {
	const ShowMode = { conversation: 0, thread: 1, flat: 2 };
	const DisplayMode = { standard: 0, review: 1 };

	function MessageManager(aras, messagesContainer, replyToolbar, userControl) {
		this.messageItems = null;
		this.context = {};
		this.showMode = ShowMode.conversation;
		this.displayMode = DisplayMode.standard;
		this.aras = aras;
		this.showCount = getDefaultPageSize(this.aras);
		this.defaultRepliesNumber = parseInt(
			this.aras.getPreferenceItemProperty(
				'SSVC_Preferences',
				null,
				'default_replies_number',
				'1'
			)
		);
		this.container = messagesContainer;
		this.replyToolbar = replyToolbar;
		this.userControl = userControl;
		this.flat = []; //array of MessageControls for all messages
		this.messages = []; //array of MessageControls for structure view
		this.shownMessagesCount = 0;

		/*manager events*/
		this.onTumbnailClick = function (message) {};

		this.onMoreMessagesShow = function (hasMoreMessages) {};
		/*end manager events*/
		const manager = this;
		const viewStateParser = new DOMParser();
		new Tooltip({
			connectId: manager.container,
			selector: '.ssvc-message .ssvc-message-thumbnail',
			position: ['below', 'above'],
			getContent: function (target) {
				const message = manager.getMessageById(
					target.closest('div.ssvc-message').id
				);
				if (message && message.classification === 'Markup') {
					if (!message.markup.tooltip) {
						const itemId = message.markup.item.getProperty('markup_holder_id');
						const itemTypeId = message.markup.item.getProperty(
							'markup_holder_type_id'
						);
						let smViewTemplate = manager.aras.newIOMItem(
							'Method',
							'VC_GetTooltipFromTooltipTemplate'
						);
						smViewTemplate.setProperty('item_type_id', itemTypeId);
						smViewTemplate.setProperty(
							'required_items',
							'File:{0},SecureMessageMarkup:{1},Item:{2},ItemType:{3}'.Format(
								message.markup.fileId,
								message.markup.id,
								itemId,
								itemTypeId
							)
						);
						smViewTemplate.setProperty(
							'tooltip_container_id',
							message.tooltipContainerId
						);
						smViewTemplate.setProperty(
							'tooltip_container_name',
							message.tooltipContainerName
						);
						smViewTemplate.setProperty(
							'tooltip_property_name',
							message.tooltipPropertyName
						);

						if (message.markup && message.markup.markupData) {
							const rootXml = viewStateParser.parseFromString(
								'<root>' + message.markup.markupData + '</root>',
								'text/xml'
							);
							//We should use alternative thumbnail's tooltip for Sketch
							const elementSketch = rootXml.getElementsByTagName(
								'sketchTooltipTemplate'
							)[0];
							if (elementSketch) {
								smViewTemplate.setProperty(
									'required_items',
									'Item:{0},ItemType:{1}'.Format(itemId, itemTypeId)
								);
								smViewTemplate.setProperty(
									'tooltip_property_name',
									'sketch_tooltip_template'
								);
							}
							// We should use alternative thumbnail's tooltip template from the resource for thumbnails made from Comparison Viewer
							// Only xPath parameters are supported for such kind of the tooltip templates now
							const element = rootXml.getElementsByTagName(
								'comparisonTooltipTemplate'
							)[0];
							if (typeof element !== 'undefined') {
								let tooltipTemplate = ssvcUtils.GetResource(
									'comparison_thumbnail_tooltip_template'
								);
								if (tooltipTemplate) {
									const criteriaList = [];
									const re = new RegExp(
										'\\${[\\w|\\w\\s|\\s\\w|\\w\\s\\w]+:@?[\\w_]+(\\(.*?\\))?}',
										'g'
									);
									const rePath = new RegExp('\\(.*\\)');
									let matches = re.exec(tooltipTemplate);
									while (matches) {
										const criteriaListItem = { OriginalCriteria: matches[0] };
										const criteria = criteriaListItem.OriginalCriteria.replace(
											/\$|\{|\}/g,
											''
										).split(':');

										let xPath = '';
										let property = criteria[1];
										if (rePath.test(criteria[1])) {
											xPath = rePath.exec(criteria[1])[0];
											property = property.replace(xPath, '');
											xPath = xPath.substr(3, xPath.length - 4);
										}
										criteriaListItem.XPath = xPath;
										criteriaListItem.Property = property;
										criteriaList.push(criteriaListItem);

										matches = re.exec(tooltipTemplate);
									}

									for (let i in criteriaList) {
										curCriteria = criteriaList[i];
										if (curCriteria.XPath) {
											const valueNode = rootXml.getElementsByTagName(
												curCriteria.XPath
											)[0];
											const value =
												valueNode !== null ? valueNode.textContent : '';

											tooltipTemplate = tooltipTemplate.replace(
												curCriteria.OriginalCriteria,
												value
											);
										}
									}

									message.markup.tooltip = tooltipTemplate;
									return message.markup.tooltip;
								}
							}
						}

						smViewTemplate = smViewTemplate.apply();
						if (smViewTemplate.isError()) {
							return false;
						}
						message.markup.tooltip = smViewTemplate.getResult();
					}
					return message.markup.tooltip;
				}
			},
			showDelay: 500
		});

		const events = {
			'.ssvc-message .ssvc-message-flag': function (message) {
				message.flagging();
			},
			'.ssvc-message .ssvc-message-bottom .ssvc-message-flagging': function (
				message
			) {
				message.setFlaggingInfoVisible();
			},
			'.ssvc-message .ssvc-message-bottom .ssvc-message-flagging-link': this
				.onFlaggedByClickEventHandler,
			'.ssvc-message:not(.forum-message) .ssvc-message-item-keyedName': this
				.onShowItemLatestVersion,
			'.ssvc-message .item-actions-button-icon': this.onActionsMenuClick,
			'.ssvc-message .item-actions-menu-node': this.onItemActionsClick,
			'.ssvc-message .ssvc-message-reply': this.onReplyLinkClickEventHandler,
			'.ssvc-message .ssvc-message-erase': this.onDeleteClickEventHandler,
			'.ssvc-message .ssvc-message-thumbnail-arrow': this
				.onTumbnailArrowClickEventHandler,
			'.ssvc-message .ssvc-message-thumbnail': function (message) {
				this.onTumbnailClick(message);
			},
			'.ssvc-message .ssvc-message-bottom .ssvc-message-replies': function (
				message,
				event
			) {
				const show = ssvcUtils.GetResource('mc_show_replies');
				const hide = ssvcUtils.GetResource('mc_hide_replies');
				const text = event.target.textContent;
				if (text === show) {
					this.showLastNReplies(message, this.defaultRepliesNumber);
				} else if (text == hide) {
					this.hideReplies(message);
				} else {
					// show all replies
					this.showReplies(message);
				}
			},
			'.ssvc-message video, .ssvc-message audio': function (message, event) {
				const media = event.target;
				const buffer = media.currentTime;
				if (media.paused) {
					//fix for FF audio, when audio unexpectedly ends when trying to play-pause-play
					if (!media.ended && media.localName == 'audio') {
						media.currentTime = 0;
						media.currentTime = buffer;
					}
					media.play();
				} else {
					media.pause();
				}
			},
			'.ssvc-message .ssvc-message-container .ssvc-message-toggle': function (
				message
			) {
				message.toggleMessageText();
			},
			'.ssvc-message .ssvc-message-bottom .ssvc-message-edit': this
				.onEditClickEventHandler,
			'.ssvc-edit-message-saved': this.onUpdateMessageHandler
		};

		document.addEventListener(
			'click',
			function (event) {
				if (event.target.closest('.ssvc-message .item-actions-button')) {
					return;
				}

				const activeButton = document.querySelector(
					'.ssvc-message .item-actions-button-active'
				);

				if (activeButton) {
					activeButton.classList.remove('item-actions-button-active');
				}
			},
			false
		);

		this.container.addEventListener(
			'click',
			function (events, event) {
				if (event.target.nodeName.toUpperCase() === 'A') {
					event.preventDefault();
				}
				Object.keys(events).forEach(function (value) {
					const e = event;
					if (e.target.matches(value)) {
						events[value].call(
							this,
							this.getMessageById(e.target.closest('div.ssvc-message').id),
							e
						);
					}
				}, this);
			}.bind(this, events)
		);

		this.container.closest('.FeedContainer').addEventListener(
			'mouseover',
			function (event) {
				const target = event.target;
				if (
					target.matches(
						'.ssvc-message .ssvc-message-userName, .ssvc-message .visibleTo, .ssvc-message .user-mention-link, .userRef .user-mention-link'
					)
				) {
					this.popupTimeout = window.setTimeout(
						function () {
							this.popupTimeout = null;
							const messageContainer = event.target.closest('div.ssvc-message');
							const message = messageContainer
								? this.getMessageById(messageContainer.id)
								: '';
							if (target.matches('.ssvc-message .ssvc-message-userName')) {
								this.onShowUserInfoEventHandler(message, event);
							} else {
								if (
									target.matches(
										'.ssvc-message .user-mention-link, .userRef .user-mention-link'
									)
								) {
									this.onShowUserMentionInfoEventHandler(message, event);
								} else {
									this.showVisibilityIndicatorPopup(message, event);
								}
							}
						}.bind(this),
						500
					);
				}
			}.bind(this)
		);
		this.container.closest('.FeedContainer').addEventListener(
			'mouseout',
			function (event) {
				if (
					event.target.matches(
						'.ssvc-message .ssvc-message-userName, .ssvc-message .visibleTo, .ssvc-message .user-mention-link, .userRef .user-mention-link'
					)
				) {
					if (this.popupTimeout) {
						window.clearTimeout(this.popupTimeout);
					}
					if (
						event.target.matches(
							'.ssvc-message .ssvc-message-userName, .ssvc-message .user-mention-link, .userRef .user-mention-link'
						)
					) {
						this.onHideUserInfoEventHandler();
					} else {
						this.container.parentNode.querySelector(
							'#visibilityIndicatorPopup'
						).style.display = '';
					}
				}
			}.bind(this)
		);

		function getDefaultPageSize(aras) {
			const itemType = aras.getItemTypeForClient('SecureMessage', 'name');
			const result = itemType.getProperty('default_page_size');
			return result ? parseInt(result) : 25;
		}
	}

	MessageManager.prototype.setDisplayMode = function MessageManagerSetDisplayMode(
		mode
	) {
		switch (mode) {
			case 'review':
				this.displayMode = DisplayMode.review;
				if (this.showMode !== ShowMode.flat) {
					setReviewMode(this.messages, true);
				} else {
					setReviewMode(this.flat, false);
				}
				break;
			default:
				//standard
				this.displayMode = DisplayMode.standard;
				if (this.showMode !== ShowMode.flat) {
					setStandardMode(this.messages, true);
				} else {
					setStandardMode(this.flat, false);
				}
				break;
		}

		function setReviewMode(messages, expandReplies) {
			for (let i = 0, count = messages.length; i < count; i++) {
				const message = messages[i];
				if (message.isDrawn && message.isShown && message.markup) {
					showSnapshot(message);
				}
				if (expandReplies) {
					setReviewMode(message.replies, expandReplies);
				}
			}
		}

		function setStandardMode(messages, expandReplies) {
			for (let i = 0, count = messages.length; i < count; i++) {
				const message = messages[i];
				if (message.isDrawn && message.isShown && message.markup) {
					showThumbnail(message);
				}
				if (expandReplies) {
					setStandardMode(message.replies, expandReplies);
				}
			}
		}
	};

	MessageManager.prototype.getMessageById = function MessageManagerGetMessageById(
		messageId
	) {
		return this.flat.find(function (message) {
			return message.id === messageId;
		});
	};

	MessageManager.prototype.getRootMessageById = function MessageManagerGetRootMessageById(
		messageId
	) {
		return this.messages.find(function (message) {
			return message.id === messageId;
		});
	};

	MessageManager.prototype.loadMessages = function MessageManagerLoadMessages(
		controller,
		filter
	) {
		function clearNotificationsForUser() {
			window.aras.UserNotification.removeMessage(window.aras.getUserID());
			let item = window.aras.newIOMItem(
				'User',
				'VCN_ClearNotificationsForUser'
			);
			item = item.apply();
			if (item.isError()) {
				window.aras.AlertError(item.getErrorString());
				return;
			}
		}

		if (!controller) {
			return;
		}
		let item = null;
		if (controller.itemId === 'allmessages') {
			clearNotificationsForUser();
		}
		if (filter) {
			item = window.aras.newIOMItem('SecureMessage', 'get');
			item.dom.loadXML(ArasModules.jsonToXml({ Item: filter }));
			item.node = item.dom.firstChild;
		}
		this.messageItems = controller.getSecureMessages(cloneItem(item));
		this.context = { controller: controller, filter: item };
		this.clearContainer();
		this.messages = [];
		this.flat = [];
		if (this.messageItems) {
			for (let id in this.messageItems.structure) {
				if (!this.messageItems.structure[id].item) {
					continue;
				}
				const control = this.createMessageControl(
					this.messageItems.structure[id]
				);
				this.messages.push(control);
				this.flat.push(control);
			}
		}
	};

	MessageManager.prototype.showMoreMessages = function MessageManagerShowMoreMessages(
		expandReplies
	) {
		const self = this;
		const initCount = this.shownMessagesCount;

		this.container.classList.toggle(
			'ssvc-containerMessage-flat',
			!(
				this.showMode === ShowMode.conversation ||
				this.showMode === ShowMode.thread
			)
		);
		if (
			this.showMode === ShowMode.conversation ||
			this.showMode === ShowMode.thread
		) {
			showMessages(this.messages, initCount, expandReplies);
		} else {
			showMessages(
				this.flat.filter(function (item) {
					if (item.fitsContext) {
						return item;
					}
				}),
				initCount,
				expandReplies
			);
		}

		function showMessages(data, initCount, expandReplies) {
			for (let i = 0, count = getCountToShow(data); i < count; i++) {
				const message = data[i + initCount];
				if (message && !message.isShown) {
					self.showMessage(message, expandReplies);
				}
			}

			self.onMoreMessagesShow(data.length > self.shownMessagesCount);
		}

		function getCountToShow(data) {
			let count = 0;
			if (data.length - self.shownMessagesCount < self.showCount) {
				count = data.length - self.shownMessagesCount;
			} else {
				count = self.showCount;
			}
			return count;
		}
	};

	MessageManager.prototype.showMessage = function MessageManagerShowMessage(
		message,
		expandReplies,
		isNew
	) {
		const isFlatMode = this.showMode === ShowMode.flat;
		const isReply = message.contextItem.id !== message.contextItem['thread_id'];
		const manager = this;
		if (
			(isFlatMode && (message.fitsContext || isReply)) ||
			(!isFlatMode && !isReply)
		) {
			showMessage(message, isFlatMode, isNew, isReply);
			message.shortenMessageText();
			if (!isFlatMode && expandReplies) {
				this.showLastNReplies(message, this.defaultRepliesNumber);
			}
		} else if (!isFlatMode && isReply) {
			showReply(message, isNew);
			message.shortenMessageText();
		}
		if (this.displayMode === DisplayMode.review && message.markup) {
			showSnapshot(message);
		} else if (message.markup) {
			showThumbnail(message);
		}

		function showMessage(message, isFlatMode, isNew, isReply) {
			if (!message.isDrawn) {
				message.draw();
				if (manager.shownMessagesCount === 0 || !isNew) {
					manager.container.appendChild(message.element);
				} else {
					manager.container.insertBefore(
						message.element,
						manager.container.firstChild
					);
				}
				if (isFlatMode) {
					let countReply = 0;
					if (isReply && isNew) {
						const parentMessage = manager.getRootMessageById(
							message.contextItem['thread_id']
						);
						if (parentMessage) {
							countReply = parentMessage.replies.length;
							setTextValueForReplyLabel(parentMessage, countReply);
						}
					} else {
						countReply = message.replies.length;
						setTextValueForReplyLabel(message, countReply);
					}
				}
			} else if (!message.isShown) {
				message.show();
			} else {
				return;
			}
			manager.shownMessagesCount++;

			function setTextValueForReplyLabel(message, countReply) {
				if (countReply > 0) {
					message.setTextValue(
						'.ssvc-message-labelReplies',
						countReply === 1 ? countReply + ' reply' : countReply + ' replies'
					);
				}
			}
		}

		function showReply(message, isNew) {
			if (!message.isDrawn) {
				const parent = manager.getRootMessageById(
					message.contextItem['thread_id']
				);
				const lastDrawnReply = getLastDrawnReply(parent.replies);
				message.draw();

				if (parent.replies.length <= 1) {
					parent.element.parentNode.insertBefore(
						message.element,
						parent.element.nextSibling
					);
				} else {
					if (lastDrawnReply) {
						if (lastDrawnReply.element.nextSibling) {
							parent.element.parentNode.insertBefore(
								message.element,
								lastDrawnReply.element.nextSibling
							);
						} else {
							parent.element.parentNode.appendChild(message.element);
						}
					} else {
						parent.element.parentNode.insertBefore(
							message.element,
							parent.element.nextSibling
						);
					}
				}
				if (isNew) {
					const visibleReplies = parent.replies.filter(function (reply) {
						return reply.isShown;
					}).length;
					manager.showLastNReplies(parent, visibleReplies);
				}
			} else {
				message.show();
			}

			function getLastDrawnReply(replies) {
				let lastIndex = -1;
				for (let i = 0, count = replies.length; i < count; i++) {
					if (replies[i].isDrawn && replies[i].isShown) {
						lastIndex = i;
					}
				}
				if (lastIndex == -1) {
					return null;
				} else {
					return replies[lastIndex];
				}
			}
		}
	};

	MessageManager.prototype.correctShowBtnMore = function () {
		this.flat.forEach(function (msgCtrl) {
			msgCtrl.resize();
		});
	};

	MessageManager.prototype.showReplies = function (/*messageControl*/ message) {
		if (!message || !message.replies || message.replies.length <= 0) {
			return;
		}
		message.replies.forEach(function (value) {
			this.showMessage(value);
		}, this);
		const linkText = ssvcUtils.GetResource('mc_hide_replies');
		message.setTextValue('.ssvc-message-replies', linkText);
	};

	MessageManager.prototype.showLastNReplies = function (
		message,
		repliesNumber
	) {
		this.showReplies(message);
		if (message.replies.length > repliesNumber) {
			for (
				let i = 0, count = message.replies.length - repliesNumber;
				i < count;
				i++
			) {
				message.replies[i].hide();
			}
			const linkText = ssvcUtils
				.GetResource('mc_show_all_replies')
				.Format(message.replies.length);
			message.setTextValue('.ssvc-message-replies', linkText);
		}
	};

	MessageManager.prototype.hideReplies = function (message) {
		if (!message || !message.replies || message.replies.length <= 0) {
			return;
		}
		for (let i = 0, count = message.replies.length; i < count; i++) {
			const reply = message.replies[i];
			if (reply.isDrawn && reply.isShown) {
				const replyEl = reply.hide();
			}
		}
		const linkText = ssvcUtils.GetResource('mc_show_replies');
		message.setTextValue('.ssvc-message-replies', linkText);
	};

	MessageManager.prototype.sortMessages = function MessageManagerSortMessages(
		mode
	) {
		this.clearContainer();
		let sortMethod = null;
		switch (mode) {
			case 'thread_date':
				sortMethod = sortMessagesDescending;
				this.showMode = ShowMode.thread;
				break;
			case 'message_date':
				sortMethod = sortMessagesDescending;
				this.showMode = ShowMode.flat;
				break;
			default:
				sortMethod = sortMessagesByConversation;
				this.showMode = ShowMode.conversation;
				break;
		}
		if (this.showMode === ShowMode.conversation) {
			sortRepliesAscending(this.messages);
			this.messages.sort(sortMethod);
			this.showMoreMessages(true);
		} else if (this.showMode === ShowMode.thread) {
			sortRepliesAscending(this.messages);
			this.messages.sort(sortMethod);
			this.showMoreMessages(true);
		} else {
			this.flat.sort(sortMethod);
			this.showMoreMessages();
		}

		function sortRepliesAscending(messages) {
			messages.forEach(function (message) {
				message.replies.sort(function sortReplies(
					messageControl1,
					messageControl2
				) {
					const date1 = messageControl1.createdOn;
					const date2 = messageControl2.createdOn;
					if (date1 < date2) {
						return -1;
					}
					if (date1 > date2) {
						return 1;
					}
					return 0;
				});
			});
		}

		function sortMessagesByConversation(messageControl1, messageControl2) {
			/*consider that latest reply is the last one*/
			const latestReply1 =
				messageControl1.replies[messageControl1.replies.length - 1];
			const latestReply2 =
				messageControl2.replies[messageControl2.replies.length - 1];
			const date1 = latestReply1
				? latestReply1.createdOn
				: messageControl1.createdOn;
			const date2 = latestReply2
				? latestReply2.createdOn
				: messageControl2.createdOn;
			if (date1 < date2) {
				return 1;
			}
			if (date1 > date2) {
				return -1;
			}
			return 0;
		}

		function sortMessagesDescending(messageControl1, messageControl2) {
			const date1 = messageControl1.createdOn;
			const date2 = messageControl2.createdOn;
			if (date1 < date2) {
				return 1;
			}
			if (date1 > date2) {
				return -1;
			}
			return 0;
		}
	};

	MessageManager.prototype.setFilter = function MessageManagerSortMessages(
		filterItem
	) {
		this.loadMessages(this.context.controller, filterItem);
	};

	MessageManager.prototype.clearFilter = function MessageManagerCleatFilter() {
		this.loadMessages(this.context.controller);
	};

	MessageManager.prototype.clearContainer = function MessageManagerClearContainer() {
		if (this.replyToolbar.domNode.parentNode) {
			this.replyToolbar.domNode.parentNode.removeChild(
				this.replyToolbar.domNode
			);
		}
		this.container.innerHTML = '';
		this.shownMessagesCount = 0;
		let message = null;
		if (this.showMode === ShowMode.conversation) {
			for (let i in this.messages) {
				message = this.messages[i];
				message.isShown = false;
				message.isDrawn = false;
				for (let j in message.replies) {
					message.replies[j].isShown = false;
					message.replies[j].isDrawn = false;
				}
			}
		} else {
			for (let k in this.flat) {
				message = this.flat[k];
				message.isShown = false;
				message.isDrawn = false;
			}
		}
	};

	MessageManager.prototype.scrollToMessage = function MessageManagerScrollToMessage(
		message
	) {
		const isFlatMode =
			this.showMode === ShowMode.conversation || ShowMode.thread ? false : true;
		if (isFlatMode) {
			this.scrollToTop();
		} else {
			message.element.scrollIntoView(false);
		}
	};

	MessageManager.prototype.scrollToTop = function MessageManagerScrollToTop() {
		this.container.scrollTop = 0;
	};

	MessageManager.prototype.addMessage = function MessageManagerAddMessage(
		message,
		doShow
	) {
		const item = { item: message, contextItem: message.items[0] };
		const parent = this.getRootMessageById(item.contextItem['thread_id']);
		let control = null;
		const self = this;
		if (parent) {
			//message is added to flat in onCreateReply
			control = parent.addReply(item);
			control.fitsContext = doesMessageFitContext(message);
			if (!parent.isDrawn) {
				self.showLastNReplies(parent, self.defaultRepliesNumber);
			}
		} else {
			control = this.createMessageControl(item);
			control.fitsContext = doesMessageFitContext(message);
			this.messages.unshift(control);
			this.flat.push(control);
		}

		if (doShow) {
			this.showMessage(control, false, true);
		}
		return control;

		function doesMessageFitContext(/*item*/ message) {
			const context = self.context;
			const messageId = message.getID();
			if (context.filter) {
				const filter = cloneItem(context.filter);
				filter.setProperty('id', messageId);
				const messages = context.controller.getSecureMessages(filter);
				return !messages.isError() && messages.getResult() !== '';
			}
			return true;
		}
	};

	MessageManager.prototype.createMessageControl = function MessageManagerCreateMessageControl(
		/*Item*/ message
	) {
		const messageControl = new MessageControl(this.aras, message);
		messageControl.onCreateReply = this.createReplyControl.bind(this);
		messageControl.initializeReplies();
		return messageControl;
	};

	MessageManager.prototype.onFlaggedByClickEventHandler = function (message) {
		message.isFlaggedByShown = !message.isFlaggedByShown;
		message.updateFlaggingInfo(message.isFlaggedByShown);
	};

	MessageManager.prototype.createReplyControl = function (replyMessage) {
		const id = replyMessage.item.getID();
		let control = this.getMessageById(id);
		if (!control) {
			control = this.createMessageControl(replyMessage);
			this.flat.push(control);
		}
		return control;
	};

	MessageManager.prototype.onShowUserInfoEventHandler = function (
		message,
		event
	) {
		this.userControl.setUser(message.userId);
		const rect = event.target.parentNode.getBoundingClientRect();
		const con = this.container.parentNode.getBoundingClientRect();

		this.userControl.container.style.left = rect.left - con.left + 'px';
		this.userControl.container.style.display = 'inline';

		if (
			con.bottom - rect.bottom >
			this.userControl.container.clientHeight / 2
		) {
			this.userControl.container.style.top =
				rect.top - con.top + rect.height + 'px';
		} else {
			this.userControl.container.style.top =
				rect.top - con.top + this.userControl.container.clientHeight / 2 + 'px';
		}
		this.userControl.show();
	};

	MessageManager.prototype.onHideUserInfoEventHandler = function () {
		this.userControl.hide();
	};

	MessageManager.prototype.showVisibilityIndicatorPopup = function (
		message,
		event
	) {
		const visibilityIndicatorPopup = this.container.parentNode.querySelector(
			'#visibilityIndicatorPopup'
		);
		const messageId = message.messageItem.getAttribute('id');
		const parentMessageId = message.messageItem.node.selectSingleNode(
			'thread_id'
		).text;
		const isReply = messageId !== parentMessageId;
		let identitiesSelector;
		if (isReply) {
			identitiesSelector =
				'Relationships/Item[@type="SecureMessageVisibilityFilter"]/related_id';
		} else {
			identitiesSelector =
				'Relationships/Item[@type="SecureMessageVisibilityFilter" and not(is_creator="1")]/related_id';
		}

		const visibilityFilterNodes = message.messageItem.node.selectNodes(
			identitiesSelector
		);

		const visibleToIdentities = Array.prototype.map
			.call(visibilityFilterNodes, function (node) {
				return node.getAttribute('keyed_name');
			})
			.join(', ');

		visibilityIndicatorPopup.innerHTML = visibleToIdentities;

		const feedContainerRect = this.container.parentNode.parentNode.getBoundingClientRect();
		const identityIconRect = event.target.getBoundingClientRect();

		visibilityIndicatorPopup.style.top =
			identityIconRect.top - feedContainerRect.top - 26 + 'px'; //26px = height of tooltip
		visibilityIndicatorPopup.style.display = 'inline';
	};

	MessageManager.prototype.onDeleteClickEventHandler = function (message) {
		message.setDisplayMode();
		if (!this.aras.confirm(ssvcUtils.GetResource('cd_message'), '')) {
			return;
		}
		const result = SSVC.ArasHelper.deleteSecureMessage(message.id);
		if (result.isError()) {
			this.aras.AlertError(result.getErrorString());
			return result;
		}
		message.update(result);
		const storedMessage = ArasModules.xmlToJson(result.node);
		message.contextItem['disabled_by_id'] = storedMessage['disabled_by_id'];
		message.contextItem['disabled_on'] = storedMessage['disabled_on'];
		if (message.isDisabled()) {
			message.setTextValue('#messageText', message.getDisabledMessageText());
			message.element.className += ' ssvc-message-disabled';
		}
		return result;
	};

	MessageManager.prototype.onEditClickEventHandler = function (message) {
		this.flat.forEach(function (messageControl) {
			if (messageControl.mode === 'edit' && messageControl.id !== message.id) {
				messageControl.setDisplayMode();
			}
		});

		if (message.mode === 'edit') {
			message.setDisplayMode();
		} else {
			message.setEditMode();
		}
	};

	MessageManager.prototype.onUpdateMessageHandler = function (message) {
		const updatedComment = message.getEditedText();

		if (!updatedComment && !message.hasAttachment()) {
			aras.AlertError(ssvcUtils.GetResource('empty_comments_error'));
			return;
		}

		return SSVC.ArasHelper.updateSecureMessage(message.id, updatedComment)
			.then(
				function (result) {
					const comment = result.selectSingleNode('Item/comments').text;
					message.setText(comment);
					message.setDisplayMode();
					message.showModifiedIndicator();
				}.bind(this)
			)
			.catch(function (errorResponse) {
				const errorResult = new SOAPResults(aras, errorResponse.responseText);
				return aras.AlertError(
					errorResult.getFaultString(),
					errorResult.getFaultDetails()
				);
			});
	};

	MessageManager.prototype.onReplyLinkClickEventHandler = function (message) {
		const manager = this;
		if (
			this.replyToolbar.getVisibility() === 'block' &&
			this.replyToolbar.domNode.parentNode
		) {
			this.replyToolbar.setVisibility('none');
			return;
		}
		this.replyToolbar.setVisibility('block');
		this.replyToolbar.parentMessage = {
			threadId: message.contextItem['thread_id'],
			itemType: message.context.type,
			itemId: message.context.id,
			id: message.id
		};
		insertNodeAfter(message, this.replyToolbar.domNode);

		const replyToolbarContainerRect = this.replyToolbar.domNode.getBoundingClientRect();
		const isVisibleContainer =
			replyToolbarContainerRect.bottom < this.container.clientHeight;
		if (!isVisibleContainer) {
			this.replyToolbar.domNode.scrollIntoView(false);
		}

		function insertNodeAfter(message, newNode) {
			if (manager.showMode === ShowMode.flat) {
				message.element.parentNode.insertBefore(
					newNode,
					message.element.nextSibling
				);
			} else {
				const parent = manager.getRootMessageById(
					message.contextItem['thread_id']
				);
				const lastDrawnReply = getLastDrawnReply(parent.replies);
				if (lastDrawnReply) {
					parent.element.parentNode.insertBefore(
						newNode,
						lastDrawnReply.element.nextSibling
					);
				} else {
					message.element.parentNode.insertBefore(
						newNode,
						message.element.nextSibling
					);
				}
			}
		}

		function getLastDrawnReply(replies) {
			let lastIndex = -1;
			for (let i = 0, count = replies.length; i < count; i++) {
				if (replies[i].isDrawn && replies[i].isShown) {
					lastIndex = i;
				}
			}
			if (lastIndex == -1) {
				return null;
			} else {
				return replies[lastIndex];
			}
		}
	};

	MessageManager.prototype.onTumbnailArrowClickEventHandler = function (
		message
	) {
		const arrow = message.element.querySelector(
			'.ssvc-message-thumbnail-arrow'
		);
		if (arrow.classList.contains('thumbnailArrowClose')) {
			showThumbnail(message);
		} else {
			showSnapshot(message);
		}
	};

	MessageManager.prototype.onShowUserMentionInfoEventHandler = function (
		message,
		event
	) {
		const userId = event.target.getAttribute('user_id');
		const userContainer = this.userControl.container;
		const parentContainer = userContainer.parentNode;

		if (userId) {
			this.userControl.setUser(userId);
			const parentCoordinates = parentContainer.getBoundingClientRect();
			const targetCoordinates = event.target.getBoundingClientRect();
			const topOffset = targetCoordinates.top - parentCoordinates.top;
			const leftOffset = targetCoordinates.left - parentCoordinates.left;

			this.userControl.show();

			userContainer.style.position = 'absolute';

			if (
				targetCoordinates.left + userContainer.offsetWidth >
				parentCoordinates.right
			) {
				userContainer.style.left =
					leftOffset - userContainer.offsetWidth / 2 + 'px';
			} else {
				userContainer.style.left = leftOffset + 'px';
			}

			if (
				targetCoordinates.top - userContainer.offsetHeight <
				parentCoordinates.top
			) {
				userContainer.style.top =
					topOffset + event.target.offsetHeight + 5 + 'px';
			} else {
				userContainer.style.top = topOffset - userContainer.offsetHeight + 'px';
			}
		}
	};

	MessageManager.prototype.onShowItemLatestVersion = function (message) {
		let id = message.context.id;
		const type = message.context.type;
		let typeId = message.context.typeId;
		if (message.context.isVersionable) {
			const item = this.aras.getItemLastVersion(type, message.context.id);
			typeId = item.getAttribute('typeId');
			id = item.getAttribute('id');
		}

		if (!this.aras.getPermissions('can_get', id, typeId, type)) {
			this.aras.AlertWarning(
				this.aras.getResource('', 'ssvc.secure_message.no_get_permission')
			);
			return;
		}

		this.aras.uiShowItem(type, id);
	};

	MessageManager.prototype.onItemActionsClick = function (message, event) {
		const actionType = event.target.getAttribute('data-action-type');
		const cui = this.aras.getMostTopWindowWithAras().cui;
		const nodes = cui.dataLoader.loadCommandBar('discussion', {
			locationName: 'discussion',
			itemId: message.context.id,
			itemTypeName: message.context.type
		});
		const props = {
			configId: message.contextItem['item_config_id'],
			keyedName: message.context.keyedName,
			itemId: message.context.id,
			itemTypeName: message.context.type,
			typeId: message.context.typeId,
			isVersionable: message.context.isVersionable
		};

		for (let i = 0, l = nodes.length; i < l; i++) {
			if (nodes[i].selectSingleNode('name').text === actionType) {
				const handler = cui.utils.getOnClickHandler(nodes[i]);

				if (handler) {
					handler(props);
				}

				break;
			}
		}

		event.target
			.closest('.ssvc-message .item-actions-button')
			.classList.remove('item-actions-button-active');
	};

	MessageManager.prototype.onActionsMenuClick = function (message, event) {
		const activeButton = event.currentTarget.querySelector(
			'.item-actions-button-active'
		);
		const target = event.target.closest('.ssvc-message .item-actions-button');

		if (activeButton && activeButton !== target) {
			activeButton.classList.remove('item-actions-button-active');
		}

		target.classList.toggle('item-actions-button-active');
	};

	function showSnapshot(message) {
		const element = message.element;
		const imgNode = element.querySelector('img.ssvc-message-thumbnail');
		const arrow = element.querySelector('.ssvc-message-thumbnail-arrow');
		if (arrow.classList.contains('thumbnailArrowClose')) {
			return;
		}

		const imageUrl = message.markup.getSnapshot();
		if (!imageUrl) {
			return;
		}
		imgNode.src = imageUrl;
		const img = new Image();
		img.onload = function () {
			const newWidth = '100%';
			const newHeight = '100%';
			img.onload = null;
			if (supportsTransitions()) {
				imgNode.style.width = newWidth;
				imgNode.style.height = newHeight;
				arrow.classList.add('thumbnailArrowClose');
				return;
			}

			baseFx
				.animateProperty({
					node: imgNode,
					properties: {
						width: newWidth,
						height: newHeight
					},
					onEnd: function () {
						arrow.classList.add('thumbnailArrowClose');
					}
				})
				.play();
		};
		img.src = imageUrl;
	}

	function supportsTransitions() {
		const b = document.body || document.documentElement;
		return typeof b.style.transition === 'string';
	}

	function showThumbnail(message) {
		const element = message.element;
		const img = element.querySelector('img.ssvc-message-thumbnail');
		const arrow = element.querySelector('.ssvc-message-thumbnail-arrow');
		if (!arrow || !arrow.classList.contains('thumbnailArrowClose')) {
			return;
		}

		const imageUrl = message.markup.getThumbnail();
		if (!imageUrl) {
			return;
		}
		if (supportsTransitions()) {
			img.style.width = '';
			img.style.height = '';
			img.src = imageUrl;
			arrow.classList.remove('thumbnailArrowClose');
			return;
		}
		baseFx
			.animateProperty({
				node: img,
				properties: {
					width: 60,
					height: 60
				},
				onEnd: function () {
					img.src = imageUrl;
					arrow.classList.remove('thumbnailArrowClose');
				}
			})
			.play();
	}

	function cloneItem(item) {
		if (item) {
			const result = this.aras.newIOMItem('', 'get');
			result.loadAML(item.dom.xml);
			return result;
		}
	}

	return MessageManager;
});
