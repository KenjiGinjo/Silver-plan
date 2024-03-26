"use client";
import React, { useEffect, useRef } from "react";
import Hls from "hls.js";
type AudioPlayerProps = {
  audio: string;
};
export const AudioPlayer = ({ audio }: AudioPlayerProps) => {
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
              const canvas = canvasRef.current;
              if (!canvas) return;
              const gl = canvas.getContext("webgl");
              if (!gl) {
                console.error(
                  "Unable to initialize WebGL. Your browser may not support it."
                );
                return;
              }
              console.log(gl);
              // Vertex shader program
              const vsSource = `
                attribute vec4 aVertexPosition;
                void main(void) {
                  gl_Position = aVertexPosition;
                }
              `;

              // Fragment shader program
              const fsSource = `
                precision mediump float;
                void main(void) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
              `;

              // Initialize a shader program; this is where all the lighting
              // for the vertices and so forth is established.
              const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
              console.log(shaderProgram);
              const programInfo = {
                program: shaderProgram,
                attribLocations: {
                  vertexPosition: gl.getAttribLocation(
                    shaderProgram,
                    "aVertexPosition"
                  ),
                },
              };
              console.log(programInfo);

              // Here we'll hold all the data necessary to draw the waveform
              let buffers;

              // Function to initialize shaders
              function initShaderProgram(
                gl: any,
                vsSource: any,
                fsSource: any
              ) {
                const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
                const fragmentShader = loadShader(
                  gl,
                  gl.FRAGMENT_SHADER,
                  fsSource
                );

                // Create the shader program
                const shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertexShader);
                gl.attachShader(shaderProgram, fragmentShader);
                gl.linkProgram(shaderProgram);

                // If creating the shader program failed, alert
                if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                  alert(
                    "Unable to initialize the shader program: " +
                      gl.getProgramInfoLog(shaderProgram)
                  );
                  return null;
                }

                return shaderProgram;
              }
              // Function to create a shader of a given type, uploads the source and
              // compiles it.
              function loadShader(gl: any, type: any, source: any) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);

                // See if it compiled successfully
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                  alert(
                    "An error occurred compiling the shaders: " +
                      gl.getShaderInfoLog(shader)
                  );
                  gl.deleteShader(shader);
                  return null;
                }

                return shader;
              }

              // Function to create and update buffers with audio data
              function updateBuffers(
                gl: any,
                programInfo: any,
                audioData: any
              ) {
                const vertices = [];
                for (let i = 0; i < audioData.length; i++) {
                  const x = -1 + (2 * i) / audioData.length;
                  const y = audioData[i] / 128.0 - 1; // Mapping from 0-255 to -1 to 1
                  vertices.push(x, y);
                }

                const positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(
                  gl.ARRAY_BUFFER,
                  new Float32Array(vertices),
                  gl.STATIC_DRAW
                );

                return {
                  position: positionBuffer,
                };
              }
              // Function to draw the scene
              function drawScene(gl: any, programInfo: any, buffers: any) {
                console.log(buffers.position);
                gl.clearColor(1.0, 1.0, 1.0, 1.0); // Clear to white, fully opaque
                gl.clearDepth(1.0); // Clear everything
                gl.enable(gl.DEPTH_TEST); // Enable depth testing
                gl.depthFunc(gl.LEQUAL); // Near things obscure far things

                // Clear the canvas before we start drawing on it.
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                // Tell WebGL how to pull out the positions from the position
                // buffer into the vertexPosition attribute.
                {
                  const numComponents = 2; // pull out 2 values per iteration
                  const type = gl.FLOAT; // the data in the buffer is 32bit floats
                  const normalize = false; // don't normalize
                  const stride = 0; // how many bytes to get from one set of values to the next
                  // 0 = use type and numComponents above
                  const offset = 0; // how many bytes inside the buffer to start from
                  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                  gl.vertexAttribPointer(
                    programInfo.attribLocations.vertexPosition,
                    numComponents,
                    type,
                    normalize,
                    stride,
                    offset
                  );
                  gl.enableVertexAttribArray(
                    programInfo.attribLocations.vertexPosition
                  );
                }

                // Tell WebGL to use our program when drawing
                gl.useProgram(programInfo.program);

                {
                  const offset = 0;
                  const vertexCount = buffers.position.length / 2;
                  gl.drawArrays(gl.LINE_STRIP, offset, vertexCount);
                }
              }
              // Function to animate the waveform
              function animate() {
                requestAnimationFrame(animate);
                // Generate dummy audio data
                const audioData = new Uint8Array(
                  analyserNode.frequencyBinCount
                );
                analyserNode.getByteTimeDomainData(audioData);
                buffers = updateBuffers(gl, programInfo, audioData);
                drawScene(gl, programInfo, buffers);
              }

              // Set up the canvas
              canvas.width = window.innerWidth;
              canvas.height = 200; // Adjust height as needed
              // Set up audio context and analyser
              const audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
              const sourceNode = audioContext.createMediaElementSource(
                audioRef.current
              );
              const analyserNode = audioContext.createAnalyser();
              sourceNode.connect(analyserNode);
              analyserNode.connect(audioContext.destination);
              // animate();
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
