const ErrorLevel = Object.freeze({
    Critical: 0,
});

function Analyzer(user, entity) {

    this.user = user;
    this.entity = entity;

    let isAnime = entity === 'anime';
    this.myStatus = isAnime ? 'watched_status' : 'read_status';
    this.statusWatchRead = isAnime ? 'watching' : 'reading';
    this.statusPlanned = isAnime ? 'plan to watch' : 'plan to read';
    this.myStartDate = isAnime ? 'watching_start' : 'reading_start';
    this.myEndDate = isAnime ? 'watching_end' : 'reading_end';
    this.myRestarting = isAnime ? 'rewatching' : 'rereading';

    ////////// SANITY //////////////

    this.x_completedWrongMetrics = [];
    this.completedWrongMetricsDesc = 'Wrong number of eps/vols/chap on completed entry';
    this.completedWrongMetricsLevel = ErrorLevel.Critical;

    this.x_invalidMetrics = [];
    this.invalidMetricsDesc = 'Wrong number of eps on any entry (more than the maximum)';

    ////////// SCORES //////////////

    this.x_completedNoScore = [];
    this.completedNoScoreDesc = 'Completed but no score was given';

    ////////// DATES //////////////

    this.x_missingStartDate = [];
    this.missingStartDateDesc = 'No start date on non-ptw item';

    this.x_missingEndDate = [];
    this.missingEndDateDesc = 'No end date on completed item';

    this.x_invalidStartDate = [];
    this.invalidStartDateDesc = 'Start date on PTW item';

    this.x_invalidEndDate = [];
    this.invalidEndDateDesc = 'End date on non-completed item';
}

Analyzer.prototype.run = function(list) {
    list.forEach((item) => {
        this.inspect(this.entity, item);
    });

    return this.export();
};

Analyzer.prototype.inspectEntity = function(item) {
    if (item[this.myStatus] === 'completed') {
        if (item['score'] === 0) {
            this.x_completedNoScore.push(item);
        }

        if (!(this.myEndDate in item) || !item[this.myEndDate]) {
            this.x_missingEndDate.push(item);
        }
    }
    else {
        if ((this.myEndDate in item) && item[this.myEndDate]) {
            this.x_invalidEndDate.push(item);
        }
    }

    if (item[this.myStatus] === this.statusPlanned) {
        if ((this.myStartDate in item) && item[this.myStartDate]) {
            this.x_invalidStartDate.push(item);
        }
    }
    else {
        if (!(this.myStartDate in item) || !item[this.myStartDate]) {
            this.x_missingStartDate.push(item);
        }

    }
};

Analyzer.prototype.inspectAnime = function(item) {
    if ('episodes' in item && item['episodes'] > 0) {
        if (item[this.myStatus] === 'completed') {
            if (!item[this.myRestarting] && item['episodes'] > item['watched_episodes']) {
                this.x_completedWrongMetrics.push(item);
            }
        }

        if (item['episodes'] < item['watched_episodes'] || item['watched_episodes'] < 0) {
            this.x_invalidMetrics.push(item);
        }
    }
};

Analyzer.prototype.inspectManga = function(item) {
    let hasWrongMetrics = false;
    let hasInvalidMetrics = false;

    if ('chapters' in item && item['chapters'] > 0) {
        if (item[this.myStatus] === 'completed') {
            if (!item[this.myRestarting] && item['chapters'] > item['read_chapters']) {
                this.x_completedWrongMetrics.push(item);
                hasWrongMetrics = true;
            }
        }
        if (item['chapters'] < item['read_chapters'] || item['read_chapters'] < 0) {
            this.x_invalidMetrics.push(item);
            hasInvalidMetrics = true;
        }
    }

    if ('volumes' in item && item['volumes'] > 0) {
        if (item[this.myStatus] === 'completed') {
            if (!hasWrongMetrics && !item[this.myRestarting] && item['volumes'] > item['read_volumes']) {
                this.x_completedWrongMetrics.push(item);
            }
        }
        if (!hasInvalidMetrics && (item['volumes'] < item['read_volumes'] || item['read_volumes'] < 0)) {
            this.x_invalidMetrics.push(item);
        }
    }
};

Analyzer.prototype.inspect = function(entity, item) {
    this.inspectEntity(item);
    if (entity === 'anime') {
        this.inspectAnime(item);
    }
    else {
        this.inspectManga(item);
    }
};

Analyzer.prototype.export = function() {
    let data = {};
    for (let property in this) {
        if (this.hasOwnProperty(property) && property.startsWith('x_')) {
            let propertyName = property.substring(2);
            let descProperty = `${propertyName}Desc`;

            let items = this[property];
            if (items.length > 0) {
                data[propertyName] = this.exportCollection(items, propertyName, this[descProperty])
            }
        }
    }

    return data;
};

Analyzer.prototype.exportCollection = function(items, key, description) {
    return {
        items: items.map(x => x['title']),
        description: description
    };
};

module.exports = Analyzer;