import ioClient from 'socket.io-client';

const socket = ioClient(process.env.ENDPOINT ?? '');

export const io = socket;
