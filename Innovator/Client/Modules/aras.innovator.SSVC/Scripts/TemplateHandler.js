dojo.setObject(
	'SSVC.ArasHelper.TemplateHandler',
	(function (params, $) {
		function getVisibleToIdentityContext(identityId) {
			const imagesFolderUrl = aras.getBaseURL() + '/../images/';
			let isWorld = false;
			let iconName;
			if (identityId === 'A73B655731924CD0B027E4F4D5FCC0A9') {
				//worldId
				iconName = 'World.svg';
				isWorld = true;
			} else {
				let identityRequest = aras.newIOMItem('identity', 'get');
				identityRequest.setAttribute('id', identityId);
				identityRequest.setAttribute('select', 'is_alias');
				identityRequest = identityRequest.apply();
				const isAlias =
					identityRequest.dom.selectSingleNode('//Item/is_alias').text === '1';
				iconName = isAlias ? 'User.svg' : 'Group.svg';
			}

			return { isWorld: isWorld, src: imagesFolderUrl + iconName };
		}

		var aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;
		let Item;
		let smTemplate;
		let id;
		if (params && params.itemTypeName && params.itemID) {
			Item = {
				Item: {
					'@attrs': {
						type: params.itemTypeName,
						action: 'VC_GetSecureMessageViewTemplate',
						select: 'template',
						id: params.itemID
					},
					markup_holder_config_id: params.item.getProperty('config_id')
				}
			};
		} else {
			// F1E9620C1AB3408588708B68E18D51DE - id of DefaultSMTemplate.
			Item = {
				Item: {
					'@attrs': {
						type: 'SecureMessageViewTemplate',
						action: 'get',
						select: 'template',
						id: 'F1E9620C1AB3408588708B68E18D51DE'
					}
				}
			};
		}

		let tooltipContainerId;
		require(['dojox/dtl', 'dojox/dtl/Context'], function () {
			$.soap($.jsonToXml(Item))
				.then($.xmlToJson)
				.then(
					function (json) {
						smTemplate = new dojox.dtl.Template(json.Item.template);
						tooltipContainerId = json.Item['@attrs'].id;
					},
					function () {
						aras.AlertError(
							'The Secure Messages loading is failed - SecureMessageViewTemplate item is not exist'
						);
					}
				);
		});

		function getMessageContent(message, contextItem) {
			if (message.isDisabled()) {
				return message.getDisabledMessageText();
			} else {
				const comments = getCommentContent(contextItem.comments);
				const content = message.getHtmlMessage(comments);
				const builder = new dojox.string.Builder();
				builder.safe = true;
				builder.append(content);
				return builder;
			}
		}

		function getCommentContent(comment) {
			if (typeof comment === 'object') {
				if (typeof comment['@value'] === 'string') {
					return comment['@value'];
				}
				return '';
			}
			return comment;
		}

		const tooltipContainerName = 'SecureMessageViewTemplate';
		const tooltipPropertyName = 'thumbnail_tooltip_template';
		const actionsMenuData = getActionsMenuData();

		return function (message, contextItem) {
			const smElement = document.createElement('div');
			if (!smTemplate) {
				return smElement;
			}
			const isDisabled = message.isDisabled();
			smElement.id = contextItem.id;
			smElement.className = 'ssvc-message';
			smElement.className +=
				contextItem['item_type_name'] == 'Forum' ? ' forum-message' : '';
			smElement.className +=
				contextItem.classification === 'History' ? ' ssvc-message-history' : '';
			smElement.className += isDisabled ? ' ssvc-message-disabled' : '';
			smElement.className +=
				contextItem['thread_id'] !== contextItem.id
					? ' ssvc-message-reply'
					: '';
			smElement.className +=
				!message.fitsContext && !isDisabled ? ' disabled' : '';

			const visibilityFilterNd = message.messageItem.node.selectSingleNode(
				"Relationships/Item[@type='SecureMessageVisibilityFilter' and not(is_creator='1')]/related_id"
			);
			smElement.innerHTML = smTemplate.render(
				new dojox.dtl.Context({
					message: getMessageContent(message, contextItem),
					type:
						contextItem.classification === 'Audio' ||
						contextItem.classification === 'Video'
							? 'Media'
							: contextItem.classification,
					sourceMessage: getMediaContentObject(message),
					time: message.getSendDate(),
					sourceDataKeyedName: contextItem['item_keyed_name'] || 'empty',
					sourceDataIconNode: message.settings.itemTypeIcon,
					sourceDataTypeLineStyle: message.settings.style || '',
					itemInfo: [
						contextItem['item_major_rev'],
						message.context.isVersionable ? contextItem['item_version'] : '',
						typeof contextItem['item_state'] == 'string'
							? contextItem['item_state']
							: ''
					]
						.filter(function (value) {
							return !!value;
						})
						.join(' - '),
					userName: message.userKeyedName,
					flagsCount: message.getUserIDsFlaggedBy().length || '',
					flagLabel: message.isFlaggedByUser(aras.getUserID())
						? 'Unflag'
						: 'Flag',
					visibleToIdentity: getVisibleToIdentityContext(
						visibilityFilterNd
							? visibilityFilterNd.text
							: 'A73B655731924CD0B027E4F4D5FCC0A9'
					),
					actions: message.context.type !== 'Forum' && actionsMenuData
				})
			);
			message.tooltipContainerId = tooltipContainerId;
			message.tooltipContainerName = tooltipContainerName;
			message.tooltipPropertyName = tooltipPropertyName;

			return smElement;

			function getMediaContentObject(message) {
				let sourceMessage = null;
				let media = null;
				if (message.isDisabled()) {
					return;
				}
				switch (contextItem.classification) {
					case 'Markup':
						if (message.markup) {
							sourceMessage = {
								hasSnapshot: message.markup.id !== false,
								file: message.markup.getThumbnail()
							};
						}
						break;
					case 'Video':
						media = message.media;
						if (
							['mp4', 'webm', 'ogg'].indexOf(
								media.file.extension.toLowerCase()
							) !== -1
						) {
							sourceMessage = {
								sourceType: 'video',
								file: media.file.getUrl(),
								type: 'video/' + media.file.extension
							};
						}
						break;
					case 'Audio':
						media = message.media;
						if (
							['mp3', 'wav', 'ogg'].indexOf(
								media.file.extension.toLowerCase()
							) !== -1
						) {
							sourceMessage = {
								sourceType: 'audio',
								file: media.file.getUrl(),
								type: 'audio/' + media.file.extension
							};
						}
						break;
				}
				return sourceMessage;
			}
		};

		function getActionsMenuData() {
			const cui = aras.getMostTopWindowWithAras().cui;
			const items = cui.dataLoader.loadCommandBar('discussion', {
				locationName: 'discussion'
			});

			// items.nodeList - could be "like array" object
			return Array.prototype.map.call(items, function (cuiItem) {
				const cuiItemName = cuiItem.selectSingleNode('name').text;
				const cuiItemLabelNode = cuiItem.selectSingleNode('label');

				return {
					type: cuiItemName,
					value: cuiItemLabelNode ? cuiItemLabelNode.text : cuiItemName
				};
			});
		}
	})(window.params, ArasModules)
);
