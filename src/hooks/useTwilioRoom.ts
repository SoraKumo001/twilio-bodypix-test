import { useState, useEffect } from 'react';
import { connect, RemoteParticipant, Room } from 'twilio-video';

type TwilioRoomState = 'connecting' | 'connected' | 'disconnected';

interface Props {
  token: string;
  roomName: string;
  stream: MediaStream;
}
export const useTwilioRoom = ({ token, roomName, stream }: Props) => {
  const [error, setError] = useState(null);
  const [state, setState] = useState<TwilioRoomState>('disconnected');
  const [remoteStream, setRemoteStream] = useState<MediaStream[]>([]);
  const addParticipant = (participant: RemoteParticipant) => {
    const media = new MediaStream();
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
    if (!token || !roomName || !stream) return;
    let room: Room;
    const listener = () => {
      if (room) {
        console.log('beforeunload');
        room.disconnect();
        room = null;
      }
    };
    setState('connecting');
    connect(token, {
      audio: true,
      name: roomName,
      tracks: stream.getTracks(),
    })
      .then((room) => {
        setState('connected');
        room.participants.forEach(addParticipant);
        room.on('participantConnected', addParticipant);
        room.on('disconnected', () => {
          setState('disconnected');
          setRemoteStream([]);
        });
        addEventListener('beforeunload', listener);
      })
      .catch((e) => {
        setState('disconnected');
        setError(e);
      });
    return () => {
      if (room) {
        room.disconnect();
        room = null;
      }
      removeEventListener('beforeunload', listener);
    };
  }, [token, roomName, stream]);

  return { error, remoteStream, state };
};
