dojo.setObject(
	'SSVC.ArasHelper',
	(function () {
		const SecureMessageItem = function (args) {
			const secureMessageItm = window.aras.newIOMItem(
				'SecureMessage',
				args.action
			);
			secureMessageItm.structure = {};

			secureMessageItm.fill = function (messages) {
				const result = messages || secureMessageItm.apply();
				if (result.isError()) {
					window.aras.AlertError(result.getErrorString());
					return false;
				}
				const dom =
					result.dom.firstChild.nodeName === 'Result'
						? result.dom.firstChild
						: result.dom.firstChild.firstChild.firstChild;
				const items = ArasModules.xmlToJson(dom).Item || [];
				secureMessageItm.items = Array.isArray(items) ? items : [items];
				secureMessageItm.dom = result.dom;
				secureMessageItm.node = result.node;
				secureMessageItm.nodeList = result.nodeList;
				return true;
			};

			secureMessageItm.buildStructure = function (bool) {
				const parentIdsToGet = [];
				const items = secureMessageItm.items;
				for (let i = 0; i < items.length; i++) {
					const current = items[i];
					factoryMessage(current);
					const parentId = current['thread_id'];
					if (parentId === current.id) {
						if (!secureMessageItm.structure[parentId]) {
							secureMessageItm.structure[parentId] = {
								contextItem: current,
								item: secureMessageItm.getItemByIndex(i),
								replies: [],
								fitsContext: true
							};
						} else {
							secureMessageItm.structure[
								parentId
							].item = secureMessageItm.getItemByIndex(i);
							secureMessageItm.structure[parentId].contextItem = current;
							deleteFromArray(parentIdsToGet, parentId);
						}
					} else {
						if (!secureMessageItm.structure[parentId]) {
							secureMessageItm.structure[parentId] = {
								item: null,
								replies: [],
								fitsContext: true
							};
							parentIdsToGet.push(parentId);
						}
						const reply = {
							contextItem: current,
							item: secureMessageItm.getItemByIndex(i),
							fitsContext: true
						};
						secureMessageItm.structure[parentId].replies.push(reply);
					}
				}
				if (bool && parentIdsToGet.length > 0) {
					const parents = getMessagesByIds(parentIdsToGet);
					setEmptyParents(parents, secureMessageItm.structure);
				}

				function setEmptyParents(parentItems, structure) {
					const dom =
						parentItems.dom.firstChild.nodeName === 'Result'
							? parentItems.dom.firstChild
							: parentItems.dom.firstChild.firstChild.firstChild;
					let items = ArasModules.xmlToJson(dom).Item || [];
					items = Array.isArray(items) ? items : [items];
					for (let i = 0, count = parentItems.getItemCount(); i < count; i++) {
						const parent = parentItems.getItemByIndex(i);
						const item = items[i];
						factoryMessage(item);
						const id = parent.getID();
						structure[id].contextItem = item;
						structure[id].item = parent;
						structure[id].fitsContext = false;
					}
				}

				function deleteFromArray(array, item) {
					const index = array.indexOf(item);
					if (index > -1) {
						array.splice(index, 1);
					}
				}

				function getMessagesByIds(ids) {
					const messages = window.aras.newIOMItem('SecureMessage', 'get');
					messages.setAttribute('idlist', ids.join(', '));
					return messages.apply();
				}
			};

			return secureMessageItm;
		};

		const factoryMessage = function (mes) {
			mes.id = mes['@attrs'].id;
			const rel = mes.Relationships;
			if (rel) {
				const items = rel.Item.length ? rel.Item : [rel.Item];
				items.forEach(function (item) {
					if (item['@attrs'].type === 'SecureMessageFlaggedBy') {
						item.flagged = item.flagged || {};
						item.flagged[item['flagged_by_id']['@value']] = item['keyed_name'];
					}
				});
				delete mes.Relationships;
			}
		};

		return {
			factoryMessage: factoryMessage,
			getSecureMessages: function (aggregationItm, filter) {
				const itms = new SecureMessageItem({
					action: 'VC_GetMessagesForItems'
				});
				itms.setProperty('all_generations', '0');
				if (filter) {
					itms.setPropertyItem('filter', filter);
				}
				for (let i = 0; i < aggregationItm.getItemCount(); i++) {
					itms.addRelationship(aggregationItm.getItemByIndex(i));
				}

				itms.fill();
				itms.buildStructure(true);
				if (itms.isError()) {
					window.aras.AlertError(itms.getErrorString());
					return;
				}

				return itms;
			},

			newSecureMessageShell: function (defaultItm) {
				const messageItem = new SecureMessageItem({ action: 'get' });

				messageItem.fill(defaultItm);
				messageItem.buildStructure(true);
				return messageItem;
			},

			newSecureMessage: function (object) {
				/*
				 *object.itemTypeName
				 *object.itemConfigId
				 *object.itemId
				 *object.comments
				 *object.replyToId
				 *object.thumbnail
				 *object.snapshot
				 *object.markupData
				 *object.classification
				 *object.fileId
				 *object.fileSelectorTypeId;
				 *object.fileSelectorId;
				 *object.visibleToIdentity
				 */

				const secureMessage = new SecureMessageItem({ action: 'add' });
				secureMessage.setProperty('comments', object.comments);
				if (object.classification) {
					secureMessage.setProperty('classification', object.classification);
				}
				if (object.highlightedText) {
					secureMessage.setProperty('highlighted_text', object.highlightedText);
				}

				if (!object.itemTypeName || !object.itemId) {
					window.aras.AlertError(
						'Message cannot be created: not all data is set.'
					);
					return;
				} else if (!object.replyToId) {
					secureMessage.setProperty('item_id', object.itemId);
					secureMessage.setProperty('item_type_name', object.itemTypeName);
				}
				if (object.replyToId) {
					secureMessage.setProperty('reply_to_id', object.replyToId);
				} else if (object.visibleToIdentity) {
					const visibilityFilter = secureMessage.CreateRelationship(
						'SecureMessageVisibilityFilter',
						'add'
					);
					visibilityFilter.setProperty('related_id', object.visibleToIdentity);
				}

				if (object.classification && object.classification == 'Markup') {
					const markupMessageRel = window.aras.newIOMItem(
						'SecureMessageMarkup',
						'add'
					);
					markupMessageRel.setProperty('snapshot', object.snapshot);
					markupMessageRel.setProperty('thumbnail', object.thumbnail);
					markupMessageRel.setProperty('markup_data', object.markupData);

					markupMessageRel.setProperty('file_id', object.fileId);
					markupMessageRel.setProperty(
						'file_selector_type_id',
						object.fileSelectorTypeId
					);
					markupMessageRel.setProperty(
						'file_selector_id',
						object.fileSelectorId
					);
					markupMessageRel.setProperty(
						'markup_holder_id',
						object.markupHolderId
					);
					markupMessageRel.setProperty(
						'markup_holder_itemtype_name',
						object.markupHolderItemtypeName
					);
					markupMessageRel.setProperty(
						'top_markup_message_id',
						object.topMarkupMessageId
					);
					secureMessage.addRelationship(markupMessageRel);
				}

				secureMessage.fill();
				secureMessage.buildStructure();
				return secureMessage;
			},

			//args={snapshotUrl = "...", comments="...", markupData="..."}
			newDefaultMarkupMessage: function (args) {
				const snapshotUrl = args.snapshotUrl;
				const comments = args.comments;
				const markupData = args.markupData;

				const topWin = window.parent;
				const tabsControl = topWin.getViewersTabs();
				args = tabsControl
					.getTabById(tabsControl.getCurrentTabId())
					.getChildren()[0].args.params;
				const smProperties = {};
				smProperties.topMarkupMessageId = args.markupMessageId;
				smProperties.fileSelectorTypeId = args.fileSelectorTypeId;
				smProperties.fileSelectorId = args.fileSelectorId;
				smProperties.fileId = args.fileId;
				smProperties.markupHolderId = args.markupHolderId;
				smProperties.markupHolderItemtypeName = args.markupHolderItemtypeName;

				let imgItm = topWin.aras.newIOMItem('Document', 'VC_SaveThumbnail');
				imgItm.setProperty('file_id', args.fileId);
				imgItm.setProperty('png_data', snapshotUrl);
				imgItm = imgItm.apply();

				if (imgItm.isError()) {
					topWin.aras.AlertError(imgItm.getErrorString());
					return false;
				}

				const idArray = imgItm.getResult().split(',');
				const snapshotId = idArray[0];
				const thumbnailId = idArray[1];

				smProperties.thumbnail = thumbnailId;
				smProperties.snapshot = snapshotId;

				smProperties.classification = 'Markup';
				smProperties.comments = comments;
				smProperties.markupData = markupData;
				smProperties.itemId = topWin.itemID;
				smProperties.itemTypeName = topWin.itemTypeName;
				secureMessage = SSVC.ArasHelper.newSecureMessage(smProperties);
				return true;
			},

			flagSecureMessage: function (messageId, setFlagged) {
				const secureMessage = new SecureMessageItem({
					action: 'VC_UpdateFlaggedByIds'
				});
				const flagValue = setFlagged ? '1' : '-1';
				secureMessage.setID(messageId);
				secureMessage.setAttribute('flag', flagValue);
				return secureMessage.apply();
			},

			deleteSecureMessage: function (messageId) {
				const secureMessage = new SecureMessageItem({
					action: 'VC_DisableSecureMessage'
				});
				secureMessage.setID(messageId);
				return secureMessage.apply();
			},

			updateSecureMessage: function (messageId, updatedComment) {
				const secureMessage = new SecureMessageItem({ action: 'update' });
				secureMessage.setID(messageId);
				secureMessage.setProperty('comments', updatedComment);

				return ArasModules.soap(secureMessage.node.xml, { async: true });
			}
		};
	})()
);
