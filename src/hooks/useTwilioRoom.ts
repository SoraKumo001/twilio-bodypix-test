import { useState, useEffect } from 'react';
import { connect, LocalAudioTrack, LocalVideoTrack, RemoteParticipant, Room } from 'twilio-video';

type TwilioRoomState = 'connecting' | 'connected' | 'disconnected';
type ParticipantMediaStream = MediaStream & { participant: RemoteParticipant };
interface Props {
  token: string | null;
  roomName: string | null;
  stream: MediaStream | null;
}

export const useTwilioRoom = ({ token, roomName, stream }: Props) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState(null);
  const [state, setState] = useState<TwilioRoomState>('disconnected');
  const [remoteStream, setRemoteStream] = useState<ParticipantMediaStream[]>([]);
  const addParticipant = (participant: RemoteParticipant) => {
    const media = new MediaStream() as ParticipantMediaStream;
    media.participant = participant;
    setRemoteStream((medias) => [...medias, media]);
    participant.on('trackSubscribed', (track) => {
      if (track.kind === 'video' || track.kind === 'audio') media.addTrack(track.mediaStreamTrack);
    });
    participant.on('trackUnsubscribed', (track) => {
      if (track.kind === 'video' || track.kind === 'audio')
        media.removeTrack(track.mediaStreamTrack);
    });
    participant.on('disconnected', () => {
      setRemoteStream((mediaList) => mediaList.filter((m) => m !== media));
    });
  };
  useEffect(() => {
    setError(null);
    if (
      !token ||
      !roomName ||
      !stream ||
      (room && room.name === roomName) ||
      state === 'connecting'
    )
      return;
    if (room) {
      room.disconnect(); //
      return;
    }
    setState('connecting');
    connect(token, {
      audio: true,
      name: roomName,
      tracks: stream.getTracks(),
    })
      .then((room) => {
        setRoom(room);
        setState('connected');
        room.participants.forEach(addParticipant);
        room.addListener('participantConnected', addParticipant);
        room.on('disconnected', () => {
          const tracks = Array.from(room.localParticipant.tracks.values()).map((t) => t.track);
          room.localParticipant.unpublishTracks(tracks);
          setRoom(null);
          setState('disconnected');
          setRemoteStream([]);
        });
      })
      .catch((e) => {
        setState('disconnected');
        setError(e);
      });
  }, [token, roomName, stream, state]);
  useEffect(() => {
    if (room && stream) {
      const tracks = Array.from(room.localParticipant.tracks.values()).map(
        (t) => t.track as LocalAudioTrack | LocalVideoTrack
      );
      const removeTracks = tracks.filter(
        (track) => !stream.getTracks().includes(track.mediaStreamTrack)
      );
      const addTracks = stream
        .getTracks()
        .filter((track) => !tracks.map((track) => track.mediaStreamTrack).includes(track));
      room.localParticipant.unpublishTracks(removeTracks);
      room.localParticipant.publishTracks(addTracks);
    }
  }, [room, stream]);
  useEffect(() => {
    addEventListener('beforeunload', () => {
      room?.disconnect();
    });
    return () => {
      room?.disconnect();
    };
  }, []);
  return { error, remoteStream, state, room };
};
