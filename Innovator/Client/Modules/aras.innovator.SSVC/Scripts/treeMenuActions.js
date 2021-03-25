function TreeMenuActions(aras) {
	this.aras = aras;
	this.wnd = window;
}

//Open item in tear-off window and return uiShowItem result
TreeMenuActions.prototype.open = function TreeMenuActionsOpen(type, id) {
	return this.aras.uiShowItem(type, id);
};

//Do not know what it should do
TreeMenuActions.prototype.setAsDefault = function TreeMenuActionsSetAsDefault(
	type,
	id
) {
	this.aras.setPreferenceItemProperties('SSVC_Preferences', null, {
		default_bookmark: id
	});
};

//Displaying share forum dialog and return changed item or null if item doesn't changed
TreeMenuActions.prototype.share = function TreeMenuActionsShare(
	id,
	sharePagePath
) {
	const forumItemType = 'Forum';
	const worldIdentityId = 'A73B655731924CD0B027E4F4D5FCC0A9';

	const sharedItems = getSharedWithItemsByForumId(id);
	const sharedIdsArray = getSharedWithIdsArray(sharedItems);
	const currentResult = getPreviousResultByIdsArray(sharedIdsArray);

	window.parent.ArasModules.Dialog.show('iframe', {
		title: this.aras.getResource('', 'ssvc.forum.dialog.share_forum'),
		aras: this.aras,
		prevResult: copyCurrentResult(currentResult),
		dialogWidth: 330,
		dialogHeight: 150,
		resizable: false,
		content: sharePagePath
	}).promise.then(function (result) {
		if (result) {
			const merged = mergeResult(
				copyCurrentResult(currentResult),
				copyCurrentResult(result)
			);
			updateForumRelships(id, merged);
		}
	});

	function copyCurrentResult(srcRes) {
		return {
			shareType: srcRes.shareType,
			identityIds: Array.prototype.slice.call(srcRes.identityIds)
		};
	}

	function updateForumRelships(forumId, mergedResults) {
		const forum = aras.newIOMItem(forumItemType, 'edit');
		forum.setID(forumId);
		for (let i = 0, count = mergedResults.length; i < count; i++) {
			addSharedWithRelship(mergedResults[i].id, mergedResults[i].action);
		}

		function addSharedWithRelship(id, action) {
			const item = aras.newIOMItem('ForumSharedWith', action);
			if (action === 'delete') {
				item.setAttribute('id', getSharedItemIdForDelete(sharedItems, id));
			}
			item.setProperty('shared_with_id', id);
			forum.addRelationship(item);
		}

		function getSharedItemIdForDelete(/*items*/ items, id) {
			for (let i = 0, count = items.getItemCount(); i < count; i++) {
				const sharedWithId = items
					.getItemByIndex(i)
					.getProperty('shared_with_id');
				if (sharedWithId === id) {
					return items.getItemByIndex(i).getId();
				}
			}
		}

		return forum.apply();
	}

	function getSharedWithIdsArray(/*items*/ sharedWith) {
		const result = [];
		if (sharedWith.isError()) {
			return result;
		}
		for (let i = 0, count = sharedWith.getItemCount(); i < count; i++) {
			result.push(sharedWith.getItemByIndex(i).getProperty('shared_with_id'));
		}
		return result;
	}

	function getSharedWithItemsByForumId(id) {
		let shared = aras.newIOMItem('ForumSharedWith', 'get');
		shared.setProperty('source_id', id);
		shared = shared.apply();
		return shared;
	}

	function getPreviousResultByIdsArray(/*array of identity ids*/ sharedWith) {
		const curResult = { isCancelled: true };
		if (!sharedWith || sharedWith.length < 1) {
			curResult.identityIds = [];
			curResult.shareType = 'myself';
		} else if (sharedWith.length === 1) {
			const id = sharedWith[0];
			if (id === worldIdentityId) {
				curResult.shareType = 'world';
				curResult.identityIds = sharedWith;
			} else if (id === aras.getIsAliasIdentityIDForLoggedUser()) {
				curResult.shareType = 'myself';
				curResult.identityIds = sharedWith;
			} else {
				setIdentitiesShareType(sharedWith);
			}
		} else {
			setIdentitiesShareType(sharedWith);
		}

		function setIdentitiesShareType(ids) {
			curResult.shareType = 'identities';
			curResult.identityIds = ids;
		}
		return curResult;
	}

	function mergeResult(oldResult, newResult) {
		if (
			oldResult.shareType !== newResult.shareType ||
			oldResult.shareType === 'identities'
		) {
			const oldRes = oldResult.identityIds;
			const result = newResult.identityIds
				.filter(function (value) {
					const index = oldRes.indexOf(value);
					if (index !== -1) {
						oldRes.splice(index, 1);
					}
					return index === -1;
				})
				.map(function (value) {
					return { id: value, action: 'add' };
				});

			oldRes.forEach(function (value) {
				this.push({ id: value, action: 'delete' });
			}, result);
			return result;
		}
		return [];
	}
};

TreeMenuActions.prototype.unsubscribe = function TreeMenuActionsUnsubscribe(
	userId,
	forumId
) {
	let item = this.aras.newIOMItem('Forum', 'VC_UnsubscribeFromForum');
	item.setID(forumId);
	item.setProperty('user_id', userId);
	item = item.apply();

	const forumMustViewBy = item.getItemsByXPath('//Item/Relationships/Item');
	if (forumMustViewBy && forumMustViewBy.getItemCount() > 0) {
		let forumName = item.getProperty('label');
		if (!forumName) {
			forumName = item.getProperty('name');
		}
		window.aras.AlertWarning(
			window.aras
				.getResource('../Modules/aras.innovator.SSVC/', 'cant_remove_forum')
				.Format(forumName)
		);
	}

	return item;
};

//Deleting item and return result
TreeMenuActions.prototype.remove = function TreeMenuActionsRemove(type, id) {
	const item = this.aras.newIOMItem(type, 'delete');
	item.setAttribute('id', id);
	return item.apply();
};
