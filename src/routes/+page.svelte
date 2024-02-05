<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';

	interface JudgeResult {
		probability: number;
		result: boolean;
	}

	interface SelectResult {
		numOfChoices: number;
		selected: number;
	}

	interface Result {
		userName: string;
		diamond: number;
		raffle: {
			weightedJudge: JudgeResult;
			judge: JudgeResult;
			select: SelectResult;
		};
	}

	let userName = '';
	let probability = 0.5;
	let minProbability = 0.1;
	let maxProbability = 0.9;
	let maxDiamond = 200;
	let numOfChoices = 5;
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

	const emitParameters = () => {
		io.emit('updateParameters', {
			probability,
			minProbability,
			maxProbability,
			maxDiamond,
			numOfChoices
		});
	};

	onMount(() => {
		emitParameters();
	});
</script>

<div>
	<label for="probability">当選確率(傾斜なし)</label>
	<input id="probability" bind:value={probability} />
</div>
<div>
	<label for="minProbability">最低当選確率(傾斜あり)</label>
	<input id="minProbability" bind:value={minProbability} />
</div>
<div>
	<label for="maxProbability">最高当選確率(傾斜あり)</label>
	<input id="maxProbability" bind:value={maxProbability} />
</div>
<div>
	<label for="maxDiamond">上限ダイアモンド数(傾斜あり)</label>
	<input id="maxDiamond" bind:value={maxDiamond} />
</div>
<div>
	<label for="numOfChoices">選択肢数</label>
	<input id="numOfChoices" bind:value={numOfChoices} />
</div>
<div>
	<button on:click={emitParameters}>パラメータ更新</button>
</div>

<label for="userName">ユーザ名</label>
<input id="userName" bind:value={userName} />
{#if connected}
	<button on:click={disconnect}>接続解除</button>
{:else}
	<button on:click={connect}>接続</button>
{/if}
{#if roomId}
	<p>Room ID: {roomId} のライブ配信に接続しています。</p>
{/if}
{#if histories.length}
	<table>
		<caption> ユーザごとの当落結果など </caption>
		<thead>
			<tr>
				<th scope="col">ユーザ名</th>
				<th scope="col">ダイアモンド数</th>
				<th scope="col">傾斜なし当選確率</th>
				<th scope="col">傾斜なし当選結果</th>
				<th scope="col">傾斜あり当選確率</th>
				<th scope="col">傾斜あり当選結果</th>
				<th scope="col">選択肢数</th>
				<th scope="col">選ばれた選択肢</th>
			</tr>
		</thead>
		<tbody>
			{#each histories as history}
				<tr>
					<th scope="row">{history.userName}</th>
					<td>{history.diamond}</td>
					<td>{history.raffle.judge.probability}</td>
					<td>{history.raffle.judge.result ? 'あたり' : 'はずれ'}</td>
					<td>{history.raffle.weightedJudge.probability}</td>
					<td>{history.raffle.weightedJudge.result ? 'あたり' : 'はずれ'}</td>
					<td>{history.raffle.select.numOfChoices}</td>
					<td>{history.raffle.select.selected}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
