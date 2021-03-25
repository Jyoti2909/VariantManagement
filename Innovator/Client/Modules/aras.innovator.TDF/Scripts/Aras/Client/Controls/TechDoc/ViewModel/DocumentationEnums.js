define([], function () {
	var images = {
		0: '../../images/Folder.svg',
		4: '../../images/FormattedText.svg',
		16: '../../images/TechDocItemType.svg',
		32: '../../images/UnformattedText.svg',
		64: '../../images/List_2.svg',
		128: '../../images/ListItem.svg',
		256: '../../images/Image.svg',
		512: '../../images/ItemType.svg',
		1024: '../../images/Table.svg',
		2048: '../../images/TableRow.svg',
		4096: '../../images/TableCell.svg',
		8192: '../../images/Properties.svg'
	};

	return {
		EditLevels: {
			FullAllow: 0, // Document is locked by user; Language is current; Element don't placed in external block
			IgnoreExternal: 1, // Document is locked by user; Language is current. On external block don't validate
			AllowExternal: 2, // Document is locked by user; Language is current; Element placed in external block
			FullDeny: 4 // Document isn't locked by user; Language isn't current; Element placed in external block
		},

		XmlSchemaElementType: {
			Unknown: 0,
			SystemElement: 1,
			InteractiveElement: 2,
			Text: 4,
			String: 8,
			Block: 16,
			Mixed: 32,
			List: 64,
			ListItem: 128,
			Image: 256,
			Item: 512,
			Table: 1024,
			TableRow: 2048,
			TableCell: 4096,
			ItemProperty: 8192
		},

		getImagefromType: function (type) {
			var enums = Object.keys(images);
			var number;
			var i;

			for (i = 0; i < enums.length; i++) {
				number = parseInt(enums[i]);

				if (number && (type & number) === number) {
					return images[enums[i]];
				}
			}

			return images[this.XmlSchemaElementType.Unknown];
		},

		ElementContentType: {
			Common: 0,
			Static: 1,
			Dynamic: 2
		},

		ByReferenceType: {
			Unknown: 0,
			External: 1,
			Internal: 2
		},

		DisplayType: {
			Hidden: 0,
			Active: 1,
			Inactive: 2
		},

		ExternalTypes: {
			Block: 0,
			Image: 1,
			Link: 2,
			Item: 3
		},

		LinkTypes: {
			None: 0,
			ExternalDocument: 1,
			Url: 2,
			InternalElement: 3
		},

		Directions: {
			Up: 0,
			Right: 1,
			Down: 2,
			Left: 3
		}
	};
});
