export default function validateCondition(condition, itemTypeProperty) {
	switch (itemTypeProperty.data_type) {
		case 'string':
		case 'ml_string':
		case 'text':
		case 'formatted text':
		case 'image':
		case 'color':
		case 'item':
		case 'federated':
		case 'foreign':
			return ['=', '!=', 'like', 'not like', 'is null', 'is not null'].includes(
				condition
			);
		case 'md5':
		case 'list':
		case 'color list':
		case 'filter list':
			return ['=', '!=', 'is null', 'is not null'].includes(condition);
		case 'float':
		case 'decimal':
		case 'integer':
		case 'ubigint':
		case 'global_version':
		case 'sequence':
			return [
				'=',
				'!=',
				'<',
				'>',
				'<=',
				'>=',
				'is null',
				'is not null'
			].includes(condition);
		case 'date':
			return [
				'=',
				'!=',
				'<',
				'>',
				'<=',
				'>=',
				'between',
				'is null',
				'is not null'
			].includes(condition);
		case 'mv_list':
			return [
				'=',
				'!=',
				'<',
				'>',
				'<=',
				'>=',
				'like',
				'not like',
				'is null',
				'is not null'
			].includes(condition);
		case 'boolean':
			return ['=', '!='].includes(condition);
	}
	return true;
}
