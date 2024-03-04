import { writable, type Writable } from 'svelte/store';
import { getContext, setContext } from 'svelte';
interface TiktokLiveSetting {
	isAuto: boolean;
	isGiftLinked: boolean;
	isConnected: boolean;
	userName: string;
	roomId: string | null;
}
type TiktokLiveStore = Writable<TiktokLiveSetting>;

const contextName = 'tiktokLive';

export const initTikTokLiveStore = () => {
	const tiktokLiveStore = writable<TiktokLiveSetting>({
		isAuto: false,
		isGiftLinked: false,
		isConnected: false,
		userName: '',
		roomId: null
	});
	setContext(contextName, tiktokLiveStore);
};

export const getTiktokLiveStore = () => getContext<TiktokLiveStore>(contextName);
