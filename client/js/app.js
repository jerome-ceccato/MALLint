// App
const app = angular.module('app', []);

// Service to fetch some data..
app.factory('dataServ', ['$http',($http) => {
	return {
		get : () => $http.get('/analyze/anime/iatgof-test')
	}
}]);

// App controller
app.controller('appController', ['$scope','dataServ', ($scope, Data) => {
	Data.get().success(resp => {
			$scope.funnyStuff = resp;
		});
}]);