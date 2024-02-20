<script lang="ts">
	import type { Transition } from '@skeletonlabs/skeleton';
	import { quintInOut } from 'svelte/easing';
	import { COLORS, COLOR_NAMES, OPACITIES } from '$lib/color';
	import type { ChoiceInfo, History } from '../types/roulette';

	export let choices: string[];
	export let histories: History[];
	export let isAuto = false;

	const VIEW_BOX_SIDE_LENGTH = 400;
	const RADIUS = VIEW_BOX_SIDE_LENGTH / 2 - 5;

	let choiceInfoList: ChoiceInfo[];
	$: choiceInfoList = choices.map((choice, index) => {
		const colorIndex = index % COLOR_NAMES.length;
		const opacityIndex = Math.floor(index / COLOR_NAMES.length);
		const color = `${COLORS[colorIndex]}${OPACITIES[opacityIndex]}`;
		const start = (index / choices.length) * 100;
		const end = ((index + 1) / choices.length) * 100;
		return {
			title: choice,
			color,
			start,
			end
		};
	});
	let isDrawing = false;
	$: disabled = isAuto || isDrawing || histories.length === 0;
	$: if (isAuto && !isDrawing && histories.length > 0) {
		setTimeout(() => {
			drawRaffle();
		}, 1000);
	}

	const drawRaffle = () => {
		isDrawing = true;
	};

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

	const getRoundedNumber = (x: number, digit: number) =>
		Math.round(x * Math.pow(10, digit)) / Math.pow(10, digit);

	const getRadian = (x: number) => -Math.PI * ((2 * x) / 100 - 0.5);

	const getPathParam = (radius: number, startRadian: number, endRadian: number) => {
		const center = VIEW_BOX_SIDE_LENGTH / 2.0;
		const startX = center + radius * Math.cos(startRadian);
		const startY = center + radius * Math.sin(startRadian - Math.PI);
		const endX = center + radius * Math.cos(endRadian);
		const endY = center + radius * Math.sin(endRadian - Math.PI);

		return `M${center},${center} L${startX},${startY} A${radius},${radius} 0 0 1 ${endX},${endY} Z`;
	};
</script>

<div class="flex flex-row justify-center">
	{#key isDrawing}
		<div class="flex flex-col items-center justify-center">
			<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
				<polyline points="15, 30 45, 30 30, 60" fill="#E53935" />
			</svg>
			<button type="button" in:spin on:introend={onDrawFinished} on:click={onClick}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox={`0 0 ${VIEW_BOX_SIDE_LENGTH} ${VIEW_BOX_SIDE_LENGTH}`}
					width={VIEW_BOX_SIDE_LENGTH}
					height={VIEW_BOX_SIDE_LENGTH}
				>
					{#each choiceInfoList as choiceInfo}
						<path
							d={getPathParam(RADIUS, getRadian(choiceInfo.start), getRadian(choiceInfo.end))}
							fill={choiceInfo.color}
							stroke="#FAFAFA"
							stroke-width="2"
						/>
					{/each}
				</svg>
			</button>
		</div>
	{/key}
	<div class="flex flex-col">
		{#each choiceInfoList as choiceInfo}
			<div class="flex flex-row">
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
					<circle cx="15" cy="15" r="7" fill={choiceInfo.color} />
				</svg>
				<div class="grow">{choiceInfo.title}</div>
				<div class="ml-4">{getRoundedNumber(choiceInfo.end - choiceInfo.start, 3)}%</div>
			</div>
		{/each}
	</div>
</div>
