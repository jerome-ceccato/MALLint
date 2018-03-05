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
}]);
