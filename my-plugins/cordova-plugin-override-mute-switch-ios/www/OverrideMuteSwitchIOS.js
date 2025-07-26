/*
TO UNISTAL AND INSTALL FROM LOCAL (NON NPM):
cordova plugin remove cordova-plugin-override-mute-switch-ios
cordova plugin add ./my-plugins/cordova-plugin-override-mute-switch-ios
*/

// var exec = require("cordova/exec");

// exports.overrideMuteSwitch = function (success, error) {
//     exec(success, error, "OverrideMuteSwitchIOS", "overrideMuteSwitch", []);
// };

const OverrideMuteSwitchIOS = {
    overrideMuteSwitch: function() {
        return new Promise((resolve, reject) => {
            cordova.exec(resolve, reject, "OverrideMuteSwitchIOS", "overrideMuteSwitch", []);
        });
    },
    playTestSound: function() {
        return new Promise((resolve, reject) => {
            cordova.exec(resolve, reject, "OverrideMuteSwitchIOS", "playTestSound", []);
        });
    }
};

module.exports = OverrideMuteSwitchIOS;


