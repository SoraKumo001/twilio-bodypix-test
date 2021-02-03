import '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { ModelConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

declare interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

interface Props {
  width?: number;
  height?: number;
  fps?: number;
  maskUpdate?: number;
  backgroundBlurAmount?: number;
  edgeBlurAmount?: number;
  flipHorizontal?: boolean;
  audio?: boolean;
}

const BodyPixParams: ModelConfig = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 2,
};

export const createBodyPixStream = ({
  width = 640,
  height = 480,
  fps = 30,
  maskUpdate = 500,
  backgroundBlurAmount = 5,
  edgeBlurAmount = 3,
  flipHorizontal = false,
  audio = true,
}: Props): Promise<MediaStream> => {
  return new Promise((resolve) => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width,
          height,
        },
        audio: false,
      })
      .then(async (videoStream) => {
        if (!audio) return [videoStream, null];
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        return [videoStream, audioStream];
      })
      .then(([stream, audio]) => {
        const canvas = document.createElement('canvas') as CanvasElement;
        canvas.width = width;
        canvas.height = height;
        const inputVideo = document.createElement('video');
        inputVideo.width = width;
        inputVideo.height = height;
        inputVideo.autoplay = true;
        inputVideo.srcObject = stream;
        let time = performance.now();
        let animationNumber: number;
        inputVideo.onloadedmetadata = async () => {
          const bodypixnet = await bodyPix.load(BodyPixParams);
          let segmentation = await bodypixnet.segmentPerson(inputVideo);
          const render = async () => {
            const now = performance.now();
            if (now - time > maskUpdate) {
              time = now;
              segmentation = await bodypixnet.segmentPerson(inputVideo);
            }
            bodyPix.drawBokehEffect(
              canvas,
              inputVideo,
              segmentation,
              backgroundBlurAmount,
              edgeBlurAmount,
              flipHorizontal
            );
            animationNumber = requestAnimationFrame(render);
          };
          render();
          const outputStream = canvas.captureStream(fps);
          audio?.getAudioTracks().forEach((track) => outputStream.addTrack(track));
          outputStream.addEventListener('stop', () => {
            cancelAnimationFrame(animationNumber);
            bodypixnet.dispose();
          });
          resolve(outputStream);
        };
      });
  });
};
