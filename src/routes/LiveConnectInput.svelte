<script lang="ts">
	import { io } from '$lib/realtime';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { getTiktokLiveStore } from '../stores/tiktokLive';

	const tiktokLiveStore = getTiktokLiveStore();

	$: if (!$tiktokLiveStore.isGiftLinked) {
		$tiktokLiveStore.isAuto = false;
	}

	/**
	 * TikTok Liveに接続する
	 */
	const connect = () => {
		$tiktokLiveStore.isConnected = true;
		// APIに接続イベントを送信
		io.emit('connectTiktokLive', $tiktokLiveStore.userName);
	};

	/**
	 * TikTok Liveから切断する
	 */
	const disconnect = () => {
		$tiktokLiveStore.isConnected = false;
		// APIに切断イベントを送信
		io.emit('disconnectTiktokLive');
	};

	onMount(() => {
		// APIから送信された接続イベントを受信する設定
		io.on('connectTiktokLive', (message) => {
			$tiktokLiveStore.roomId = message.roomId;
			$tiktokLiveStore.isConnected = message.isConnected;
		});
		// APIから送信された切断イベントを受信を受信する設定
		io.on('disconnectTiktokLive', (message) => {
			$tiktokLiveStore.roomId = null;
			$tiktokLiveStore.isConnected = message.isConnected;
		});
	});
</script>

<div class="grid grid-cols-1 gap-4">
	<div class="card col-span-2 m-4 p-4">
		<header class="card-header text-xl font-bold">TikTok Live 連携</header>
		<section class="p-4">
			<div class="grid grid-rows-5 gap-y-2">
				<!-- ユーザ名の入力フォーム -->
				<div class="grid grid-cols-4">
					<div>ユーザ名</div>
					<div class="col-span-3">
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="input-group-shim">@</div>
							<input type="text" placeholder="ユーザ名" bind:value={$tiktokLiveStore.userName} />
						</div>
					</div>
				</div>
				<!-- 接続状況の表示 -->
				<div class="grid grid-cols-4">
					<div>接続状況</div>
					<div class="col-span-3">
						<div class="">
							{#if $tiktokLiveStore.isConnected}
								<p class="grod col-span-6 font-mono">
									<span class="variant-soft-success badge font-bold">接続中</span>
									{#if $tiktokLiveStore.roomId}
										(Room ID: {$tiktokLiveStore.roomId})
									{/if}
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
							bind:checked={$tiktokLiveStore.isGiftLinked}
						>
							{$tiktokLiveStore.isGiftLinked ? 'ON' : 'OFF'}
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
							disabled={!$tiktokLiveStore.isGiftLinked}
							bind:checked={$tiktokLiveStore.isAuto}
						>
							{$tiktokLiveStore.isAuto ? 'ON' : 'OFF'}
						</SlideToggle>
					</div>
				</div>
				<!-- 接続/接続解除ボタン -->
				<div class="grid grid-cols-4">
					<div class="col-span-2 col-end-5 grid">
						{#if $tiktokLiveStore.isConnected}
							<button type="button" class="variant-ghost-error btn" on:click={disconnect}
								>接続解除
							</button>
						{:else}
							<button
								type="button"
								disabled={!$tiktokLiveStore.userName}
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
