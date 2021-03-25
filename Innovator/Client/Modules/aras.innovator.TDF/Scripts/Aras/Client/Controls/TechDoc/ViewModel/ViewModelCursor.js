define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Originator',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Memento'
], function (declare, Originator, Memento) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.ViewModelCursor',
		Originator,
		{
			start: null,
			startOffset: -1,
			end: null,
			endOffset: -1,
			commonAncestor: null,
			collapsed: undefined,
			_isModified: false,

			constructor: function (args) {},

			CreateMemento: function (/*Object*/ args) {
				var startNodePositionInParent = -1;
				var endNodePositionInParent = -1;
				var startUid;
				var startType;
				var endUid;
				var endType;
				var state;
				var parent;

				if (this.start) {
					if (this.start.is('ArasTextXmlSchemaElement')) {
						startUid = this.start.Uid();
						startType = 'ArasTextXmlSchemaElement';
					} else {
						parent = this.start.Parent;
						startType = this.start.nodeName;

						if (parent) {
							startUid = parent.Uid();
							startNodePositionInParent = parent.ChildItems().index(this.start);
						} else {
							startUid = this.start.Uid();
						}
					}
				}

				if (this.end) {
					if (this.end.is('ArasTextXmlSchemaElement')) {
						endUid = this.end.Uid();
						endType = 'ArasTextXmlSchemaElement';
					} else {
						parent = this.end.Parent;
						endType = this.end.nodeName;

						if (parent) {
							endUid = parent.Uid();
							endNodePositionInParent = parent.ChildItems().index(this.end);
						} else {
							endUid = this.end.Uid();
						}
					}
				}

				state = {
					startUid: startUid,
					startOffset: this.startOffset,
					startNodePositionInParent: startNodePositionInParent,
					startType: startType,
					endUid: endUid,
					endOffset: this.endOffset,
					endNodePositionInParent: endNodePositionInParent,
					endType: endType
				};

				return new Memento({ state: state });
			},

			SetMemento: function (/*Object*/ args) {
				var memento = args.memento;
				var viewmodel = args.viewmodel;
				var state = memento.GetState();
				var elements = viewmodel.GetElementsByUid(state.startUid);
				var element;
				var start;
				var end;

				if (elements.length) {
					element = elements[0];
					start =
						state.startType === 'ArasTextXmlSchemaElement'
							? element
							: element.ChildItems().get(state.startNodePositionInParent);
				}

				elements = viewmodel.GetElementsByUid(state.endUid);
				if (elements.length) {
					element = elements[0];
					end =
						state.endType === 'ArasTextXmlSchemaElement'
							? element
							: element.ChildItems().get(state.endNodePositionInParent);
				}

				this.start = start;
				this.startOffset = state.startOffset;
				this.end = end;
				this.endOffset = state.endOffset;

				this._recalculateCollapsed();
				this._recalculateCommonAncestor();

				if (this.start && this.start.is('ArasTextXmlSchemaElement')) {
					this.start.InvalidRange(this);
				}

				viewmodel.SetSelectedItems(this.commonAncestor);
				this._invalidate();
			},

			IsModified: function () {
				return this._isModified;
			},

			Reinitialize: function (/*DOMRange*/ domRange) {
				this.start = domRange.start;
				this.startOffset = domRange.startOffset;

				this.end = domRange.end;
				this.endOffset = domRange.endOffset;

				this.commonAncestor = domRange.commonAncestor;
				this.collapsed = domRange.collapsed;
				this._isModified = false;
				this.OnCursorChanged(this);
			},

			Set: function (start, startOffset, end, endOffset) {
				this.start = start;
				this.startOffset = startOffset;
				this.end = end;
				this.endOffset = endOffset;

				this._recalculateCollapsed();
				this._recalculateCommonAncestor();

				this._invalidate();
			},

			Collapse: function () {
				this.start = this.start;
				this.startOffset = this.startOffset;
				this.end = this.start;
				this.endOffset = this.startOffset;
				this.commonAncestor = this.start;
				this.collapsed = true;

				this._invalidate();
			},

			_invalidate: function () {
				this._isModified = true;
				this.OnCursorChanged(this, {});
			},

			_calculateElementDepth: function (/*WrappedObject*/ targetElement) {
				var i = 0;
				while (targetElement.Parent) {
					targetElement = targetElement.Parent;
					i++;
				}

				return i;
			},

			_findLowestCommonAncestor: function (/*WrappedObject*/ start, end) {
				var startDepth = this._calculateElementDepth(start);
				var endDepth = this._calculateElementDepth(end);

				while (startDepth != endDepth) {
					if (startDepth > endDepth) {
						start = start.Parent;
						startDepth--;
					} else {
						end = end.Parent;
						endDepth--;
					}
				}

				while (start != end) {
					start = start.Parent;
					end = end.Parent;
				}

				return start;
			},

			_recalculateCommonAncestor: function () {
				if (this.start && this.end) {
					this.commonAncestor = this._findLowestCommonAncestor(
						this.start,
						this.end
					);
				} else {
					this.commonAncestor = null;
				}
			},

			_recalculateCollapsed: function () {
				this.collapsed =
					this.start == this.end && this.startOffset == this.endOffset;
			},

			OnCursorChanged: function (sender, earg) {
				//event
			},

			DeleteContents: function () {
				if (!this.collapsed && this.commonAncestor) {
					if (this.commonAncestor.is('XmlSchemaText')) {
						//selection inside of the same XmlSchemaText
						var substText = this.commonAncestor.Text();
						var textBefore = substText.substring(0, this.startOffset);
						var textAfter = substText.substring(this.endOffset);

						this.commonAncestor.Text(textBefore + textAfter);
					}

					this.Collapse();
				}
			},

			ExtractContents: function () {},

			InsertContent: function (/*WrappedObject*/ insertObject) {}
		}
	);
});
