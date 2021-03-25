define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTextXmlSchemaElement.ArasTextStash',
		null,
		{
			owner: null,
			_stash: null,
			_map: null,
			_isInitialized: false,

			constructor: function (/*ArasTextXmlSchemaElement*/ arasTextElement) {
				this.owner = arasTextElement;
				this._allowedStyles = arasTextElement._allowedStyles;
				this._initialiseStash();
			},

			_initialiseStash: function () {
				var clildsItems = this.owner.origin.childNodes;
				var childItemsCount = clildsItems.length;
				var i;
				var childItem;
				var cell;

				this._stash = [];
				this._map = {};

				for (i = 0; i < clildsItems.length; i++) {
					childItem = clildsItems[i];

					cell = this.CreateNewEmphInstance(childItem);
					this.RegisterEmph(cell);
				}
			},

			_getIndexOfEmphInStash: function (/*string*/ uid) {
				var stash = this._stash;
				var count = stash.length;

				for (var i = 0; i < count; i++) {
					if (uid == stash[i]) {
						return i;
					}
				}
				return -1;
			},

			GetNextPositionForSet: function (/*uid*/ SetBeforeId) {
				var index = this._getIndexOfEmphInStash(SetBeforeId);

				return index >= 0 ? index : this._stash.length;
			},

			RegisterEmph: function (emph, index) {
				var emphId = emph.Id();

				if (!this._map[emphId]) {
					if (!index && index !== 0) {
						this._stash.push(emphId);
					} else {
						this._stash.splice(index, 0, emphId);
					}

					this._map[emphId] = emph;
					this._isInitialized = true;
				}

				return emph;
			},

			UnRegisterEmph: function (emph) {
				var uid = emph.Id();
				var index = this._getIndexOfEmphInStash(uid);

				this._stash.splice(index, 1);
				delete this._map[uid];

				if (this._stash.length === 0) {
					this._isInitialized = false;
				}
			},

			/* Public Properies */
			Stash: function () {
				return this._stash;
			},

			IsInitialized: function () {
				return this._isInitialized;
			},

			Count: function () {
				return this._stash.length;
			},

			GetEmphObjById: function (uid) {
				return uid !== undefined ? this._map[uid] : null;
			},

			CreateNewEmphInstance: function (node) {
				return this.owner.CreateNewEmphObject(node);
			},

			GetSurroundForCursor: function (uid, type) {
				var stash = this._stash;
				var i;

				for (i = 0; i < stash.length; i++) {
					if (stash[i] == uid) {
						return type == 'prev' ? stash[i - 1] : stash[i + 1];
					}
				}
			}
		}
	);
});
