const SCROLL_AREA_SIZE = 90;
const SCROLL_SPEED = 2;

function moveArrayElement(array, element, offset) {
	const index = array.indexOf(element);
	const newIndex = index + offset;

	if (newIndex > -1 && newIndex < array.length) {
		const removedElement = array.splice(index, 1)[0];
		array.splice(newIndex, 0, removedElement);
	}
}

export default class DragController {
	constructor(tabInstance, tabHelper) {
		this.tabInstance = tabInstance;
		this.tabHelper = tabHelper;
		this.dragInfo = {};
		this.boundDragHandler = this.dragHandler.bind(this);
		this.boundDragEndHandler = this.dragEndHandler.bind(this);
		tabInstance._elem.addEventListener(
			'dragstart',
			this.dragStartHandler.bind(this)
		);
	}
	dragStartHandler(evt) {
		evt.preventDefault();
		evt.stopPropagation();
		const targetElement = evt.target.closest('li');
		if (!targetElement) {
			return;
		}

		const tabId = targetElement.dataset.id;
		if (this.tabInstance.selectedTab !== tabId) {
			this.tabInstance.selectTab(tabId);
		}
		const computedStyle = window.getComputedStyle(targetElement);
		const margin =
			parseInt(computedStyle.marginRight) +
			parseInt(computedStyle.borderRightWidth);
		const containerRect = this.tabInstance._elem.getBoundingClientRect();
		this.dragInfo = {
			draggedElement: targetElement,
			id: tabId,
			lastTarget: null,
			initialOffset: evt.clientX - targetElement.offsetLeft,
			draggedElementOffset: targetElement.offsetLeft,
			draggedElementWidth: targetElement.offsetWidth,
			margin,
			itemsNodes: {},
			tabs: this.tabInstance.tabs.slice(),
			containerRect,
			scrollOffset: 0,
			scrollInterval: null,
			initialScrollOffset: this.tabInstance._movable.scrollLeft,
			mouseX: evt.clientX,
			containerScrollWidth: this.tabInstance._movable.scrollWidth
		};
		const items = this.tabInstance._elem.querySelectorAll('li');
		[].forEach.call(items, (li) => {
			this.dragInfo.itemsNodes[li.dataset.id] = li;
		});
		window.document.addEventListener('mousemove', this.boundDragHandler);
		window.document.addEventListener('mouseup', this.boundDragEndHandler);
		this.tabInstance._elem.classList.add('aras-tabs_draggable');
		targetElement.style.pointerEvents = 'none';
		targetElement.dataset.drag = 'true';
	}

	dragHandler(evt) {
		const {
			draggedElement,
			initialOffset,
			draggedElementOffset,
			draggedElementWidth,
			margin,
			lastTarget,
			id,
			containerRect,
			tabs,
			itemsNodes,
			containerScrollWidth
		} = this.dragInfo;

		if (evt.clientX < 0 || evt.clientY < 0) {
			this.dragEndHandler(evt);
			return;
		}

		this.dragInfo.mouseX = evt.clientX;

		const target =
			evt.target.closest && evt.target.closest('li[draggable=true]');

		if (target && target !== lastTarget) {
			const targetId = target.dataset.id;
			const targetTabIndex = tabs.indexOf(targetId);
			const draggableTabIndex = tabs.indexOf(id);
			const startIndex = Math.min(targetTabIndex, draggableTabIndex);
			const endIndex = Math.max(targetTabIndex, draggableTabIndex);
			const affectedTabs = tabs.slice(startIndex, endIndex);

			if (affectedTabs.indexOf(targetId) === -1) {
				affectedTabs.push(targetId);
			}

			const direction = targetTabIndex - draggableTabIndex;
			const elementOffset = Math.abs(startIndex - endIndex);
			moveArrayElement(
				this.dragInfo.tabs,
				id,
				direction > 0 ? elementOffset : -elementOffset
			);

			affectedTabs.forEach((tabId) => {
				const tab = itemsNodes[tabId];
				if (tab === draggedElement) {
					return;
				}
				if (tab.style.transform) {
					tab.style.transform = '';
				} else {
					const offset =
						direction < 0
							? draggedElementWidth + margin
							: -draggedElementWidth - margin;
					tab.style.transform = `translate3d(${offset}px, 0, 0)`;
				}
			});
		}

		function doScroll(instanse, direction) {
			const tabs = instanse.tabInstance;
			if (
				direction === 'right' &&
				containerScrollWidth <=
					tabs._movable.scrollLeft + tabs._movable.offsetWidth
			) {
				return;
			}
			const offset = direction === 'right' ? SCROLL_SPEED : -SCROLL_SPEED;
			tabs._movable.scrollLeft += offset;
			instanse.dragInfo.scrollOffset =
				tabs._movable.scrollLeft - instanse.dragInfo.initialScrollOffset;
			const x = instanse.dragInfo.mouseX;
			const draggedOffset =
				x -
				initialOffset -
				draggedElementOffset +
				instanse.dragInfo.scrollOffset;
			draggedElement.style.transform = `translate3d(${draggedOffset}px, 0, 0)`;
		}

		if (!this.dragInfo.scrollInterval) {
			if (evt.clientX > containerRect.right - SCROLL_AREA_SIZE) {
				this.dragInfo.scrollInterval = setInterval(doScroll, 0, this, 'right');
				return;
			}
			if (evt.clientX < containerRect.left + SCROLL_AREA_SIZE) {
				this.dragInfo.scrollInterval = setInterval(doScroll, 0, this, 'left');
				return;
			}
		} else {
			if (
				evt.clientX < containerRect.right - SCROLL_AREA_SIZE &&
				evt.clientX > containerRect.left + SCROLL_AREA_SIZE
			) {
				clearInterval(this.dragInfo.scrollInterval);
				this.dragInfo.scrollInterval = null;
				this.tabHelper.controlByScroll(
					this.tabInstance._elem,
					this.tabInstance._movable
				);
			}
		}

		const draggedOffset =
			evt.clientX -
			initialOffset -
			draggedElementOffset +
			this.dragInfo.scrollOffset;
		draggedElement.style.transform = `translate3d(${draggedOffset}px, 0, 0)`;
		this.dragInfo.lastTarget = target;
	}
	dragEndHandler(evt) {
		const { draggedElement, tabs, itemsNodes, scrollInterval } = this.dragInfo;
		this.tabInstance.tabs = tabs;
		window.document.removeEventListener('mousemove', this.boundDragHandler);
		window.document.removeEventListener('mouseup', this.boundDragEndHandler);
		clearInterval(scrollInterval);
		this.dragInfo = null;
		this.tabInstance.render().then(() => {
			this.tabInstance._elem.classList.remove('aras-tabs_draggable');
			draggedElement.style.transform = '';
			draggedElement.style.pointerEvents = '';
			draggedElement.dataset.drag = '';
			tabs.forEach((tabId) => (itemsNodes[tabId].style.transform = ''));
			this.tabHelper.controlByScroll(
				this.tabInstance._elem,
				this.tabInstance._movable
			);
		});
	}
}
