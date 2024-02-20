<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { InputChip } from '@skeletonlabs/skeleton';
	import LiveConnectInput from '$lib/LiveConnectInput.svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import Roulette from '$lib/Roulette.svelte';
	import type { History } from '../types/roulette';

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

	let isAuto = false;

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

<Roulette {choices} {histories} {isAuto} />

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
