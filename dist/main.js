!function(t){var e={};function r(n){if(e[n])return e[n].exports;var i=e[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)r.d(n,i,function(e){return t[e]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=0)}([function(t,e,r){"use strict";r.r(e);e.default=class{constructor(t){this.ttsArray=[],this.ttsChunkIndex=0,this.ttsSampleRate=8e3,this.canReplay=!0,this.ttsAudioContext=null,this.currentSourceArray=[]}init({ttsSampleRate:t}){this.ttsSampleRate=t;const e=window.AudioContext||window.webkitAudioContext;this.ttsAudioContext=new e;const r=this.ttsAudioContext.createOscillator();r.frequency.value=400,r.connect(this.ttsAudioContext.destination),r.start(0),r.stop(0)}async add(t,e){const r=this.ttsChunkIndex++,n=this.decodeTTS(t);await this.ttsAudioContext.decodeAudioData(n,t=>{const n={id:e,buffer:t,playTime:0,ttsChunkIndex:r};this.ttsArray.push(n),this.sortTTSArray(this.ttsArray)})}decodeTTS(t){const e=this.base64ToArrayBuffer(t),r={numFrames:e.byteLength},n=this.buildWaveHeader(r);return this.concatenate(n,e)}sortTTSArray(t){(t=t.sort(this.sortTTSChunk)).forEach((t,e)=>{t.playTime=this.getTTSPlayTime(t.id,t.ttsChunkIndex)})}play1Sentence(t){if(!this.ttsAudioContext||!this.ttsAudioContext.state||"closed"===this.ttsAudioContext.state)return;const e=this.ttsArray.filter(e=>Number(e.id)===t),r=e[e.length-1];if(!r||!Object.keys(r).includes("playTime"))return!1;const n=r.playTime+r.buffer.duration;return!!this.canReplay&&(this.canReplay=!1,setTimeout(()=>{this.canReplay=!0},1e3*n),this.currentSourceArray=[],e.forEach(t=>{this.play(this.ttsAudioContext,t)}),n)}play(t,e){try{const r=t.createBufferSource(),n=t.createGain();r.buffer=e.buffer,this.currentSourceArray.push(r),n.gain.setTargetAtTime(.1,t.currentTime+2,5),r.connect(n),n.connect(t.destination),r.start(e.playTime+t.currentTime)}catch(t){console.log("error when create source",t)}}stop(){this.canReplay=!0;try{this.currentSourceArray.forEach(t=>t.stop())}catch(t){console.log("error in currentSourceArray",t)}}sortTTSChunk(t,e){return t.ttsChunkIndex-e.ttsChunkIndex}base64ToArrayBuffer(t,e){const r=window.atob(t),n=r.length,i=new Uint8Array(n);for(let t=0;t<n;t++)i[t]=r.charCodeAt(t);return e?i:i.buffer}getTTSPlayTime(t,e){let r=0;return(this.ttsArray.filter(e=>e.id===t)||[]).filter(t=>t.ttsChunkIndex<e).map(t=>(r+=t.buffer.duration,t)),r}buildWaveHeader(t){const e=t.numFrames,r=t.numChannels||1,n=t.sampleRate||this.ttsSampleRate||16e3,i=t.bytesPerSample||2,s=r*i,o=n*s,a=e*s,u=new ArrayBuffer(44),c=new DataView(u);let h=0;return h=this.writeString("RIFF",c,h),h=this.writeUint32(a+36,c,h),h=this.writeString("WAVE",c,h),h=this.writeString("fmt ",c,h),h=this.writeUint32(16,c,h),h=this.writeUint16(1,c,h),h=this.writeUint16(r,c,h),h=this.writeUint32(n,c,h),h=this.writeUint32(o,c,h),h=this.writeUint16(s,c,h),h=this.writeUint16(8*i,c,h),h=this.writeString("data",c,h),h=this.writeUint32(a,c,h),u}concatenate(t,e){const r=new Uint8Array(t.byteLength+e.byteLength);return r.set(new Uint8Array(t),0),r.set(new Uint8Array(e),t.byteLength),r.buffer}writeString(t,e,r){for(let n=0;n<t.length;n++)e.setUint8(r+n,t.charCodeAt(n));return r+=t.length}writeUint32(t,e,r){return e.setUint32(r,t,!0),r+=4}writeUint16(t,e,r){return e.setUint16(r,t,!0),r+=2}}}]);