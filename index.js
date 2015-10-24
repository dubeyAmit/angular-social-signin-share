/*
    Angular Social SignIn and Social Sharing Module
    2015-10-24
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

! function(window, angular, undefined) {
  'use strict';

  var socialApp = angular.module('socialApp', []);

  socialApp.provider('$socialApp', function() {

    this.googlePlusClientID;
    this.facebookAppID;
    this.linkedInApiKey;

    //Set the Google Plus App Client ID
    this.setGooglePlusClientID = function(clientId) {
      this.googlePlusClientID = clientId;
    };

    //Set the Facebook App ID
    this.setFacebookAppID = function(appId) {
      this.facebookAppID = appId;
    };

    //Set the LinkedIn Api Key
    this.setLinkedInApiKey = function(apiKey) {
      this.linkedInApiKey = apiKey;
    };

    //Call init as soon as the above ID, Key is set
    this.init = function() {
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://apis.google.com/js/client:plusone.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'googlePlus-jssdk'));

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://platform.linkedin.com/in.js?async=true";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'linkedin-jssdk'));
    }


    this.$get = ['$window', '$q', function($window, $q) {
      var self = this;

      $window.fbAsyncInit = function() {
        FB.init({
          appId: self.facebookAppID,
          cookie: true,
          status: true,
          xfbml: true,
          version: 'v2.5'
        }, {
          scope: 'email'
        });

        IN.init({
          api_key: self.linkedInApiKey,
          authorize: true
        });
      };

      var getLinkedInApiKey = function(apiKey) {
        return self.linkedInApiKey;
      };

      var getGooglePlusClientID = function(clientId) {
        return self.googlePlusClientID;
      };

      var getFacebookAppID = function(appId) {
        return self.facebookAppID;
      };

      var facebookSignIn = function(callbackfn) {
        var deferred = $q.defer();
        FB.login(function(response) {
          if (response.error) deferred.reject(response.error);
          else deferred.resolve(response);
          callbackfn(response);
        }, {
          scope: 'email'
        });
      };

      var linkedinSignIn = function(callbackfn) {
        if (IN.User.isAuthorized()) {
          callbackfn();
        } else {
          IN.User.authorize(callbackfn);
        }
      };

      var googlePlusSignIn = function(callbackfn) {
        var defaults = {
          cookie_policy: 'single_host_origin',
          scope: 'https://www.googleapis.com/auth/userinfo.profile',
          height: 'standard',
          width: 'wide',
          state: '',
          immediate: false,
          client_id: self.googlePlusClientID + '.apps.googleusercontent.com'
        };

        gapi.auth.authorize(defaults, callbackfn);
      };

      var signOut = function() {
        if (gapi) {
          gapi.auth.signOut();
        }

        if (FB) {
          FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
              FB.logout(function(response) {
                //console.log("FB logged out");
              });
            }
          });
        }

        if (IN && IN.User.isAuthorized()) {
          IN.User.logout(function(response) {
            //console.log("LinkedIn logged out");
          });
        }

      };


      return {
        FacebookSignIn: facebookSignIn,
        LinkedInSignIn: linkedinSignIn,
        GooglePlusSignIn: googlePlusSignIn,
        SocialSignOut: signOut,
        GetGooglePlusClientId: getGooglePlusClientID,
        GetFacebookAppId: getFacebookAppID,
        GetLinkedInAppKey: getLinkedInApiKey
      };
    }];
  });

  socialApp.service('userService', [function() {
    var userData = {
      firstName: "",
      lastName: "",
      displayName: "",
      gender: "",
      avatarUrl: "",
      email: "",
      mobile: "",
      isGuest: true
    };

    //Set the LocalStorage with key and value
    var setToLocalStorage = function(key, obj) {
      try {
        localStorage.setItem(key, angular.toJson(obj));
      } catch (e) {
        console.log("Local Storge is not supported.Error : " + e);
      }
    };

    //Get the value from LocalStorage using key
    var getFromLocalStorage = function(key) {
      var retrievedItem = null;
      try {
        retrievedItem = angular.fromJson(localStorage.getItem(key));
      } catch (e) {
        console.log("Local Storge is not supported.Error : " + e);
      }

      return retrievedItem;
    };

    //Remove the Item from LocalStorage
    var removeFromLocalStorage = function(key) {
      localStorage.removeItem(key);
    };

    var userService = {
      getData: function() {
        return getFromLocalStorage('USER') || userData;
      },
      setData: function(userData) {
        //Set the Profile Data to Local Storage for persistence
        setToLocalStorage('USER', userData)
      },
      clearData: function() {
        removeFromLocalStorage('USER');
      },
      transformGooglePlusData: function(data) {
        //console.log("Google");
        //console.log(data);

        var resp = data.result;
        userData.firstName = resp.name.givenName;
        userData.lastName = resp.name.familyName;
        userData.displayName = resp.displayName;
        userData.gender = resp.gender;
        userData.avatarUrl = resp.image.url;
        userData.email = resp.emails[0].value;
        userData.mobile = "";
        userData.isGuest = false;

        this.setData(userData);
      },
      transformFacebookData: function(resp) {
        //console.log("Facebook");
        //console.log(resp);

        userData.firstName = resp.first_name;
        userData.lastName = resp.last_name;
        userData.displayName = userData.firstName + ' ' + userData.lastName;
        userData.gender = resp.gender;
        userData.avatarUrl = resp.picture.data.url;
        userData.email = resp.email;
        userData.mobile = "";
        userData.isGuest = false;

        this.setData(userData);
      },
      transformLinkedInData: function(data) {
        //console.log("LinkedIn");
        //console.log(data);

        var resp = data.values[0];
        userData.firstName = resp.firstName;
        userData.lastName = resp.lastName;
        userData.displayName = userData.firstName + ' ' + userData.lastName;
        userData.gender = resp.gender;
        userData.avatarUrl = resp.pictureUrls.url || "";
        userData.email = resp.emailAddress;
        userData.mobile = "";
        userData.isGuest = false;

        this.setData(userData);
      }
    };
    return userService;
  }]);

  //Directive for Social Sign - Google Plus, Facebook, LinkedIn
  socialApp.directive('angularSocialSignin', ['$socialApp', 'userService', function($socialApp, userService) {
    return {
      templateUrl: function(elem, attr) {
        //Configure the template Url in directive attribute
        return attr.template;
      },
      restrict: 'E',
      scope: {},
      controller: function($scope) {
        $scope.userData = userService.getData();

        var completeSignIn = function() {
          //Get the Profile Data and Bind to template
          $scope.userData = userService.getData();
        }

        $scope.gPlusSignIn = function() {
          $socialApp.GooglePlusSignIn(function(authResult) {
            if (authResult && !authResult.error) {
              gapi.client.load('plus', 'v1', function() {
                gapi.client.plus.people.get({
                  userId: 'me'
                }).then(function(resp) {
                  userService.transformGooglePlusData(resp);
                  completeSignIn();
                });
              });
            } else {
              console.log(authResult);
            }

          })
        };

        $scope.fbLogin = function() {
          $socialApp.FacebookSignIn(function(response) {
            if (response.status === 'connected') {
              FB.api('/me', {
                  fields: 'first_name, last_name, email, gender, age_range, picture'
                },
                function(resp) {
                  userService.transformFacebookData(resp);
                  completeSignIn();
                });
            } else {
              console.log(response.status);
            }
          })
        }

        $scope.linkedinLogin = function() {
          $socialApp.LinkedInSignIn(function(response) {
            IN.API.Profile("me")
              .fields('id', 'first-name', 'last-name', 'location', 'industry', 'headline', 'picture-urls::(original)', 'email-address')
              .result(function(resp) {
                userService.transformLinkedInData(resp);
                completeSignIn();
              })
              .error(function(err) {
                console.log(err);
              });
          })
        }

        //Common Sign Out for Google Plus, Facebook, LinkedIn
        $scope.socialLogOut = function() {
          $socialApp.SocialSignOut();
          userService.clearData();

          //console.log("Clear Local Storage");
        }

      }
    };
  }]);

  //Directive for Social Sharing - Google Plus, Facebook, Twitter
  socialApp.directive('angularSocialShare', ['$window', '$location', '$socialApp', function($window, $location, $socialApp) {
    return {
      templateUrl: function(elem, attr) {
        //Configure the template Url in directive attribute
        return attr.template;
      },
      restrict: 'E',
      scope: {},
      controller: function($scope, $element) {

        $scope.gplusShare = function() {
          var url = 'https://plus.google.com/share?url=';
          $scope.socialShare(url, "Google Plus Share");
        };

        $scope.fbShare = function() {
          var appId = $socialApp.GetFacebookAppId();
          var url = 'https://www.facebook.com/dialog/share?app_id=' + appId + '&display=popup&redirect_uri=https://www.facebook.com&href='
          $scope.socialShare(url, "Facebook Share");
        };

        $scope.twtShare = function() {
          var url = 'https://twitter.com/share?url=';
          $scope.socialShare(url, "LinkedIn Share");
        };

        $scope.socialShare = function(url, title) {
          var currentUrl = $location.absUrl();
          url = url + encodeURIComponent(currentUrl);
          var left = (screen.width / 2) - 200;
          var top = (screen.height / 2) - 250;
          return $window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=400, height=500, top=' + top + ', left=' + left);
        };
      }
    };
  }]);
}(window, window.angular);
