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
  fps = 15,
  maskUpdate = 500,
  backgroundBlurAmount = 5,
  edgeBlurAmount = 3,
  flipHorizontal = true,
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
      .then((stream) => {
        const canvas = document.createElement('canvas') as CanvasElement;
        canvas.width = width;
        canvas.height = height;
        const inputVideo = document.createElement('video');
        inputVideo.width = width;
        inputVideo.height = height;
        inputVideo.autoplay = true;
        inputVideo.srcObject = stream;
        let time = performance.now();
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
            requestAnimationFrame(render);
          };
          render();
          resolve(canvas.captureStream(fps));
        };
      });
  });
};
