const AudioHandler = {

    /* 
    use cordova file plugin to read mp3 data
    use web audio to play sounds
    */

    init: function () {
        this.audioContext = new AudioContext();

        // Fallback incase browser supsends audio intil user input
        if (this.audioContext.state === "suspended") {
            const resume = () => {
                this.audioContext.resume();
            };
            document.body.addEventListener("touchend", resume, { once: true });
        }

        this.gainNode = this.audioContext.createGain();

        this.createBuffers();
    },

    createBuffers: async function () {
        // also plays menu music for testing

        this.JumpSFXBuffer = await this.getAudioBuffer("JumpSFX.mp3");
        this.splashBuffer = await this.getAudioBuffer("splash.mp3");
        this.successBuffer = await this.getAudioBuffer("success.mp3");

        // await this.playLoopedMusic("600hz.mp3");
        await this.playLoopedMusic("surfacing.mp3");
    },

    getAudioBuffer: async function (fileName) {
        const arrayBuffer = await readFile("local", "assets/audio/", fileName, "arraybuffer");
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    },

    playAudio: function (audioBuffer, options = {}) {
        // options: {loop: true, volume: 0.5}
        const bufferSource = this.audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.loop = options.loop || false;

        // Optional per-sound volume (default to 1.0 = full volume)
        const individualGainNode = this.audioContext.createGain();
        individualGainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;

        // Connect: source -> individual gain -> global gain -> destination
        bufferSource
            .connect(individualGainNode)
            .connect(this.gainNode)
            .connect(this.audioContext.destination);

        // bufferSource.start(options.when || 0); // allows for "when" param
        bufferSource.start();

        return bufferSource;
    },

    playLoopedMusic: async function (fileName) {
        // Stop and clean up any currently playing music
        if (this.currentMusicSource) {
            this.currentMusicSource.stop();
            this.currentMusicSource.disconnect();
            this.currentMusicSource = null;
        }

        // Load and decode audio file
        const musicBuffer = await this.getAudioBuffer(fileName);

        // Play the new music loop
        this.currentMusicSource = this.playAudio(musicBuffer, { loop: true });
    },

    setVolume: async function (value) {
        // const gainNode = this.gainNode || (await this.gainNodeIsReadyPromise);
        // gainNode.gain.value = value;
        this.gainNode.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.1);
    },
};
