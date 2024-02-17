<script lang="ts">
	import { io } from '$lib/realtime';

	let userName = '';
	let connected = false;
	let roomId: string | null = null;

	const connect = () => {
		connected = true;
		io.emit('connectTiktokLive', userName);
		io.on('connectTiktokLive', (message) => {
			roomId = message.roomId;
			connected = message.isConnected;
		});
		// io.on('recieveGift', (message: History) => {
		// 	console.log(JSON.stringify(message));
		// });
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

<div class="grid grid-cols-1 gap-4">
	<div class="card col-span-2 m-4 p-4">
		<div class="grid grid-cols-6 grid-rows-2 gap-y-8">
			<div class="col-span-2">
				<p>ユーザID</p>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="input-group-shim">@</div>
					<input type="text" placeholder="User ID" bind:value={userName} />
				</div>
			</div>
			<div class="col-span-1 grid px-6 pt-4">
				{#if connected}
					<button type="button" class="variant-filled btn" on:click={disconnect}>接続解除</button>
				{:else}
					<button type="button" class="variant-filled btn" on:click={connect}>接続</button>
				{/if}
			</div>
			<!-- <div class="col-span-1 col-end-7 px-6 pt-4">
				<button type="button" class="variant-filled btn" on:click={emitParameters}
					>パラメータ更新</button
				>
			</div> -->
			{#if roomId}
				<p class="grod col-span-6 font-mono">
					Room ID: <span class="font-bold">{roomId}</span> のライブ配信に接続しています。
				</p>
			{/if}
		</div>
	</div>
</div>
