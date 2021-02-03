import React, { useEffect, useState } from 'react';
import { connect, LocalVideoTrack, RemoteParticipant } from 'twilio-video';
import { createBodyPixStream } from '../libs/createBodyPixStream';
import { getRoomToken } from '../libs/getRoomToken';

const RoomName = 'Test';

if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('name')) {
  sessionStorage.setItem('name', new Date().toUTCString());
}

const Page = () => {
  const [localVideo, setLocalVideo] = useState<HTMLVideoElement>(null);
  const [remoteVideos, setRemoteVideos] = useState<HTMLMediaElement[]>([]);
  useEffect(() => {
    const addParticipant = (participant: RemoteParticipant) => {
      participant.on('trackSubscribed', (track) => {
        console.log('trackSubscribed', track);
        if ('attach' in track) {
          setRemoteVideos((videos) => [...videos, track.attach()]);
        }
      });
      participant.on('trackUnsubscribed', (track) => {
        console.log('trackUnsubscribed', track);
        if ('detach' in track)
          track.detach().forEach((element) => {
            setRemoteVideos((remoteVideos) => remoteVideos.filter((video) => video !== element));
            element.remove();
          });
      });
    };

    getRoomToken(RoomName, sessionStorage.getItem('name')).then((token) => {
      let track: LocalVideoTrack;
      createBodyPixStream({ width: 640, height: 480 }).then((tracks) => {
        track = new LocalVideoTrack(tracks.getTracks()[0]);
        setLocalVideo(track.attach());
        connect(token, {
          audio: true,
          name: RoomName,
          tracks: tracks.getVideoTracks(),
        }).then((room) => {
          console.log(`Connected to Room: ${room.name}`);
          room.participants.forEach(addParticipant);
          room.on('participantConnected', addParticipant);
        });
      });
    });
  }, []);
  return (
    <>
      <style jsx>{`
        .videoList {
          border: solid 1px black;
          box-sizing: content-box;
        }
      `}</style>
      <div className="videoList">{localVideo}</div>
      <div className="videoList">{remoteVideos}</div>
    </>
  );
};

export default Page;
