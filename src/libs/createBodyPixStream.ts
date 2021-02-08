import '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { ModelConfig } from '@tensorflow-models/body-pix/dist/body_pix_model';

interface CanvasCaptureMediaStreamTrack extends MediaStreamTrack {
  requestFrame(): void;
}
interface CanvasMediaStream extends MediaStream {
  getAudioTracks(): CanvasCaptureMediaStreamTrack[];
  getTrackById(trackId: string): CanvasCaptureMediaStreamTrack | null;
  getTracks(): CanvasCaptureMediaStreamTrack[];
  getVideoTracks(): CanvasCaptureMediaStreamTrack[];
}
interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): CanvasMediaStream;
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
  width,
  height,
  fps,
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
          frameRate: fps,
        },
        audio,
      })
      .then((video) => {
        const inputVideo = document.createElement('video');
        inputVideo.autoplay = true;
        inputVideo.srcObject = new MediaStream(video.getVideoTracks());
        let time = performance.now();
        let animationNumber = 0;
        inputVideo.onloadedmetadata = async () => {
          const settings = video.getVideoTracks()[0].getSettings() as Required<MediaTrackSettings>;
          const canvas = document.createElement('canvas') as CanvasElement;
          canvas.width = settings.width;
          canvas.height = settings.height;
          inputVideo.width = settings.width;
          inputVideo.height = settings.height;
          let bodypixnet: bodyPix.BodyPix | null = await bodyPix.load(BodyPixParams);
          let segmentation = await bodypixnet.segmentPerson(inputVideo);
          const outputStream = canvas.captureStream(0);
          const videoStream = outputStream.getVideoTracks()[0];
          const render = async () => {
            if (!bodypixnet) return;
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
            videoStream.requestFrame();
            animationNumber = requestAnimationFrame(render);
          };
          render();

          if (audio) video.getAudioTracks().forEach((track) => outputStream.addTrack(track));
          const handleStop = () => {
            animationNumber && cancelAnimationFrame(animationNumber);
            outputStream.getTracks().forEach((track) => {
              track.stop();
              outputStream.removeTrack(track);
            });
            outputStream.removeEventListener('stop', handleStop);
            bodypixnet?.dispose();
            bodypixnet = null;
          };
          outputStream.addEventListener('stop', handleStop);
          resolve(outputStream);
        };
      });
  });
};
