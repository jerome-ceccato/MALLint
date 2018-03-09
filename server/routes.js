const fs = require('fs');
const logfile = 'logs/logs.json';

module.exports = app => {

	app.get(`/`, (req, res) => {
		res.sendfile('./public/index.html');
	});

	app.get(`/analyze/:entity/:user`, (req, res) => {
		let api = new (require('./api'))();
		api.run(res, req.params, function (data) {
			log(req.params.entity, req.params.user, data);
        });
	});
};

function log(entity, user, response) {
    let data = {
        date: new Date().toISOString(),
        entity: entity,
        user: user,
    };

    if (response.hasOwnProperty('error')) {
    	data.error = response.error;
	}
	else if (response.hasOwnProperty('stats')) {
    	data.stats = response.stats;
	}

    fs.appendFile(logfile, JSON.stringify(data) + '\n', function (err) {});
}
