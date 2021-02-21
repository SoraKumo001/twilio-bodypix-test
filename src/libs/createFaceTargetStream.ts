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
  size?: number;
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

export const createFaceTargetStream = ({
  width,
  height,
  size = 256,
  fps,
  maskUpdate = 1,
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
          const canvas2 = document.createElement('canvas') as CanvasElement;
          canvas2.width = size;
          canvas2.height = size;

          inputVideo.width = settings.width;
          inputVideo.height = settings.height;
          let bodypixnet: bodyPix.BodyPix | null = await bodyPix.load(BodyPixParams);
          let segmentation = await bodypixnet.segmentPerson(inputVideo);
          const outputStream = canvas2.captureStream(0);
          const videoStream = outputStream.getVideoTracks()[0];
          let faceLength = 0;
          let faceCenter = [0, 0];
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
            if (segmentation.allPoses[0]) {
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
              //位置補正
              center[1] -= length * 0.6;
              faceCenter =
                !faceCenter[0] && !faceCenter[1]
                  ? center
                  : [
                      faceCenter[0] + (center[0] - faceCenter[0]) / 5,
                      faceCenter[1] + (center[1] - faceCenter[1]) / 5,
                    ];
              faceLength = faceLength === 0 ? length : faceLength + (length - faceLength) / 10;

              const context = canvas2.getContext('2d')!;
              const px = segmentation.width / 2 + faceCenter[0];
              const py = segmentation.height / 2 + faceCenter[1];
              const zoom = 4.3;
              const srcSize = faceLength * zoom * 2;
              const srcPos = [
                Math.max(px - faceLength * zoom, 0),
                Math.max(py - faceLength * zoom, 0),
              ];
              context.clearRect(0, 0, size, size);
              context.beginPath();
              context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, false);
              context.globalCompositeOperation = 'source-over';
              context.fill();
              context.globalCompositeOperation = 'source-in';
              context.drawImage(
                canvas,
                srcPos[0],
                srcPos[1],
                srcSize,
                srcSize,
                srcSize + srcPos[0] > canvas.width ? (srcSize + srcPos[0] - canvas.width) / 2 : 0,
                srcSize + srcPos[1] > canvas.height ? (srcSize + srcPos[1] - canvas.height) / 2 : 0,
                size,
                size
              );
            }
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
