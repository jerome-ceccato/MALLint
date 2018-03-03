const express   = require('express');
const app       = express();
const port      = 3000;

app.use(express.static(`${__dirname}/client`));
require('./server/routes.js')(app);

app.listen(port);
console.log(`Web server listening on port ${port}`);
