"use client";
import React, { useRef } from "react";
import Hls from "hls.js";
type AudioPlayerProps = {
  audio: string;
};
export const AudioPlayerCanvas = ({ audio }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  return (
    <div>
      <div
        onClick={() => {
          if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(audio);
            hls.attachMedia(audioRef.current as HTMLAudioElement);
            hls.on(Hls.Events.MANIFEST_PARSED, async function () {
              await audioRef.current?.play();

              const audioContext = new AudioContext();
              const sourceNode = audioContext.createMediaElementSource(
                audioRef.current as HTMLAudioElement
              );
              const analyserNode = audioContext.createAnalyser();

              sourceNode.connect(analyserNode);
              analyserNode.connect(audioContext.destination);

              const canvasContext = canvasRef.current.getContext("2d");
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = 200; // 可以根据需要调整高度

              function animate() {
                requestAnimationFrame(animate);
                const dataArray = new Uint8Array(
                  analyserNode.frequencyBinCount
                );
                analyserNode.getByteTimeDomainData(dataArray);
                // 在这里，使用dataArray来渲染你的波形动画
                console.log(dataArray);
                canvasContext.fillStyle = "rgb(255, 255, 255)";
                canvasContext.fillRect(
                  0,
                  0,
                  canvasRef.current.width,
                  canvasRef.current.height
                );

                canvasContext.lineWidth = 2;
                canvasContext.strokeStyle = "rgb(0, 0, 0)";
                canvasContext.beginPath();

                let sliceWidth =
                  (canvasRef.current.width * 1.0) /
                  analyserNode.frequencyBinCount;
                let x = 0;

                for (let i = 0; i < analyserNode.frequencyBinCount; i++) {
                  let v = dataArray[i] / 128.0; // 将值映射到0到1
                  let y = (v * canvasRef.current.height) / 2; // 计算波形在画布上的位置

                  if (i === 0) {
                    canvasContext.moveTo(x, y);
                  } else {
                    canvasContext.lineTo(x, y);
                  }

                  x += sliceWidth;
                }

                canvasContext.lineTo(
                  canvasRef.current.width,
                  canvasRef.current.height / 2
                );
                canvasContext.stroke();
              }
              animate();
            });
          }
        }}
      >
        开始播放
      </div>
      <audio ref={audioRef} src={audio}></audio>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};
