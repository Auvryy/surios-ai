// Loopback-only fake Gemini transport for integration tests; no API credits are used.
import http from 'node:http';
let settings = { mode: 'valid', delay: 0, overrides: {} };
let requests = [];
const analysis = { isValidInfrastructure: true, rejectionReason: null, infrastructureType: 'OTHER_PUBLIC_INFRASTRUCTURE', distressType: 'other', hazardSeverity: 3, riskLevel: 'LOW', vruLethality: 'LOW', vruDetails: 'A public access area is visible.', estimatedDimensions: { depthEstimate: 'Unmeasured', surfaceAreaEstimate: 'Unmeasured' }, recommendedAction: 'Arrange an on-site inspection.', materialsChecklist: [], urgency: 'ROUTINE', summary: 'Visible deterioration requires a closer inspection.', severityEvidence: { visibleDefects: ['Visible surface deterioration.'], reportedConditions: ['Reporter describes public use.'], criticalDangerVisible: false, confidence: 'MEDIUM', limitations: 'Ownership and hidden structural condition cannot be verified.' } };
const server = http.createServer(async (req,res) => {
	const chunks=[];for await(const chunk of req)chunks.push(chunk);
	const body=Buffer.concat(chunks).toString();
	res.setHeader('Content-Type','application/json');
	if(req.url === '/health'){res.end('{}');return;}
	if(req.url === '/control') {settings={mode:'valid',delay:0,overrides:{},...JSON.parse(body||'{}')};requests=[];res.end('{}');return;}
	if(req.url === '/requests'){res.end(JSON.stringify(requests));return;}
	if(!req.url?.includes(':generateContent')){res.writeHead(404);res.end('{}');return;}
	const input=JSON.parse(body);
	const parts=input.contents.flatMap(content=>content.parts||[]);
	const record={texts:parts.filter(part=>part.text).map(part=>part.text),media:parts.filter(part=>part.inlineData).map(part=>({mimeType:part.inlineData.mimeType,encodedLength:part.inlineData.data.length})),aborted:false};
	requests.push(record);
	const captured={...settings};
	const timer=setTimeout(()=>{
		if(captured.mode==='fail'){res.writeHead(503);res.end(JSON.stringify({error:{code:503,message:'Controlled provider failure',status:'UNAVAILABLE'}}));return;}
		const result={...analysis,...captured.overrides,...(captured.mode==='reject'?{isValidInfrastructure:false,rejectionReason:'No identifiable infrastructure asset in the supplied media.'}:{})};
		res.end(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:JSON.stringify(result)}]},finishReason:'STOP'}]}));
	},captured.delay);
	res.once('close',()=>{if(!res.writableEnded){record.aborted=true;clearTimeout(timer);}});
});
server.listen(5198,'127.0.0.1',()=>console.log('Fake Gemini transport:5198'));
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>process.exit(0)));
