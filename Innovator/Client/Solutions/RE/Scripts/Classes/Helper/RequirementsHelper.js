define([
	'dojo/_base/declare',
],
function(declare) {
	return declare('Aras.Client.Controls.RE.Helper.RequirementsHelper', null, {
		_aras: null,
		_itemWithReqs: null,
		_requirementsCache: null,
		_statesNotAllowedForUpdate: null,

		constructor: function(args) {
			this._aras = args.aras;
			this._statesNotAllowedForUpdate = ['Released', 'Superseded'];
		},

		initialize: function(sourceItem) {
			this._itemWithReqs = this._aras.IomInnovator.newItem();
			this._itemWithReqs.dom = sourceItem.ownerDocument;
			this._itemWithReqs.node = sourceItem;
			this._reloadRequirementsCache();
		},

		_reloadRequirementsCache: function() {
			const relationships = this._itemWithReqs.getRelationships('re_Req_Doc_Content');

			this._requirementsCache = {};

			const relationshipsCount = relationships.getItemCount();
			for (let i = 0; i < relationshipsCount; i++) {
				const relationshipItem = relationships.getItemByIndex(i);
				const requirementItem = relationshipItem.getRelatedItem();
				if (!requirementItem) {
					continue;
				}
				const chapter = relationshipItem.getProperty('chapter');
				const configId = requirementItem.getProperty('config_id');
				const reqTitle = requirementItem.getProperty('req_title');

				this._requirementsCache[configId] = {
					reqContent: relationshipItem,
					requirement: requirementItem,
					chapter: chapter,
					title: reqTitle
				};
			}
		},

		invalidateRequirementsCache: function(args) {
			const action = args.action;
			let configId;
			let newRequirement;
			switch (action) {
				case 'add':
					newRequirement = args.newReq;
					configId = newRequirement.getProperty('config_id');
					this._requirementsCache[configId] = {
						requirement: newRequirement,
						reqContent: args.reqContent,
						title: newRequirement.getProperty('req_title')
					};
					break;
				case 'delete':
					configId = args.reqId;
					if (configId) {
						delete this._requirementsCache[configId];
					}
					break;
				case 'replace':
					const reqIdToReplace = args.oldReqId;
					const reqToReplace = this._requirementsCache[reqIdToReplace];
					if (reqToReplace) {
						newRequirement = args.newReq;
						configId = newRequirement.getProperty('config_id');
						const chapterNumber = reqToReplace.chapter;
						delete this._requirementsCache[reqIdToReplace];
						this._requirementsCache[configId] = {
							requirement: newRequirement,
							reqContent: reqToReplace.reqContent,
							chapter: chapterNumber,
							title: newRequirement.getProperty('req_title')
						};
					}
					break;
				default:
					break;
			}
		},

		getRequirementById: function(reqId) {
			return this._requirementsCache[reqId] && this._requirementsCache[reqId].requirement;
		},

		getRequirementDocumentWithRequirements: function() {
			return this._itemWithReqs;
		},

		getRequirementDocContentByReqId: function(reqId) {
			const relationshipItem = this._requirementsCache[reqId] && this._requirementsCache[reqId].reqContent;
			if (relationshipItem && relationshipItem.getAttribute('action') !== 'delete') {
				return relationshipItem;
			}
		},

		getSectionNumberById: function(reqId) {
			return this._requirementsCache[reqId] && this._requirementsCache[reqId].chapter;
		},

		getReqIdBySectionNumber: function(sectionNumber) {
			const reqIds = Object.keys(this._requirementsCache);
			for (let i = 0; i < reqIds.length; i++) {
				const reqId = reqIds[i];
				if (this._requirementsCache[reqId] && this._requirementsCache[reqId].chapter === sectionNumber) {
					return reqId;
				}
			}
		},

		getRequirementsCache: function() {
			return this._requirementsCache;
		},

		getRequirementDocRequirements: function(activeOnly) {
			const additionalFiltering = activeOnly ? ' and not(@action="delete")' : '';
			return this._itemWithReqs.getItemsByXPath('Relationships/Item[@type="re_Req_Doc_Content"' + additionalFiltering + ']');
		},

		getRequirementPropertyValueById: function(reqId, propertyName, defaultValue, lang) {
			const requirement = this.getRequirementById(reqId);
			return this.getRequirementPropertyValue(requirement, propertyName, defaultValue, lang);
		},

		getRequirementPropertyValue: function(requirement, propertyName, defaultValue, lang) {
			return requirement.getProperty(propertyName, defaultValue || '', lang);
		},

		setRequirementPropertyValue: function(requirement, propName, propValue, lang) {
			requirement.setProperty(propName, propValue, lang);
		},

		getRequirementAttributeValueById: function(reqId, attributeName) {
			const requirement = this.getRequirementById(reqId);
			return this.getRequirementAttributeValue(requirement, attributeName);
		},

		getRequirementAttributeValue: function(requirement, attributeName) {
			return requirement.getAttribute(attributeName);
		},

		setRequirementAttributeValue: function(requirement, attributeName, attributeValue) {
			requirement.setAttribute(attributeName, attributeValue);
		},

		getRequirementId: function(requirement) {
			return requirement.getID();
		},

		getNewRequirement: function(reqId, itemParams) {
			const reqItem = this._aras.newIOMItem('re_Requirement', 'add');
			reqItem.setID(reqId || this._aras.generateNewGUID());
			this._populatePropertiesToItem(reqItem, itemParams.properties);
			this._populateAttributesToItem(reqItem, itemParams.attributes);
			return reqItem;
		},

		getExistingRequirementsFromServer: function(itemParams) {
			const newReqItems = this._aras.newIOMItem('re_Requirement', 'get');
			this._populatePropertiesToItem(newReqItems, itemParams.properties);
			this._populateAttributesToItem(newReqItems, itemParams.attributes);
			return newReqItems.apply();
		},

		_populatePropertiesToItem: function(item, propsList) {
			propsList = propsList || {};
			for (let propName in propsList) {
				item.setProperty(propName, propsList[propName]);
			}
		},

		_populateAttributesToItem: function(item, attributesList) {
			attributesList = attributesList || {};
			for (let attrName in attributesList) {
				item.setAttribute(attrName, attributesList[attrName]);
			}
		},

		getItemsCount: function(item) {
			return item.getItemCount();
		},

		getItemByIndex: function(item, index) {
			return item.getItemByIndex(index);
		},

		getCopyOfRequirement: function(sourceReqId, copyNumber) {
			const sourceReq = this.getRequirementById(sourceReqId);
			const originalTitle = this.getRequirementPropertyValue(sourceReq, 'req_title', '');
			const copyReq = sourceReq.clone(true);
			const reqId = this.getRequirementId(copyReq);
			copyReq.setProperty('config_id', reqId);
			copyReq.setProperty('req_title', this._aras.getResource('../Solutions/RE', 'chaptertree_requirement_copyOf',
				originalTitle, (copyNumber > 1 ? '(' + copyNumber + ')': '')));

			// cleanup of copied item
			copyReq.removeProperty('generation');
			copyReq.removeProperty('keyed_name');
			copyReq.removeProperty('locked_by_id');
			copyReq.removeProperty('item_number');

			copyReq.setAttribute('isNew', '1');
			copyReq.setAttribute('isTemp', '1');

			return copyReq;
		},

		addRequirementToRequirementDocuments: function(requirement) {
			const reqContent = this._aras.newIOMItem('re_Req_Doc_Content', 'add');
			reqContent.setRelatedItem(requirement);
			this._itemWithReqs.addRelationship(reqContent);
			const newReq = reqContent.getRelatedItem();
			this.invalidateRequirementsCache({
				action: 'add',
				newReq: newReq,
				reqContent: reqContent
			});
		},

		markAsDeletedRequirementDocRequirementsByIds: function(requirementIds) {
			for (let i = 0; i < requirementIds.length; i++) {
				const requirementId = requirementIds[i];
				const relationshipItem = this.getRequirementDocContentByReqId(requirementId);
				const relationshipItemNode = relationshipItem && relationshipItem.node;

				if (relationshipItemNode) {
					const action = relationshipItem.getAction();

					if (action === 'add') {
						relationshipItemNode.parentNode.removeChild(relationshipItemNode);
					} else {
						relationshipItem.setAction('delete');
					}
					this.invalidateRequirementsCache({
						action: 'delete',
						reqId: requirementId
					});
				}
			}
		},

		replaceRequirementInRequirementDocument: function(oldReqId, newRequirement) {
			const reqDocReq = this.getRequirementDocContentByReqId(oldReqId);
			if (!reqDocReq.isNew()) {
				reqDocReq.setAction('update');
			}
			reqDocReq.setAttribute('isDirty', '1');
			reqDocReq.setRelatedItem(newRequirement);
			this.invalidateRequirementsCache({
				action: 'replace',
				newReq: newRequirement,
				oldReqId: oldReqId
			});
		},

		lockUnlockRequirementById: function(action, id) {
			const itemToLockUnlock = this._aras.newIOMItem('re_Requirement', action);
			itemToLockUnlock.setID(id);
			return itemToLockUnlock.apply();
		},

		markAsUpdatedRequirementById: function(reqId) {
			const reqDocReq = this.getRequirementDocContentByReqId(reqId);
			const requirement = this.getRequirementById(reqId);

			const action = reqDocReq.getAttribute('action', 'update');
			reqDocReq.setAttribute('action', action);
			reqDocReq.setAttribute('isDirty', '1');

			const reqState = requirement.getProperty('state');
			if (requirement.getAttribute('action') != 'add' && this._statesNotAllowedForUpdate.indexOf(reqState) === -1) {
				requirement.setAttribute('action', 'update');
				requirement.setAttribute('isDirty', '1');
			}
		},

		updateRequirementsSections: function(sectionsByConfigIds) {
			const updatedChaptersDictionary = {};
			for (let configId in this._requirementsCache) {
				const currentReqDocReq = this._requirementsCache[configId].reqContent;
				const currentSection = this._requirementsCache[configId].chapter;
				const newSection = sectionsByConfigIds[configId];
				const currentReqDocReqAction = currentReqDocReq.getAttribute('action');

				if (currentSection !== newSection) {
					this._requirementsCache[configId].requirement.setAttribute('isDirtyContent', '1');
					currentReqDocReq.setProperty('chapter', newSection);

					if (currentReqDocReqAction !== 'add') {
						currentReqDocReq.setAttribute('isDirty', '1');
					}

					updatedChaptersDictionary[configId] = newSection;
					this._requirementsCache[configId].chapter = newSection;

					currentReqDocReq.setAttribute('action', currentReqDocReqAction || 'update');
				}
			}

			return updatedChaptersDictionary;
		}
	});
});
