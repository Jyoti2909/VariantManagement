define(['dojo/_base/declare'], function (declare) {
	var ArrayWrapper = declare(
		'Aras.Client.Controls.TechDoc.ViewModel.ArrayWrapper',
		null,
		{
			origin: null,
			owner: null,
			_array: null,
			_indexHash: null,

			constructor: function (args) {
				this.origin = args.origin;
				this.owner = args.owner;
				this._indexHash = [];

				this.initialize(args.array || []);
				this.suspended = false;
			},

			initialize: function (/*WrappedObject[]*/ array) {
				for (var i = 0; i < array.length; i++) {
					array[i].Parent = this.owner;
				}

				this._array = array;
				this._RebuildIndexes();
			},

			length: function () {
				return this._array.length;
			},

			List: function () {
				return this._array;
			},

			get: function (/*int*/ index) {
				return this._array[index];
			},

			add: function (/*WrappedObject*/ newElement) {
				this.insertAt(this.length(), newElement);
			},

			addRange: function (/*ArrayWrapper*/ elementsArray) {
				var itemsCount = elementsArray.length();
				var i;

				if (itemsCount) {
					this._suspendEvents();

					for (i = 0; i < itemsCount; i++) {
						this.add(elementsArray.get(i));
					}

					this._resumeEvents();
					this.fireChangedEvent();
				}
			},

			clear: function () {
				this.unregisterElements();

				this._array.length = 0;
				this.origin.length = 0;

				this.fireChangedEvent();
			},

			splice: function (startIndex, deleteCount) {
				const ownerOrigin = this.owner && this.owner.origin;
				const elementsList = this._array;
				const childCount = elementsList.length;

				if (ownerOrigin && childCount) {
					startIndex = Math.min(Math.max(startIndex, 0), childCount - 1);
					deleteCount =
						startIndex + deleteCount > childCount
							? childCount - startIndex
							: deleteCount;

					this._suspendEvents();

					for (let i = 0; i < deleteCount; i++) {
						const childElement = elementsList[startIndex + i];

						childElement.unregisterDocumentElement();
						ownerOrigin.removeChild(childElement.origin);
					}

					result = new ArrayWrapper({
						owner: this.owner,
						origin: null,
						array: elementsList.splice(startIndex, deleteCount)
					});

					this._resumeEvents();
					this.fireChangedEvent();
				}

				return result;
			},

			insertAt: function (index, newElements) {
				newElements = newElements
					? Array.isArray(newElements)
						? newElements
						: [newElements]
					: [];

				if (newElements.length) {
					const itemsCount = this.length();

					if (index >= 0 && index <= itemsCount) {
						const parentOrigin = this.owner.origin;
						const insertionNode =
							index !== itemsCount && this._array[index].Origin();

						this._suspendEvents();

						Array.prototype.splice.apply(
							this._array,
							[index, 0].concat(newElements)
						);

						for (let i = 0; i < newElements.length; i++) {
							const currentElement = newElements[i];
							const elementOrigin = currentElement.Origin();

							if (insertionNode) {
								parentOrigin.insertBefore(elementOrigin, insertionNode);
							} else {
								parentOrigin.appendChild(elementOrigin);
							}

							//set parent before registration, because registration need to make sure is parent registered or not
							currentElement.Parent = this.owner;
							currentElement.registerDocumentElement();
						}

						this._resumeEvents();
						this.fireChangedEvent();
					} else {
						aras.AlertError(
							aras.getResource(
								'../Modules/aras.innovator.TDF',
								'helper.insert_out_range'
							)
						);
					}
				}
			},

			index: function (/*WrappedObject*/ targetElement) {
				var itemId = targetElement.Id();
				var index = this._indexHash[itemId];
				var i;

				if (isNaN(index)) {
					for (i = 0; i < this._array.length; i++) {
						if (this._array[i] == targetElement) {
							this._indexHash[itemId] = i;
							index = i;
							break;
						}
					}
				}

				return !isNaN(index) ? index : -1;
			},

			forEach: function (/*Function*/ handler) {
				for (var i = 0; i < this.length(); i++) {
					handler(this.get(i));
				}
			},

			registerElements: function () {
				this.forEach(function (element) {
					element.registerDocumentElement();
				});
			},

			unregisterElements: function () {
				this.forEach(function (element) {
					element.unregisterDocumentElement();
				});
			},

			_suspendEvents: function () {
				this.suspended = true;
			},

			_resumeEvents: function () {
				this.suspended = false;
			},

			_RebuildIndexes: function () {
				var element;
				var i;

				this._indexHash.length = 0;
				for (i = 0; i < this._array.length; i++) {
					element = this._array[i];
					this._indexHash[element.Id()] = i;
				}
			},

			fireChangedEvent: function () {
				if (!this.suspended) {
					this._RebuildIndexes();
					this.onChanged(this);
				}
			},

			onChanged: function (sender) {
				sender.owner._onChildItemsChanged(sender);
			}
		}
	);

	return ArrayWrapper;
});
