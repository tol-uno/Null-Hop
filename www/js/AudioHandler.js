const AudioHandler = {

    
    init : function() {

        // FROM: https://github.com/apache/cordova-plugin-media/issues/182
        // Need to unescape if path have '%20' component
        var menuMusic_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/menuMusic.wav";
        var successAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/success.mp3";
        var jumpAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/jump.mp3";
        var splashAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/splash.mp3";

        // iOS need to remove file://
        // could use a for loop here. Just throw all the sounds into an array?
        if (device.platform.toLowerCase() == "ios") {
            menuMusic_path = menuMusic_path.replace("file://", "");
            successAudio_path = successAudio_path.replace("file://", "");
            jumpAudio_path = jumpAudio_path.replace("file://", "")
            splashAudio_path = splashAudio_path.replace("file://", "")
        }


        // setRate(1) in onSuccess callbacks to counter caching workaround which sets Rate(9999) to play the audio silently at the start of game.
        this.menuMusic = new Media(menuMusic_path, null, (error) => {console.log(error);});
        this.successAudio = new Media(successAudio_path, function(){AudioHandler.successAudio.setRate(1)}, (error) => {console.log(error);});
        this.jumpAudio = new Media (jumpAudio_path, function(){AudioHandler.jumpAudio.setRate(1)}, (error) => {console.log(error);})
        this.splashAudio = new Media (splashAudio_path, function(){AudioHandler.splashAudio.setRate(1)}, (error) => {console.log(error);})


        // PLAY ALL SOUNDS REALLY QUICKLY TO CACHE THEM
        this.jumpAudio.setRate(999)
        this.jumpAudio.play()

        this.successAudio.setRate(999)
        this.successAudio.play()

        this.splashAudio.setRate(999)
        this.splashAudio.play()
        
        // SET CORRECT VOLUMES
        this.setVolumes();
        this.menuMusic.play()
    },



    setVolumes : function() {

        this.menuMusic.setVolume(UserInterface.settings.volume);
        this.successAudio.setVolume(UserInterface.settings.volume);
        this.jumpAudio.setVolume(UserInterface.settings.volume);
        this.splashAudio.setVolume(UserInterface.settings.volume);
    },
}
