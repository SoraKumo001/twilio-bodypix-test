import React, { useCallback, useState } from 'react';
import { useTwilioToken } from '../hooks/useTwillioToken';
import { useTwilioRoom } from '../hooks/useTwilioRoom';
import { StreamType, useLocalStream } from '../hooks/useLocalStream';
import { createSessionName } from '../libs/createSessionName';
import styles from './index.module.css';

const RoomName = 'Test';
const SessionName = createSessionName();

const Page = () => {
  const [streamType, setStreamType] = useState<StreamType>('camera-blur');
  const token = useTwilioToken({ roomName: RoomName, sessionName: SessionName });
  const stream = useLocalStream({ type: streamType });
  const { remoteStream, state, error } = useTwilioRoom({
    token,
    stream,
    roomName: RoomName,
  });
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
        {stream && (
          <video
            width={640}
            height={480}
            autoPlay
            ref={(video) => video && (video.srcObject = stream)}
          />
        )}
      </div>
      <div className={styles.videoList}>
        <div className={styles.message}>
          <div>Remote</div>
          {state === 'disconnected' && <div>未接続</div>}
          {state === 'connecting' && <div>接続中</div>}
          {error && <div>接続エラー</div>}
        </div>
        {remoteStream.map((media) => (
          <video
            width={640}
            height={480}
            key={media.id}
            autoPlay
            ref={(video) => video && (video.srcObject = media)}
          />
        ))}
      </div>
    </>
  );
};

export default Page;
