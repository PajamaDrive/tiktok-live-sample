<script lang="ts">
	import type { Transition } from '@skeletonlabs/skeleton';
	import { quintInOut } from 'svelte/easing';
	import { COLORS, COLOR_NAMES, OPACITIES } from '$lib/color';
	import type { ChoiceInfo, History, RaffleResult } from '../types/roulette';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { UserInputContext } from '../types/context';

	export let choices: string[];
	export let histories: History[];
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
	let raffleResults: RaffleResult[] = [];
	let degree = 0;
	let result = 0;
	$: result = (result + randomNum) % 1;
	// 手動抽選を禁止する条件
	$: disabled = isAuto || isDrawing || (isGiftLinked && histories.length === 0);
	// 条件を満たす場合は1秒後に自動抽選
	$: if (isAuto && !isDrawing && isGiftLinked && histories.length > 0) {
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
		const selectedChoice = choiceInfoList.find(
			(choiceInfo) => result >= choiceInfo.start && result <= choiceInfo.end
		);
		if (selectedChoice) {
			raffleResults = getUpdatedRaffleResults(raffleResults, selectedChoice);
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
			css: (t) => `transform: rotate(${t * (21600 - randomNum * 360)}deg);`
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
</script>

<div class=" flex flex-row justify-center space-x-4">
	<!-- ルーレット -->
	{#key isDrawing}
		<div class="flex flex-col items-center justify-center" style="--degree: {degree}deg">
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
					{:else if choiceInfoList.length === 1}
						<!-- 選択肢が1つの場合は扇型をうまく描画できないので円を描画 -->
						<circle
							cx={CIRCLE_CENTER}
							cy={CIRCLE_CENTER}
							r={RADIUS}
							fill={choiceInfoList[0].color}
							stroke="#FAFAFA"
							stroke-width="2"
						/>
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
					{/if}
				</svg>
			</button>
		</div>
	{/key}
	<!-- 凡例 -->
	<div class="flex flex-col">
		{#each choiceInfoList as choiceInfo}
			<div class="flex flex-row">
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
					<circle cx="15" cy="15" r="7" fill={choiceInfo.color} />
				</svg>
				<div class="grow">{choiceInfo.title}</div>
				<div class="ml-4">{getRoundedPercentage(choiceInfo.end - choiceInfo.start, 3)}%</div>
			</div>
		{/each}
	</div>
	<!-- 抽選結果 -->
	<div class="flex flex-col">
		{#each raffleResults as raffleResult}
			<div class="flex flex-row">
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
					<circle cx="15" cy="15" r="7" fill={raffleResult.color} />
				</svg>
				<div class="grow">{raffleResult.title}</div>
				<div class="ml-4">{raffleResult.count}回</div>
			</div>
		{/each}
	</div>
</div>

<style lang="scss" scoped>
	.roulette {
		transform: rotate(var(--degree));
	}
</style>
