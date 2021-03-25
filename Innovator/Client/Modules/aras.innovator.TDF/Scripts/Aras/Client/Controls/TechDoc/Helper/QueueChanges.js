define(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return declare('Aras.Client.Controls.TechDoc.Helper.QueueChanges', null, {
		_current: null,
		_viewmodel: null,
		_dom: null,
		_isProgress: false,
		_trackingEventHandler: null,

		constructor: function (args) {
			this._viewmodel = args.viewmodel;
		},

		_startProcess: function () {
			this._isProgress = true;
			this._viewmodel.SuspendInvalidation();
		},

		_endProcess: function () {
			this._viewmodel.ResumeInvalidation();
			this._isProgress = false;
		},

		IsProgress: function () {
			return this._isProgress;
		},

		GetDom: function () {
			if (!this._dom) {
				this._dom = this._viewmodel.Dom().Origin().cloneNode(true);
			}

			return this._dom;
		},

		SetDom: function (/*XmlNode*/ dom) {
			this._dom = dom.cloneNode(true);
		},

		getCurrentState: function () {
			return this._current;
		},

		getNextState: function () {
			return this._current && this._current.next;
		},

		getPreviousState: function () {
			return this._current && this._current.prev;
		},

		dropCurrentState: function () {
			if (this._current) {
				var previousState = this._current.prev;
				var nextState = this._current.next;

				if (previousState) {
					this.Undo();

					previousState.next = nextState;

					if (nextState) {
						nextState.prev = previousState;
					}
				} else if (nextState) {
					this.Redo();
					nextState.prev = null;
				} else {
					this._current = null;
				}
			}
		},

		PushState: function (/*Object*/ args) {
			var dom = args.dom;
			var cursor = args.cursor;
			var memento = dom.memento;
			var targetUid = dom.targetUid;
			var state = dom.memento.GetState();
			var tmpNode = state.newNode;
			var newNode = tmpNode.cloneNode(true);
			var oldNode = this._findNodeByUid(this.GetDom(), targetUid);
			var parent = oldNode && oldNode.parentNode;
			var container = {
				data: { dom: dom, cursor: cursor },
				prev: this._current,
				next: null
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
		},

		Undo: function () {
			if (this._current && this._current.prev) {
				var previousState = this._current.prev;
				var currentState = this._current;

				this._current = previousState;

				this._startProcess();
				this._applyDomState(currentState.data.dom, 'source');
				this._applyCursorState(previousState.data && previousState.data.cursor);
				this._endProcess();

				return true;
			}
		},

		Redo: function () {
			if (this._current && this._current.next) {
				var nextState = this._current.next;
				var currentState = this._current;

				this._current = nextState;

				this._startProcess();
				this._applyDomState(nextState.data.dom, 'new');
				this._applyCursorState(nextState.data && nextState.data.cursor);
				this._endProcess();

				return true;
			}
		},

		_applyDomState: function (domState, mode) {
			var memento = domState.memento;
			var targetUid = domState.targetUid;
			var targetOrigin = this._findNodeByUid(
				this._viewmodel.Dom().Origin(),
				targetUid
			);
			var target = this._viewmodel.GetElementsByOrigin(targetOrigin)[0];
			var node;
			var uid;
			var currentNode;
			var parent;

			target.SetMemento({ memento: memento, mode: mode, queueChanges: this });

			switch (mode) {
				case 'new':
					node = memento.GetState().newNode.cloneNode(true);
					break;
				case 'source':
					node = memento.GetState().sourceNode.cloneNode(true);
					break;
			}

			uid = node.getAttribute('aras:id');
			currentNode = this._findNodeByUid(this.GetDom(), uid);
			parent = currentNode.parentNode;

			if (parent) {
				parent.replaceChild(node, currentNode);
			} else {
				this.SetDom(node);
			}
		},

		_applyCursorState: function (cursorState) {
			if (cursorState && cursorState.memento) {
				this._viewmodel.Cursor().SetMemento({
					memento: cursorState.memento,
					viewmodel: this._viewmodel
				});
			}
		},

		_findNodeByUid: function (node, uid) {
			if (node.nodeName === '#text') {
				return null;
			}

			if (node.getAttribute('aras:id') === uid) {
				return node;
			} else {
				var nodes = node.childNodes;
				var child;
				var result;
				var i;

				for (i = 0; i < nodes.length; i++) {
					child = nodes[i];
					result = this._findNodeByUid(child, uid);

					if (result) {
						return result;
					}
				}
			}

			return null;
		},

		startTrackingChanges: function () {
			if (!this._trackingEventHandler) {
				this._trackingEventHandler = aspect.after(
					this._viewmodel,
					'OnInvalidate',
					this.GetOnInvalidateHandler(),
					true
				);
			}
		},

		dropChangesQueue: function () {
			var dom = this._viewmodel.Dom();
			var memento = dom.CreateMemento({ queueChanges: this });

			this._current = null;
			this.PushState({ dom: { memento: memento, targetUid: dom.Uid() } });
		},

		stopTrackingChanges: function () {
			if (this._trackingEventHandler) {
				this._trackingEventHandler.remove();
				this._trackingEventHandler = null;
			}
		},

		GetOnInvalidateHandler: function () {
			return function (sender, earg) {
				function depth(node) {
					return parent(node) ? depth(parent(node)) + 1 : 0;
				}

				function parent(node) {
					return node.Parent;
				}

				function LCA(u, v) {
					var h1 = depth(u);
					var h2 = depth(v);

					while (h1 !== h2) {
						if (h1 > h2) {
							u = parent(u);
							h1--;
						} else {
							v = parent(v);
							h2--;
						}
					}

					while (u !== v) {
						u = parent(u);
						v = parent(v);
					}

					return u;
				}

				function LCA_ALL(arr) {
					var p = arr[0];

					arr.forEach(function (cur) {
						p = LCA(p, cur);
					});

					return p;
				}

				// Validate for translations
				if (
					this._defaultLanguageCode == this._currentLanguageCode &&
					earg.invalidationList.length &&
					!sender.QueueChanges().IsProgress()
				) {
					var target = LCA_ALL(earg.invalidationList);
					var isValid = false;
					var memento;
					var state;
					var cursorMemento;

					while (!target.is('XmlSchemaElement') || !target.Uid()) {
						target = target.Parent;
					}

					do {
						memento = target.CreateMemento({
							queueChanges: sender.QueueChanges()
						});
						state = memento.GetState();

						if (state.sourceNode && state.newNode) {
							isValid = true;
						} else {
							target = target.Parent;
						}
					} while (!isValid);

					cursorMemento = sender.Cursor().CreateMemento();

					sender.QueueChanges().PushState({
						dom: { memento: memento, targetUid: target.Uid() },
						cursor: { memento: cursorMemento }
					});
				}
			};
		}
	});
});
