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
    const thumb = landmarks[4];
    const thumbbase = landmarks[2];
    const index = landmarks [8];
    const indexbase = landmarks[6];
    const middle = landmarks[12];
    const middlebase = landmarks[10];
    const ring = landmarks[16];
    const ringbase = landmarks[14];
    const pinky = landmarks[20];
    const pinkybase = landmarks[18];

    if(!thumb || !thumbbase || !index || !indexbase || !middle || !middlebase || !ring || !ringbase || !pinky || !pinkybase) return "oh no";
    // thumb open: thumb.x > thumbbase.x
    // fingers raised: indexbase.y > index.y

    //thumb out
    if(indexbase.y < index.y && middlebase.y < middle.y && ringbase.y < ring.y){
        if((indexbase.x > middlebase.x && thumb.x > thumbbase.x) || (indexbase.x < middlebase.x && thumb.x < thumbbase.x)) {
            if(pinkybase.y < pinky.y){
                return "thumb out";
            }
            return "thumb out pinky up";
        }
        if(pinkybase.y < pinky.y){
            return "thumb in";
        }
        return "thumb in pinky up";
    }

    if(indexbase.y > index.y && middlebase.y < middle.y && ringbase.y < ring.y){
        if((indexbase.x > middlebase.x && thumb.x > thumbbase.x) || (indexbase.x < middlebase.x && thumb.x < thumbbase.x)) {
            if(pinkybase.y < pinky.y){
                return "thumb out index up";
            }
            return "thumb out index up pinky up";
        }
        if(pinkybase.y < pinky.y){
            return "raised index thumb in";
        }
        return "raised index thumb in pinky up";
    }

    if(indexbase.y > index.y && middlebase.y > middle.y && ringbase.y < ring.y){
        if((indexbase.x > middlebase.x && thumb.x > thumbbase.x) || (indexbase.x < middlebase.x && thumb.x < thumbbase.x)) {
            if(pinkybase.y < pinky.y){
                return "thumb out index up middle up";
            }
            return "thumb out index up middle up pinky up";
        }
        if(pinkybase.y < pinky.y){
            return "raised index raised middle thumb in";
        }
        return "raised index raised middle thumb in pinky up";
    }

    if(indexbase.y > index.y && middlebase.y > middle.y && ringbase.y > ring.y){
        if((indexbase.x > middlebase.x && thumb.x > thumbbase.x) || (indexbase.x < middlebase.x && thumb.x < thumbbase.x)) {
            if(pinkybase.y < pinky.y){
                return "thumb out index up middle up ring up";
            }
            return "palm";
        }
        if(pinkybase.y < pinky.y){
            return "raised index raised middle ring up thumb in";
        }
        return "raised index raised middle thumb in ring up pinky up";
    }

    if(indexbase.y < index.y && middlebase.y > middle.y && ringbase.y < ring.y && pinkybase.y < pinky.y){
        return "fuck you";
    }

    //yay
    // if(thumb.y>yayref.y && ring.y>yayref.y && pinky.y>yayref.y && index.y < yayref.y && middle.y <yayref.y){
    //     return "peace sign";
    // }

    return "everything else";
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
        <div class="Page">
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
            <p>hand type: {isClosedFist(landmarkData)}</p>
        </div>
    );
}

export default Page;