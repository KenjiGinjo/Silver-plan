"use client";
import React, { useRef } from "react";
import Hls from "hls.js";
type AudioPlayerProps = {
  audio: string;
};
function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: any,
  fsSource: any
) {
  const vertexShader = loadShader(
    gl,
    gl.VERTEX_SHADER,
    vsSource
  ) as WebGLShader;
  const fragmentShader = loadShader(
    gl,
    gl.FRAGMENT_SHADER,
    fsSource
  ) as WebGLShader;

  const shaderProgram = gl.createProgram() as WebGLProgram;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: any) {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
function updateBuffers(
  gl: WebGLRenderingContext,
  programInfo: any,
  audioData: any
) {
  const lineThickness = 0.001; // Adjust this value as needed

  const vertices = [];
  for (let i = 0; i < audioData.length - 1; i++) {
    const x1 = -1 + (2 * i) / audioData.length;
    const y1 = audioData[i] / 128.0 - 1;
    const x2 = -1 + (2 * (i + 1)) / audioData.length;
    const y2 = audioData[i + 1] / 128.0 - 1;

    // Calculate normal direction for this segment
    const dx = x2 - x1;
    const dy = y2 - y1;
    const nx = dy;
    const ny = -dx;

    // Normalize the normal direction
    const len = Math.sqrt(nx * nx + ny * ny);
    const nnx = nx / len;
    const nny = ny / len;

    // Use the normal to create vertices for the two triangles
    vertices.push(x1 - nnx * lineThickness, y1 - nny * lineThickness);
    vertices.push(x1 + nnx * lineThickness, y1 + nny * lineThickness);
    vertices.push(x2 - nnx * lineThickness, y2 - nny * lineThickness);
    vertices.push(x2 + nnx * lineThickness, y2 + nny * lineThickness);
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    vertexCount: vertices.length / 2,
  };
}
function drawScene(gl: WebGLRenderingContext, programInfo: any, buffers: any) {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  gl.useProgram(programInfo.program);
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // gl.lineWidth(5); // 例如，设置线条宽度为5
  // gl.drawArrays(gl.LINE_STRIP, 0, buffers.vertexCount);

  for (let i = 0; i < buffers.vertexCount - 2; i += 2) {
    gl.drawArrays(gl.TRIANGLE_STRIP, i, 4);
  }
}
export const AudioPlayer = ({ audio }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  return (
    <div style={{ background: "red" }}>
      <div
        onClick={() => {
          if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(audio);
            hls.attachMedia(audioRef.current as HTMLAudioElement);
            hls.on(Hls.Events.MANIFEST_PARSED, async function () {
              await audioRef.current?.play();
              const canvas = canvasRef.current;
              if (!canvas) return;

              canvas.width = window.innerWidth;
              canvas.height = 200;

              const gl = canvas.getContext("webgl") as WebGLRenderingContext;
              const vsSource = `attribute vec4 aVertexPosition;
                void main(void) {
                  gl_Position = aVertexPosition;
                }
              `;
              const fsSource = `precision mediump float;
                void main(void) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
              `;

              const shaderProgram = initShaderProgram(
                gl,
                vsSource,
                fsSource
              ) as WebGLProgram;

              const programInfo = {
                program: shaderProgram,
                attribLocations: {
                  vertexPosition: gl.getAttribLocation(
                    shaderProgram,
                    "aVertexPosition"
                  ),
                },
              };

              const audioContext = new AudioContext();
              const sourceNode = audioContext.createMediaElementSource(
                audioRef.current as HTMLAudioElement
              );
              const analyserNode = audioContext.createAnalyser();
              sourceNode.connect(analyserNode);
              analyserNode.connect(audioContext.destination);
              console.log(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
              function animate() {
                requestAnimationFrame(animate);
                const audioData = new Uint8Array(
                  analyserNode.frequencyBinCount
                );
                analyserNode.getByteTimeDomainData(audioData);
                const buffers = updateBuffers(gl, programInfo, audioData);

                drawScene(gl, programInfo, buffers);
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
