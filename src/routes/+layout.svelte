<script lang="ts">
	import LiveConnectInput from './LiveConnectInput.svelte';
	import '../app.pcss';
	import {
		AppBar,
		Drawer,
		getDrawerStore,
		initializeStores,
		type DrawerSettings
	} from '@skeletonlabs/skeleton';
	import Menu from 'svelte-material-icons/Menu.svelte';
	import { initTikTokLiveStore } from '../stores/tiktokLive';

	// Drawer利用のための初期化処理
	initializeStores();
	const drawerStore = getDrawerStore();
	// storeの初期化
	initTikTokLiveStore();

	/**
	 * Drawerを開く
	 */
	const openDrawer = () => {
		const drawerSetting: DrawerSettings = {
			bgDrawer: 'bg-indigo-900',
			bgBackdrop: 'bg-indigo-900/30',
			width: 'w-[280px] md:w-[480px]',
			padding: 'p-2',
			rounded: 'rounded-xl'
		};
		drawerStore.open(drawerSetting);
	};
</script>

<Drawer>
	<LiveConnectInput />
</Drawer>

<AppBar>
	<svelte:fragment slot="lead">
		<button type="button" on:click={openDrawer}><Menu size="30" /></button>
	</svelte:fragment>
</AppBar>

<slot />
