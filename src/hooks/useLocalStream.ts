import { useEffect, useState } from 'react';
import { createBodyPixStream } from '../libs/createBodyPixStream';

const getDisplayMedia = (options?: { audio?: boolean; video?: boolean }) => {
  const promise = (navigator.mediaDevices as MediaDevices & {
    getDisplayMedia: (options?: { audio?: boolean; video?: boolean }) => Promise<MediaStream>;
  }).getDisplayMedia?.(options);
  if (promise) return promise;
  return new Promise<MediaStream>((_, reject) => reject);
};

export type StreamType = 'camera' | 'camera-blur' | 'screen';

interface Props {
  type: StreamType;
  width?: number;
  height?: number;
}

export const useLocalStream = ({ type, width, height }: Props) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    switch (type) {
      case 'camera':
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width,
              height,
            },
            audio: true,
          })
          .then(setStream)
          .catch(() => setStream(null));
        break;
      case 'screen':
        getDisplayMedia({ audio: false })
          .then(setStream)
          .catch(() => setStream(null));
        break;
      case 'camera-blur':
        createBodyPixStream({ width, height, audio: true })
          .then(setStream)
          .catch(() => setStream(null));
        break;
    }
    return () => {
      setStream((stream) => {
        if (stream) {
          stream.getTracks().forEach((track) => {
            stream.removeTrack(track);
            track.stop();
          });
          stream.dispatchEvent(new Event('stop'));
        }
        return null;
      });
    };
  }, [type]);

  return stream;
};
