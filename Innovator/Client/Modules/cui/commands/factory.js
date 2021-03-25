import { getCommandMetadata } from './commands';

const defaultCommand = {
	canExecute: () => true,
	execute: () => {
		throw new Error('The execute method is not specified');
	}
};

const createGlobalCommand = (metadata, options) => {
	const { type, itemTypeName } = metadata;
	if (!itemTypeName) {
		return null;
	}

	return createCommand(type, null, options);
};

const executeCommandMethod = (methodName, metadata, options) => {
	const globalCommand = createGlobalCommand(metadata, options);
	const method = metadata[methodName];
	if (method) {
		const commands = Object.freeze({ commandFactory, globalCommand });
		return method(options, commands);
	}

	if (globalCommand === null) {
		return defaultCommand[methodName]();
	}

	return globalCommand[methodName]();
};

const callExecuteCommand = async (...args) => {
	const canExecuteResult = canExecuteFactory(...args)();
	if (canExecuteResult === true) {
		return await executeCommandMethod('execute', ...args);
	}

	const [metadata] = args;
	throw new Error(`The ${metadata.name} command cannot be executed`);
};

const canExecuteFactory = (...args) => {
	const canExecute = () => {
		const canExecuteResult = executeCommandMethod('canExecute', ...args);
		return canExecuteResult === true;
	};

	return canExecute;
};

const executeFactory = (...args) => {
	const execute = () => callExecuteCommand(...args);
	return execute;
};

const createCommand = (type, itemTypeName, options) => {
	const metadata = getCommandMetadata(type, itemTypeName);
	if (metadata === undefined) {
		return null;
	}

	const canExecute = canExecuteFactory(metadata, options);
	const execute = executeFactory(metadata, options);
	return Object.freeze({ canExecute, execute });
};

export const commandFactory = (type, options) => {
	const commandOptions = { ...options };
	const { itemTypeName = null } = commandOptions;
	return createCommand(type, itemTypeName, commandOptions);
};

export default commandFactory;
