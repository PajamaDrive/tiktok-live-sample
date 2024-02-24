<script lang="ts">
	import LiveConnectInput from '$lib/LiveConnectInput.svelte';
	import { setContext } from 'svelte';
	import '../app.pcss';
	import {
		AppBar,
		Drawer,
		getDrawerStore,
		initializeStores,
		type DrawerSettings
	} from '@skeletonlabs/skeleton';
	import Menu from 'svelte-material-icons/Menu.svelte';
	import { writable } from 'svelte/store';

	// Drawer利用のための初期化処理
	initializeStores();
	const drawerStore = getDrawerStore();
	let isAuto = false;
	let isGiftLinked = false;
	// ページに各種値を反映するためにwriteable storeとcontextを使用
	const userSettings = writable({
		isAuto,
		isGiftLinked
	});
	setContext('userSettings', userSettings);
	$: userSettings.set({ isAuto, isGiftLinked });

	/**
	 * Drawerを開く
	 */
	const openDrawer = () => {
		const drawerSetting: DrawerSettings = {
			bgDrawer: 'bg-indigo-800',
			bgBackdrop: 'bg-indigo-800/30',
			width: 'w-[280px] md:w-[480px]',
			padding: 'p-2',
			rounded: 'rounded-xl'
		};
		drawerStore.open(drawerSetting);
	};
</script>

<Drawer>
	<LiveConnectInput bind:isAuto bind:isGiftLinked />
</Drawer>

<AppBar>
	<svelte:fragment slot="lead">
		<button type="button" on:click={openDrawer}><Menu size="30" /></button>
	</svelte:fragment>
</AppBar>

<slot />
