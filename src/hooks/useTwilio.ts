import { useState, useEffect } from 'react';
import { connect, RemoteAudioTrack, RemoteParticipant, RemoteVideoTrack } from 'twilio-video';

interface Props {
  token: string;
  roomName: string;
  stream: MediaStream;
}
export const useTwilio = ({ token, roomName, stream }: Props) => {
  const [remoteVideos, setRemoteVideos] = useState<(RemoteVideoTrack | RemoteAudioTrack)[]>([]);
  const addParticipant = (participant: RemoteParticipant) => {
    participant.on('trackSubscribed', (track, publication) => {
      console.log(publication);
      if (track.kind === 'video' || track.kind === 'audio') {
        setRemoteVideos((videos) => [...videos, track]);
      }
    });
    participant.on('trackUnsubscribed', (track) => {
      setRemoteVideos((remoteVideos) => remoteVideos.filter((video) => video !== track));
    });
  };

  useEffect(() => {
    if (!token || !roomName || !stream) return;
    console.log(stream.getTracks())
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
