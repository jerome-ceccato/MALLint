const moment = require('moment');

const Category = Object.freeze({
    Invalid: 'error',
    Warning: 'warning',
    Info: 'info',
    Misc: 'suggestion',
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

    this.entityStatusOngoing = isAnime ? 'currently airing' : 'publishing';
    this.entityStatusNotYet = isAnime ? 'not yet aired' : 'not yet published';

    ////////// ERRORS //////////////

    this.x_completedWrongMetrics = [];
    this.completedWrongMetricsMeta = {
        description: {
            anime: 'Completed anime with a wrong number of watched episodes',
            manga: 'Completed manga with a wrong number of read volumes or chapters'
        },
        fix: {
            anime: 'If you have completed them, you have seen all the episodes. MAL does not show your watched number of episodes on completed anime, so it\'s hard to notice the issue.',
            manga: 'If you have completed them, you have read all volumes/chapters. MAL does not show your read number of volumes/chapters on completed manga, so it\'s hard to notice the issue.'
        },
        category: Category.Invalid
    };

    this.x_invalidMetrics = [];
    this.invalidMetricsMeta = {
        description: {
            anime: 'Anime with more episodes watched than the maximum number',
            manga: 'Manga with more volumes or chapters read than the maximum'
        },
        fix: {
            anime: 'This usually happens when MAL splits an anime in two or more. Check the anime listed and their related anime, you might need to add a new one to your list.',
            manga: 'This usually happens when MAL splits a manga in two or more. Check the manga listed and their related manga, you might need to add a new one to your list.'
        },
        category: Category.Invalid
    };

    this.x_metricsInPlanned = [];
    this.metricsInPlannedMeta = {
        description: {
            anime: 'Plan-to-watch anime with more than 0 watched episodes',
            manga: 'Plan-to-read manga with more than 0 read volumes or chapters'
        },
        fix: {
            anime: 'Either you\'ve started them, and they should be moved to watching or on-hold, or you have not, and you should set their watched episodes to 0.',
            manga: 'Either you\'ve started them, and they should be moved to reading or on-hold, or you have not, and you should set their read volumes/chapters to 0.'
        },
        category: Category.Invalid
    };

    this.x_noMetricsInWatchingReadingOnHold = [];
    this.noMetricsInWatchingReadingOnHoldMeta = {
        description: {
            anime: 'Watching or on-hold anime with 0 watched episodes',
            manga: 'Reading or on-hold manga with 0 read volumes or chapters'
        },
        fix: {
            anime: 'Either you\'ve started them, and you have watched more than 0 episodes, or you have not, and you should move them to plan-to-watch.',
            manga: 'Either you\'ve started them, and you have read more than 0 volumes/chapters, or you have not, and you should move them to plan-to-read.'
        },
        category: Category.Invalid
    };

    this.x_invalidStartDate = [];
    this.invalidStartDateMeta = {
        description: {
            anime: 'Plan-to-watch anime with a start date recorded',
            manga: 'Plan-to-read manga with a start date recorded'
        },
        fix: {
            anime: 'If they are in your plan-to-watch list, it means you haven\'t started them yet. Remove the start date, or move them to watching or on-hold.',
            manga: 'If they are in your plan-to-read list, it means you haven\'t started them yet. Remove the start date, or move them to reading or on-hold.'
        },
        category: Category.Invalid
    };

    this.x_invalidEndDate = [];
    this.invalidEndDateMeta = {
        description: {
            anime: 'Watching, on-hold or plan-to-watch anime with an end date recorded',
            manga: 'Reading, on-hold or plan-to-read manga with an end date recorded'
        },
        fix: {
            anime: 'If you haven\'t finished or dropped them, they should not have an end date.',
            manga: 'If you haven\'t finished or dropped them, they should not have an end date.'
        },
        category: Category.Invalid
    };

    this.x_ongoingCompleted = [];
    this.ongoingCompletedMeta = {
        description: {
            anime: 'Airing anime marked as completed',
            manga: 'Publishing manga marked as completed'
        },
        fix: {
            anime: 'You can\'t possibly have completed anime that are still airing. Move them back to watching.',
            manga: 'You can\'t possibly have completed manga that are still publishing. Move them back to reading.'
        },
        category: Category.Invalid
    };

    this.x_notYetStarted = [];
    this.notYetStartedMeta = {
        description: {
            anime: 'Not yet aired anime not in plan-to-watch',
            manga: 'Not yet published manga not in plan-to-read'
        },
        fix: {
            anime: 'You can\'t possibly have started anime that have not aired yet. Move them back to plan-to-watch.',
            manga: 'You can\'t possibly have started manga that have not been published yet. Move them back to plan-to-read.'
        },
        category: Category.Invalid
    };

    this.x_endBeforeStart = [];
    this.endBeforeStartMeta = {
        description: {
            anime: 'Anime with an end date prior to the start date',
            manga: 'Manga with an end date prior to the start date'
        },
        fix: {
            anime: 'Check your dates, you probably didn\'t really finish these anime before you started them.',
            manga: 'Check your dates, you probably didn\'t really finish these manga before you started them.'
        },
        category: Category.Invalid
    };

    ////////// WARNINGS //////////////

    this.x_completedNoScore = [];
    this.completedNoScoreMeta = {
        description: {
            anime: 'Completed anime with no score',
            manga: 'Completed manga with no score'
        },
        fix: {
            anime: 'Tell the world what you think about these anime!',
            manga: 'Tell the world what you think about these manga!'
        },
        category: Category.Warning
    };

    this.x_scoredDropped = [];
    this.scoredDroppedMeta = {
        description: {
            anime: 'Dropped anime with a score',
            manga: 'Dropped manga with a score'
        },
        fix: {
            anime: 'Is it fair to rate a dropped anime? Nobody knows.',
            manga: 'Is it fair to rate a dropped manga? Nobody knows.'
        },
        category: Category.Warning
    };

    this.x_missingStartDate = [];
    this.missingStartDateMeta = {
        description: {
            anime: 'Started anime with no start date recorded',
            manga: 'Started manga with no start date recorded'
        },
        fix: {
            anime: 'It\'s time to think really hard and try to remember when you started watching these.',
            manga: 'It\'s time to think really hard and try to remember when you started reading these.'
        },
        category: Category.Warning
    };

    this.x_missingEndDate = [];
    this.missingEndDateMeta = {
        description: {
            anime: 'Completed anime with no end date recorded',
            manga: 'Completed manga with no end date recorded'
        },
        fix: {
            anime: 'When did you finish watching these again?',
            manga: 'When did you finish reading these again?'
        },
        category: Category.Warning
    };

    this.x_droppedEndDate = [];
    this.droppedEndDateMeta = {
        description: {
            anime: 'Dropped anime with an end date recorded',
            manga: 'Dropped manga with an end date recorded'
        },
        fix: {
            anime: 'Some might say it says "end date", and not "finish date", so you can put an end date on dropped anime. You decide.',
            manga: 'Some might say it says "end date", and not "finish date", so you can put an end date on dropped manga. You decide.'
        },
        category: Category.Warning
    };

    ////////// INFOS //////////////

    this.x_startedBeforeStart = [];
    this.startedBeforeStartMeta = {
        description: {
            anime: 'Anime started before its airing date',
            manga: 'Manga started before its publishing date'
        },
        fix: {
            anime: 'You can\'t have started these anime before they started airing. But maybe MAL is wrong on the aired date.',
            manga: 'You can\'t have started these manga before they started publishing. But maybe MAL is wrong on the published date.'
        },
        category: Category.Info
    };

    this.x_endedBeforeEnd = [];
    this.endedBeforeEndMeta = {
        description: {
            anime: 'Completed anime ended before it finished airing',
            manga: 'Completed manga ended before it finished publishing'
        },
        fix: {
            anime: 'You can\'t have finished these anime before they finished airing. But maybe MAL is wrong on the aired date.',
            manga: 'You can\'t have finished these manga before they finished publishing. But maybe MAL is wrong on the published date.'
        },
        category: Category.Info
    };

    ////////// SUGGESTIONS //////////////

    this.c_tooManyWatchingReading = 0;
    this.tooManyWatchingReadingMeta = {
        description: {
            anime: 'More than 30 watching anime. Move some to your on-hold list!',
            manga: 'More than 30 reading manga. Move some to your on-hold list!'
        },
        category: Category.Misc,

        check: (property) => property > 30,
    };

    ////////// FUN //////////////

    this.c_clannadNotInList = isAnime;
    this.clannadNotInListMeta = {
        description: {
            anime: 'You haven\'t watched Clannad. Drop whatever you\'re doing and go watch it :)'
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

        if (item['status'] === this.entityStatusOngoing) {
            this.x_ongoingCompleted.push(item);
        }
    }
    else {
        if ((this.myEndDate in item) && item[this.myEndDate]) {
            if (item[this.myStatus] === 'dropped') {
                this.x_droppedEndDate.push(item);
            }
            else {
                this.x_invalidEndDate.push(item);
            }
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

        if (item['status'] === this.entityStatusNotYet) {
            this.x_notYetStarted.push(item);
        }
    }

    if (item[this.myStatus] === 'dropped') {
        if (item['score'] !== 0) {
            this.x_scoredDropped.push(item);
        }
    }

    if (item[this.myStatus] === this.statusWatchRead) {
        this.c_tooManyWatchingReading += 1;
    }

    if ((this.myStartDate in item) && ('start_date' in item)) {
        if (item[this.myStartDate] < item['start_date']) {
            if (daysDifference(item[this.myStartDate], item['start_date']) > 2) {
                this.x_startedBeforeStart.push(item);
            }
        }
    }

    if ((this.myEndDate in item) && ('end_date' in item)) {
        if (item[this.myEndDate] < item['end_date']) {
            if (item[this.myStatus] === 'completed') {
                if (daysDifference(item[this.myEndDate], item['end_date']) > 2) {
                    this.x_endedBeforeEnd.push(item);
                }
            }
        }
    }

    if ((this.myStartDate in item) && (this.myEndDate in item)) {
        if (item[this.myStartDate] > item[this.myEndDate]) {
            this.x_endBeforeStart.push(item);
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

    if (item['title'].toLowerCase().includes('clannad') && item[this.myStatus] !== this.statusPlanned) {
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
        stats: this.buildStats(data, extra)
    };
};

Analyzer.prototype.buildStats = function (data, extra) {
    let issues  = {
        total: 0,
        [Category.Invalid]: 0,
        [Category.Warning]: 0,
        [Category.Info]: 0,
        [Category.Misc]: 0
    };

    let countIssues = (obj) => {
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                let total = 1;
                if (obj[property].hasOwnProperty('items')) {
                    total = obj[property].items.length;
                }

                issues.total += total;
                issues[obj[property].category] += total;
            }
        }
    };

    countIssues(data);
    countIssues(extra);

    return {
        listSize: this.list.length,
        issues: issues,
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
        items: items.map(x => this.exportEntity(x, metadata)),
        description: metadata.description[this.entity],
        fix: metadata.fix[this.entity],
        category: metadata.category,
    };
};

Analyzer.prototype.exportStatic = function (content, key, metadata) {
    return {
        description: metadata.description[this.entity],
        category: metadata.category,
    };
};

Analyzer.prototype.addNewEntities = function (entities, newItems) {
    newItems.forEach((item) => {
        entities[item.id] = item;
    });
};

Analyzer.prototype.exportEntity = function (entity, metadata) {
    return {
        id: entity.id,
        title: entity.title
    };
};

function daysDifference(a, b) {
    let da = moment(a);
    let db = moment(b);

    return Math.abs(db.diff(da, 'days'));
}

module.exports = Analyzer;
