﻿import cuiMethods from './cuiMethods';
import cuiToolbar from './cuiToolbar';

const defaultControlType = 'default';
const accordionComponentName = 'aras-accordion';

const defaultConstructor = (control, childNodes, metadata) => {
	const {
		attributes = {},
		cssClass,
		cssStyle,
		name,
		aria_label: ariaLabel
	} = control;
	const { webComponentName } = metadata;

	return HyperHTMLElement.wire(null, `:${name}`)(
		[
			`<${webComponentName} class="`,
			`" style="`,
			`" aria-label="`,
			...Object.keys(attributes).map((attribute) => `" ${attribute}="`),
			`" >`,
			`</${webComponentName}>`
		],
		cssClass,
		cssStyle,
		ariaLabel,
		...Object.values(attributes),
		childNodes
	);
};

const tabContainerControlConstructor = (control, childNodes, metadata) => {
	control.attributes = {
		movable: true,
		...control.attributes
	};

	const tabContainerNode = defaultConstructor(control, [], metadata);
	const switcher = HyperHTMLElement.wire()`
		<aras-switcher>${childNodes}</aras-switcher>
	`;
	const nodes = [tabContainerNode, switcher];
	tabContainerNode.switcher = switcher;

	if (childNodes.some((node) => node.dataset.relTypeId)) {
		const spinner = HyperHTMLElement.wire()`
			<iframe
				class="aras-spinner-container aras-hide"
				frameborder="0"
				scrolling="no"
				src="../scripts/spinner.html"
			/>
		`;
		nodes.push(spinner);
	}

	return nodes;
};

const tabElementControlConstructor = (control, childNodes, metadata) => {
	const { name, relTypeId } = control;
	control.attributes = {
		'data-rel-type-id': relTypeId,
		role: 'tabpanel',
		'switcher-pane-id': relTypeId || name,
		...control.attributes
	};

	if (relTypeId) {
		const iframe = HyperHTMLElement.hyper`
			<iframe
				id="${relTypeId}"
				frameborder="0"
				width="100%"
				height="600"
				scrolling="no"
				src="about:blank"
			/>
		`;

		const { clientHeight } = (control["additional_data"] || {});
		if (clientHeight) {
			iframe.style.height = clientHeight + "px";
		}
		return defaultConstructor(control, [iframe], metadata);
	}

	return defaultConstructor(control, childNodes, metadata);
};

const initTabContainerControl = (nodes, data) => {
	const { component, children } = nodes;
	const { childrenData } = data;
	if (!childrenData.length) {
		return;
	}

	const accordion = component.closest(accordionComponentName);
	if (accordion) {
		component.on('click', () => {
			if (accordion.collapsed) {
				accordion.expand();
			}
		});
		component.on('keydown', (id, e) => {
			const key = e.code;
			if (accordion.collapsed && ['Enter', 'Space'].includes(key)) {
				accordion.expand();
			}
		});
	}

	childrenData.forEach((child) => {
		const { label, name, relTypeId } = child;
		const tabId = relTypeId || name;
		const tabLabel = label || name;
		component.addTab(tabId, { ...child, label: tabLabel });
	});

	component.selectTab(component.tabs[0]);

	const hasRelationshipTabs = childrenData.some((tab) => tab.relTypeId);
	if (hasRelationshipTabs) {
		component.on('select', (id, event) => {
			const prevId = event.detail.previousId;
			const tabs = Array.from(component.switcher.children);
			selectTab(tabs, id, prevId);
		});
		selectTab(children, component.selectedTab, null);
	}
};

const selectTab = (tabs, id, prevId) => {
	const tab =
		tabs.find(
			(tab) =>
				tab.dataset.relTypeId && tab.getAttribute('switcher-pane-id') === id
		) || null;
	const prevTab =
		tabs.find(
			(tab) =>
				tab.dataset.relTypeId && tab.getAttribute('switcher-pane-id') === prevId
		) || null;
	const previousFrame = prevTab && prevTab.querySelector('iframe:first-child');
	if (!tab) {
		window.relationshipsControl.loadRelationshipFrame(
			null,
			null,
			previousFrame
		);
		return;
	}
	const frame = tab.querySelector('iframe:first-child');
	window.relationshipsControl.loadRelationshipFrame(
		tab.dataset.relTypeId,
		frame,
		previousFrame
	);
};

const initToolbarControl = ({ component }, { componentData }, options) =>
	cuiToolbar(component, componentData['location@keyed_name'], options);

const cuiControls = {
	[defaultControlType]: {
		constructor: defaultConstructor,
		webComponentName: 'div'
	},
	AccordionElementControl: {
		webComponentName: accordionComponentName
	},
	FormControl: {
		webComponentName: 'aras-form'
	},
	TabContainerControl: {
		constructor: tabContainerControlConstructor,
		initControl: initTabContainerControl,
		webComponentName: 'aras-tabs'
	},
	TabElementControl: {
		constructor: tabElementControlConstructor
	},
	ToolbarControl: {
		eventHandler: cuiMethods.reinitControlItems,
		initControl: initToolbarControl,
		webComponentName: 'aras-toolbar'
	}
};

const getControlMetadata = (type) => ({
	...cuiControls[defaultControlType],
	...cuiControls[type]
});

export default getControlMetadata;
