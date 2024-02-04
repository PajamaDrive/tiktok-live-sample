import { Server } from 'socket.io';

type ServerType = ConstructorParameters<typeof Server>[0];

export const initIo = (server: ServerType) => {
	const io = new Server(server);

	io.on('connection', (socket) => {
		const userName = `User ${Math.random() * 10000}`;
		socket.emit('name', userName);

		socket.on('message', (message) => {
			console.log(message);
			io.emit('message', {
				from: userName,
				message: message,
				time: new Date().toLocaleDateString()
			});
		});
	});
};
