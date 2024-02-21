interface PickResult {
	choices: string[];
	result: string;
}

export interface History {
	userName: string;
	diamond: number;
	pick: PickResult;
}

export interface ChoiceInfo {
	title: string;
	color: string;
	start: number;
	end: number;
}

export interface RaffleResult {
	title: string;
	count: number;
	color: string;
}
