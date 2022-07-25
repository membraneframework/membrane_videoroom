import {
  AUDIO_TRACK_CONSTRAINTS,
  LOCAL_PEER_ID,
  SCREENSHARING_MEDIA_CONSTRAINTS,
  VIDEO_TRACK_CONSTRAINTS,
} from "./consts";
import {
  MembraneWebRTC,
  Peer,
  SerializedMediaEvent,
  TrackContext,
} from "@membraneframework/membrane-webrtc-js";
import { Push, Socket } from "phoenix";
import {
  addVideoElement,
  attachScreensharing,
  attachStream,
  detachScreensharing,
  getRoomId,
  removeVideoElement,
  setErrorMessage,
  setParticipantsList,
  setupControls,
  toggleScreensharing,
} from "./room_ui";

import { parse } from "query-string";

export class Room {
  private peers: Peer[] = [];
  private tracks: Map<string, TrackContext[]> = new Map();
  private displayName: string;
  private localAudioStream: MediaStream | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private localVideoStream: MediaStream | null = null;
  private localVideoTrackId: string | null = null;
  private localScreensharing: MediaStream | null = null;
  private localScreensharingTrackId: string | null = null;

  private webrtc: MembraneWebRTC;

  private socket;
  private webrtcSocketRefs: string[] = [];
  private webrtcChannel;

  constructor() {
    this.socket = new Socket("/socket");
    this.socket.connect();
    this.displayName = this.parseUrl();
    this.webrtcChannel = this.socket.channel(`room:${getRoomId()}`);
    this.webrtcChannel.onError(() => {
      this.socketOff();
      window.location.reload();
    });
    this.webrtcChannel.onClose(() => {
      this.socketOff();
      window.location.reload();
    });

    this.webrtcSocketRefs.push(this.socket.onError(this.leave));
    this.webrtcSocketRefs.push(this.socket.onClose(this.leave));

    this.webrtc = new MembraneWebRTC({
      callbacks: {
        onSendMediaEvent: (mediaEvent: SerializedMediaEvent) => {
          this.webrtcChannel.push("mediaEvent", { data: mediaEvent });
        },
        onConnectionError: setErrorMessage,
        onJoinSuccess: (_peerId, peersInRoom) => {
          this.localAudioStream
            ?.getTracks()
            .forEach((track) =>
              this.webrtc.addTrack(track, this.localAudioStream!, {})
            );

          this.localVideoStream?.getTracks().forEach((track) => {
            this.localVideoTrackId = this.webrtc.addTrack(
              track,
              this.localVideoStream!,
              {},
              { enabled: false },
              1200
            );
          });

          this.peers = peersInRoom;
          this.peers.forEach((peer) => {
            addVideoElement(peer.id, peer.metadata.displayName, false);
            this.tracks.set(peer.id, []);
          });
          this.updateParticipantsList();
          if ("wakeLock" in navigator) {
            // Acquire wakeLock on join
            navigator.wakeLock.request("screen").then((wakeLock) => {
              this.wakeLock = wakeLock;
            });

            // Reacquire wakeLock when after the document is visible again (e.g. user went back to the tab)
            document.addEventListener(
              "visibilitychange",
              this.onVisibilityChange
            );
          }
        },
        onJoinError: (_metadata) => {
          throw `Peer denied.`;
        },
        onTrackReady: (ctx) => {
          if (ctx.metadata && ctx.metadata.type === "screensharing") {
            attachScreensharing(
              ctx.peer.id,
              `(${ctx.peer.metadata.displayName}) Screen`,
              ctx.stream!
            );
          } else {
            attachStream(ctx.peer.id, {
              audioStream: ctx.stream,
              videoStream: ctx.stream,
            });
          }
          this.tracks.get(ctx.peer.id)?.push(ctx);
        },
        onTrackAdded: (_ctx) => {},
        onTrackRemoved: (ctx) => {
          if (ctx.metadata.type === "screensharing") {
            detachScreensharing(ctx.peer.id);
          }
          let newPeerTracks = this.tracks
            .get(ctx.peer.id)
            ?.filter((track) => track.trackId !== ctx.trackId)!;
          this.tracks.set(ctx.peer.id, newPeerTracks);
        },
        onPeerJoined: (peer) => {
          this.peers.push(peer);
          this.tracks.set(peer.id, []);
          this.updateParticipantsList();
          addVideoElement(peer.id, peer.metadata.displayName, false);
        },
        onPeerLeft: (peer) => {
          this.peers = this.peers.filter((p) => p.id !== peer.id);
          this.tracks.delete(peer.id);
          removeVideoElement(peer.id);
          this.updateParticipantsList();
        },
        onPeerUpdated: (_ctx) => {},
      },
    });

    this.webrtcChannel.on("mediaEvent", (event: any) =>
      this.webrtc.receiveMediaEvent(event.data)
    );
  }

  public init = async () => {
    await this.askForPermissions();

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
        this.localVideoStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        break;
      } catch (error) {
        console.error("Error while getting local video stream", error);
      }
    }

    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_TRACK_CONSTRAINTS,
      });
    } catch (error) {
      console.error("Error while getting local audio stream", error);
    }

    addVideoElement(LOCAL_PEER_ID, "Me", true);

    attachStream(LOCAL_PEER_ID, {
      audioStream: this.localAudioStream,
      videoStream: this.localVideoStream,
    });

    await this.phoenixChannelPushResult(this.webrtcChannel.join());
  };

  public join = () => {
    const onScreensharingEnd = async () => {
      if (!this.localScreensharing) return;

      this.localScreensharing.getTracks().forEach((track) => track.stop());
      this.localScreensharing = null;

      this.webrtc.removeTrack(this.localScreensharingTrackId!);
      detachScreensharing(LOCAL_PEER_ID);
    };

    const onScreensharingStart = async () => {
      if (this.localScreensharing) return;

      this.localScreensharing = await navigator.mediaDevices.getDisplayMedia(
        SCREENSHARING_MEDIA_CONSTRAINTS
      );

      this.localScreensharingTrackId = this.webrtc.addTrack(
        this.localScreensharing.getVideoTracks()[0],
        this.localScreensharing,
        { type: "screensharing" }
      );

      // listen for screensharing stop via browser controls instead of ui buttons
      this.localScreensharing.getVideoTracks().forEach((track) => {
        track.onended = () => {
          toggleScreensharing(null, onScreensharingEnd)();
        };
      });

      attachScreensharing(
        LOCAL_PEER_ID,
        "(Me) Screen",
        this.localScreensharing
      );
    };

    const callbacks = {
      onLeave: this.leave,
      onScreensharingStart,
      onScreensharingEnd,
    };

    setupControls(
      {
        audioStream: this.localAudioStream,
        videoStream: this.localVideoStream,
      },
      callbacks
    );

    this.webrtc.join({ displayName: this.displayName });
  };

  private onVisibilityChange = async () => {
    if (this.wakeLock !== null && document.visibilityState === "visible") {
      this.wakeLock = await navigator.wakeLock.request("screen");
    }
  };

  private leave = () => {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.wakeLock && this.wakeLock.release();
    this.wakeLock = null;
    this.webrtc.leave();
    this.webrtcChannel.leave();
    this.socketOff();
  };

  private socketOff = () => {
    this.socket.off(this.webrtcSocketRefs);
    while (this.webrtcSocketRefs.length > 0) {
      this.webrtcSocketRefs.pop();
    }
  };

  private parseUrl = (): string => {
    const { display_name: displayName } = parse(document.location.search);

    // remove query params without reloading the page
    window.history.replaceState(null, "", window.location.pathname);

    return displayName as string;
  };

  private updateParticipantsList = (): void => {
    const participantsNames = this.peers.map((p) => p.metadata.displayName);

    if (this.displayName) {
      participantsNames.push(this.displayName);
    }

    setParticipantsList(participantsNames);
  };

  private askForPermissions = async (): Promise<void> => {
    const hasVideoInput: boolean = (
      await navigator.mediaDevices.enumerateDevices()
    ).some((device) => device.kind === "videoinput");

    let tmpVideoStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: hasVideoInput,
    });

    // stop tracks
    // in other case, next call to getUserMedia may fail
    // or won't respect media constraints
    tmpVideoStream.getTracks().forEach((track) => track.stop());
  };

  private phoenixChannelPushResult = async (push: Push): Promise<any> => {
    return new Promise((resolve, reject) => {
      push
        .receive("ok", (response: any) => resolve(response))
        .receive("error", (response: any) => reject(response));
    });
  };
}
