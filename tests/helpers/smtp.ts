import net from 'node:net';
import tls from 'node:tls';

export async function startLocalMailbox(options?: { tls?: tls.TlsOptions }) {
	const messages: { to: string[]; subject: string; text: string }[] = [];
	const sockets = new Set<net.Socket>();
	let rejectNext = false;
	const connection = (socket: net.Socket) => {
		sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {});
		socket.write('220 localhost test mailbox\r\n');
		let buffer = '', inData = false, data: string[] = [], recipients: string[] = [];
		socket.on('data', (chunk) => {
			buffer += chunk.toString();
			let newline: number;
			while ((newline = buffer.indexOf('\r\n')) >= 0) {
				const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 2);
				if (inData) {
					if (line !== '.') { data.push(line.replace(/^\.\./, '.')); continue; }
					inData = false;
					if (rejectNext) { rejectNext = false; socket.write('451 temporary test failure\r\n'); continue; }
					const raw = data.join('\r\n');
					const text = raw.slice(raw.indexOf('\r\n\r\n') + 4).replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
					messages.push({ to: [...recipients], subject: /^Subject: (.*)$/mi.exec(raw)?.[1] || '', text });
					socket.write('250 message accepted\r\n'); continue;
				}
				if (/^(EHLO|HELO)/.test(line)) socket.write('250-localhost\r\n250 PIPELINING\r\n');
				else if (/^MAIL FROM:/.test(line)) { recipients = []; socket.write('250 OK\r\n'); }
				else if (/^RCPT TO:/.test(line)) { recipients.push(/<([^>]+)>/.exec(line)?.[1] || ''); socket.write('250 OK\r\n'); }
				else if (line === 'DATA') { data = []; inData = true; socket.write('354 end with dot\r\n'); }
				else if (line === 'QUIT') socket.end('221 bye\r\n');
				else socket.write('250 OK\r\n');
			}
		});
	};
	const server = options?.tls ? tls.createServer(options.tls, connection) : net.createServer(connection);
	await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(25279, '127.0.0.1', resolve); });
	return { messages, rejectOne: () => { rejectNext = true; }, close: async () => { for (const socket of sockets) socket.destroy(); await new Promise<void>((resolve) => server.close(() => resolve())); } };
}
