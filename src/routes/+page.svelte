<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { InputChip } from '@skeletonlabs/skeleton';
	import LiveConnectInput from '$lib/LiveConnectInput.svelte';
	import { ConicGradient } from '@skeletonlabs/skeleton';
	import type { ConicStop, Transition } from '@skeletonlabs/skeleton';
	import Triangle from 'svelte-material-icons/Triangle.svelte';
	import { quintInOut } from 'svelte/easing';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { COLORS, COLOR_NAMES, OPACITIES } from '$lib/color';

	interface PickResult {
		choices: string[];
		result: string;
	}

	interface History {
		userName: string;
		diamond: number;
		pick: PickResult;
	}

	let choices: string[] = ['hoge', 'fuga'];
	const history = {
		userName: 'hoge',
		diamond: 200,
		pick: {
			choices: ['hoge'],
			result: 'hoge'
		}
	};
	let histories: History[] = [history];
	let conicStops: ConicStop[];
	$: conicStops = choices.map((choice, index) => {
		const colorIndex = index % COLOR_NAMES.length;
		const opacityIndex = Math.floor(index / COLOR_NAMES.length);
		const color = `${COLORS[colorIndex]}${OPACITIES[opacityIndex]}`;
		const start = Math.floor((index / choices.length) * 100);
		const end = Math.floor(((index + 1) / choices.length) * 100);
		return {
			label: choice,
			color,
			start,
			end
		};
	});

	let isDrawing = false;
	let isAuto = false;
	$: disabled = isAuto || isDrawing || histories.length === 0;
	const drawRaffle = () => {
		isDrawing = true;
	};
	$: if (isAuto && !isDrawing && histories.length > 0) {
		setTimeout(() => {
			drawRaffle();
		}, 1000);
	}

	const onClick = () => {
		if (!disabled) {
			drawRaffle();
		}
	};

	const onDrawFinished = () => {
		if (!isDrawing) {
			return;
		}
		isDrawing = false;
		histories = histories.slice(1, histories.length);
	};

	const spin: Transition = (_node, _param) => {
		if (!isDrawing) return {};
		return {
			duration: 7000,
			easing: quintInOut,
			css: (t) => `transform: rotate(${t * 21600}deg);`
		};
	};

	const emitParameters = () => {
		io.emit('updateParameters', {
			raffle: {
				probability: 0.5
			},
			weightedRaffle: {
				limit: 200,
				minProbability: 0.1,
				maxProbability: 0.9,
				funcType: 1
			},
			pick: {
				choices
			}
		});
	};

	const addHistory = () => {
		histories = [...histories, history];
	};

	onMount(() => {
		emitParameters();
		io.on('recieveGift', (message: History) => {
			histories = [...histories, message];
		});
	});
</script>

<div class="grid grid-cols-2 gap-4">
	<div class="card m-4 p-4">
		<div class="card-header pb-12 font-mono text-lg font-bold">選択肢</div>
		<InputChip bind:value={choices} name="choices" placeholder="選択肢の値を入力してください" />
	</div>
	<LiveConnectInput />
</div>

<button type="button" class="variant-filled btn" on:click={addHistory}>追加</button>
<SlideToggle name="slide" bind:checked={isAuto}>{isAuto ? '自動抽選' : '手動抽選'}</SlideToggle>

{#key isDrawing}
	<div class="grid justify-center">
		<Triangle color="red" size="30px" class="rotate-180 place-self-center self-end" />
		<button type="button" in:spin on:introend={onDrawFinished} on:click={onClick}>
			<ConicGradient stops={conicStops} width="w-96" />
		</button>
	</div>
{/key}

{#if histories.length}
	<div class="table-container">
		<table class="table table-hover table-comfortable">
			<caption> ユーザごとの当落結果など </caption>
			<thead>
				<tr class="table-row-checked">
					<th scope="col">ユーザ名</th>
					<th scope="col">ダイアモンド数</th>
					<th scope="col">選択肢数</th>
					<th scope="col">選ばれた選択肢</th>
				</tr>
			</thead>
			<tbody>
				{#each histories as history}
					<tr>
						<th scope="row">{history.userName}</th>
						<td>{history.diamond}</td>
						<td>{history.pick.choices.length}</td>
						<td>{history.pick.result}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
