define([
	'dojo/_base/declare',
	'dojo/aspect',
	'RE/Scripts/Classes/Helper/BaseQueueChanges'
],

function(declare, aspect, BaseQueueChanges) {
	return declare('Aras.Client.Controls.Requirement.QueueChanges', [BaseQueueChanges], {
		dropChangesQueue: function() {
			const dom = this._viewmodel.Dom();
			const reqElementDom = dom.getAllChilds()[1];
			if (reqElementDom) {
				const memento = reqElementDom.CreateMemento({queueChanges: this});

				this._current = null;
				this.PushState({dom: {memento: memento, targetUid: reqElementDom.Uid()}});
			}
		},

		startTrackingChanges: function() {
			if (!this._trackingEventHandler) {
				this._trackingEventHandler = aspect.after(this._viewmodel, 'OnInvalidate', this._onViewModelInvalidate.bind(this), true);
			}
		},

		getTargetNode: function(invalidtionList) {
			let firstNode = invalidtionList[0];
			for (let i = 0; i < invalidtionList.length; i++) {
				firstNode = this.findLowestCommonAncestor(firstNode, invalidtionList[i]);
			}
			return firstNode;
		},

		findLowestCommonAncestor: function(firstNode, secondNode) {
			const visitedNodes = [];
			let commonAncestor;
			while (true) {
				visitedNodes[firstNode.Id()] = true;
				if (!firstNode.Parent) {
					break;
				}
				firstNode = firstNode.Parent;
			}
			while (true) {
				if (visitedNodes[secondNode.Id()]) {
					commonAncestor = secondNode;
					break;
				}
				secondNode = secondNode.Parent;
			}
			return commonAncestor;
		},

		_onViewModelInvalidate: function(sender, earg) {
			if ((this._defaultLanguageCode == this._currentLanguageCode) && earg.invalidationList.length && !sender.QueueChanges().IsProgress()) {
				let target = this.getTargetNode(earg.invalidationList);
				let isValid = false;
				let memento;
				let state;

				while (!target.is('XmlSchemaElement') || !target.Uid()) {
					target = target.Parent;
				}

				do {
					memento = target.CreateMemento({queueChanges: sender.QueueChanges()});
					state = memento.GetState();

					if (state.sourceNode && state.newNode) {
						isValid = true;
					} else {
						target = target.Parent;
					}
				}
				while (!isValid);

				const cursorMemento = sender.Cursor().CreateMemento();

				sender.QueueChanges().PushState({
					dom: {memento: memento, targetUid: target.Uid()},
					cursor: {memento: cursorMemento}
				});
			}
		}
	});
});
