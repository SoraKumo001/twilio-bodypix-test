import { useEffect, useState } from 'react';
import { createBodyPixStream } from '../libs/createBodyPixStream';

const getDisplayMedia = (options?: { audio?: boolean; video?: boolean }) => {
  return (navigator.mediaDevices as MediaDevices & {
    getDisplayMedia: (options?: { audio?: boolean; video?: boolean }) => Promise<MediaStream>;
  }).getDisplayMedia(options);
};

export type StreamType = 'camera' | 'camera-blur' | 'screen';

interface Props {
  type: StreamType;
  width?: number;
  height?: number;
}

export const useLocalStream = ({ type, width = 640, height = 480 }: Props) => {
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
          .then(setStream);
        break;
      case 'screen':
        getDisplayMedia({ audio: false }).then(setStream);
        break;
      case 'camera-blur':
        createBodyPixStream({ width, height, audio: true }).then(setStream);
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
