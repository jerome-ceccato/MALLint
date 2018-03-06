// App
const app = angular.module('app', ['angular-loading-bar']);

// Service to fetch some data..
app.factory('fetcher', ['$http', ($http) => {
	return {
		get : (entity, username) => $http.get(`/analyze/${entity}/${username}`)
	}
}]);

// App controller
app.controller('appController', ['$scope', 'fetcher', ($scope, Data) => {
	$scope.loadData = function (entity, username) {
	    $scope.entity = entity;
	    $scope.data = null;

        Data.get(entity, username).success(resp => {
            if (resp.hasOwnProperty('error')) {
                $scope.error = resp.error;
                $scope.data = null;
            }
            else {
                $scope.error = null;
                $scope.data = resp
            }
        });
    };
    
    $scope.loadMALList = function () {
        $scope.loadData('anime', $scope.usernameInput);
    };

    // Utils

    $scope.getEntities = function () {
        return $scope.data[$scope.entity];
    };

    $scope.imageURLForID = function (id) {
        return $scope.getEntities()[id].image_url;
    };

    $scope.titleForID = function (id) {
        return $scope.getEntities()[id].title;
    };

    $scope.linkForID = function (id) {
        return `https://myanimelist.net/${$scope.entity}/${id}`;
    };

    $scope.badgeStyleForCategory = function (category) {
        switch (category) {
            case 'error':
                return 'danger';
            case 'warning':
                return 'primary';
            default:
                return 'secondary';
        }
    };

    $scope.getStats = function () {
        let message = `${$scope.data.stats.listSize} ${$scope.entity} analyzed`;
        let stats = $scope.data.stats.issues;

        if (stats.total > 0) {
            if (stats.error > 0) {
                let s = stats.error > 1 ? 's' : '';
                message += ` - ${stats.error} error${s}`
            }
            if (stats.warning > 0) {
                let separator = stats.error > 0 ? ', ' : ' - ';
                let s = stats.warning > 1 ? 's' : '';
                message += `${separator}${stats.warning} warning${s}`
            }
            if (stats.suggestion > 0) {
                let separator = stats.error > 0 || stats.warning > 0 ? ', ' : ' - ';
                let s = stats.suggestion > 1 ? 's' : '';
                message += `${separator}${stats.suggestion} suggestion${s}`
            }
        }
        else {
            message += ' - no problem detected!'
        }
        return message;
    };

    $scope.getReportStyle = function() {
        let stats = $scope.data.stats.issues;

        if (stats.error > 0) {
            return 'danger';
        }
        else if (stats.warning > 0) {
            return 'warning';
        }
        return 'success';
    };

    $scope.getReportGlobalStatus = function() {
        let result = {};
        let stats = $scope.data.stats.issues;

        if (stats.error > 0) {
            result.title = 'Oh no! There are some errors in your list';
        }
        else if (stats.warning > 0) {
            result.title = 'No errors were found, but you have some warnings';
        }
        else {
            result.title = 'Well done, your list passes the tests!'
        }

        result.body = '';
        if (stats.total > 0) {
            if (stats.error > 0) {
                let s = stats.error > 1 ? 's' : '';
                result.body += `${stats.error} error${s} - you should fix these`
            }
            if (stats.warning > 0) {
                let separator = stats.error > 0 ? '\n' : '';
                let s = stats.warning > 1 ? 's' : '';
                result.body += `${separator}${stats.warning} warning${s} - you may ignore these depending on your personal preferences`
            }
            if (stats.suggestion > 0) {
                let separator = stats.error > 0 || stats.warning > 0 ? '\n' : '';
                let s = stats.suggestion > 1 ? 's' : '';
                result.body += `${separator}${stats.suggestion} suggestion${s} - this is purely subjective`
            }
        }

        result.footer = `${$scope.data.stats.listSize} ${$scope.entity} analyzed`;
        return result;
    };
}]);
