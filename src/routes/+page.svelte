<script lang="ts">
	import { io } from '$lib/realtime';

	interface Result {
		userName: string;
		diamond: number;
		probability: number;
		result: {
			weightedJudge: boolean;
			judge: boolean;
			select: number;
		};
	}

	let userName = '';
	let histories: Result[] = [];
	let connected = false;
	let roomId: string | null = null;

	const connect = () => {
		connected = true;
		io.emit('connectTiktokLive', userName);
		io.on('connectTiktokLive', (message) => {
			roomId = message.roomId;
			connected = message.isConnected;
		});
		io.on('recieveGift', (message: Result) => {
			histories = [...histories, message];
		});
		io.on('disconnectTiktokLive', (message) => {
			roomId = null;
			connected = message.isConnected;
		});
	};
	const disconnect = () => {
		connected = false;
		io.emit('disconnectTiktokLive');
	};
</script>

<input bind:value={userName} />
{#if connected}
	<button on:click={disconnect}>接続解除</button>
{:else}
	<button on:click={connect}>接続</button>
{/if}
{#if roomId}
	<p>Room ID: {roomId} のライブ配信に接続しています。</p>
{/if}
<ul>
	{#each histories as history}
		<li>
			{history.userName},
			{history.diamond}, {history.result.judge}, {history.result.weightedJudge}, {history.result
				.select}
		</li>
	{/each}
</ul>
