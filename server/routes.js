module.exports = app => {

	app.get(`/`, (req, res) => {
		res.sendfile('./public/index.html');
	});

	app.get(`/analyze/:entity/:user`, (req, res) => {
		require('./api').run(res, req.params);
	});
};
