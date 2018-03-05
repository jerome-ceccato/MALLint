const Category = Object.freeze({
    Invalid: 'invalid',
    Score: 'scores',
    Date: 'dates',
    Misc: 'other',
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
    this.completedWrongMetricsMeta = {
        description: {
            anime: 'Completed anime with a wrong number of watched episodes',
            manga: 'Completed manga with a wrong number of read volumes or chapters'
        },
        category: Category.Invalid,
    };

    this.x_invalidMetrics = [];
    this.invalidMetricsMeta = {
        description: {
            anime: 'Anime with more episodes watched than the maximum number',
            manga: 'Manga with more volumes or chapters read than the maximum'
        },
        category: Category.Invalid,
    };

    this.x_metricsInPlanned = [];
    this.metricsInPlannedMeta = {
        description: {
            anime: 'Plan-to-watch anime with more than 0 watched episodes',
            manga: 'Plan-to-read manga with more than 0 read volumes or chapters'
        },
        category: Category.Invalid,
    };

    this.x_noMetricsInWatchingReadingOnHold = [];
    this.noMetricsInWatchingReadingOnHoldMeta = {
        description: {
            anime: 'Watching or On-hold anime with 0 watched episodes',
            manga: 'Reading or On-hold manga with 0 read volumes or chapters'
        },
        category: Category.Invalid,
    };

    ////////// SCORES //////////////

    this.x_completedNoScore = [];
    this.completedNoScoreMeta = {
        description: {
            anime: 'Completed anime with no score',
            manga: 'Completed manga with no score'
        },
        category: Category.Score,
    };

    // add unpure scores

    ////////// DATES //////////////

    this.x_missingStartDate = [];
    this.missingStartDateMeta = {
        description: {
            anime: 'Started anime with no start date recorded',
            manga: 'Started manga with no start date recorded'
        },
        category: Category.Date,
    };

    this.x_missingEndDate = [];
    this.missingEndDateMeta = {
        description: {
            anime: 'Completed anime with no end date recorded',
            manga: 'Completed manga with no end date recorded'
        },
        category: Category.Date,
    };

    this.x_invalidStartDate = [];
    this.invalidStartDateMeta = {
        description: {
            anime: 'Plan-to-watch anime with a start date recorded',
            manga: 'Plan-to-read manga with a start date recorded'
        },
        category: Category.Date,
    };

    this.x_invalidEndDate = [];
    this.invalidEndDateMeta = {
        description: {
            anime: 'Non-completed anime with an end date recorded',
            manga: 'Non-completed manga with an end date recorded'
        },
        category: Category.Date
    };

    ////////// MISC //////////////

    this.c_tooManyWatchingReading = 0;
    this.tooManyWatchingReadingMeta = {
        description: {
            anime: 'More than 30 watching anime. Move some in your on-hold list',
            manga: 'More than 30 reading manga. Move some in your on-hold list'
        },
        category: Category.Misc,

        check: (property) => property > 30,
    };

    ////////// FUN //////////////

    this.c_clannadNotInList = isAnime;
    this.clannadNotInListMeta = {
        description: {
            anime: 'You haven\'t watched Clannad. Drop whatever you\'re doing and go watch it'
        },
        category: Category.Misc,

        check: (property) => property
    }

}

Analyzer.prototype.run = function(list) {
    this.list = list;

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

    if (item[this.myStatus] === this.statusWatchRead) {
        this.c_tooManyWatchingReading += 1;
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

    if (item[this.myStatus] === this.statusPlanned) {
        if (item['watched_episodes'] > 0) {
            this.x_metricsInPlanned.push(item);
        }
    }

    if (item[this.myStatus] === this.statusWatchRead || item[this.myStatus] === 'on-hold') {
        if (item['watched_episodes'] === 0) {
            this.x_noMetricsInWatchingReadingOnHold.push(item);
        }
    }

    if (item['title'].toLowerCase().includes('clannad')) {
        this.c_clannadNotInList = false;
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

    if (item[this.myStatus] === this.statusPlanned) {
        if (item['read_volumes'] > 0 || item['read_chapters'] > 0) {
            this.x_metricsInPlanned.push(item);
        }
    }

    if (item[this.myStatus] === this.statusWatchRead || item[this.myStatus] === 'on-hold') {
        if (item['read_volumes'] === 0 && item['read_chapters'] === 0) {
            this.x_noMetricsInWatchingReadingOnHold.push(item);
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
    let extra = {};
    let entities = {};

    this.exportItems('x_', (content, name, metadata) => {
        if (content.length > 0) {
            data[name] = this.exportCollection(content, name, metadata);
            this.addNewEntities(entities, content);
        }
    });

    this.exportItems('c_', (content, name, metadata) => {
        if (metadata.check(content)) {
            extra[name] = this.exportStatic(content, name, metadata);
        }
    });

    return {
        reports: data,
        extra: extra,
        stats: this.buildStats(data, extra),
        [this.entity]: this.purgeEntities(entities)
    };
};

Analyzer.prototype.buildStats = function (data, extra) {
    let objectLength = (obj) => {
        let len = 0;
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (obj[property].hasOwnProperty('items')) {
                    len += obj[property].items.length;
                }
                else {
                    len++;
                }
            }
        }
        return len;
    };

    return {
        listSize: this.list.length,
        issues: objectLength(data) + objectLength(extra),
    };
};

Analyzer.prototype.exportItems = function (indicator, exporter) {
    for (let property in this) {
        if (this.hasOwnProperty(property) && property.startsWith(indicator)) {
            let propertyName = property.substring(indicator.length);
            let metaProperty = `${propertyName}Meta`;

            let content = this[property];
            exporter(content, propertyName, this[metaProperty]);
        }
    }
};

Analyzer.prototype.exportCollection = function(items, key, metadata) {
    return {
        items: items.map(x => x['id']),
        description: metadata.description[this.entity],
        category: metadata.category,
    };
};

Analyzer.prototype.exportStatic = function (content, key, metadata) {
    return {
        value: content,
        description: metadata.description[this.entity],
        category: metadata.category,
    };
};

Analyzer.prototype.addNewEntities = function (entities, newItems) {
    newItems.forEach((item) => {
        entities[item.id] = item;
    });
};

Analyzer.prototype.purgeEntities = function (entities) {
    let newEntities = {};
    for (let property in entities) {
        if (entities.hasOwnProperty(property)) {
            newEntities[property] = this.purgeEntity(entities[property]);
        }
    }
    return newEntities;
};

Analyzer.prototype.purgeEntity = function (entity) {
    let newEntity = {};

    let properties = [
        'title',
        'synonyms',
        'image_url',
        'type',
        'status',

        'episodes',
        'chapters',
        'volumes'
    ];

    let userProperties = [
        'watched_status',
        'watched_episodes',
        'rewatching',

        'read_status',
        'chapters_read',
        'volumes_read',
        'rereading',

        'score',
        'watching_start',
        'watching_end',
        'reading_start',
        'reading_end'
    ];

    properties.forEach((property) => {
        if (entity.hasOwnProperty(property)) {
            newEntity[property] = entity[property];
        }
    });

    newEntity['user'] = {};
    userProperties.forEach((property) => {
        if (entity.hasOwnProperty(property)) {
            newEntity['user'][property] = entity[property];
        }
    });

    return newEntity;
};

module.exports = Analyzer;
