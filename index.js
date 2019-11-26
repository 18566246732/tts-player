/**
 * this module is specializing in play and stop tts(text to speach)
 */
class TTS {
    constructor() {
      this.ttsArray = [];
      this.ttsChunkIndex = 0;
      this.ttsSampleRate = 8000;
      this.canReplay = true;
      this.ttsAudioContext = null;
  
      // cache current playing tts array, so we can stop them when needed
      this.currentSourceArray = [];
    }
    /**
     * for ios compatibility, init audio context, this function should be called in in a use ineraction callback like `onclick`
     */
    init({ ttsSampleRate }) {
      this.ttsSampleRate = ttsSampleRate;
  
      const AudioContent = window.AudioContext || window.webkitAudioContext;
      this.ttsAudioContext = new AudioContent();
  
      // play a empty sound to create a warm start
      const oscillator = this.ttsAudioContext.createOscillator();
      oscillator.frequency.value = 400;
      oscillator.connect(this.ttsAudioContext.destination);
      oscillator.start(0);
      oscillator.stop(0);
    }
    /**
     * cache tts
     * @param {String} rawTTS raw tts after base64
     * @param {String} sentenceIndex the index of a group of tts chunk, represent a single text
     */
    async add(rawTTS, sentenceIndex) {
      const ttsChunkIndex = this.ttsChunkIndex++;
      const TTS = this.decodeTTS(rawTTS);
      await this.ttsAudioContext.decodeAudioData(TTS, buffer => {
        const ttsItem = {
          id: sentenceIndex,
          buffer,
          playTime: 0,
          ttsChunkIndex
        };
        this.ttsArray.push(ttsItem);
        /**
         * sort when tts pushed into ttsArray, because decode might be async
         * fix: wrong order when tts play
         */
        this.sortTTSArray(this.ttsArray);
      });
    }
    decodeTTS(rawTTS) {
      const TTSBodyBuf = this.base64ToArrayBuffer(rawTTS);
      const headerOption = {
        numFrames: TTSBodyBuf.byteLength
      };
      const TTSHeaderBuf = this.buildWaveHeader(headerOption);
      const ttsBuf = this.concatenate(TTSHeaderBuf, TTSBodyBuf);
      return ttsBuf;
    }
    sortTTSArray(ttsArray) {
      ttsArray = ttsArray.sort(this.sortTTSChunk);
      ttsArray.forEach((chunk, index) => {
        chunk.playTime = this.getTTSPlayTime(chunk.id, chunk.ttsChunkIndex);
      });
    }
    /**
     * play 1 text's tts chunks
     * @param {String} sentenceIndex index of text to be played
     * @returns {Number} the duration when play this text
     */
    play1Sentence(sentenceIndex) {
      // defensive code
      if (!this.ttsAudioContext || !this.ttsAudioContext.state || this.ttsAudioContext.state === 'closed') return;
  
      const currentTTSChunks = this.ttsArray.filter(
        tts => Number(tts.id) === sentenceIndex
      );
      const lastcurrentTTSChunk = currentTTSChunks[currentTTSChunks.length - 1];
  
      // defensive code
      if (!(lastcurrentTTSChunk && Object.keys(lastcurrentTTSChunk).includes('playTime'))) {
        return false;
      }
  
      const playTTSDuration = lastcurrentTTSChunk.playTime + lastcurrentTTSChunk.buffer.duration;
  
      // 防止重复播放
      if (!this.canReplay) return false;
      this.canReplay = false;
      setTimeout(() => {
        this.canReplay = true;
      }, playTTSDuration * 1000);
  
      // reset source array
      this.currentSourceArray = [];
  
      currentTTSChunks.forEach(tts => {
        this.play(this.ttsAudioContext, tts);
      });
      return playTTSDuration;
    }
    // play a tts piece
    play(ttsAudioContext, tts) {
      try {
        // Create a source node from the buffer
        const source = ttsAudioContext.createBufferSource();
        const gainNode = ttsAudioContext.createGain();
        source.buffer = tts.buffer;
  
        this.currentSourceArray.push(source);
  
        gainNode.gain.setTargetAtTime(0.1, ttsAudioContext.currentTime + 2, 5);
        source.connect(gainNode);
        gainNode.connect(ttsAudioContext.destination);
        source.start(tts.playTime + ttsAudioContext.currentTime); // 这里必须要加上currentTime
      } catch (error) {
        console.log('error when create source', error);
      }
    }
    stop() {
      this.canReplay = true;
  
      // fix: https://stackoverflow.com/questions/53100047/why-state-can-be-invalid-in-web-audio-in-safari-after-resume
      try {
        this.currentSourceArray.forEach(source => source.stop());
      } catch (error) {
        console.log('error in currentSourceArray', error);
      }
    }
    sortTTSChunk(prevTTSChunk, nextTTSChunk) {
      return prevTTSChunk.ttsChunkIndex - nextTTSChunk.ttsChunkIndex;
    }
    base64ToArrayBuffer(base64, unit8buffer) {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return unit8buffer ? bytes : bytes.buffer;
    }
    getTTSPlayTime(sentenceIndex, ttsChunkIndex) {
      let playTime = 0;
      const currentTTSChucks = this.ttsArray.filter(tts => tts.id === sentenceIndex) || [];
      currentTTSChucks
        .filter(chunk => chunk.ttsChunkIndex < ttsChunkIndex)
        .map(chunk => {
          playTime += chunk.buffer.duration;
          return chunk;
        });
      return playTime;
    }
    buildWaveHeader(opts) {
      const numFrames = opts.numFrames;
      const numChannels = opts.numChannels || 1;
      const sampleRate = opts.sampleRate || this.ttsSampleRate || 16000; // 采样率16000
      const bytesPerSample = opts.bytesPerSample || 2; // 位深2个字节
      const blockAlign = numChannels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = numFrames * blockAlign;
  
      const buffer = new ArrayBuffer(44);
      const dv = new DataView(buffer);
  
      let p = 0;
  
      p = this.writeString('RIFF', dv, p); // ChunkID
      p = this.writeUint32(dataSize + 36, dv, p); // ChunkSize
      p = this.writeString('WAVE', dv, p); // Format
      p = this.writeString('fmt ', dv, p); // Subchunk1ID
      p = this.writeUint32(16, dv, p); // Subchunk1Size
      p = this.writeUint16(1, dv, p); // AudioFormat
      p = this.writeUint16(numChannels, dv, p); // NumChannels
      p = this.writeUint32(sampleRate, dv, p); // SampleRate
      p = this.writeUint32(byteRate, dv, p); // ByteRate
      p = this.writeUint16(blockAlign, dv, p); // BlockAlign
      p = this.writeUint16(bytesPerSample * 8, dv, p); // BitsPerSample
      p = this.writeString('data', dv, p); // Subchunk2ID
      p = this.writeUint32(dataSize, dv, p); // Subchunk2Size
  
      return buffer;
    }
    concatenate(buffer1, buffer2) {
      const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
      tmp.set(new Uint8Array(buffer1), 0);
      tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
      return tmp.buffer;
    }
    writeString(s, dv, p) {
      for (let i = 0; i < s.length; i++) {
        dv.setUint8(p + i, s.charCodeAt(i));
      }
      p += s.length;
      return p;
    }
    writeUint32(d, dv, p) {
      dv.setUint32(p, d, true);
      p += 4;
      return p;
    }
    writeUint16(d, dv, p) {
      dv.setUint16(p, d, true);
      p += 2;
      return p;
    }
  }
  
  export default TTS;