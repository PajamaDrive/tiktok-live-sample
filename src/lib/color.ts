export const COLOR_NAMES = [
	'RED',
	'GREEN',
	'BLUE',
	'PINK',
	'LIME',
	'LIGHT_BLUE',
	'ORANGE',
	'CYAN',
	'PURPLE',
	'YELLOW',
	'TEAL',
	'AMBER',
	'INDIGO',
	'BROWN',
	'BLACK'
] as const;
type COLOR = (typeof COLOR_NAMES)[number];

export const COLOR_ENUM = Object.freeze<{ [key in COLOR]: number }>({
	RED: 0,
	GREEN: 1,
	BLUE: 2,
	PINK: 3,
	LIME: 4,
	LIGHT_BLUE: 5,
	ORANGE: 6,
	CYAN: 7,
	PURPLE: 8,
	YELLOW: 9,
	TEAL: 10,
	AMBER: 11,
	INDIGO: 12,
	BROWN: 13,
	BLACK: 14
});

export const COLORS = Object.freeze<{ [key in (typeof COLOR_ENUM)[COLOR]]: string }>({
	[COLOR_ENUM.RED]: '#F44336',
	[COLOR_ENUM.GREEN]: '#4CAF50',
	[COLOR_ENUM.BLUE]: '#2196F3',
	[COLOR_ENUM.PINK]: '#E91E63',
	[COLOR_ENUM.LIME]: '#CDDC39',
	[COLOR_ENUM.LIGHT_BLUE]: '#03A9F4',
	[COLOR_ENUM.ORANGE]: '#FF9800',
	[COLOR_ENUM.CYAN]: '#00BCD4',
	[COLOR_ENUM.PURPLE]: '#9C27B0',
	[COLOR_ENUM.YELLOW]: '#FFEB3B',
	[COLOR_ENUM.TEAL]: '#009688',
	[COLOR_ENUM.AMBER]: '#FFC107',
	[COLOR_ENUM.INDIGO]: '#3F51B5',
	[COLOR_ENUM.BROWN]: '#795548',
	[COLOR_ENUM.BLACK]: '#212121'
});

export const OPACITIES = Object.freeze(['DD', '88', '33']);
