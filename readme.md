# tts player

## description

a fast, simple, and cross-platform solution for play tts

## Installation
```bash
npm i tts-player
yarn add tts-player
```

## usage

1. init tts, for ios compatibility, please call `tts.init()` on a user interaction callback like `onclick`, normally, the `ttsSampleRate` is 8000 or 16000
```js
import TTS from 'tts-player';
const tts = new TTS();

tts.init({
    ttsSampleRate: 8000
});

```

2. cache tts chunks, the ttsChunk **must be pcm buffer which encoded with base64**, normally, we get ttsChunk from other server, and in most cases, the ttsChunk is base64 encode for transportation comfortability

```js
// the caching may take a while before it's ready to play
const ws = new WebSocket();
ws.onmessage = (data) => {
    if (typeof data === 'string') {
        const { ttsChunk, textId } = JSON.parse(data);
        tts.add(ttsChunk, textId);
    }
}
```

3. play 1 sentence, the return value should be a duration if tts is ready

```js
const playTTSDuration = tts.play1Sentence(textId);
if (!playTTSDuration) throw new Error('tts is not ready !');
console.log(playTTSDuration); // 3.2
```

4. stop play 1 sentence
```js
tts.stop();
```