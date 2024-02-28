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

	let choices: string[] = ['hoge', 'fuga'];
	const history = {
		userName: 'hoge',
		diamond: 200,
		pick: {
			choices: ['hoge'],
			result: 'hoge'
		},
		sendedAt: '2024/01/01'
	};
	let histories: History[] = [history];

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

<!-- ルーレット -->
<Roulette {choices} bind:histories />

<!-- 抽選結果 -->
{#if isGiftLinked}
	<div class="flex flex-col">
		<div class="m-2 flex-none">
			<span class="border-b-2 border-indigo-500 text-lg font-bold">未抽選のギフト一覧</span>
		</div>
		{#if histories.length}
			<div class="table-container m-4 w-1/2">
				<table class="table table-hover table-comfortable">
					<thead>
						<tr class="table-row-checked">
							<th scope="col">No.</th>
							<th scope="col">ユーザ名</th>
							<th scope="col">ダイアモンド数</th>
							<th scope="col">送信時刻</th>
						</tr>
					</thead>
					<tbody>
						{#each histories as history, index}
							<tr>
								<th scope="row">{index + 1}</th>
								<td>{history.userName}</td>
								<td>{history.diamond}</td>
								<td>{history.sendedAt}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="m-4 text-red-500">未抽選のギフトはありません</div>
		{/if}
	</div>
{/if}
