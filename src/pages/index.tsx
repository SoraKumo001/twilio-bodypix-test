import React, { useEffect, useState } from 'react';
import { connect, LocalVideoTrack, RemoteParticipant, VideoTrack } from 'twilio-video';
import { createBodyPixStream } from '../libs/createBodyPixStream';
import { getRoomToken } from '../libs/getRoomToken';

const RoomName = 'Test';

if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('name')) {
  sessionStorage.setItem('name', new Date().toUTCString());
}

const getDisplayMedia = (options?: { audio?: boolean; video?: boolean }) => {
  return (navigator.mediaDevices as MediaDevices & {
    getDisplayMedia: () => Promise<MediaStream>;
  }).getDisplayMedia();
};

const Page = () => {
  const [localVideo, setLocalVideo] = useState<VideoTrack>(null);
  const [remoteVideos, setRemoteVideos] = useState<VideoTrack[]>([]);
  useEffect(() => {
    const addParticipant = (participant: RemoteParticipant) => {
      participant.on('trackSubscribed', (track) => {
        console.log('trackSubscribed', track);
        if ('attach' in track) {
          setRemoteVideos((videos) => [...videos, track as VideoTrack]);
        }
      });
      participant.on('trackUnsubscribed', (track) => {
        console.log('trackUnsubscribed', track);
        if ('detach' in track)
          setRemoteVideos((remoteVideos) => remoteVideos.filter((video) => video !== track));
      });
    };

    getRoomToken(RoomName, sessionStorage.getItem('name')).then((token) => {
      let track: LocalVideoTrack;
      createBodyPixStream({ width: 640, height: 480 }).then((tracks) => {
        //getDisplayMedia({ audio: false, video: true }).then((tracks) => {
        track = new LocalVideoTrack(tracks.getTracks()[0]);
        setLocalVideo(track);
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
      <div className="videoList">
        {localVideo && (
          <video
            autoPlay
            ref={(video) =>
              video && (video.srcObject = new MediaStream([localVideo.mediaStreamTrack]))
            }
          />
        )}
      </div>
      <div className="videoList">
        {remoteVideos.map((track) => (
          <video
            key={track.name}
            autoPlay
            ref={(video) => video && (video.srcObject = new MediaStream([track.mediaStreamTrack]))}
          />
        ))}
      </div>
    </>
  );
};

export default Page;
