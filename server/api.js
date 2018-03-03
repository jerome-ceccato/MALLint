var https = require('https');

var API = {
    res: null,
    user: '',
    entity: 'anime',
    user_list: null,
};

API.run = (res, params) => {
    API.res = res;

    if (!API.validateParams(params)) {
        API.error('invalid parameters')
    }
    else {
        API.loadList(() => {
            let analyzer = require('./analyzer');
            API.res.json(analyzer.run(API.user, API.entity, API.user_list));
        });
    }
};

API.loadList = (success) => {
    let options = {
        host: 'imal.iatgof.com',
        path: `/app.php/2.2/${API.entity}list/${API.user}`
    };

    let request = https.get(options, (res) => {
        let response = '';

        res.on('data', function(data) {
            response += data;
        });

        res.on('end', function() {
            let responseJSON = JSON.parse(response);
            API.user_list = responseJSON[API.entity];
            success(responseJSON)
        });
    });

    request.on('error', (e) => {
        this.error(e);
    });
    request.end();
};

API.validateParams = (params) => {
    if (params.user != null) {
        API.user = params.user;
    }
    else {
        return false;
    }

    if (params.entity === 'anime' || params.entity === 'manga') {
        API.entity = params.entity;
    }
    else {
        return false;
    }

    return true;
};

API.error = (message) => {
    API.res.json({'error': message});
};

module.exports = API;