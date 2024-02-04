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
						const weightedJudgeResult = weightedJudge(totalDiamond, 500, 0.1, 0.9);
						const judgeResult = judge(0.5);
						const selectResult = select(4);
						console.log(`[weightedJudge]: ${weightedJudgeResult}`);
						console.log(`[judge]: ${judgeResult}`);
						console.log(`[select]: ${selectResult}`);
						io.emit('recieveGift', {
							userId: data.userId,
							userName: data.nickname,
							diamond: totalDiamond,
							result: {
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
			});
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
	return randomNum >= threshold;
};

const weightedJudge = (num, limit, minRate, maxRate) => {
	const ratio = normalizeSigmoid(5, num / limit);
	const threshold = 1 - Math.min(Math.max(minRate, ratio), maxRate);
	const randomNum = Math.random();
	return randomNum >= threshold;
};

const select = (choiceCount) => Math.floor(Math.random() * choiceCount) + 1;

const sigmoid = (slope, x) => (x > 1 ? 1.0 : 1.0 / (1 + Math.exp(-slope * x)));

const normalizeSigmoid = (slope, x) => (sigmoid(slope, x) - 0.5) / (1 - 0.5);
