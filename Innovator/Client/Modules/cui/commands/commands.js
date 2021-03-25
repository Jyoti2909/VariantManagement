const commands = [];

export const addCommandMetadata = (metadata = []) => {
	metadata.forEach((data) => commands.push(data));
};

const findCommand = (commands, options) => {
	const { itemTypeName, type } = options;
	return commands.find((command) => {
		const itemTypeCompatible = command.itemTypeName === itemTypeName;
		const typeCompatible = command.type === type;
		return typeCompatible && itemTypeCompatible;
	});
};

export const getCommandMetadata = (type, itemTypeName) => {
	const options = { itemTypeName, type };
	const itemTypeCommand = findCommand(commands, options);
	if (itemTypeCommand) {
		return itemTypeCommand;
	}

	return findCommand(commands, { type });
};
