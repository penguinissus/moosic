import React, { useRef, useEffect, useState } from 'react';
import Webcam from "react-webcam";
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import './Page.css';

// MediaPipe Hand tracking indices mapping layout array
const HAND_CONNECTIONS = [
    // Thumb
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    // Index Finger
    { from: 0, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
    // Middle Finger
    { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
    // Ring Finger
    { from: 13, to: 14 }, { from: 14, to: 15 }, { from: 15, to: 16 },
    // Pinky
    { from: 0, to: 17 }, { from: 17, to: 18 }, { from: 18, to: 19 }, { from: 19, to: 20 },
    // Palm Base Knuckle Alignment Connectors
    { from: 5, to: 9 }, { from: 9, to: 13 }, { from: 13, to: 17 }
];

// Function that doesn't freaking work
// function calculateHandVectors(landmarkData) {
//     console.log("landmarkData: ", landmarkData);
//     console.log("landmarkData[0]: ", landmarkData?.[0]);
//     if (!landmarkData || landmarkData.length === 0) return [];
//     return landmarkData
//         .filter(landmarks => landmarks != null)
//         .map(landmarks => {
//             HAND_CONNECTIONS.map((connection) => {
//                 const start = landmarks[connection.from];
//                 const end = landmarks[connection.to];
//                 if (!start || !end) return [0,0];
//                 return [end.x - start.x, end.y - start.y];
//             })
//         });
// }

function isClosedFist(landmarkData) {
    if (!landmarkData || landmarkData.length === 0) return false;
    const landmarks = landmarkData[0];
    if (!landmarks) return false;
    const ref = landmarks[5];
    const thumb = landmarks[4]
    const index = landmarks [8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];

    if(!ref || !thumb || !index || !middle || !ring || !pinky) return 0;

    //yay
    if(thumb.y>ref.y && ring.y>ref.y && pinky.y>ref.y && index.y < ref.y && middle.y <ref.y){
        return 1;
    }

    return 2;
}

function Page() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const landmarkerRef = useRef(null);
    const [landmarkData, setLandmarkData] = useState(null);

    // const vectors = [];

    useEffect(() => {
        async function initMediaPipe() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            
            landmarkerRef.current = await HandLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
                    },
                    numHands: 2,
                    runningMode: "VIDEO"
                }
            );
            
            // Kickstart the rendering loops once instantiation finishes successfully
            renderLoop();
        }

        initMediaPipe();
    }, []);

    let lastVideoTime = -1;

    function renderLoop() {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;
        const handLandmarker = landmarkerRef.current;

        if (!video || !canvas || !handLandmarker || video.readyState !== 4) {
            requestAnimationFrame(renderLoop);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (video.currentTime !== lastVideoTime) {
            const startTimeMs = performance.now();
            const detections = handLandmarker.detectForVideo(video, startTimeMs);
            
            // Clear prior vector stroke layouts safely 
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections.landmarks && detections.landmarks.length > 0) {
                setLandmarkData(detections.landmarks);
                for (const landmarks of detections.landmarks) {
                    
                    // 1. Draw Skeleton Joint Connective Line Segments First
                    // const count = 0;
                    HAND_CONNECTIONS.forEach((connection) => {
                        const start = landmarks[connection.from];
                        const end = landmarks[connection.to];

                        if (start && end) {
                            ctx.beginPath();
                            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
                            ctx.strokeStyle = "#00008B"; // Responsive Neon Green Vector Line Style
                            ctx.lineWidth = 3;
                            ctx.stroke();
                        }
                        // vectors[count] = [(start.x-end.x), (start.y-end.y)];
                        // count++;
                    });

                    // 2. Draw Vector Circle Nodes Over Top of Joint Points
                    landmarks.forEach((point) => {
                        ctx.beginPath();
                        ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
                        ctx.fillStyle = "#ADD8E6"; // Distinct Red Node Knuckle Points
                        ctx.fill();

                        // ctx.fillStyle = "white";
                        // ctx.font = "12px Arial";
                        // ctx.fillText(index, point.x * canvas.width + 6, point.y * canvas.height - 6);
                    });
                }
            }
            lastVideoTime = video.currentTime;
        }

        requestAnimationFrame(renderLoop);
    }

    return (
        <>
            <h1>Moosic</h1>
            <div className="webcam-container" style={{ position: 'relative', width: '640px', height: '480px' }}>
                <Webcam 
                    ref={webcamRef} 
                    mirrored={true}
                    videoConstraints={{ width: 640, height: 480 }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
                <canvas 
                    ref={canvasRef} 
                    width={640}
                    height={480}
                    style={{ 
                        position: 'absolute', 
                        top: 0, left: 0, 
                        width: '100%', height: '100%', 
                        zIndex: 2,
                        transform: 'scaleX(-1)' // Synchronizes canvas coordinate drawings with Webcam mirroring
                    }}
                />
            </div>
            {/* <pre>{JSON.stringify(vectors, null, 2)}</pre> */}
            {/* <pre>{JSON.stringify(calculateHandVectors(landmarkData), null, 2)}</pre> */}
            {/* <pre>{JSON.stringify(landmarkData, null, 2)}</pre> */}
            <pre>{isClosedFist(landmarkData)}</pre>
        </>
    );
}

export default Page;