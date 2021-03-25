define([
	'dojo/_base/declare',
	'dojo/aspect',
	'RE/Scripts/Model/RequirementStructuredDocument',
	'RE/Scripts/Classes/Helper/RequirementDocumentActionsHelper',
	'RE/Scripts/Classes/ReqDocActionStateController',
	'RE/Scripts/Classes/Helper/BaseQueueChanges',
	'RE/Scripts/Classes/Helper/RequirementsHelper'
],
function(declare, aspect, RequirementStructuredDocument, ActionsHelper, ReqDocActionStateController, QueueChanges, RequirementsHelper) {
	return declare('Aras.Client.Controls.RE.Model.RequirementDocumentStructuredDocument', [RequirementStructuredDocument], {
		_schemaId: null,
		_activeRequirementId: null,
		_defaultSchemaId: null,
		_requirementUpdateAllowed: true,
		_conflictedReqs: {},
		// Array is populated only by "runMassInvalidationManually" method.
		// Array is used at "OnInvalidate" method.
		// "runMassInvalidationManually" runs invalidation for item that were added as replacement for old items
		// and there is no need to set to tham additional attributes
		_massInvalidationIds: [],
		_editableRequirements: new Map(),
		// Flag is introduced to have possibility skip items changes (relationships and related items actions update)
		// during onInvalidate, because it can be caused by actions (e.g. search) which actually doesn't change context
		skipItemsUpdate: false,
		_updatedChaptersDictionary: {},
		_queueChanges: null,
		_requirementsHelper: null,
		_arasBlockXPath: '/aras:document/aras:content/aras:block',

		postCreate: function(args) {
			if (typeof args.customEditModeCheck === 'function') {
				this._customEditModeCheck = args.customEditModeCheck;
			}

			if (typeof args.showItem === 'function') {
				this._showItem = args.showItem;
			}

			// defaultSchemaId should be used only in case when no Requirements are specified in Requirements Document.
			this._defaultSchemaId = args.defaultSchemaId;
			this._requirementsHelper = new RequirementsHelper({
				aras: this._aras
			});
			this.inherited(arguments);
			this._actionsHelper = new ActionsHelper({viewmodel: this, clipboard: this._clipboardHelper, aras: this._aras});
			this._actionStateController = new ReqDocActionStateController({aras: this._aras, viewmodel: this});

			// Drop queueChanges tracker from base class
			if (this._queueChanges) {
				this._queueChanges.stopTrackingChanges();
			}

			this._queueChanges = new QueueChanges({viewmodel: this});

			if (this.IsEditable()) {
				this._queueChanges.startTrackingChanges();
				this._queueChanges.dropChangesQueue();
			}
		},

		saveDocumentXml: function(documentXml, languageCode) {
			this.inherited(arguments, [documentXml, languageCode, true]);
		},

		setContentToItem: function() {
			const languageCode = this.DefaultLanguageCode();
			const content = this.getSavedDocumentXml(languageCode);

			if (content) {
				const contentNode = new XmlDocument();
				contentNode.loadXML(content);

				if (this._aras.Browser.isIe()) {
					contentNode.setProperty('SelectionNamespaces', 'xmlns:aras="http://aras.com/ArasTechDoc"');
				} else {
					contentNode.documentElement.setAttribute('xmlns:aras', 'http://aras.com/ArasTechDoc');
				}

				const block = contentNode.selectSingleNode(this._arasBlockXPath);
				let element = block.firstChild;
				while (element) {
					const nextSibling = element.nextSibling;
					if (!element.getAttribute('isDirty')) {
						block.removeChild(element);
					} else {
						element.removeAttribute('isDirty');
					}

					element = nextSibling;
				}

				const documentItem = this.getDocumentItem();
				this._aras.setItemTranslation(documentItem, 'document_xml', contentNode.xml, languageCode);
			}
		},

		_customEditModeCheck: function(itemId) {
			return true;
		},

		_showItem: function(node, itemId) {
			this._aras.uiShowItemEx(node);
		},

		Reload: function(newItem, optionalParameters) {
			this._editableRequirements.clear();
			const oldSelectedItems = this.GetSelectedItems();

			this._multilangcache = null;
			this._all = null;
			this._allByIndex = null;
			this._allIndexHash = null;
			this._invalidationList = null;
			this._savedDocumentXml = null;

			this._multilangcache = {};
			this._all = {};
			this._allByIndex = [];
			this._allIndexHash = {};
			this._invalidationList = [];
			this._savedDocumentXml = {};

			this.inherited(arguments);
			if (oldSelectedItems.length > 0) {
				this._restoreItemSelection(oldSelectedItems);
			}
		},

		_SetOriginForStructureDocument: function() {
			this.inherited(arguments);

			this._generateRequirementDocumentWithRelationships();
			this._setSchemaIdToOrigin();
		},

		// Method is inherited from RequirementStructuredDocument.
		// Original method should be called only in case when node has type 're_Requirement'.
		// On call from "Reload" node will be "re_Requirement_Document" and it should be skipped.
		_updateTitleAndNumberElement: function(node) {
			if (node.getAttribute('type') === 're_Requirement') {
				this.inherited(arguments);
			}
		},

		_restoreItemSelection: function(oldSelectedItems) {
			let newElement = [];
			if (oldSelectedItems.length > 0) {
				const selectedItemUid = oldSelectedItems[0].Uid();
				newElement = this.GetElementsByUid(selectedItemUid);
				if (newElement.length === 0) {
					const req = this._getClassifiedParentElement(oldSelectedItems[0]);
					const reqUid = req.Uid();
					newElement = this.GetElementsByUid(reqUid);
				}
			}

			if (newElement.length === 0) {
				// if oldSelectedItem is removed need to try to select very first element.
				const firstElement = this.getFirstElement();
				if (firstElement) {
					newElement.push(firstElement);
				}
			}
			this.SetSelectedItems(newElement);
		},

		restoreItemSelectionByReqId: function(reqId) {
			let elements = [];
			// reqId == 0 for root element
			if (reqId !== 0) {
				const origin = this._getOriginByReqId(reqId);
				elements = this.GetElementsByOrigin(origin);
			}

			this._restoreItemSelection(elements);
		},

		getFirstElement: function() {
			const arasBlock = this.Dom();
			const childItems = arasBlock.ChildItems();
			if (childItems.length) {
				return childItems.get(0);
			}
		},

		IsItemLockedByUser: function() {
			return this._aras.isEditStateEx(this._item);
		},

		GetRequirementDocumentWithRequirements: function() {
			return this._requirementsHelper.getRequirementDocumentWithRequirements();
		},

		GetRequirementTitle: function(schemaElement) {
			return this._getRequirementPropertyValue(schemaElement, 'req_title');
		},

		SetActiveRequirementId: function(id) {
			this._activeRequirementId = id;
		},

		GetActiveRequirementId: function() {
			return this._activeRequirementId;
		},

		GetRequirementClassification: function(schemaElement) {
			return this._getRequirementPropertyValue(schemaElement, 'classification');
		},

		AddRequirementToRequirementDocument: function(requirement) {
			const requiremnetId = this._requirementsHelper.getRequirementId(requirement);
			this.SetActiveRequirementId(requiremnetId);

			if (!this._requirementsHelper.getRequirementPropertyValue(requirement, 'config_id')) {
				this._requirementsHelper.setRequirementPropertyValue(requirement, 'config_id', requiremnetId);
			}

			if (!this._requirementsHelper.getRequirementPropertyValue(requirement, 'req_document_type')) {
				this._requirementsHelper.setRequirementPropertyValue(requirement, 'req_document_type', this._schemaId);
			}
			this._addReqItemToRequirementDocument(requirement);
		},

		AddCopyOfRequirementToRequirementDocument: function(sourceReqId, copyNumber) {
			const copyReq = this._requirementsHelper.getCopyOfRequirement(sourceReqId, copyNumber);

			this._addReqItemToRequirementDocument(copyReq);
			return copyReq;
		},

		_addReqItemToRequirementDocument: function(requirement) {
			this._requirementsHelper.addRequirementToRequirementDocuments(requirement);
		},

		MarkAsDeletedRequirementDocRequirementsByIds: function(requirementIds) {
			this._requirementsHelper.markAsDeletedRequirementDocRequirementsByIds(requirementIds);
		},

		ViewRequirementById: function(configId) {
			const requirement = this._getRequirementById(configId);
			this._showItem(requirement.node, configId);
		},

		ReplaceRequirement: function(oldReqId, newRequirement) {
			this._requirementsHelper.replaceRequirementInRequirementDocument(oldReqId, newRequirement);
		},

		InvalidateSections: function(sectionsByConfigIds) {
			this._updatedChaptersDictionary = this._requirementsHelper.updateRequirementsSections(sectionsByConfigIds);

			if (Object.keys(this._updatedChaptersDictionary).length) {
				this._requirementUpdateAllowed = false;
				this.selectiveSectionsInvalidate(this._updatedChaptersDictionary);
				this._requirementUpdateAllowed = true;
			}
		},

		// Other controls can subscribe on call of this method.
		// invalidationList - contains id and chapter of requirements that was changed,
		// it can be used for updating them on UI.
		selectiveSectionsInvalidate: function(invalidationList) {
		},

		getUpdatedChapterByRequirementId: function(configId) {
			return configId && this._updatedChaptersDictionary[configId];
		},

		GetSectionNumberById: function(reqId) {
			return this._requirementsHelper.getSectionNumberById(reqId);
		},

		GetReqIdBySectionNumber: function(sectionNumber) {
			return this._requirementsHelper.getReqIdBySectionNumber(sectionNumber);
		},

		_getRequirementPropertyValue: function(schemaElement, propertyName) {
			var reqId = schemaElement.origin.getAttribute('reqId');
			return this._requirementsHelper.getRequirementPropertyValueById(reqId, propertyName);
		},

		_getRequirementAttributeValue: function(schemaElement, attributeName) {
			const reqId = schemaElement.Attribute('reqId');
			return this._requirementsHelper.getRequirementAttributeValueById(reqId, attributeName);
		},

		_setSchemaIdToOrigin: function() {
			var reqDocReqs = this._requirementsHelper.getRequirementDocRequirements();
			// take schema id from first Requirement
			if (reqDocReqs.getItemCount() > 0) {
				var docReq = reqDocReqs.getItemByIndex(0);
				var req = docReq.getRelatedItem();
				this._schemaId = req.getProperty('req_document_type');
			} else {
				this._schemaId = this._defaultSchemaId;
			}

			// 'req_document_type' will be removed from item before save
			// This property set should not affect item dirty state
			const wasDirty = this._aras.isDirtyEx(this._item);

			this._aras.setItemProperty(this._item, 'req_document_type', this._schemaId);

			if (!wasDirty) {
				this._item.removeAttribute('isDirty');
			}
		},

		_generateRequirementDocumentWithRelationships: function() {
			this._requirementsHelper.initialize(this._item);
		},

		GetDocumentBlockXml: function(itemId, langCode, byReferenceType, isPartialLoading) {
			// If 'isPartialLoading' flag is true, then content of specified re_Requirement item will be loaded
			// and method from base class will be called.
			// If 'isPartialLoading' flag is false, then contnet of re_RequirementDocument item will be loaded.
			// This fix is used in order to avoid duplication GetDocumentBlockXml method from RequrementStructuredDocument.
			if (isPartialLoading) {
				return this.inherited(arguments);
			}
			var type = this._item.getAttribute('type');
			var documentContent = this._aras.newIOMItem(type, 're_GetRequirementContent');
			documentContent.setID(itemId);
			documentContent.setAttribute('language', langCode);
			documentContent.setProperty('req_document_type', this._schemaId);
			documentContent = documentContent.apply();

			if (documentContent.isError()) {
				this._aras.AlertError(documentContent.getErrorString());
				return;
			}
			return documentContent.getResult();
		},

		getRequirementDocRequirements: function(activeOnly) {
			return this._requirementsHelper.getRequirementDocRequirements(activeOnly);
		},

		_getRequirementDocRequirementByRequirementId: function(reqId) {
			return this._requirementsHelper.getRequirementDocContentByReqId(reqId);
		},

		_getRequirementById: function(reqId) {
			return this._requirementsHelper.getRequirementById(reqId);
		},

		_getClassifiedParentElement: function(element) {
			if (element) {
				return element.Parent && element.Parent.is('ArasBlockXmlSchemaElement') ? element : this._getClassifiedParentElement(element.Parent);
			}
		},

		OnInvalidate: function(sender, earg) {
			var invalidationList = earg.invalidationList;
			for (var elementIndex = 0; elementIndex < invalidationList.length; elementIndex++) {
				var element = invalidationList[elementIndex];
				if (element.is('ArasBlockXmlSchemaElement') || this.isImmutableElement(element)) {
					continue;
				}

				var classifiedParent = this._getClassifiedParentElement(element);
				classifiedParent.origin.setAttribute('isDirty', '1');
				var reqId = classifiedParent.Attribute('reqId');

				// "action" attribute should not be assigned to Requirement If Mass invalidation is running
				// because items that passed invalidation methods have no changes yet.
				// "_massInvalidationIds" is populated by "runMassInvalidationManually"
				// "OnInvalidate" method should cleanup "_massInvalidationIds" array for avoiding skipping of requirements
				// when they will be invalideted not in context of Mass invalidation.
				if (!this.skipItemsUpdate && this._massInvalidationIds.indexOf(reqId) === -1) {
					this._requirementsHelper.markAsUpdatedRequirementById(reqId);
				}
			}

			// Cleanup mass invalidation array
			this._massInvalidationIds.length = 0;

			this._invalidateElementsStates(invalidationList);
		},

		OnRequirementDocumentContentChange: function(evnt) {
			this._editableRequirements.clear();
			this._generateRequirementDocumentWithRelationships();
		},

		isRequirementUpdateAllowed: function() {
			return this._requirementUpdateAllowed;
		},

		getLastChildElementInRoot: function() {
			var origin = this.Dom().origin;
			var childNodes = origin.childNodes;
			if (childNodes.length) {
				var lastOrigin = childNodes[childNodes.length - 1];
				return this.GetElementsByOrigin(lastOrigin)[0];
			}
		},

		IsEqualEditableLevel: function() {
			let selectedItem = this.GetSelectedItems()[0];
			if (selectedItem) {
				selectedItem = this._getClassifiedParentElement(selectedItem);
				const reqConfigId = selectedItem.Attribute('reqId');
				const requirement = this._getRequirementById(reqConfigId);
				const reqId = this._requirementsHelper.getRequirementId(requirement);
				if (!this._editableRequirements.has(reqId)) {
					this._editableRequirements.set(reqId, this._customEditModeCheck(requirement.node));
				}

				return this.IsItemLockedByUser() && requirement.getLockStatus() < 2 && this._editableRequirements.get(reqId);
			}

			return this.IsItemLockedByUser();
		},

		GetNormalizedClassification: function(requirement) {
			let classification = requirement.getProperty('classification');
			switch (classification) {
				case 'Text':
					return 'RequirementText';
				case 'Use case':
					return 'Usecase';
				default:
					return classification;
			}
		},

		getLastElement: function() {
			var selectedItem = this.GetSelectedItems()[0];
			if (selectedItem) {
				selectedItem = this._getClassifiedParentElement(selectedItem);
				var lastElementOrigin = selectedItem.origin.lastChild;
				return lastElementOrigin ? this.GetElementsByOrigin(lastElementOrigin)[0] : selectedItem;
			} else {
				return this._getLastElementIfNothingIsSelected();
			}
		},

		_getLastElementIfNothingIsSelected: function() {
			const arasBlockElement = this.Dom();
			const childItems = arasBlockElement.ChildItems();
			if (childItems.length() > 0) {
				return childItems.get(childItems.length() - 1);
			}
		},

		getRootNodeUid: function() {
			var selectedItem = this.GetSelectedItems()[0];
			if (selectedItem) {
				selectedItem = this._getClassifiedParentElement(selectedItem);
				return selectedItem.Uid();
			} else {
				let lastElement = this._getLastElementIfNothingIsSelected();
				if (lastElement) {
					return lastElement.Uid();
				}
			}
		},

		_ReplaceOriginFromServerIfNeed: function(langCode) {
			this.inherited(arguments, [langCode, true]);
		},

		getRequirementWithContent: function(configId) {
			let requirement = this._getRequirementById(configId);
			let origin = this._getOriginByReqId(configId);
			let documentXml = '<aras:document xmlns="http://www.aras.com/REStandard" ' +
				'schemaid="{schema_id}" xmlns:aras="http://aras.com/ArasTechDoc">'.replace('{schema_id}', this._schemaId) +
					'<aras:content><aras:block blockId="{config_id}">{req_content}</aras:block></aras:content></aras:document>'
						.replace('{config_id}', configId).replace('{req_content}', origin ? origin.xml : '');
			this._requirementsHelper.setRequirementPropertyValue(requirement, 'document_xml', documentXml, this.CurrentLanguageCode());

			return requirement;
		},

		_getOriginByReqId: function(reqId) {
			return this.Dom().origin.selectSingleNode(this._arasBlockXPath + '/*[@reqId="' + reqId + '"]');
		},

		runMassInvalidationManually: function(idsToInvalidate) {
			this._massInvalidationIds = idsToInvalidate;
			const oldSelectedItems = this.GetSelectedItems();

			this.SuspendInvalidation();
			for (let idIndex = 0; idIndex < idsToInvalidate.length; idIndex++) {
				let itemId = idsToInvalidate[idIndex];
				let origin = this._getOriginByReqId(itemId);
				let element = this.GetElementsByOrigin(origin)[0];
				this._invalidate(element);
			}
			this.ResumeInvalidation();

			this._restoreItemSelection(oldSelectedItems);
		},

		// Only for internal use. Do not use in custom code.
		silentReplaceOrigin: function(requirement) {
			let oldOrigin = this._getOriginByReqId(requirement.getProperty('config_id'));
			let element = this.GetElementsByOrigin(oldOrigin)[0];
			let content = new XmlDocument();
			const contentAsString = this._requirementsHelper.getRequirementPropertyValue(requirement, 'content', '', this.CurrentLanguageCode());
			content.loadXML(contentAsString);

			let wrappedObject = this.CreateElement('element', {origin: content.firstChild});
			let childList = element.Parent.ChildItems();
			let index = childList.index(element);
			childList.splice(index, 1);
			childList.insertAt(index, wrappedObject);
		},

		getActionStateController: function() {
			return this._actionStateController;
		},

		setRequirementState: function(state, reqId) {
		},

		_invalidateElementsStates: function(invalidationList) {
			if (invalidationList.length) {
				const currentUserId = this._aras.getCurrentUserID();
				for (let invIndex = 0; invIndex < invalidationList.length; invIndex++) {
					const invalidationElement = invalidationList[invIndex];
					if (!invalidationElement.is('ArasBlockXmlSchemaElement')) {
						this._calculateStateOfElement(this._getClassifiedParentElement(invalidationElement), currentUserId);
					} else {
						const allElements = invalidationElement.ChildItems().List();
						for (let elementIndex = 0; elementIndex < allElements.length; elementIndex++) {
							this._calculateStateOfElement(allElements[elementIndex], currentUserId);
						}
					}
				}
			}
		},

		_invalidateRequirementsCache: function(args) {
			this._requirementsHelper.invalidateRequirementsCache(args);
		},

		_calculateStateOfElement: function(element, currentUserId) {
			this._calculateAndApplyState({
				action: this._getRequirementAttributeValue(element, 'action'),
				lockedBy: this._getRequirementPropertyValue(element, 'locked_by_id'),
				reqId: element.Attribute('reqId')
			}, currentUserId);
		},

		_calculateAndApplyState: function(requirementDescriptor, currentUserId) {
			const isModified = requirementDescriptor.action === 'update';
			const isNew = requirementDescriptor.action === 'add';

			let newState;
			if (this._conflictedReqs[requirementDescriptor.reqId]) {
				newState = this._conflictedReqs[requirementDescriptor.reqId];
			} else if (!requirementDescriptor.lockedBy && !requirementDescriptor.action) {
				newState = 'Blank';
			} else if (isNew) {
				newState = 'NewItem';
			} else if (requirementDescriptor.lockedBy && requirementDescriptor.lockedBy === currentUserId) {
				newState = (isModified ? 'LockedAndModified' : 'LockedByMe');
			} else if (requirementDescriptor.lockedBy) {
				newState = 'LockedByOther';
			} else if (isModified) {
				newState = 'Modified';
			}

			this.setRequirementState(newState, requirementDescriptor.reqId);
		},

		setRequirementConflictState: function(state, reqId) {
			if (state === 'Blank') {
				delete this._conflictedReqs[reqId];
			} else {
				this._conflictedReqs[reqId] = state;
			}

			this.setRequirementState(state, reqId);
		},

		refreshStateForElement: function(element) {
			if (element) {
				const currentUserId = this._aras.getCurrentUserID();
				this._calculateStateOfElement(element, currentUserId);
			}
		},

		lockUnlockItemById: function(action, id) {
			const itemToLockUnlock = this._requirementsHelper.lockUnlockRequirementById(action, id);
			if (itemToLockUnlock.isError()) {
				this._aras.AlertError(itemToLockUnlock);
			}
		},

		getRequirementsHelper: function() {
			return this._requirementsHelper;
		}
	});
});
