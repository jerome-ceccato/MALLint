module.exports = app => {

	app.get(`/`, (req, res) => {
		res.sendfile('./public/index.html');
	});

	app.get(`/analyze/:entity/:user`, (req, res) => {
		let api = new (require('./api'))();
		api.run(res, req.params);
	});
};
