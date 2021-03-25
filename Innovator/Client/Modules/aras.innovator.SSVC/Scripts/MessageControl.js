define([
	'dojo/_base/declare',
	'dojo/date',
	'dojo/date/locale',
	'dojo/date/stamp',
	'dojo/i18n!dojo/cldr/nls/gregorian',
	'dojox/html/entities',
	'SSVC/Scripts/Classes/ViewSettingsManager',
	'SSVC/Scripts/Mention/MessageContentConverter',
	'SSVC/Scripts/Utils'
], function (
	declare,
	date,
	localDate,
	stamp,
	gregorian,
	entities,
	ViewSettingsManager,
	MessageContentConverter,
	ssvcUtils
) {
	return declare(null, {
		defaultFlaggedByCount: null,
		defaultMessageLinesCount: null,
		messageItem: null,
		aras: null,
		element: null,
		isDrawn: false,
		isShown: false,
		messageEditor: null,
		mode: 'display',
		storedMessageComment: null,

		constructor: function (aras, message) {
			this.defaultFlaggedByCount = window.aras.getPreferenceItemProperty(
				'SSVC_Preferences',
				null,
				'default_flagged_by_number',
				'1'
			);
			this.defaultMessageLinesCount = window.aras.getPreferenceItemProperty(
				'SSVC_Preferences',
				null,
				'messages_max_lines',
				'1'
			);
			if (!message || !message.item) {
				throw new Error(
					"SSVC.UI.MessageControl: inner exception - message argument can't be null or unefined"
				);
			}
			this.aras = aras || window.aras;
			this.contextItem = message.contextItem;
			this.messageItem = message.item;
			this.replyItems = message.replies;
			this.id = this.contextItem.id;
			this.classification = this.contextItem.classification;
			this.createdOn = this.contextItem['created_on'];

			const itemTypeName = this.contextItem['item_type_name'];
			const itemTypeItem = this.aras.getItemTypeForClient(itemTypeName, 'name');
			this.context = {
				isVersionable: itemTypeItem.getProperty('is_versionable', '') !== '0',
				revision: this.contextItem['item_major_rev'],
				generation: this.contextItem['item_version'],
				state: this.contextItem['item_state'],
				keyedName: this.contextItem['item_keyed_name'],
				typeId: this.contextItem['item_type_id'],
				type: itemTypeName,
				id: this.contextItem['item_id']
			};
			this.fitsContext = message.fitsContext !== false;
			//properties are initilized before message drawing
			this.userId = null;
			this.userKeyedName = null;
			this.file = null;
			this.replies = [];
			this.messageContentConverter = new MessageContentConverter();
			this.isInitialized = false;
			this.storedMessageComment = message.item.getProperty('comments');
		},

		initializeReplies: function () {
			if (this.replyItems) {
				for (let i = 0, count = this.replyItems.length; i < count; i++) {
					const replyControl = this.onCreateReply(this.replyItems[i]);
					this.replies.push(replyControl);
				}
			}
		},

		flagging: function () {
			const currentUser = this.aras.getUserID();
			let flaggingIds = this.getUserIDsFlaggedBy();
			let isFlagging = flaggingIds.indexOf(currentUser) > -1;
			const result = SSVC.ArasHelper.flagSecureMessage(
				this.contextItem.id,
				!isFlagging
			);
			if (result.isError()) {
				this.aras.AlertError(result.getErrorString());
				return result;
			}
			this.messageItem = result;
			flaggingIds = this.getUserIDsFlaggedBy();
			isFlagging = flaggingIds.indexOf(currentUser) > -1;

			const el = this.element.querySelector('.ssvc-message-flagging');
			el.classList.toggle('ssvc-message-flaggingGray', !flaggingIds.length);
			el.textContent = flaggingIds.length || '';
			this.updateFlaggingInfo();
			this.element.querySelector('.ssvc-message-flag').textContent = isFlagging
				? 'Unflag'
				: 'Flag';
		},

		updateFlaggingInfo: function (flaggedShown) {
			const element = this.element.querySelector('.ssvc-message-flagging-info');
			const names = this.getUsersFlaggedBy();
			if (!names.length) {
				element.classList.add('aras-hide');
				return;
			}
			const count = Math.min(
				flaggedShown ? names.length : this.defaultFlaggedByCount,
				names.length
			);
			const flaggedByNames = names
				.slice(0, count)
				.map(function (flaggedByModel) {
					const name = entities.encode(flaggedByModel.label);
					if (flaggedByModel.isRestricted) {
						return (
							'<span class="ssvc-message-flagging-user-restricted">' +
							name +
							'</span>'
						);
					}
					return name;
				})
				.join(', ');
			element.querySelector('label').innerHTML = 'Flagged by ' + flaggedByNames;
			if (count === names.length) {
				element.querySelector('a').textContent =
					flaggedShown && count > this.defaultFlaggedByCount
						? 'Hide users'
						: '';
			} else {
				element.querySelector('a').textContent =
					'and ' + (names.length - count) + ' others';
			}
		},

		setFlaggingInfoVisible: function () {
			if (!this.getUserIDsFlaggedBy().length) {
				return;
			}
			this.element
				.querySelector('.ssvc-message-flagging-info')
				.classList.toggle('aras-hide');
		},

		//events
		onCreateReply: function (replyItem) {},

		//loads all data for message from server
		initialize: function () {
			const aras = this.aras;
			if (!this.isInitialized) {
				const viewSettingsManager = new ViewSettingsManager({ aras: aras });
				this.settings = viewSettingsManager.getMessageControlViewSettings({
					itemTypeName: this.contextItem['item_type_name'],
					configId: this.contextItem['item_config_id'],
					itemId: this.contextItem['item_id']
				});
				this.userId = this.messageItem.getProperty('created_by_id', '');
				const userItem = this.messageItem.getPropertyItem('created_by_id');
				this.userKeyedName = this.messageItem.getPropertyAttribute(
					'created_by_id',
					'keyed_name',
					''
				);
				if (userItem.getID() === this.userKeyedName) {
					this.userKeyedName = userItem.getProperty(
						'login_name',
						this.userKeyedName
					);
					if (this.userKeyedName === this.aras.getUserID()) {
						this.userKeyedName = this.aras.getLoginName();
					}
				}
				if (!this.isDisabled()) {
					if (this.classification === 'Markup') {
						this.markup = getMarkupInfo(this.messageItem);
					} else if (this.classification === 'Video') {
						this.media = getMediaInfo(this.messageItem, 'SecureMessageVideo');
					} else if (this.classification === 'Audio') {
						this.media = getMediaInfo(this.messageItem, 'SecureMessageAudio');
					}
				}
				this.isInitialized = true;
			}

			function getMediaInfo(message, typeName) {
				return getSecureMessageMedia(message, typeName);

				function getSecureMessageMedia(message, relshipTypeName) {
					const smMedia = message.getRelationships(relshipTypeName);
					let media = null;
					let result = null;
					if (smMedia.nodeList.length === 0) {
						media = getItemBySourceId(relshipTypeName, message.getID());
					} else {
						media = smMedia.getItemByIndex(0);
					}
					if (media && !media.isError()) {
						result = {
							id: media.getID(),
							item: media,
							file: getFileInfo(getMediaFileItem(media))
						};
					}
					return result;
				}

				function getFileInfo(/*item*/ file) {
					if (file && !file.isError()) {
						const filename = file.getProperty('filename', '');
						return {
							id: file.getID(),
							item: file,
							mimeType: file.getProperty('mimetype', ''),
							name: filename,
							extension: filename.split('.').pop(),
							getUrl: function () {
								return aras.IomInnovator.getFileUrl(
									file.getID(),
									aras.Enums.UrlType.SecurityToken
								);
							}
						};
					} else {
						return null;
					}
				}

				function getMediaFileItem(smMedia) {
					//TODO: try to get media file from current structure without additional request
					const fileId = smMedia.getProperty('media_file', '');
					if (fileId) {
						const file = aras.newIOMItem('File', 'get');
						file.setID(fileId);
						return file.apply();
					} else {
						return null;
					}
				}
			}

			function getMarkupInfo(message) {
				return getSecureMessageMarkup(message);

				function getSecureMessageMarkup(/*item*/ message) {
					const smMarkup = message.getRelationships('SecureMessageMarkup');
					let markup = null;
					let result = null;
					if (smMarkup.nodeList.length === 0) {
						markup = getItemBySourceId('SecureMessageMarkup', message.getID());
					} else {
						markup = smMarkup.getItemByIndex(0);
					}

					if (markup && !markup.isError() && markup.getResult()) {
						result = {
							id: markup.getID(),
							getThumbnail: function () {
								return getImageUrl(
									'vault:///?fileId=' + markup.getProperty('thumbnail', '')
								);
							},
							getSnapshot: function () {
								return getImageUrl(
									'vault:///?fileId=' + markup.getProperty('snapshot', '')
								);
							},
							markupData: markup.getProperty('markup_data', ''),
							fileId: markup.getProperty('file_id'),
							documentId: markup.getProperty('markup_holder_id'),
							item: markup
						};
					}
					if (!markup.getResult()) {
						result = {
							id: false,
							getThumbnail: getAccessDeniedImage,
							getSnapshot: getAccessDeniedImage,
							markupData: null,
							fileId: null,
							documentId: null,
							item: null,
							tooltip: aras.getResource(
								'',
								'ssvc.secure_message.snapshot_access_restricted'
							)
						};
					}
					result.getViewData = restoreViewDataFromMarkupData;
					return result;
				}
				function getAccessDeniedImage() {
					return aras.getBaseURL() + '/images/AccessDenied.png';
				}
				function getImageUrl(imageValue) {
					if (!imageValue) {
						return imageValue;
					}
					let result = imageValue;
					if (result.toLowerCase().indexOf('vault:///?fileid=') !== -1) {
						const fileId = result.replace(/vault:\/\/\/\?fileid\=/i, '');
						result = aras.IomInnovator.getFileUrl(
							fileId,
							aras.Enums.UrlType.SecurityToken
						);
					}
					return result;
				}
				function restoreViewDataFromMarkupData() {
					if (!this.markupData) {
						return;
					}

					const viewStateParser = new DOMParser();
					const viewStateSerializer = new XMLSerializer();
					const xmlData = viewStateParser.parseFromString(
						'<root>' + this.markupData + '</root>',
						'text/xml'
					);
					const viewState = xmlData.getElementsByTagName('view_state')[0];
					return viewStateSerializer.serializeToString(viewState);
				}
			}

			function getItemBySourceId(type, id) {
				const item = aras.newIOMItem(type, 'get');
				item.setProperty('source_id', id);
				return item.apply();
			}
		},

		//methods
		draw: function () {
			this.initialize();
			this.element = SSVC.ArasHelper.TemplateHandler(this, this.contextItem);
			const isMessageDisabled = this.isDisabled();
			if (!isMessageDisabled) {
				this.updateFlaggingInfo();
				this.setFlaggingInfoVisible();
			} else {
				this.hideModifiedIndicator();
			}
			if (
				!isMessageDisabled &&
				!(this.userId === this.aras.getUserID() || this.aras.isAdminUser())
			) {
				this.setElementDisplay('.ssvc-message-erase', 'none');
			}
			if (!isMessageDisabled && this.userId !== this.aras.getUserID()) {
				this.setElementDisplay('.ssvc-message-edit', 'none');
			}
			if (!isMessageDisabled && this._isModified()) {
				this.showModifiedIndicator();
			} else {
				this.hideModifiedIndicator();
			}

			this.isDrawn = true;
			this.isShown = true;
			return this.element;
		},

		show: function () {
			if (this.isDrawn && !this.isShown) {
				this.element.style.display = 'block';
				this.isShown = true;
			}
		},

		hide: function () {
			if (this.isDrawn && this.isShown) {
				this.element.style.display = 'none';
				this.isShown = false;
			}
		},

		_isModified: function () {
			// we have to aproximate difference bettween modifiedOn and createdOn,
			// because sometimes when we are creating item, item is created with little difference
			// between this values (less then 1 second)
			const createdOn = new Date(this.messageItem.getProperty('created_on'));
			const modifiedOn = new Date(this.messageItem.getProperty('modified_on'));
			return modifiedOn !== createdOn && (modifiedOn - createdOn) / 1000 > 1;
		},

		addReply: function (/*item*/ message) {
			const reply = this.onCreateReply(message);
			this.replies.push(reply);
			return reply;
		},

		update: function (message) {
			this.messageItem = message;
			this.classification = message.getProperty('classification', '');
		},
		toggleMessageText: function () {
			let msgElem;
			let lineHeight;
			let toggleBtn;
			let isPlaced;

			msgElem = this.element.querySelector('.ssvc-message-text');

			if (!msgElem) {
				return;
			}

			lineHeight = this.getFontSizesOf(msgElem).lineHeight;
			toggleBtn = this.element.querySelector('.ssvc-message-toggle');

			// 2nd condition is needed to hide the string entirely if it doesn't fit partially
			isPlaced = !(
				msgElem.offsetHeight < msgElem.scrollHeight &&
				msgElem.scrollHeight - msgElem.offsetHeight > lineHeight
			);
			if (isPlaced) {
				msgElem.style.maxHeight =
					lineHeight * this.defaultMessageLinesCount + 'em';
				toggleBtn.innerHTML = ssvcUtils.GetResource('short_more');
				toggleBtn.classList.remove('ssvc-message-toggle-disclosed');
			} else {
				msgElem.style.maxHeight = '';
				toggleBtn.innerHTML = ssvcUtils.GetResource('short_less');
				toggleBtn.classList.add('ssvc-message-toggle-disclosed');
			}
		},

		_hideToggleBtn: function () {
			const toggleBtn = this.element.querySelector('.ssvc-message-toggle');
			toggleBtn.style.display = 'none';
		},

		_addMessageEditorToControl: function () {
			this.messageEditor = new SSVC.UI.MessageEditor();
			const messageContainer = this.element.querySelector(
				'.ssvc-message-container'
			);
			messageContainer.appendChild(this.messageEditor.element);
		},

		hideModifiedIndicator: function () {
			const indicator = this.element.querySelector('.ssvc-message-modified');
			indicator.style.display = 'none';
		},

		showModifiedIndicator: function () {
			const indicator = this.element.querySelector('.ssvc-message-modified');
			indicator.style.display = 'inline-block';
		},

		hasAttachment: function () {
			return (
				this.messageItem
					.getRelationships('SecureMessageMarkup')
					.getItemCount() > 0 ||
				this.messageItem.getRelationships('SecureMessageAudio').getItemCount() >
					0 ||
				this.messageItem.getRelationships('SecureMessageVideo').getItemCount() >
					0
			);
		},

		getEditedText: function () {
			return this.messageContentConverter.parseFromHtml(
				this.messageEditor.textContainer
			);
		},

		setText: function (text) {
			this.storedMessageComment = text;
			const msgElem = this.element.querySelector('.ssvc-message-text');
			msgElem.innerHTML = this.messageContentConverter.convertIntoHtml(text);
		},

		setEditMode: function () {
			if (!this.messageEditor) {
				this._addMessageEditorToControl();
			}

			this._hideToggleBtn();
			const msgElem = this.element.querySelector('.ssvc-message-text');
			const messageToEdit = this.messageContentConverter.convertIntoEditableHtml(
				this.storedMessageComment
			);
			this.messageEditor.setMessageText(messageToEdit);
			this.messageEditor.setVisibility(true);
			msgElem.style.display = 'none';
			this.mode = 'edit';
		},

		setDisplayMode: function () {
			if (!this.messageEditor) {
				return;
			}

			const msgElem = this.element.querySelector('.ssvc-message-text');
			this.messageEditor.setVisibility(false);
			this.messageEditor.setMessageText('');
			msgElem.style.display = 'block';
			this.resize();
			this.mode = 'display';
		},

		/**
		 * invoked at comments initialization and their replies
		 */
		shortenMessageText: function () {
			if (!this.isShown || !this.element) {
				return;
			}
			const msgElem = this.element.querySelector('.ssvc-message-text');
			const toggleBtn = this.element.querySelector('.ssvc-message-toggle');
			if (
				toggleBtn &&
				toggleBtn.textContent !== ssvcUtils.GetResource('short_less')
			) {
				toggleBtn.textContent = ssvcUtils.GetResource('short_more');

				const lineHeight = this.getFontSizesOf(msgElem).lineHeight;
				msgElem.style.maxHeight =
					lineHeight * this.defaultMessageLinesCount + 'em';
				// 2nd condition is needed to hide the string entirely if it doesn't fit partially
				const isFit = !(
					msgElem.offsetHeight < msgElem.scrollHeight &&
					msgElem.scrollHeight - msgElem.offsetHeight > lineHeight
				);
				if (isFit) {
					toggleBtn.style.display = 'none';
				}
			}
		},
		resize: function () {
			if (
				this.element &&
				!this.element.classList.contains('disabled') &&
				!this.element.classList.contains('ssvc-message-disabled')
			) {
				const msgElem = this.element.querySelector('.ssvc-message-text');
				const textSizes = this.getFontSizesOf(msgElem);
				const toggleBtn = this.element.querySelector('.ssvc-message-toggle');
				// 1px - padding-bottom in css IE fix
				const maxHeight =
					textSizes.lineHeight *
						textSizes.fontSize *
						this.defaultMessageLinesCount +
					1;
				// 2nd condition is needed to hide the string entirely if it doesn't fit partially
				const isPlaced = !(
					msgElem.offsetHeight < msgElem.scrollHeight &&
					msgElem.scrollHeight - msgElem.offsetHeight > textSizes.lineHeight
				);
				// needed for correctly show and hide buttons "more" in state "...More"
				const isFoldedAndPlaced =
					isPlaced &&
					!toggleBtn.classList.contains('ssvc-message-toggle-disclosed');
				// needed for correctly show and hide buttons "More" in state "Less"
				const isDetailedAndPlaced =
					isPlaced && msgElem.offsetHeight <= maxHeight;
				if (isFoldedAndPlaced || isDetailedAndPlaced) {
					toggleBtn.style.display = 'none';
				} else {
					toggleBtn.style.display = '';
				}
			}
		},
		getFontSizesOf: function (msgElem) {
			let lineHeight = window
				.getComputedStyle(msgElem)
				.getPropertyValue('line-height');
			const fontSize = parseFloat(
				getComputedStyle(msgElem).getPropertyValue('font-size')
			);

			// detects "px" because "getComputedStyle" may transform the most types values
			// except types with text: "1.4", "0.3", "12.1" etc. (normal behavior)
			if (lineHeight.indexOf('px') !== -1) {
				lineHeight = parseFloat(lineHeight) / fontSize;
			} else if (lineHeight === 'normal') {
				// detects "normal" (analogously with previous "px") (only for IE9 behavior)
				lineHeight = 1;
			} else if (lineHeight.match(/[^\d*\.?\d*]/g) === null) {
				// detects types values with clear number (only for IE9 behavior)
				lineHeight = parseFloat(lineHeight);
			}

			return {
				lineHeight: lineHeight,
				fontSize: fontSize
			};
		},
		setTextValue: function (selector, value) {
			const element = this.element
				? this.element.querySelector(selector)
				: null;
			if (element) {
				element.textContent = value;
			}
		},

		setElementDisplay: function (selector, mode) {
			const element = this.element.querySelector(selector);
			if (element) {
				element.style.display = mode;
			}
		},

		isFlaggedByUser: function (/*string*/ userId) {
			return this.getUserIDsFlaggedBy().indexOf(userId) > -1;
		},

		isDisabled: function () {
			return ['disabled_on', 'disabled_by_id'].some(function (propertyName) {
				const property = this[propertyName];
				const hasValue =
					property &&
					(property['@value'] ||
						!property['@attrs'] ||
						property['@attrs']['is_null'] === '0');

				return hasValue;
			}, this.contextItem);
		},

		getDate: function (dt) {
			const dtDate = stamp.fromISOString(dt);
			const now = new Date();
			const corporateTime = this.aras.getCorporateToLocalOffset();
			if (corporateTime) {
				now.setUTCMinutes(now.getUTCMinutes() + corporateTime);
			}
			const day = date.difference(dtDate, now);
			let datePattern;
			if (day === 0) {
				datePattern = "'" + gregorian['field-day-relative+0'] + "'";
			} else if (day === 1) {
				datePattern = "'" + gregorian['field-day-relative+-1'] + "'";
			} else {
				const year = date.difference(dtDate, now, 'year');
				datePattern = year === 0 ? 'MMMM dd' : 'MMMM dd, yyyy';
			}
			return localDate.format(dtDate, {
				datePattern: datePattern,
				formatLength: 'full',
				timePattern: gregorian['timeFormat-short']
			});
		},

		getSendDate: function () {
			return this.getDate(this.createdOn);
		},

		getDisabledMessageText: function () {
			return this.aras.getResource(
				'',
				'ssvc.secure_message.disabled',
				this.getDate(this.contextItem['disabled_on'])
			);
		},

		getUsersFlaggedBy: function () {
			const result = [];
			const currentUserId = this.aras.getUserID();
			const flaggedByRels = this.messageItem.getRelationships(
				'SecureMessageFlaggedBy'
			);
			for (let i = 0; i < flaggedByRels.nodeList.length; i++) {
				const current = flaggedByRels.getItemByIndex(i);
				const flaggedById = current.getProperty('flagged_by_id');
				const isRestricted =
					current.getPropertyAttribute('flagged_by_id', 'is_null') === '0';

				if (flaggedById === currentUserId) {
					result.unshift({
						label: this.aras.getResource('', 'ssvc.message_flagging_you'),
						isRestricted: false
					});
				} else if (flaggedById) {
					const keyedName = current.getProperty('keyed_name');
					result.push({
						label: keyedName,
						isRestricted: false
					});
				} else if (isRestricted) {
					result.push({
						label: this.aras.getResource(
							'',
							'common.restricted_property_warning'
						),
						isRestricted: true
					});
				} else {
					throw new Error('Incorrect value of flagged_by_id property');
				}
			}

			return result;
		},

		/**
		 * Returns ids of Users that flagged message.
		 * When access to User is restricted User id is empty string.
		 *
		 * @returns {string[]}
		 */
		getUserIDsFlaggedBy: function () {
			const result = [];
			const flaggedByRels = this.messageItem.getRelationships(
				'SecureMessageFlaggedBy'
			);
			for (let i = 0; i < flaggedByRels.nodeList.length; i++) {
				result.push(
					flaggedByRels.getItemByIndex(i).getProperty('flagged_by_id')
				);
			}
			return result;
		},

		getHtmlMessage: function (messageText) {
			return this.messageContentConverter.convertIntoHtml(messageText);
		}
	});
});
