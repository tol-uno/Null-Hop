const AudioHandler = {


    init: function () {

        // FROM: https://github.com/apache/cordova-plugin-media/issues/182
        // Need to unescape if path have '%20' component

        var surfacing_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/surfacing.mp3";
        var successAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/success.mp3";
        var jump1Audio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/jump1.mp3";
        var jump2Audio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/jump2.mp3";
        var jump3Audio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/jump3.mp3";
        var splashAudio_path = decodeURI(cordova.file.applicationDirectory) + "www/assets/audio/splash.mp3";

        // iOS need to remove file://
        // could use a for loop here. Just throw all the sounds into an array?
        if (device.platform.toLowerCase() == "ios") {
            surfacing_path = surfacing_path.replace("file://", "");
            successAudio_path = successAudio_path.replace("file://", "");
            jump1Audio_path = jump1Audio_path.replace("file://", "")
            jump2Audio_path = jump2Audio_path.replace("file://", "")
            jump3Audio_path = jump3Audio_path.replace("file://", "")
            splashAudio_path = splashAudio_path.replace("file://", "")
        }


        // Media(src, mediaSuccess, mediaError, mediaStatus, mediaDurationUpdate); mediaDurationUpdate is called when duration information becomes available and passes duration
        this.surfacing = new Media(surfacing_path, null, (error) => { console.log(error); });

        this.jump1Audio = new Media(jump1Audio_path, null, (error) => { console.log(error) })
        this.jump2Audio = new Media(jump2Audio_path, null, (error) => { console.log(error) })
        this.jump3Audio = new Media(jump3Audio_path, null, (error) => { console.log(error) })
        this.successAudio = new Media(successAudio_path, null, (error) => { console.log(error) });
        this.splashAudio = new Media(splashAudio_path, null, (error) => { console.log(error) })


        // ONLY JUMP SOUNDS SEEM TO NEED TO BE CACHED RIGHT NOW..
        // NOT SURE WHY. THE OTHER SOUNDS ARE PLAYING WITHOUT LAG

        cacheSound(this.jump1Audio)
        cacheSound(this.jump2Audio)
        cacheSound(this.jump3Audio)

        function cacheSound(mediaObj) {
            mediaObj.play();

            setTimeout(() => {
                mediaObj.stop();
            }, 490); // stop after 500ms (the silent portion)
        }


        // SET CORRECT VOLUMES
        // FIX THIS: Needs to be called once all sounds are available
        this.setVolumes();
        
        // start music
        this.playSound(this.surfacing)


        // #######################################
        // HOWLER SETUP TESTING
        // #######################################

        const sound = new Howl({
            src: ["assets/audio/surfacing.mp3"],
            autoplay: true,
            loop: true,
            volume: 1,
            html5: true,
        });
        
        sound.play()
        
        this.jumpSoundHowler = new Howl({
            src: ["assets/audio/JumpSFX.mp3"],
            html5: true,
        });




    },


    playSound: function (mediaObj, skipSilence) {
        if (UserInterface.settings.volume > 0){
            if (skipSilence) { mediaObj.seekTo(500) }
            mediaObj.play()
        }
    },


    setVolumes: function () {
        this.surfacing.setVolume(UserInterface.settings.volume);
        this.successAudio.setVolume(UserInterface.settings.volume);
        this.jump1Audio.setVolume(UserInterface.settings.volume);
        this.jump2Audio.setVolume(UserInterface.settings.volume);
        this.jump3Audio.setVolume(UserInterface.settings.volume);
        this.splashAudio.setVolume(UserInterface.settings.volume);
    },
}
