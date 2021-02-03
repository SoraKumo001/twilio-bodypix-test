import { useState, useEffect } from 'react';
import { connect, RemoteParticipant, RemoteTrack, VideoTrack } from 'twilio-video';

interface Props {
  token: string;
  roomName: string;
  stream: MediaStream;
}
export const useTwilio = ({ token, roomName, stream }: Props) => {
  const [remoteVideos, setRemoteVideos] = useState<RemoteTrack[]>([]);
  const addParticipant = (participant: RemoteParticipant) => {
    participant.on('trackSubscribed', (track) => {
      setRemoteVideos((videos) => [...videos, track]);
    });
    participant.on('trackUnsubscribed', (track) => {
      setRemoteVideos((remoteVideos) => remoteVideos.filter((video) => video !== track));
    });
  };

  useEffect(() => {
    if (!token || !roomName || !stream) return;
    connect(token, {
      audio: true,
      name: roomName,
      tracks: stream.getTracks(),
    }).then((room) => {
      console.log(`Connected to Room: ${room.name}`);
      room.participants.forEach(addParticipant);
      room.on('participantConnected', addParticipant);
    });
  }, [token, roomName, stream]);

  return remoteVideos;
};
