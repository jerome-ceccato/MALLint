const fs = require('fs');
const logfile = 'logs/logs.json';

module.exports = app => {

	app.get(`/`, (req, res) => {
		res.sendfile('./public/index.html');
	});

	app.get(`/analyze/:entity/:user`, (req, res) => {
		let api = new (require('./api'))();
		api.run(res, req.params);

		log(req.params.entity, req.params.user);
	});
};

function log(entity, user) {
    let data = {
        date: new Date().toISOString(),
        entity: entity,
        user: user,
    };

    fs.appendFile(logfile, JSON.stringify(data) + '\n', function (err) {});
}
