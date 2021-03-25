define(['dojo/_base/declare'], function (declare) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTextXmlSchemaElement.ArasTextSelection',
		null,
		{
			_fromId: null,
			_fromOff: -1,
			_toId: null,
			_toOff: -1,

			constructor: function (arasTextObj) {},

			/*Pablic API*/
			From: function (uid, position) {
				if (uid !== undefined) {
					this._fromId = uid;
					this._fromOff = position;
				} else {
					return this.IsValid()
						? { id: this._fromId, offset: this._fromOff }
						: null;
				}
			},

			To: function (uid, position) {
				if (uid !== undefined) {
					this._toId = uid;
					this._toOff = position;
				} else {
					return this.IsValid()
						? { id: this._toId, offset: this._toOff }
						: null;
				}
			},

			Clear: function () {
				this._fromId = null;
				this._fromOff = -1;
				this._toId = null;
				this._toOff = -1;
			},

			IsValid: function () {
				return this._fromId && this._toId;
			},

			IsRange: function () {
				return (
					this._fromId &&
					(this._fromId != this._toId || this._fromOff != this._toOff)
				);
			}
		}
	);
});
