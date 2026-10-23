import http from 'node:http';
import { fileURLToPath } from 'node:url';

// Media paths and build assets must resolve from this checkout, not the caller.
const checkout = fileURLToPath(new URL('../', import.meta.url));
process.chdir(checkout);

// Local HTTP preview of the production build. Deployment remains HTTPS by default.
process.env.NODE_ENV = 'production';
process.env.BODY_SIZE_LIMIT ||= '52M';
const protocolHeader = 'x-surios-local-protocol';
process.env.PROTOCOL_HEADER = protocolHeader;
process.env.HOST_HEADER = '';
process.env.PORT_HEADER = '';
const { handler } = await import('../build/handler.js');
const port = Number(process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use a valid PORT.');
const server = http.createServer((request, response) => {
	// Replace any client value. Only this loopback launcher establishes the protocol.
	request.headers[protocolHeader] = 'http';
	handler(request, response);
});
server.listen(port, 'localhost', () => {
	console.log(`Production preview: http://localhost:${port}`);
	console.log(`Checkout: ${checkout}`);
	console.log(`Database: ${new URL(process.env.DATABASE_URL || 'postgres://localhost/surios').pathname.slice(1)}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
