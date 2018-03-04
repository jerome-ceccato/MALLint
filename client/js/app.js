// App
const app = angular.module('app', []);

// Service to fetch some data..
app.factory('fetcher', ['$http', ($http) => {
	return {
		get : (entity, username) => $http.get(`/analyze/${entity}/${username}`)
	}
}]);

// App controller
app.controller('appController', ['$scope', 'fetcher', ($scope, Data) => {
	$scope.loadData = function (entity, username) {
        Data.get(entity, username).success(resp => {
            $scope.output = JSON.stringify(resp, null, 2);
        });
    };
    
    $scope.inputEnter = function (event) {
        if (event.which === 13) {
            $scope.loadData('anime', $scope.usernameInput);
        }
    };
}]);

app.directive('inputReturned', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});
