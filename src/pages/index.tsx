import React, { useCallback, useMemo, useState } from 'react';
import { LocalVideoTrack } from 'twilio-video';
import { useTwilioToken } from '../hooks/useTwillioToken';
import { useTwilio } from './../hooks/useTwilio';
import { StreamType, useLocalStream } from '../hooks/useLocalStream';
import { createSessionName } from '../libs/createSessionName';
import styles from './index.module.css';

const RoomName = 'Test';
const SessionName = createSessionName();

const Page = () => {
  const [streamType, setStreamType] = useState<StreamType>('camera-blur');
  const token = useTwilioToken({ roomName: RoomName, sessionName: SessionName });
  const stream = useLocalStream({ type: streamType });
  const remoteVideos = useTwilio({ token, stream, roomName: RoomName });
  const localVideo = useMemo(
    () =>
      stream
        ? new LocalVideoTrack(stream.getTracks().find((track) => track.kind === 'video'))
        : null,
    [stream]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamType(e.target.value as StreamType);
  }, []);
  return (
    <>
      <form>
        {[
          ['camera', 'Camera'],
          ['camera-blur', 'Camera(Blur)'],
          ['screen', 'Screen'],
        ].map(([name, label]) => (
          <label key={name}>
            <input
              type="radio"
              name="type"
              value={name}
              onChange={handleChange}
              defaultChecked={streamType === name}
            />
            {label}
          </label>
        ))}
      </form>
      <div className={styles.videoList}>
        <div className={styles.message}>Local</div>
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
      <div className={styles.videoList}>
        <div className={styles.message}>Remote</div>
        {remoteVideos.map((track) =>
          track.kind === 'video' ? (
            <video
              width={640}
              height={480}
              key={track.name}
              autoPlay
              ref={(video) =>
                video && (video.srcObject = new MediaStream([track.mediaStreamTrack]))
              }
            />
          ) : (
            <audio
              key={track.name}
              autoPlay
              ref={(video) =>
                video && (video.srcObject = new MediaStream([track.mediaStreamTrack]))
              }
            />
          )
        )}
      </div>
    </>
  );
};

export default Page;
