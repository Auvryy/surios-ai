import { prepareNativeApiRequest } from './native-api.mjs';

process.env.NODE_ENV = 'production';
process.env.BODY_SIZE_LIMIT ||= '52M';
// Keep adapter-node's server, proxy configuration and graceful shutdown behavior.
const { server } = await import('../build/index.js');
server.prependListener('request', prepareNativeApiRequest);
