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
  maskUpdate = 50,
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
            //三点座標を抽出
            const poses = segmentation.allPoses[0].keypoints
              .filter((pos) => ['nose', 'leftEye', 'rightEye'].includes(pos.part))
              .map(({ position }) => [
                position.x - segmentation.width / 2,
                position.y - segmentation.height / 2,
              ]);
            //中心の計算
            const center = poses
              .reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
              .map((v) => v / poses.length);

            //距離
            const length = Math.max(
              ...poses.map((pos) =>
                Math.sqrt(Math.pow(pos[0] - center[0], 2) + Math.pow(pos[1] - center[1], 2))
              )
            );
            bodyPix.drawMask(canvas, inputVideo, null);
            const context = canvas.getContext('2d')!;
            const px = segmentation.width / 2 + center[0];
            const py = segmentation.height / 2 + center[1];
            context.drawImage(
              canvas,
              Math.max(px - length * 5, 0),
              Math.max(py - length * 5, 0),
              length * 10,
              length * 10,
              0,
              0,
              length * 10,
              length * 10
            );

            // bodyPix.drawBokehEffect(
            //   canvas,
            //   inputVideo,
            //   segmentation,
            //   backgroundBlurAmount,
            //   edgeBlurAmount,
            //   flipHorizontal
            // );
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
