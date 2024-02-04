import ioClient from 'socket.io-client';

const endpoint = 'http://localhost:3000';
const socket = ioClient(endpoint);

export const io = socket;
