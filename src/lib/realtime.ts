import ioClient from 'socket.io-client';
import { PUBLIC_ENDPOINT } from '$env/static/public';

const socket = ioClient(PUBLIC_ENDPOINT);

export const io = socket;
