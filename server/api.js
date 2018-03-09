let https = require('https');

function API() {
    this.res = null;
    this.user = '';
    this.entity = 'anime';
    this.user_list = null;
    this.logger = null;
}

API.prototype.run = function(res, params, logger) {
    this.res = res;
    this.logger = logger;

    if (!this.validateParams(params)) {
        this.error('invalid parameters')
    }
    else {
        this.loadList(() => {
            let analyzer = new (require('./analyzer'))(this.user, this.entity);
            this.success(analyzer.run(this.user_list));
        });
    }
};

API.prototype.loadList = function(success) {
    let options = {
        host: 'imal.iatgof.com',
        path: `/app.php/2.2/${this.entity}list/${this.user}`
    };

    let request = https.get(options, (res) => {
        let response = '';

        res.on('data', (data) => {
            response += data;
        });

        res.on('end', () => {
            let responseJSON = JSON.parse(response);
            this.user_list = responseJSON[this.entity];

            if (this.user_list) {
                success();
            }
            else {
                this.error('User not found or empty list');
            }
        });
    });

    request.on('error', (e) => {
        this.error(e);
    });
    request.end();
};

API.prototype.validateParams = function(params) {
    if (params.user != null) {
        this.user = params.user;
    }
    else {
        return false;
    }

    if (params.entity === 'anime' || params.entity === 'manga') {
        this.entity = params.entity;
    }
    else {
        return false;
    }

    return true;
};

API.prototype.success = function (data) {
    this.logger(data);
    this.res.json(data)
};

API.prototype.error = function(message) {
    let data = {'error': message};
    this.logger(data);
    this.res.json(data);
};

module.exports = API;