export default {
	async getItemType(criteriaValue, criteriaName = 'name') {
		if (!criteriaValue) {
			return null;
		}

		return aras.MetadataCacheJson.GetItemType(criteriaValue, criteriaName);
	},

	getMorphaeList(itemType) {
		if (!itemType) {
			return [];
		}

		return itemType.Morphae.map((morphae) => {
			const { name, label } = morphae['related_id'];
			return {
				id: morphae.id,
				name: name,
				label: label || name
			};
		});
	},

	isAllowToAdd(itemType) {
		if (!itemType) {
			return false;
		}

		const isDependent = itemType['is_dependent'] === '1';
		const isRelationship = itemType['is_relationship'] === '1';
		const hasUserSrcAccess = itemType['user_src_access'] === '1';
		const isRelationshipAndUseSrcAccess = isRelationship && hasUserSrcAccess;
		if (isDependent || isRelationshipAndUseSrcAccess) {
			return false;
		}

		const userIdentities = aras.getIdentityList();
		const isSuperUser = userIdentities.includes(
			'6B14D33C4A7D41C188CCF2BC15BD01A3'
		);
		if (isSuperUser) {
			return true;
		}

		const canAdd = itemType['Can Add'] || [];
		return canAdd.some((relationship) => {
			const canAdd = relationship['can_add'] === '1';
			const identityId = relationship['related_id@aras.id'];
			return canAdd && userIdentities.includes(identityId);
		});
	},

	getKeyedNameConfiguration(itemType) {
		if (!itemType) {
			return [];
		}

		return itemType.Property.filter(
			(property) => property['keyed_name_order'] !== null
		).sort(
			(propertyA, propertyB) =>
				propertyA['keyed_name_order'] - propertyB['keyed_name_order']
		);
	},

	getItemTypeName(id) {
		if (!id) {
			return '';
		}

		return aras.MetadataCacheJson.GetItemTypeName(id);
	},

	getItemTypeId(name) {
		if (!name) {
			return '';
		}

		return aras.MetadataCacheJson.GetItemTypeId(name);
	},

	getProperyEvents(itemType, propertyName, eventName) {
		if (!itemType || !propertyName) {
			return [];
		}

		const currentProperty = itemType.Property.find(
			(property) => property.name === propertyName
		);
		if (!currentProperty) {
			return [];
		}

		let propertyEvents = currentProperty['Grid Event'];
		if (eventName) {
			propertyEvents = propertyEvents.filter(
				(event) => event['grid_event'] === eventName
			);
		}

		return propertyEvents.map((event) => {
			const {
				name: methodName,
				method_type: methodType,
				method_code: methodCode
			} = event['related_id'];
			return {
				eventName: event['grid_event'],
				methodName,
				methodType,
				methodCode
			};
		});
	},

	isPolymorphic(itemType) {
		if (!itemType) {
			return false;
		}

		return itemType['implementation_type'] === 'polymorphic';
	}
};
