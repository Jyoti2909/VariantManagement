import propertiesPlugin from './propertiesPlugin';
import classPathPlugin from './classPathPlugin';
import formClassificationPlugin from './formClassificationPlugin';
import policyAccessAttrDefinitionPlugin from './policyAccessAttrDefinitionPlugin';
import affectedTypePlugin from './affectedTypePlugin';

const pluginDeclarations = [
	{
		itemTypeName: 'Property',
		plugin: propertiesPlugin
	},
	{
		itemTypeName: 'ItemType Life Cycle',
		plugin: classPathPlugin
	},
	{
		itemTypeName: 'Can Add',
		plugin: classPathPlugin
	},
	{
		itemTypeName: 'DiscussionTemplate',
		plugin: classPathPlugin
	},
	{
		itemTypeName: 'View',
		plugin: formClassificationPlugin
	},
	{
		itemTypeName: 'ac_PolicyAccessAttrDefinition',
		plugin: policyAccessAttrDefinitionPlugin
	},
	{
		itemTypeName: 'Express DCO Affected Item',
		plugin: affectedTypePlugin
	},
	{
		itemTypeName: 'Simple ECO Affected Item',
		plugin: affectedTypePlugin
	}
];

export default pluginDeclarations;
