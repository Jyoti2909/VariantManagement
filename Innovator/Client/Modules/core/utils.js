const utils = {};

utils.mixin = function (...arg) {
	const target = arg[0];

	const _len = arg.length;
	const sources = Array(_len > 1 ? _len - 1 : 0);

	for (let _key = 1; _key < _len; _key++) {
		sources[_key - 1] = arg[_key];
	}

	sources.forEach(function (source) {
		const descriptors = Object.keys(source).reduce(function (descriptors, key) {
			descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
			return descriptors;
		}, {});
		// by default, Object.assign copies enumerable Symbols too
		Object.getOwnPropertyNames(source).forEach(function (sym) {
			const descriptor = Object.getOwnPropertyDescriptor(source, sym);
			if (descriptor.enumerable) {
				descriptors[sym] = descriptor;
			}
		});
		Object.defineProperties(target, descriptors);
	});
	return target;
};

utils.infernoFlags = {
	unknownChildren: 0,
	hasInvalidChildren: 1,
	hasVNodeChildren: 2,
	hasNonKeyedChildren: 4,
	hasKeyedChildren: 8,
	multipleChildren: 12,
	hasTextChildren: 16,
	componentFunction: 8
};

utils.templateToVNode = function (template) {
	if (template === null) {
		return template;
	}

	if (typeof template !== 'object' || !template.tag) {
		if (template.flags && template.type) {
			return template;
		}

		return Inferno.createTextVNode(template);
	}

	let children;
	if (template.children) {
		children = template.children.map((child) => utils.templateToVNode(child));
	}

	const props = {
		style: template.style
	};
	Object.assign(props, template.attrs || {}, template.events || {});

	let childFlag;
	if (!children || (!Array.isArray(children) && typeof children !== 'object')) {
		childFlag = this.infernoFlags.hasInvalidChildren;
	} else if (!Array.isArray(children)) {
		childFlag = this.infernoFlags.hasVNodeChildren;
	} else if (children.every((child) => !!child.key)) {
		childFlag = this.infernoFlags.hasKeyedChildren;
	} else {
		childFlag = this.infernoFlags.hasNonKeyedChildren;
	}
	return Inferno.createVNode(
		Inferno.getFlagsForElementVnode(template.tag),
		template.tag,
		template.className,
		children,
		childFlag,
		props,
		template.key,
		template.ref
	);
};

function createWebComponent({ tag, state, props }) {
	return Inferno.createVNode(
		Inferno.getFlagsForElementVnode(tag),
		tag,
		state.className,
		null,
		utils.infernoFlags.unknownChildren,
		props
	);
}

const components = new WeakMap();

createWebComponent.defaultHooks = {
	onComponentShouldUpdate(prev, next) {
		if (components.has(prev)) {
			components.set(next, components.get(prev));
			components.delete(prev);
		}
		return prev.tag !== next.tag || !utils.areEqual(prev.state, next.state);
	}
};

utils.createWebComponentFunction = function (props, method) {
	return Inferno.createComponentVNode(
		utils.infernoFlags.componentFunction,
		createWebComponent,
		props,
		null,
		{
			onComponentDidMount(domNode) {
				method(domNode);
				components.set(props, domNode);
			},
			onComponentDidUpdate(prev, next) {
				if (components.has(next)) {
					method(components.get(next));
				}
			}
		}
	);
};

utils.hashFromString = function (string) {
	let hash = 0;
	if (string.length === 0) {
		return hash;
	}
	for (let i = 0; i < string.length; i++) {
		const char = string.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

utils.extendHTMLElement = function (...arg) {
	return typeof Reflect === 'object'
		? Reflect.construct(HTMLElement, arg, this.constructor)
		: HTMLElement.apply(this, arg) || this;
};

const xStackPool = [];
const yStackPool = [];
utils.areEqual = function (x, y) {
	const xStack = xStackPool.length ? xStackPool.pop() : [];
	const yStack = yStackPool.length ? yStackPool.pop() : [];
	const result = equal(x, y, xStack, yStack);
	xStack.length = 0;
	yStack.length = 0;
	xStackPool.push(xStack);
	yStackPool.push(yStack);

	return result;
};

function equal(x, y, xStack, yStack) {
	if (x === y) {
		return x !== 0 || 1 / x == 1 / y;
	}
	if (x == null || y == null) {
		return false;
	}
	if (typeof x != 'object' || typeof y != 'object') {
		return false;
	}
	const objToString = Object.prototype.toString.call(x);
	if (objToString != Object.prototype.toString.call(y)) {
		return false;
	}
	if (objToString === '[object Date]') {
		return +x == +y;
	}

	let stackLength = xStack.length;
	while (stackLength--) {
		if (xStack[stackLength] == x) {
			return yStack[stackLength] == y;
		}
	}
	xStack.push(x);
	yStack.push(y);
	if (objToString === '[object Array]') {
		let arrayLength = x.length;
		if (arrayLength !== y.length) {
			return false;
		}
		while (arrayLength--) {
			if (!equal(x[arrayLength], y[arrayLength], xStack, yStack)) {
				return false;
			}
		}
	} else {
		if (x.constructor !== y.constructor) {
			return false;
		}

		const hasOwnProperty = Object.prototype.hasOwnProperty;
		if (
			hasOwnProperty.call(x, 'valueOf') &&
			hasOwnProperty.call(y, 'valueOf')
		) {
			return x.valueOf() == y.valueOf();
		}
		const keys = Object.keys(x);
		const keysLength = keys.length;
		if (keysLength != Object.keys(y).length) {
			return false;
		}
		for (let i = 0; i < keysLength; i++) {
			if (!equal(x[keys[i]], y[keys[i]], xStack, yStack)) {
				return false;
			}
		}
	}
	xStack.pop();
	yStack.pop();

	return true;
}

export default utils;
