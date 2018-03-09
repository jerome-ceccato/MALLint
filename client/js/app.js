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

    $scope.username = null;
    $scope.data = {};
    $scope.error = {};
    $scope.loading = {'anime': false, 'manga': false};
    $scope.loaded = false;
    $scope.lockLoading = false;

	$scope.loadData = function (entity, username) {
	    $scope.loading[entity] = true;
	    $scope.lockLoading = true;
        Data.get(entity, username).success(resp => {
            $scope.loaded = true;
            $scope.lockLoading = false;
            if (resp.hasOwnProperty('error')) {
                $scope.error[entity] = resp.error;
                $scope.data[entity] = null;
            }
            else {
                $scope.error[entity] = null;
                $scope.data[entity] = resp
            }

            //setTimeout(() => $('[data-toggle="tooltip"]').tooltip(), 100);
        });
    };

	$scope.reloadLists = function () {
        $scope.data = {};
        $scope.error = {};
        $scope.loading = {'anime': false, 'manga': false};
        $scope.loaded = false;

        if ($scope.usernameInput) {
            $scope.username = $scope.usernameInput;
            $scope.loadMALList('anime');
        }
    };

    $scope.loadMALList = function (entity) {
        if (!$scope.loading[entity] && !$scope.lockLoading) {
            $scope.loadData(entity, $scope.username);
        }
    };

    // Utils

    $scope.linkForItem = function (entity, item) {
        return `https://myanimelist.net/${entity}/${item.id}`;
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

    $scope.getReportStyle = function(entity) {
        let stats = $scope.data[entity].stats.issues;

        if (stats.error > 0) {
            return 'danger';
        }
        else if (stats.warning > 0) {
            return 'warning';
        }
        return 'success';
    };

    $scope.getReportGlobalStatus = function(entity) {
        let result = {};
        let stats = $scope.data[entity].stats.issues;

        if (stats.error > 0) {
            result.title = 'Oh no! There are some errors in your list';
        }
        else if (stats.warning > 0) {
            result.title = 'No errors were found, but you have some suggestions';
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
                result.body += `${separator}${stats.warning} suggestion${s} - you may ignore these depending on your personal preferences`
            }
            if (stats.info > 0) {
                let separator = stats.error > 0 || stats.warning > 0 ? '\n' : '';
                let s = stats.info > 1 ? 'ies' : 'y';
                result.body += `${separator}${stats.info} inconsistenc${s} - not sure if MAL is right or if you are`
            }
            if (stats.suggestion > 0) {
                let separator = stats.error > 0 || stats.warning > 0 || stats.info > 0 ? '\n' : '';
                let s = stats.suggestion > 1 ? 's' : '';
                result.body += `${separator}${stats.suggestion} other${s} - this is purely subjective`
            }
        }

        result.footer = `${$scope.data[entity].stats.listSize} ${entity} analyzed`;
        if (stats.total > 0) {
            result.footer += `\nClick on the section names to see the details`
        }
        return result;
    };
}]);
