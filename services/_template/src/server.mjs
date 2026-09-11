import http from 'node:http';

const port = Number(process.env.PORT || 3100);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8'});
    res.end(JSON.stringify({ok:true, service:'replace-me'}));
    return;
  }
  res.writeHead(404, {'content-type':'application/json; charset=utf-8'});
  res.end(JSON.stringify({error:'not_found'}));
});

server.listen(port, () => {
  console.log(`service listening on ${port}`);
});
