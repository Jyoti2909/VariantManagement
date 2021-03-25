define([
	'dojo/_base/declare',
	'SSVC/Scripts/UserSelect',
	'SSVC/Scripts/Utils'
], function (declare, UserSelect, ssvcUtils) {
	return declare(UserSelect, {
		popupTitle: ssvcUtils.GetResource('follow_forum_title'),
		constructor: function () {
			const listNodeHtmlTemplate =
				'	<span class="followForum-forumLabel">{{forumName}}</span>' +
				'	<span class="followForum-forumOwner">{{forumOwner}}</span>';

			this.listNodeTemplate = new dojox.dtl.Template(listNodeHtmlTemplate);
		},

		sendRequest: function () {
			const requestData = {
				Item: {
					forum_type: 'regular',
					state: 'active',
					OR: {
						label: {
							'@attrs': {
								condition: 'like'
							},
							'@value': '%' + this.nameField.value + '%'
						},
						and: {
							label: {
								'@attrs': {
									condition: 'in null'
								}
							},
							name: {
								'@attrs': {
									condition: 'like'
								},
								'@value': '%' + this.nameField.value + '%'
							}
						}
					},
					created_by_id: {
						Item: {
							'@attrs': {
								type: 'User',
								action: 'get',
								select: 'login_name'
							}
						}
					},
					Relationships: {
						Item: {
							shared_with_id: {
								'@attrs': {
									condition: 'in'
								},
								'@value': aras.getIdentityList()
							},
							'@attrs': {
								type: 'ForumSharedWith',
								action: 'get'
							}
						}
					},
					'@attrs': {
						type: 'Forum',
						action: 'get'
					}
				}
			};
			return ArasModules.soap(ArasModules.jsonToXml(requestData), {
				async: true
			});
		},

		addItemToList: function (forumdata) {
			const forumData = {
				forumName:
					aras.getItemProperty(forumdata, 'label', '') ||
					aras.getItemProperty(forumdata, 'name', ''),
				forumOwner: aras.getItemPropertyAttribute(
					forumdata,
					'created_by_id',
					'keyed_name'
				)
			};

			if (
				forumData.forumOwner ===
				aras.getItemProperty(forumdata, 'created_by_id')
			) {
				forumData.forumOwner = aras.getItemProperty(
					forumdata,
					'created_by_id/Item/login_name'
				);
			}

			const forumBlock = document.createElement('div');
			forumBlock.className = 'popupSelect-listItem followForum-listItem';

			forumBlock.innerHTML = this.listNodeTemplate.render(
				new dojox.dtl.Context(forumData)
			);
			return forumBlock;
		},

		checkFollowState: function (id) {
			return followedForumsIDs[id] ? true : false;
		},

		postListFill: function () {},

		processItem: function (index) {
			const item = this.itemsList.childNodes[index];

			if (item.classList.contains('followed')) {
				// forum already in follow list
				return;
			}

			let newForum = aras.newIOMItem('Forum', 'VC_SubscribeToForum');
			newForum.setID(item.getAttribute('data-id', ''));
			newForum.setProperty('user_id', aras.getUserID());
			newForum = newForum.apply();
			if (newForum.isError()) {
				aras.AlertError(newForum.getErrorString(), null, null, window);
			}
			this.hide();
			initializeTree();
			selectBookmark(treeControl.getSelectedId());
		}
	});
});
