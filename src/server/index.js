import express from 'express';
import { createServer } from 'http';
import { handler } from '../../build/handler.js';
import { Server } from 'socket.io';
import { WebcastPushConnection } from 'tiktok-live-connector';

const port = 3000;
const app = express();
const server = createServer(app);
let tiktokLiveConnection;
const io = new Server(server);
let probability;
let minProbability;
let maxProbability;
let maxDiamond;
let numOfChoices;

io.on('connection', (socket) => {
	const userName = `User ${Math.random() * 10000}`;
	socket.emit('name', userName);

	socket.on('connectTiktokLive', async (message) => {
		tiktokLiveConnection = new WebcastPushConnection(message);
		await tiktokLiveConnection
			.connect()
			.then((state) => {
				console.log(`Connected to roomID $${state.roomId}`);
				io.emit('connectTiktokLive', {
					roomId: state.roomId,
					isConnected: state.isConnected
				});
				tiktokLiveConnection.on('gift', (data) => {
					if (data.giftType !== 1 || data.repeatEnd) {
						console.log(
							`[gift] ${data.uniqueId} (userID: ${data.userId}) sends ${data.giftId}, diamonds: ${data.diamondCount} x${data.repeatCount} type: ${data.giftType} end: ${data.repeatEnd}`
						);
						const totalDiamond = data.diamondCount * data.repeatCount;
						const weightedJudgeResult = weightedJudge(
							totalDiamond,
							maxDiamond,
							minProbability,
							maxProbability
						);
						const judgeResult = judge(probability);
						const selectResult = select(numOfChoices);
						console.log(`[weightedJudge]: ${weightedJudgeResult.result}`);
						console.log(`[judge]: ${judgeResult.result}`);
						console.log(`[select]: ${selectResult}`);
						io.emit('recieveGift', {
							userName: data.nickname,
							diamond: totalDiamond,
							raffle: {
								weightedJudge: weightedJudgeResult,
								judge: judgeResult,
								select: selectResult
							}
						});
					}
				});
			})
			.catch((err) => {
				console.error('Failed to connect', err);
				io.emit('connectTiktokLive', {
					roomId: null,
					isConnected: false
				});
			});
	});

	socket.on('updateParameters', (message) => {
		probability = message.probability;
		minProbability = message.minProbability;
		maxProbability = message.maxProbability;
		maxDiamond = message.maxDiamond;
		numOfChoices = message.numOfChoices;
		console.log(JSON.stringify(message));
	});

	socket.on('disconnectTiktokLive', () => {
		tiktokLiveConnection.disconnect;
		io.emit('disconnectTiktokLive');
	});
});

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler);

server.listen(port);

const judge = (rate) => {
	const threshold = 1 - rate;
	const randomNum = Math.random();
	return {
		probability: rate,
		result: randomNum >= threshold
	};
};

const weightedJudge = (num, limit, minRate, maxRate) => {
	const ratio = normalizeSigmoid(num / limit, 5);
	const probability = Math.min(Math.max(minRate, ratio), maxRate);
	const threshold = 1 - probability;
	const randomNum = Math.random();
	return {
		probability,
		result: randomNum >= threshold
	};
};

const select = (choiceCount) => ({
	numOfChoices: choiceCount,
	selected: Math.floor(Math.random() * choiceCount) + 1
});

const sigmoid = (x, slope) => Math.min(1.0, 1.0 / (1 + Math.exp(-slope * x)));

const normalizeSigmoid = (x, slope) => (sigmoid(x, slope) - 0.5) / (1 - 0.5);
