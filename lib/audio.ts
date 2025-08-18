// A singleton AudioContext to be reused.
let audioContext: AudioContext | null = null;

// A cache for the decoded audio buffer to avoid re-decoding.
let whistleBuffer: AudioBuffer | null = null;

// Base64 encoded WAV data for the referee whistle sound.
const WHISTLE_SOUND_B64 = 'data:audio/wav;base64,UklGRqYSAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQSAADe/t7+yP7l/tj+yP7K/uX+7/7y/sj/wv7V/sz+x/7h/tD+uP6s/rr+wP68/sL+xf7P/uL96f30/ev+6/7y/vD/FwAZ/CH/7v3x/fX97f3x/vD/FwEwAR8A7v3r/dP9yf3D/r7+pP6I/n7+dv5U/lT+Xv5+/or+qf7B/sX+vf7P/tr+7v79/v8ABgAWAC8AOwA/ADgALwAcABEA/P7y/tj+wP6q/oX+ev5c/k3+T/5g/nH+if6r/rr+w/7L/uL+9v7+/gACAAwAEgAYAB0AHwAeABsAEwAJAPn+4v7I/qj+hP56/lj+Tf5K/k/+YP52/of+qP6//sn+5f73/v8AAwAJAAsADQAOAA4ACwAGAPz+7/7U/sL+qf6E/nf+WP5Q/k3+T/5X/m7+i/6q/rz+yv7m/vL+/v8HAAsADgASABUAEwASAA4ACgD6/uX+yP6w/p/+fP5d/lH+Tv5Q/lb+bf6I/qn+v/7L/uX+9f7+/gAJAA8AEwAZABsAGgAUAA4AAAD5/uH+x/6t/pX+fP5c/lP+UP5U/mf+h/6k/r3+yP7k/vH+/gALABEAFwAcABwAFwAQAAUA+f7j/sr+tf6U/n3+Xf5U/lH+U/5b/nb+if6p/rv+yf7l/vL+/wANABQAGgAfACEAIAAZABAABgD8/vL+3P7N/sH+rP6W/oH+d/5d/lP+UP5U/ln+df6I/qn+uv7I/uX+8v4AEQAYACEAJgAqACgAHwAVAAcA/f7y/tz+z/7C/q/+mP6B/nf+Xv5T/lL+U/5Z/nb+hv6n/rr+yP7m/vD/AhkAIwAoACwAKgAkABgADAD+/vH+3P7O/sT+rv6Y/oH+d/5e/lP+U/5S/lf+bP6H/qb+vP7J/uf+8v4DFgApADcAPAA9ADUAJwAaAAoA/v7x/tz+zv7F/q/+mP6A/nf+X/5V/lT+U/5Y/m/+hf6n/rz+yv7n/vL+Aw8AKgA4AD8AQgA+ACsADQD9/u/+3v7O/sX+rv6Z/oD+d/5h/lj+WP5b/nL+g/6f/q7+wP7O/uT+8f8JCy4AUwBfAGIAUgAlAPX+3f7P/sf+t/6d/or+hP6K/pn+s/7A/sn+6v7y/v/+AAQAGgA3AFIAZwBqAFwANgAcAPz+1/7J/rn+pP6O/oj+l/6w/sL+0P7z//sADgAyAF0AbgB0AHQAYwBDAP7+2f7K/rz+qf6U/pL+ov6v/sP+zv7n/vT+/v8CAAsAEwAdAB8AHQATAAUA9/7a/sz+wf6x/qb+ov6q/sL+zP7h/vT+/P8BAAIACgAMAA0ACwAIAAMACQAQABUAFwAUABAABQD+/vf+4/7K/rz+rf6f/pL+n/6q/rv+w/7M/uP+9f7+/wEABAAMABEAEwASABAACQAFAAQACwAQABEAEQAOAAgA+f7p/s/+wP6x/qH+nv6e/qL+qP67/sH+yv7k/vH+/v8AAQAEAAYACQALAAkABQADAAUACAAJAAsACwAJAAUAAAD7/uv+2P7M/sD+t/6g/p/+oP6n/rP+vP7E/sn+4/7x/v3/AAAAAQABAAMABQAFABAAEAAQAAYACAAHAAgACgALAAoACQAHAAcABgAGAAUAAwADAAQABgAHAAcACAAIAAkACQAKAAoACgAKAAkACQAIAAcABgAFAAIAAAABAAIAAwADAAIAAgABAAEAAQABAAIAAwADAAQABQAFABAAEAACAAIACQAKAAcABQAFAAYABgAGAAUABAADAAIABAAAAAAAAAAAAQAAAAEAAQABAAEAAQABAAEAAQACAAIAAgACAAIAAgABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

/**
 * Initializes the AudioContext if not already present, decodes the whistle
 * sound from Base64, and plays it. This function handles browser autoplay
 * policies by creating/resuming the AudioContext on user gesture.
 */
export async function playWhistleSound(): Promise<void> {
  try {
    // Create AudioContext on the first call. It must be initiated by a user gesture.
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Browsers may suspend the AudioContext after a period of inactivity.
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Decode the audio data if we haven't already and cache it.
    if (!whistleBuffer) {
      const response = await fetch(WHISTLE_SOUND_B64);
      const arrayBuffer = await response.arrayBuffer();
      whistleBuffer = await audioContext.decodeAudioData(arrayBuffer);
    }

    // Create a sound source, connect it to the speakers, and play the sound.
    if (audioContext && whistleBuffer) {
        const source = audioContext.createBufferSource();
        source.buffer = whistleBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
  } catch (error) {
    console.error('Failed to play whistle sound:', error);
    // Silently fail if there's an issue with audio playback.
  }
}
