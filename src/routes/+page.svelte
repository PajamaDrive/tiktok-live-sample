<script lang="ts">
	import { io } from '$lib/realtime';
	import { getContext, onMount } from 'svelte';
	import Roulette from '$lib/Roulette.svelte';
	import type { History } from '../types/roulette';
	import type { Writable } from 'svelte/store';
	import type { UserInputContext } from '../types/context';

	let isGiftLinked: boolean;
	// Drawで変更した値を受け取る（中身はwritable store）
	const userSettings = getContext<Writable<UserInputContext>>('userSettings');
	$: {
		isGiftLinked = $userSettings.isGiftLinked;
	}

	let choices: string[] = [];
	let histories: History[] = [];

	onMount(() => {
		io.on('recieveGift', (message: History) => {
			histories = [...histories, message];
		});
	});
</script>

<!-- ルーレット -->
<Roulette {choices} bind:histories />
