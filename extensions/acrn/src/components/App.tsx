import { useState, useEffect } from "react";
import { ActionPanel, List, showToast, Toast } from "@raycast/api";
import * as constants from "../constants";
import * as Tone from "tone";

export function App() {
  const [freq, setFreq] = useState<number>(constants.DEFAULT_FREQ);
  const [volume, setVolume] = useState<number>(constants.DEFAULT_VOLUME);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // const [playState, setPlayState] = useState<number>(constants.PLAYER_STATES.PLAY_TONE);
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
  const [osc, setOsc] = useState<Tone.Oscillator | null>(null);
  // const [sequence, setSequence] = useState<Tone.Sequence | null>(null);

  useEffect(() => {
    // Initialize Tone.js synth and oscillator
    const synthInstance = new Tone.PolySynth(Tone.Synth).toDestination();
    const volumeNode = new Tone.Volume(volume).toDestination();
    synthInstance.connect(volumeNode);
    setSynth(synthInstance);

    const oscInstance = new Tone.Oscillator(freq, "sine").connect(volumeNode);
    setOsc(oscInstance);

    Tone.getContext().latencyHint = "interactive";

    // Clean up on unmount
    return () => {
      synthInstance.dispose();
      volumeNode.dispose();
    };
  }, []);

  useEffect(() => {
    if (osc) {
      osc.frequency.value = freq;
    }
  }, [freq]);

  useEffect(() => {
    if (synth) {
      synth.volume.value = volume;
    }
  }, [volume]);

  const handleFreqChange = (value: number) => {
    setFreq(value);
    localStorage.setItem(constants.FREQ_KEY, value.toString());
  };

  const handlePlayToggle = async () => {
    if (!isPlaying) {
      await Tone.start();
      Tone.getTransport().start();
      setIsPlaying(true);
      showToast(Toast.Style.Success, "Playing tone");
    } else {
      Tone.getTransport().stop();
      setIsPlaying(false);
      showToast(Toast.Style.Success, "Stopped tone");
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // localStorage.setItem(constants.VOLUME_KEY, newVolume.toString());
  };

  const handleRadioChange = (newPlayState: number) => {
    setPlayState(newPlayState);
    // localStorage.setItem(constants.PLAYER_STATE_KEY, newPlayState.toString());
  };

  return (
    <List>
      <List.Section title="Tone Generator">
        <List.Item
          title={`Frequency: ${freq} Hz`}
          actions={
            <ActionPanel>
              <ActionPanel.Item
                title="Increase Frequency"
                onAction={() => handleFreqChange(Math.min(freq + 100, constants.MAX_FREQ))}
              />
              <ActionPanel.Item
                title="Decrease Frequency"
                onAction={() => handleFreqChange(Math.max(freq - 100, constants.MIN_FREQ))}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title={`Volume: ${volume} dB`}
          actions={
            <ActionPanel>
              <ActionPanel.Item title="Increase Volume" onAction={() => handleVolumeChange(Math.min(volume + 1, 0))} />
              <ActionPanel.Item
                title="Decrease Volume"
                onAction={() => handleVolumeChange(Math.max(volume - 1, -80))}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title={isPlaying ? "Stop Tone" : "Play Tone"}
          actions={
            <ActionPanel>
              <ActionPanel.Item title="Toggle Play" onAction={handlePlayToggle} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Play Mode"
          actions={
            <ActionPanel>
              <ActionPanel.Item title="Tone" onAction={() => handleRadioChange(constants.PLAYER_STATES.PLAY_TONE)} />
              <ActionPanel.Item
                title="Sequence"
                onAction={() => handleRadioChange(constants.PLAYER_STATES.PLAY_ACRN)}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

function generateSequence(freq: number) {
  const sequence = [];
  for (let i = 0; i < constants.LOOP_REPEAT; i++) {
    sequence.push(...[freq, freq, freq, freq]);
  }
  for (let i = 0; i < constants.REST_LENGTH + 1; i++) {
    sequence.push(freq);
  }
  return sequence;
}
