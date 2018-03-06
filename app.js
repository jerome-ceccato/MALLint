const fs = require('fs');
const http = require('http');

const express = require('express');
const app = express();

app.use(express.static(`${__dirname}/client`));
require('./server/routes.js')(app);

const httpServer = http.createServer(app);

httpServer.listen(3000);
console.log('HTTP server started');

if (fs.existsSync('sslcert/key')) {
    const https = require('https');

    const credentials = {
        key: fs.readFileSync('sslcert/key', 'utf8'),
        cert: fs.readFileSync('sslcert/cert', 'utf8'),
        ca: fs.readFileSync('sslcert/ca', 'utf8')
    };

    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(3443);
    console.log('HTTPS server started');
}

