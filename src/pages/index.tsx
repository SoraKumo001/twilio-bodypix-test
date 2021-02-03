import React, { useEffect, useState } from 'react';
import { LocalVideoTrack, VideoTrack } from 'twilio-video';
import { useTwilioToken } from '../hooks/useTwillioToken';
import { useTwilio } from './../hooks/useTwilio';
import { StreamType, useLocalStream } from '../hooks/useLocalStream';

const RoomName = 'Test';

if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('name')) {
  sessionStorage.setItem('name', new Date().toUTCString());
}

const Page = () => {
  const [streamType, setStreamType] = useState<StreamType>('camera-blur');
  const [localVideo, setLocalVideo] = useState<VideoTrack>(null);
  const token = useTwilioToken({ roomName: RoomName });
  const stream = useLocalStream({ type: streamType });
  const remoteVideos = useTwilio({ token, stream, roomName: RoomName });
  useEffect(() => {
    if (!stream) return;
    const track = new LocalVideoTrack(stream.getTracks().find((track) => track.kind === 'video'));
    setLocalVideo(track);
  }, [stream]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamType(e.target.value as StreamType);
  };
  return (
    <>
      <style jsx>{`
        .videoList {
          border: solid 1px black;
          box-sizing: content-box;
        }
      `}</style>
      <form>
        <label>
          <input
            type="radio"
            name="type"
            value="camera-blur"
            onChange={handleChange}
            defaultChecked={true}
          />
          Camera(ブラー)
        </label>
        <label>
          <input type="radio" name="type" value="camera" onChange={handleChange} />
          Camera
        </label>
        <label>
          <input type="radio" name="type" value="screen" onChange={handleChange} />
          Screen
        </label>
      </form>
      <div className="videoList">
        <div>Local</div>
        {localVideo && (
          <video
            width={640}
            height={480}
            autoPlay
            ref={(video) =>
              video && (video.srcObject = new MediaStream([localVideo.mediaStreamTrack]))
            }
          />
        )}
      </div>
      <div className="videoList">
        <div>Remote</div>
        {remoteVideos.map((track) => (
          <video
            width={640}
            height={480}
            key={track.name}
            autoPlay
            ref={(video) =>
              video && (video.srcObject = new MediaStream([(track as VideoTrack).mediaStreamTrack]))
            }
          />
        ))}
      </div>
    </>
  );
};

export default Page;
