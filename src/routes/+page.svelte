<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import Roulette from './Roulette.svelte';
	import type { History } from '../types/roulette';

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
