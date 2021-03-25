define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Originator',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Memento',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Typeable',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DomSynchronizable'
], function (declare, Originator, Memento, Typeable, DomSynchronizable) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.XmlSchemaNode',
		[Typeable, Originator, DomSynchronizable],
		{
			ownerDocument: null,
			origin: null,
			nodeName: null,
			_id: null,
			_childItems: null,
			_nodeId: { count: 0 },

			constructor: function (args) {
				this.origin = args.origin || this._createOrigin();
				this.nodeName = this.origin.nodeName;
				this.ownerDocument = args.ownerDocument;
				this._id = this.getNextNodeId();
				this.registerType(this.nodeName);
				this.registerType('XmlSchemaNode');
			},

			getNextNodeId: function () {
				return this._nodeId.count++;
			},

			CreateMemento: function (/*Object*/ args) {
				var queueChanges = args && args.queueChanges;
				var tmpNode = this.findNodeByUid(
					queueChanges && queueChanges.GetDom(),
					this.Uid()
				);
				var sourceNode = tmpNode ? tmpNode.cloneNode(true) : null;

				return new Memento({
					state: {
						sourceNode: sourceNode,
						newNode: this.origin.cloneNode(true)
					}
				});
			},

			Uid: function () {
				return this.origin && this.origin.getAttribute('aras:id');
			},

			findNodeByUid: function (targetNode, uid) {
				if (
					targetNode &&
					(targetNode.nodeType == document.ELEMENT_NODE ||
						targetNode.nodeType == document.DOCUMENT_NODE)
				) {
					if (targetNode.getAttribute('aras:id') === uid) {
						return targetNode;
					} else {
						var nodes = targetNode.childNodes;
						var childNode;
						var foundNode;
						var i;

						for (i = 0; i < nodes.length; i++) {
							childNode = nodes[i];
							foundNode = this.findNodeByUid(childNode, uid);

							if (foundNode) {
								return foundNode;
							}
						}
					}
				}

				return null;
			},

			SetMemento: function (/*Object*/ args) {
				var memento = args.memento;
				var mode = args.mode;
				var state = memento.GetState();
				var node;

				switch (mode) {
					case 'new':
						node = state.newNode.cloneNode(true);
						break;
					case 'source':
						node = state.sourceNode.cloneNode(true);
						break;
				}

				this.origin.parentNode.replaceChild(node, this.origin);
				this.origin = node;

				this.parseOrigin();
			},

			isRegistered: function () {
				return this.ownerDocument.GetElementById(this.Id()) ? true : false;
			},

			registerDocumentElement: function () {
				if (!this.Parent || this.Parent.isRegistered()) {
					//if root item or if parent registered
					this.ownerDocument._RegisterElement(this);
				}
			},

			unregisterDocumentElement: function () {
				this.ownerDocument._UnregisterElement(this);
			},

			_parseOriginInternal: function () {
				throw new Error('Override _parseOriginInternal method');
			},

			_createOrigin: function () {
				throw new Error('Override _createOrigin method');
			},

			parseOrigin: function () {
				// do not use aspect.before and aspect.after for avoid consuming memory
				if (!this.ownerDocument._isInvalidating) {
					this.ownerDocument.SuspendInvalidation();
				}
				this._parseOriginInternal();
				if (!this.ownerDocument._isInvalidating) {
					this.NotifyChanged();
					this.ownerDocument.ResumeInvalidation();
				}
			},

			Id: function (/*String*/ value) {
				if (value === undefined) {
					return this._id;
				} else {
					this._id = value;
				}
			},

			Clone: function () {
				var clonedOrigin = this.origin.cloneNode(true);
				var clonedElement = this.ownerDocument.CreateElement('element', {
					origin: clonedOrigin
				});

				clonedElement._OnCloned();

				return clonedElement;
			},

			isSelectable: function () {
				return false;
			},

			_OnCloned: function () {
				//for override
			},

			Origin: function () {
				return this.origin;
			},

			OnChanged: function (/*WrappedObject*/ sender) {
				if (this.isRegistered()) {
					this.ownerDocument._OnElementChanged(sender);
				}
			},

			NotifyChanged: function () {
				this.OnChanged(this);
			},

			processNotificationEvent: function (/*Object*/ notificationMessage) {},

			AlertError: function (/*String*/ errorMessage) {
				this.ownerDocument._aras.AlertError(errorMessage);
			}
		}
	);
});
