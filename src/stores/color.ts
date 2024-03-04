import { writable, type Readable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { COLOR_NAMES, type COLOR } from '$lib/color';

interface ColorQueueStore extends Readable<COLOR[]> {
	repush: () => void;
	interruptAtFirst: (color: COLOR) => void;
}
const contextName = 'colorQueue';

const createColorQueueStore = (): ColorQueueStore => {
	const colorStore = writable<COLOR[]>([...COLOR_NAMES]);
	const repush = () => {
		colorStore.update(($colors) => {
			const [color] = $colors.splice(0, 1);
			$colors.push(color);
			return $colors;
		});
	};
	const interruptAtFirst = (color: COLOR) => {
		colorStore.update(($colors) => {
			const index = $colors.indexOf(color);
			const [_color] = $colors.splice(index, 1);
			$colors.unshift(_color);
			return $colors;
		});
	};
	return {
		subscribe: colorStore.subscribe,
		repush,
		interruptAtFirst
	};
};

export const initColorQueueStore = () => {
	const colorQueueStore = createColorQueueStore();
	setContext(contextName, colorQueueStore);
};

export const getColorQueueStore = () => getContext<ColorQueueStore>(contextName);
