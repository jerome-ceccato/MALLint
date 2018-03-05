const fs = require('fs');
const http = require('http');

const express = require('express');
const app = express();

app.use(express.static(`${__dirname}/client`));
require('./server/routes.js')(app);

const httpServer = http.createServer(app);

httpServer.listen(3000);
console.log('HTTP server started');

if (fs.existsSync('sslcert/server.key')) {
    const https = require('https');
    const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
    const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
    const credentials = {key: privateKey, cert: certificate};

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(3443);
    console.log('HTTPS server started');
}

