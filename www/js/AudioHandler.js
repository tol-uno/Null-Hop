const AudioHandler = {
    // REMOVE CORDOVA MEDIA PLUGIN IF THIS WORKS

    /* 
    new method
    use web audio to play sounds 
    use cordova file plugin to read mp3 data
    */

    init: function () {
        // let musicBuffer;

        const audioContext = new AudioContext();

        // get the audio element
        const audioElement = document.querySelector("audio"); // USE ID

        // pass it into the audio context
        const track = audioContext.createMediaElementSource(audioElement);

        this.gainNode = audioContext.createGain();

        track.connect(this.gainNode).connect(audioContext.destination);

        function playTrack() {
            // Check if context is in suspended state (autoplay policy)
            if (audioContext.state === "suspended") {
                audioContext.resume();
            }

            // Play
            audioElement.play();
        }

        this.setVolumes();

        playTrack();

        // const gainNode = audioContext.createGain();
        // gainNode.connect(audioContext.destination);
        // gainNode.gain.value = 0.5;
    },

    // Should unload() songs that arent needed -- only cache the one for current level

    loadAudioFromFilePlugin: function (audioContext, path, fileName, callback) {
        window.resolveLocalFileSystemURL(
            path,
            function (dirEntry) {
                dirEntry.getFile(
                    fileName,
                    { create: false },
                    function (fileEntry) {
                        fileEntry.file(
                            function (file) {
                                const reader = new FileReader();

                                reader.onloadend = function () {
                                    const arrayBuffer = reader.result;
                                    audioContext.decodeAudioData(
                                        arrayBuffer,
                                        function (buffer) {
                                            callback(null, buffer);
                                        },
                                        function (err) {
                                            callback(err, null);
                                        }
                                    );
                                };

                                reader.onerror = function (e) {
                                    callback(e, null);
                                };

                                reader.readAsArrayBuffer(file);
                            },
                            function (err) {
                                callback(err, null);
                            }
                        );
                    },
                    function (err) {
                        callback(err, null);
                    }
                );
            },
            function (err) {
                callback(err, null);
            }
        );
    },

    setVolumes: function () {
        this.gainNode.gain.value = UserInterface.settings.volume;
        // doesnt work with html audio only webaudio
        // Howler.volume(UserInterface.settings.volume)
        // this.song.volume(UserInterface.settings.volume)
        // this.jumpSoundHowler.volume(UserInterface.settings.volume)
        // this.successAudio.volume(UserInterface.settings.volume)
        // this.splashAudio.volume(UserInterface.settings.volume)
    },
};
