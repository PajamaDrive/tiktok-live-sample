<script lang="ts">
	// TODO: 色のマッピングを削除されても崩さないようにする
	// TODO: 色を更新するようにする
	// TODO: 選択肢テキストの折り返しを行う
	// TODO: 抽選できる回数をどこかに表示しておく
	// TODO: 抽選履歴の表示は一旦消しておく
	import { io } from '$lib/realtime';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';

	export let isAuto: boolean;
	export let isGiftLinked: boolean;
	let userName = '';
	let connected = false;
	let roomId: string | null = null;
	$: if (!isGiftLinked) {
		isAuto = false;
	}

	/**
	 * TikTok Liveに接続する
	 */
	const connect = () => {
		connected = true;
		// APIに接続イベントを送信
		io.emit('connectTiktokLive', userName);
	};

	/**
	 * TikTok Liveから切断する
	 */
	const disconnect = () => {
		connected = false;
		// APIに切断イベントを送信
		io.emit('disconnectTiktokLive');
	};

	onMount(() => {
		// APIから送信された接続イベントを受信する設定
		io.on('connectTiktokLive', (message) => {
			roomId = message.roomId;
			connected = message.isConnected;
		});
		// APIから送信された切断イベントを受信を受信する設定
		io.on('disconnectTiktokLive', (message) => {
			roomId = null;
			connected = message.isConnected;
		});
	});
</script>

<div class="grid grid-cols-1 gap-4">
	<div class="bg-initial card col-span-2 m-4 p-4">
		<header class="card-header text-xl font-bold">TikTok Live 連携</header>
		<section class="p-4">
			<div class="grid grid-rows-5 gap-y-2">
				<!-- ユーザ名の入力フォーム -->
				<div class="grid grid-cols-4">
					<div>ユーザ名</div>
					<div class="col-span-3">
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="input-group-shim">@</div>
							<input type="text" placeholder="ユーザ名" bind:value={userName} />
						</div>
					</div>
				</div>
				<!-- 接続状況の表示 -->
				<div class="grid grid-cols-4">
					<div>接続状況</div>
					<div class="col-span-3">
						<div class="">
							{#if roomId}
								<p class="grod col-span-6 font-mono">
									<span class="variant-soft-success badge font-bold">接続中</span> (Room ID: {roomId})
								</p>
							{:else}
								<p class="grod col-span-6 font-mono">
									<span class="variant-soft-error badge font-bold">未接続</span>
								</p>
							{/if}
						</div>
					</div>
				</div>
				<!-- ギフト連動を行うか決定するスイッチ -->
				<div class="grid grid-cols-4">
					<div>ギフト連動</div>
					<div class="col-span-2">
						<SlideToggle
							background="variant-ghost-error"
							active="variant-ghost-success"
							name="slide"
							bind:checked={isGiftLinked}
						>
							{isGiftLinked ? 'ON' : 'OFF'}
						</SlideToggle>
					</div>
				</div>
				<!-- 自動抽選を行うか決定するスイッチ -->
				<div class="grid grid-cols-4">
					<div>自動抽選</div>
					<div class="col-span-3">
						<SlideToggle
							background="variant-ghost-error"
							active="variant-ghost-success"
							name="slide"
							disabled={!isGiftLinked}
							bind:checked={isAuto}
						>
							{isAuto ? 'ON' : 'OFF'}
						</SlideToggle>
					</div>
				</div>
				<!-- 接続/接続解除ボタン -->
				<div class="grid grid-cols-4">
					<div class="col-span-2 col-end-5 grid">
						{#if connected}
							<button type="button" class="variant-ghost-error btn" on:click={disconnect}
								>接続解除
							</button>
						{:else}
							<button
								type="button"
								disabled={!userName}
								class="variant-ghost-success btn"
								on:click={connect}
							>
								接続
							</button>
						{/if}
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
