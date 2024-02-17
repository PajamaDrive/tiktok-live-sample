<script lang="ts">
	import { io } from '$lib/realtime';
	import { onMount } from 'svelte';
	import { InputChip } from '@skeletonlabs/skeleton';
	import LiveConnectInput from '$lib/LiveConnectInput.svelte';

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
	let histories: History[] = [];

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
		<InputChip
			bind:value={choices}
			name="choices"
			placeholder="選択肢の値を入力してください"
			max={10}
		/>
	</div>
	<LiveConnectInput />
</div>

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
