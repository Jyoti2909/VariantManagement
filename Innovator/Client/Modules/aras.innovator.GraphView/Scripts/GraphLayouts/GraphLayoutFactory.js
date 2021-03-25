import GraphLayoutsEnum from './GraphLayoutsEnum';
import force from '../Algorithms/Force';
import sugiyama from '../Algorithms/Sugiyama';

export default (layoutType) => {
	const isForceLayout = layoutType === GraphLayoutsEnum.LayoutType.Force;
	const updateGraphLayout = isForceLayout ? force : sugiyama;
	const isVertical = layoutType === GraphLayoutsEnum.LayoutType.Vertical;

	return {
		isVertical,
		updateGraphLayout
	};
};
