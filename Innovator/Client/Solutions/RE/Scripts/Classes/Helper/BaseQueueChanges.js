define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/QueueChanges'
],

function(declare, TechDocQueueChanges) {
	return declare('Aras.Client.Controls.RequirementDocument.BaseQueueChanges', [TechDocQueueChanges], {
		PushState: function(/*Object*/args) {
			const dom = args.dom;
			const cursor = args.cursor;
			const targetUid = dom.targetUid;
			const state = dom.memento.GetState();
			const tmpNode = state.newNode;
			const newNode = tmpNode.cloneNode(true);
			const oldNode = this._findNodeByUid(this.GetDom(), targetUid);
			const parent = oldNode && oldNode.parentNode;
			const container = {
				data: {dom: dom, cursor: cursor},
				prev: this._current,
				next: null,
			};

			if (this._current) {
				this._current.next = container;
			}

			this._current = container;

			if (parent) {
				parent.replaceChild(newNode, oldNode);
			} else {
				this.SetDom(newNode);
			}
		}
	});
});
