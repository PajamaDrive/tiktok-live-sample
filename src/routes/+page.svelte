<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { RangeSlider } from '@skeletonlabs/skeleton';
	import { InputChip } from '@skeletonlabs/skeleton';

	enum FUNC_TYPE {
		LINEAR = 0,
		QUADRATIC,
		SIGMOID
	}

	type FuncName = '一次関数' | '二次関数' | 'シグモイド';

	interface RaffleResult<T = number, K = boolean> {
		probability: T;
		result: K;
	}

	interface WeightedRaffleResult<T = number, K = boolean, L = FUNC_TYPE>
		extends RaffleResult<T, K> {
		funcType: L;
	}

	interface PickResult {
		choices: string[];
		result: string;
	}

	interface History {
		userName: string;
		diamond: number;
		raffle: RaffleResult;
		weightedRaffle: WeightedRaffleResult;
		pick: PickResult;
	}

	interface ComputedHistory {
		userName: string;
		diamond: number;
		raffle: RaffleResult<string, string>;
		weightedRaffle: WeightedRaffleResult<string, string, FuncName>;
		pick: PickResult;
	}

	const funcTypeMap = Object.freeze<{ [key in FUNC_TYPE]: FuncName }>({
		[FUNC_TYPE.LINEAR]: '一次関数',
		[FUNC_TYPE.QUADRATIC]: '二次関数',
		[FUNC_TYPE.SIGMOID]: 'シグモイド'
	});

	let userName = '';
	let probability = 0.5;
	let minProbability = 0.1;
	let maxProbability = 0.9;
	let limit = 200;
	let funcType = 0;
	let choices: string[] = ['hoge', 'fuga'];
	let histories: History[] = [];
	let computedHistories: ComputedHistory[];
	let connected = false;
	let roomId: string | null = null;
	$: computedHistories = histories.map((history) => {
		const raffle = Object.freeze<ComputedHistory['raffle']>({
			probability: `${history.raffle.probability * 100}%`,
			result: history.raffle.result ? 'あたり' : 'はずれ'
		});
		const weightedRaffle = Object.freeze<ComputedHistory['weightedRaffle']>({
			probability: `${history.weightedRaffle.probability * 100}%`,
			result: history.weightedRaffle.result ? 'あたり' : 'はずれ',
			funcType: funcTypeMap[history.weightedRaffle.funcType]
		});

		return { ...history, raffle, weightedRaffle };
	});

	const connect = () => {
		connected = true;
		io.emit('connectTiktokLive', userName);
		io.on('connectTiktokLive', (message) => {
			roomId = message.roomId;
			connected = message.isConnected;
		});
		io.on('recieveGift', (message: History) => {
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
			raffle: {
				probability
			},
			weightedRaffle: {
				limit,
				minProbability,
				maxProbability,
				funcType
			},
			pick: {
				choices
			}
		});
	};

	onMount(() => {
		emitParameters();
	});
</script>

<div class="grid grid-cols-2 grid-rows-3 gap-4">
	<div class="card row-span-2 m-4 p-4">
		<div class="card-header pb-12 font-mono text-lg font-bold">傾斜あり</div>
		<div class="grid grid-rows-3 gap-y-4">
			<RangeSlider name="range-slider" bind:value={minProbability} min={0.05} max={1} step={0.05}>
				<div class="flex items-center justify-between">
					<div class="font-bold">最低当選確率</div>
					<div class="text-xs">{minProbability} / 1.00</div>
				</div>
			</RangeSlider>
			<RangeSlider name="range-slider" bind:value={maxProbability} min={0.05} max={1} step={0.05}>
				<div class="flex items-center justify-between">
					<div class="font-bold">最高当選確率</div>
					<div class="text-xs">{maxProbability} / 1.00</div>
				</div>
			</RangeSlider>
			<label class="label">
				<span>上限ダイアモンド数</span>
				<input class="input" type="text" bind:value={limit} />
			</label>
			<label class="label">
				<span>確率決定関数</span>
				<select class="select" bind:value={funcType}>
					<option value={FUNC_TYPE.LINEAR}>{funcTypeMap[FUNC_TYPE.LINEAR]}</option>
					<option value={FUNC_TYPE.QUADRATIC}>{funcTypeMap[FUNC_TYPE.QUADRATIC]}</option>
					<option value={FUNC_TYPE.SIGMOID}>{funcTypeMap[FUNC_TYPE.SIGMOID]}</option>
				</select>
			</label>
		</div>
	</div>
	<div class="card m-4 p-4">
		<div class="card-header pb-12 font-mono text-lg font-bold">傾斜なし</div>
		<RangeSlider name="range-slider" bind:value={probability} min={0.05} max={1} step={0.05}>
			<div class="flex items-center justify-between">
				<div class="font-bold">当選確率</div>
				<div class="text-xs">{probability} / 1.00</div>
			</div>
		</RangeSlider>
	</div>
	<div class="card m-4 p-4">
		<div class="card-header pb-12 font-mono text-lg font-bold">選択肢</div>
		<InputChip
			bind:value={choices}
			name="choices"
			placeholder="選択肢の値を入力してください"
			max={10}
		/>
	</div>
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
			<div class="col-span-1 col-end-7 px-6 pt-4">
				<button type="button" class="variant-filled btn" on:click={emitParameters}
					>パラメータ更新</button
				>
			</div>
			{#if roomId}
				<p class="grod col-span-6 font-mono">
					Room ID: <span class="font-bold">{roomId}</span> のライブ配信に接続しています。
				</p>
			{/if}
		</div>
	</div>
</div>

<div></div>

{#if histories.length}
	<div class="table-container">
		<table class="table table-hover table-comfortable">
			<caption> ユーザごとの当落結果など </caption>
			<thead>
				<tr class="table-row-checked">
					<th scope="col">ユーザ名</th>
					<th scope="col">ダイアモンド数</th>
					<th scope="col">傾斜なし当選確率</th>
					<th scope="col">傾斜なし当選結果</th>
					<th scope="col">傾斜あり確率関数</th>
					<th scope="col">傾斜あり当選確率</th>
					<th scope="col">傾斜あり当選結果</th>
					<th scope="col">選択肢数</th>
					<th scope="col">選ばれた選択肢</th>
				</tr>
			</thead>
			<tbody>
				{#each computedHistories as history}
					<tr>
						<th scope="row">{history.userName}</th>
						<td>{history.diamond}</td>
						<td>{history.raffle.probability}</td>
						<td>{history.raffle.result}</td>
						<td>{history.weightedRaffle.funcType}</td>
						<td>{history.weightedRaffle.probability}</td>
						<td>{history.weightedRaffle.result}</td>
						<td>{history.pick.choices.length}</td>
						<td>{history.pick.result}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
