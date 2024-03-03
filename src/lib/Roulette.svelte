<script lang="ts">
	// TODO: 色のマッピングを削除されても崩さないようにする
	// TODO: 色を更新するようにする
	// TODO: 選択肢テキストの折り返しを行う
	import type { Transition } from '@skeletonlabs/skeleton';
	import { quintInOut } from 'svelte/easing';
	import { COLORS, COLOR_ENUM, COLOR_NAMES, OPACITIES } from '$lib/color';
	import type { ChoiceInfo, History, RaffleResult } from '../types/roulette';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { UserInputContext } from '../types/context';
	import Close from 'svelte-material-icons/Close.svelte';

	export let choices: string[];
	export let histories: History[];
	let choice: string;
	let isAuto: boolean;
	let isGiftLinked: boolean;
	// Drawで変更した値を受け取る（中身はwritable store）
	const userSettings = getContext<Writable<UserInputContext>>('userSettings');
	$: {
		isAuto = $userSettings.isAuto;
		isGiftLinked = $userSettings.isGiftLinked;
	}

	const VIEW_BOX_SIDE_LENGTH = 400;
	const CIRCLE_CENTER = VIEW_BOX_SIDE_LENGTH / 2.0;
	const RADIUS = VIEW_BOX_SIDE_LENGTH / 2 - 5;

	let choiceInfoList: ChoiceInfo[];
	$: choiceInfoList = choices.map((choice, index) => {
		const colorIndex = index % COLOR_NAMES.length;
		const opacityIndex = Math.floor(index / COLOR_NAMES.length);
		const color = `${COLORS[colorIndex]}${OPACITIES[opacityIndex]}`;
		const start = index / choices.length;
		const end = (index + 1) / choices.length;
		return {
			title: choice,
			color,
			start,
			end
		};
	});
	let isDrawing = false;
	let randomNum = 0;
	let raffleResult: ChoiceInfo | undefined;
	let raffleResults: RaffleResult[] = [];
	let degree = 0;
	let result = 0;
	$: result = (result + randomNum) % 1;
	// 選択肢が変わった場合に発火させたいので常に真となる条件を指定
	$: if (choices) {
		degree = 0;
		result = 0;
	}
	// 手動抽選を禁止する条件
	$: disabled =
		choices.length < 2 || isAuto || isDrawing || (isGiftLinked && histories.length === 0);
	// 条件を満たす場合は1秒後に自動抽選
	$: if (choices.length > 1 && isAuto && !isDrawing && isGiftLinked && histories.length > 0) {
		setTimeout(() => {
			drawRaffle();
		}, 1000);
	}

	/**
	 * 抽選を実行
	 */
	const drawRaffle = () => {
		randomNum = Math.random();
		isDrawing = true;
	};

	/**
	 * ルーレットクリック時に発火する関数
	 */
	const onClickRoulette = () => {
		if (!disabled) {
			drawRaffle();
		}
	};

	/**
	 * 抽選終了時に発火する関数
	 */
	const onDrawFinished = () => {
		// isDrawingの値が変わるたび呼ばれるがtrueの時（抽選終了直前）だけ処理を行う
		if (!isDrawing) {
			return;
		}
		isDrawing = false;
		// 頂点に当選部分が来るようにするので反時計回りに回転
		degree -= randomNum * 360;
		// 当選部分の値を取得
		raffleResult = choiceInfoList.find(
			(choiceInfo) => result >= choiceInfo.start && result <= choiceInfo.end
		);
		if (raffleResult) {
			raffleResults = getUpdatedRaffleResults(raffleResults, raffleResult);
		}
		if (isGiftLinked) {
			histories = histories.slice(1, histories.length);
		}
	};

	/**
	 * ルーレットを回転させるTransition
	 */
	const spin: Transition = (_node, _param) => {
		// isDrawingの値が変わるたび呼ばれるがtrueの時（抽選開始直後）だけ処理を行う
		if (!isDrawing) return {};
		return {
			duration: 7000,
			easing: quintInOut,
			css: (t) => `transform: rotate(${t * (10800 - randomNum * 360)}deg);`
		};
	};

	/**
	 * 小数点以下を丸めた百分率の値を返す
	 * @param x 百分率
	 * @param digit 小数点以下の桁数
	 * @return 丸めた値
	 */
	const getRoundedPercentage = (x: number, digit: number) =>
		Math.round(x * Math.pow(10, digit + 2)) / Math.pow(10, digit);

	/**
	 * (0, 1)の値を(0, 2π)に変換する
	 * @param x (0, 1)の値
	 * @return 変換後の値
	 */
	const getRadian = (x: number) => 2 * Math.PI * x;

	/**
	 * 扇型を描画するために使用するdパラメータの値を取得する
	 * @param radius 半径
	 * @param startRadian 開始地点の角度(rad)
	 * @param endRadian 終了地点の角度(rad)
	 * @return dパラメータの値
	 */
	const getFanShapeParam = (radius: number, startRadian: number, endRadian: number) => {
		// 通常の座標系だと弧度法は反時計回りだが描画する際は時計回りにする
		// svgの座標系は画面左上が原点なのでy軸が反転している
		// x軸は0から始まるのでπ/2だけ進める
		// y軸は最小値から始まるのでπ/2だけ遅らせる
		// 半円を超える場合は大円弧フラグを1にする
		const startX = CIRCLE_CENTER + radius * Math.cos(-startRadian + 0.5 * Math.PI);
		const startY = CIRCLE_CENTER + radius * Math.sin(-startRadian - 0.5 * Math.PI);
		const endX = CIRCLE_CENTER + radius * Math.cos(-endRadian + 0.5 * Math.PI);
		const endY = CIRCLE_CENTER + radius * Math.sin(-endRadian - 0.5 * Math.PI);
		const largeArcFlag = Number(Math.abs(endRadian - startRadian) > Math.PI);

		return `M${CIRCLE_CENTER},${CIRCLE_CENTER} L${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
	};

	/**
	 * 抽選結果一覧を更新して返す
	 * @param raffleResults 抽選結果一覧
	 * @param choice 今回選ばれた選択肢の情報
	 * @return 更新後の抽選結果一覧
	 */
	const getUpdatedRaffleResults = (raffleResults: RaffleResult[], choice: ChoiceInfo) => {
		const raffleResultIndex = raffleResults.findIndex(
			(raffleResult) => raffleResult.title === choice.title
		);
		// 過去に選ばれたことがある選択肢だった場合、該当の選択肢の当選回数を増やす
		if (raffleResultIndex >= 0) {
			return raffleResults.map((raffleResult, index) =>
				index === raffleResultIndex
					? { ...raffleResult, count: raffleResult.count + 1 }
					: raffleResult
			);
		}
		// 初当選の選択肢だった場合、結果に追加する
		return [...raffleResults, { title: choice.title, count: 1, color: choice.color }];
	};

	/**
	 * エンターキーが押されたときに処理を行う
	 */
	const onPressedEnter = (event: KeyboardEvent) => {
		// 日本語入力の時は入力終了後のみ反応させる
		if (
			!event.isComposing &&
			event.key !== 'Process' &&
			event.keyCode !== 229 &&
			event.key === 'Enter'
		) {
			choices = [...choices, choice];
			choice = '';
		}
	};

	/**
	 * 選択された選択肢を削除する
	 * @param index インデックス
	 * @return 選択された選択肢を削除する関数
	 */
	const removeChoice = (index: number) => () => {
		choices = choices.filter((_, _index) => _index !== index);
	};
</script>

<div class=" m-4 flex flex-row space-x-6">
	<!-- ルーレット -->
	{#key isDrawing}
		<div class="flex flex-col items-center justify-center" style="--degree: {degree}deg">
			{#if isGiftLinked}
				<div class="my-1" class:text-red-500={!histories.length}>
					残り抽選回数: {histories.length}回
				</div>
			{/if}
			<div class="flex flex-row">
				{#if !isDrawing && raffleResult}
					<div class="text-3xl">抽選結果:</div>
					<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
						<circle cx="20" cy="20" r="10" fill={raffleResult.color} />
					</svg>
					<span class="flex items-center text-3xl font-bold">{raffleResult.title}</span>
				{:else if isDrawing}
					<div class="text-3xl">抽選中…</div>
				{:else if isGiftLinked && !histories.length}
					<div class="text-2xl">ギフトが投げられるまでお待ちください</div>
				{:else}
					<div class="text-2xl">ルーレットをクリックしてください</div>
				{/if}
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
				<polyline points="15, 30 45, 30 30, 60" fill="#E53935" />
			</svg>
			<button type="button" in:spin on:introend={onDrawFinished} on:click={onClickRoulette}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox={`0 0 ${VIEW_BOX_SIDE_LENGTH} ${VIEW_BOX_SIDE_LENGTH}`}
					width={VIEW_BOX_SIDE_LENGTH}
					height={VIEW_BOX_SIDE_LENGTH}
					class="roulette"
				>
					{#if choiceInfoList.length > 1}
						<!-- 選択肢が複数の場合は扇型をつなぎ合わせて描画 -->
						{#each choiceInfoList as choiceInfo}
							<path
								d={getFanShapeParam(RADIUS, getRadian(choiceInfo.start), getRadian(choiceInfo.end))}
								fill={choiceInfo.color}
								stroke="#FAFAFA"
								stroke-width="2"
							/>
						{/each}
					{:else}
						<!-- 選択肢がない場合はダミーの円を描画 -->
						<circle
							cx={CIRCLE_CENTER}
							cy={CIRCLE_CENTER}
							r={RADIUS}
							fill="#FAFAFA"
							stroke="#FAFAFA"
							stroke-width="2"
						/>
						<text
							x={CIRCLE_CENTER - 150}
							y={CIRCLE_CENTER + 5}
							font-size={20}
							fill={COLORS[COLOR_ENUM.RED]}
						>
							選択肢を2つ以上入力してください
						</text>
					{/if}
				</svg>
			</button>
		</div>
	{/key}
	<!-- 選択肢入力 -->
	<div class="flex flex-col">
		<div class="mb-2 flex-none">
			<span class="border-b-2 border-indigo-500 text-lg font-bold">選択肢入力</span>
		</div>
		<div class="mb-2">
			<input
				class="input"
				disabled={isDrawing}
				type="text"
				bind:value={choice}
				on:keydown={onPressedEnter}
			/>
		</div>
		{#each choiceInfoList as choiceInfo, index}
			<div>
				<div
					class="variant-soft badge m-1 text-base {isDrawing
						? 'opacity-50'
						: 'hover:variant-filled'}"
				>
					<div class="flex flex-row">
						<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
							<circle cx="15" cy="15" r="7" fill={choiceInfo.color} />
						</svg>
						<div class="flex items-center">{choiceInfo.title}</div>
						<button class="ml-2" disabled={isDrawing} type="button" on:click={removeChoice(index)}>
							<Close size={23} />
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<!-- 凡例 -->
	<div class="flex flex-col">
		<div class="mb-2 flex-none">
			<span class="border-b-2 border-indigo-500 text-lg font-bold">抽選確率</span>
		</div>
		{#each choiceInfoList as choiceInfo}
			<div class="flex flex-row">
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
					<circle cx="15" cy="15" r="7" fill={choiceInfo.color} />
				</svg>
				<div class="flex grow items-center">{choiceInfo.title}</div>
				<div class="ml-4 flex items-center">
					{getRoundedPercentage(choiceInfo.end - choiceInfo.start, 3)}%
				</div>
			</div>
		{/each}
	</div>
	<!-- 抽選結果 -->
	<div class="flex flex-col">
		<div class="mb-2 flex-none">
			<span class="border-b-2 border-indigo-500 text-lg font-bold">抽選履歴</span>
		</div>
		{#each raffleResults as raffleResult}
			<div class="flex flex-row">
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
					<circle cx="15" cy="15" r="7" fill={raffleResult.color} />
				</svg>
				<div class="flex grow items-center">{raffleResult.title}</div>
				<div class="ml-4 flex items-center">{raffleResult.count}回</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss" scoped>
	.roulette {
		transform: rotate(var(--degree));
	}
</style>
