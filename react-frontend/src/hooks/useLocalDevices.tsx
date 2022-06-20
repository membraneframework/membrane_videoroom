import { useState, useEffect } from "react";
import { useEffectOnce } from "usehooks-ts";
import {
  AUDIO_TRACK_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
} from "../room/consts";

type Streams = {
  audio?: MediaStream;
  video?: MediaStream;
  initialized: boolean;
};

export const LOCAL_STREAMS: Streams = {
  initialized: false,
};

export function useLocalDevices() {
  const [initialized, setInitialized] = useState(LOCAL_STREAMS.initialized);

  const setAudioEnabled = (enabled: boolean) => {
    if (LOCAL_STREAMS.audio)
      LOCAL_STREAMS.audio
        .getTracks()
        .forEach((track) => (track.enabled = enabled));
  };

  const setVideoEnabled = (enabled: boolean) => {
    if (LOCAL_STREAMS.video)
      LOCAL_STREAMS.video
        .getTracks()
        .forEach((track) => (track.enabled = enabled));
  };

  useEffect(() => {
    if (!LOCAL_STREAMS.initialized) {
      LOCAL_STREAMS.initialized = true;
      getDevices()
        .then(({ localAudioStream, localVideoStream }) => {
          LOCAL_STREAMS.audio = localAudioStream;
          LOCAL_STREAMS.video = localVideoStream;
        })
        .then(() => {
          setInitialized(true);
        })
        .catch((error) => console.log(error));
    }
  }, [initialized]);

  return {
    setAudioEnabled,
    setVideoEnabled,
    initialized,
  };
}

async function getDevices() {
  var localAudioStream, localVideoStream;

  const hasVideoInput: boolean = (
    await navigator.mediaDevices.enumerateDevices()
  ).some((device) => device.kind === "videoinput");

  // Ask user for permissions if required
  await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: hasVideoInput,
  });

  // Refresh mediaDevices list after ensuring permissions are granted
  // Before that, enumerateDevices() call would not return deviceIds
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = mediaDevices.filter(
    (device) => device.kind === "videoinput"
  );

  for (const device of videoDevices) {
    const constraints = {
      video: {
        ...VIDEO_TRACK_CONSTRAINTS,
        deviceId: { exact: device.deviceId },
      },
    };

    try {
      localVideoStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error("Error while getting local video stream", error);
    }
  }

  try {
    localAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_TRACK_CONSTRAINTS,
    });
  } catch (error) {
    console.error("Error while getting local audio stream", error);
  }

  return { localAudioStream, localVideoStream };
}
