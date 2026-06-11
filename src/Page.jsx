import React, { useRef, useEffect, useState } from 'react';
import Webcam from "react-webcam";
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import useSound from 'use-sound';
import { Howl} from 'howler';

import noteC from './assets/C.mp3';
import noteCm from './assets/Cm.mp3';
import noteDb from './assets/Db.mp3';
import noteDbm from './assets/Dbm.mp3'
import noteD from './assets/D.mp3';
import noteDm from './assets/Dm.mp3';
import noteEb from './assets/Eb.mp3';
import noteEbm from './assets/Ebm.mp3';
import noteE from './assets/E.mp3';
import noteEm from './assets/Em.mp3';
import noteF from './assets/F.mp3';
import noteFm from './assets/Fm.mp3';
import noteGb from './assets/Gb.mp3';
import noteGbm from './assets/Gbm.m4a';
import noteG from './assets/G.m4a';
import noteGm from './assets/Gm.m4a';
import noteAb from './assets/Ab.m4a';
import noteAbm from './assets/Abm.m4a';
import noteA from './assets/A.m4a';
import noteAm from './assets/Am.m4a';
import noteBb from './assets/Bb.m4a';
import noteBbm from './assets/Bbm.m4a';
import noteB from './assets/B.m4a';
import noteBm from './assets/Bm.m4a';

import image1 from './assets/1.png';
import image1m from './assets/1m.png';
import image2 from './assets/2.png';
import image2m from './assets/2m.png';
import image3 from './assets/3.png';
import image3m from './assets/3m.png';
import image4 from './assets/4.png';
import image4m from './assets/4m.png';
import image5 from './assets/5.png';
import image5m from './assets/5m.png';
import image6 from './assets/6.png';
import image6m from './assets/6m.png';
import image7 from './assets/7.png';
import image7m from './assets/7m.png';

import './Page.css';
import Otherbox from './Otherbox.jsx';

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

const CAM_WIDTH = 640;
const CAM_HEIGHT = 480;

var jazz_mode = true;

const C_SCALE = ["C", "D", "E", "F", "G", "A", "B"];
const Ab_SCALE = ["Ab", "Bb", "C", "Db", "Eb", "F", "G"];
var current_scale = Ab_SCALE;

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

function Page() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const landmarkerRef = useRef(null);
    const lastGestureRef = useRef(null);
    // const setCurrentImageRef = useRef(null);
    // const [landmarkData, setLandmarkData] = useState(null);
    // const [currentImage, setCurrentImage] = useState(image1);

    const currentHowlRef = useRef(null);
    const noteMap = {
        "C": noteC, "Db": noteDb, "Cm": noteCm, "Dbm": noteDbm,
        "D": noteD, "Eb": noteEb, "Dm": noteDm, "Ebm": noteEbm,
        "E": noteE, "Em": noteEm,
        "F": noteF, "Gb": noteGb, "Fm": noteFm, "Gbm": noteGbm,
        "G": noteG, "Ab": noteAb, "Gm": noteGm, "Abm": noteAbm,
        "A": noteA, "Bb": noteBb, "Am": noteAm, "Bbm": noteBbm,
        "B": noteB, "Bm": noteBm
    }

    const imageIndexMap = {
        [current_scale[0]]: image1, [current_scale[0]+"m"]: image1m,
        [current_scale[1]]: image2, [current_scale[1]+"m"]: image2m,
        [current_scale[2]]: image3, [current_scale[2]+"m"]: image3m,
        [current_scale[3]]: image4, [current_scale[3]+"m"]: image4m,
        [current_scale[4]]: image5, [current_scale[4]+"m"]: image5m,
        [current_scale[5]]: image6, [current_scale[5]+"m"]: image6m,
        [current_scale[6]]: image7, [current_scale[6]+"m"]: image7m,
    }

    function isClosedFist(landmarkData) {
        if (!landmarkData || landmarkData.length === 0) return false;
        const landmarks = landmarkData[0];
        if (!landmarks) return false;
        const thumb = landmarks[4];
        const thumbbase = landmarks[2];
        const index = landmarks[8];
        const indexbase = landmarks[6];
        const middle = landmarks[12];
        const middlebase = landmarks[10];
        const ring = landmarks[16];
        const ringbase = landmarks[14];
        const pinky = landmarks[20];
        const pinkybase = landmarks[18];

        if(!thumb || !thumbbase || !index || !indexbase || !middle || !middlebase || !ring || !ringbase || !pinky || !pinkybase) return 0;

        //thumb in: thumb.x < thumbbase.x
        //finger raised: tip.y < base.y
        if (index.y > indexbase.y && middle.y > middlebase.y && ring.y>ringbase.y){
            if (indexbase.x > middlebase.x) {
                //thumb in
                if(thumb.x < thumbbase.x) {
                    if (pinky.y < pinkybase.y) {
                        return current_scale[0]+"m";
                    }
                    return current_scale[0];
                }
                if (pinky.y < pinkybase.y) {
                    return current_scale[1]+"m"; 
                }
                return current_scale[1];
            }
            //thumb out
            if(thumb.x < thumbbase.x) {
                if (pinky.y < pinkybase.y) {
                    return current_scale[1]+"m";      
                }
                return current_scale[1];
            }
            if (pinky.y < pinkybase.y) {
                return current_scale[0]+"m";        
            }
            return current_scale[0];
        }
        if (index.y < indexbase.y && middle.y > middlebase.y && ring.y > ringbase.y){
            if (indexbase.x > middlebase.x) {
                //thumb in
                if(thumb.x < thumbbase.x) {
                    if (pinky.y < pinkybase.y) {
                        return current_scale[2]+"m"; 
                    }
                    return current_scale[2];
                }
                if (pinky.y < pinkybase.y) {
                    return current_scale[3]+"m";       
                }
                return current_scale[3];
            }
            //thumb out
            if(thumb.x < thumbbase.x) {
                if (pinky.y < pinkybase.y) {
                    return current_scale[3]+"m";    
                }
                return current_scale[3];
            }
            if (pinky.y < pinkybase.y) {
                return current_scale[2]+"m";       
            }
            return current_scale[2];
        }
        if (index.y < indexbase.y && middle.y < middlebase.y && ring.y > ringbase.y){
            if (indexbase.x > middlebase.x) {
                //thumb in
                if(thumb.x < thumbbase.x) {
                    if (pinky.y < pinkybase.y) {
                        return current_scale[4]+"m";   
                    }
                    return current_scale[4];
                }
                if (pinky.y < pinkybase.y) {
                    return current_scale[5]+"m";      
                }
                return current_scale[5];
            }
            //thumb out
            if(thumb.x < thumbbase.x) {
                if (pinky.y < pinkybase.y) {
                    return current_scale[5]+"m";       
                }
                return current_scale[5];
            }
            if (pinky.y < pinkybase.y) {
                return current_scale[4]+"m";        
            }
            return current_scale[4];
        }
        if (index.y < indexbase.y && middle.y < middlebase.y && ring.y < ringbase.y){
            if (pinky.y < pinkybase.y) {
                if (indexbase.x > middlebase.x) {
                    if(thumb.x > thumbbase.x) {
                        return "stop";
                    }
                }
                if(thumb.x < thumbbase.x) {
                    return "stop";
                }
                return current_scale[6]+"m";           
            }
            return current_scale[6];
        }
        return "everything else";
    }

    useEffect(() => {
        async function initMediaPipe() {
            console.log("initMediaPipe called");
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
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Clear prior vector stroke layouts safely 
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections.landmarks && detections.landmarks.length > 0) {
                setLandmarkData(detections.landmarks);
                const detected = isClosedFist(detections.landmarks);
                if (detected !== lastGestureRef.current) {
                    lastGestureRef.current = detected;
                    if (detected == "stop") {
                        currentHowlRef.current?.stop();
                    }
                    if(noteMap[detected]){
                        if(currentHowlRef.current) {
                            currentHowlRef.current.stop();
                        }
                        currentHowlRef.current = new Howl({
                            src: [noteMap[detected]],
                            loop: true, 
                        });
                        currentHowlRef.current.play();
                        // if(currentImageRef.current) {
                        //     currentImageRef.current.src = imageIndexMap[detected];
                        // }
                    }
                }

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
            } else {
                // if (lastGestureRef.current === "stop") {
                //     currentHowlRef.current?.stop();
                // }
                // lastGuestureRef.current = null;
            }
            lastVideoTime = video.currentTime;
        }
        //ok
        requestAnimationFrame(renderLoop);
    }

    return (
        <div class="Page">
            <Otherbox />
            <div className="otherstuff">
                <div className="Thirdbox">
                    <p>Current Chord: {isClosedFist(landmarkData)}</p>
                    <img src={image1}></img>
                </div>
                <div className="webcamAndText">
                    <div className="webcam-container" style={{ position: 'relative', width: '640px', height: '480px' }}>
                        <Webcam 
                            ref={webcamRef} 
                            mirrored={true}
                            videoConstraints={{ width: CAM_WIDTH, height: CAM_HEIGHT }}
                            onUserMediaError={(e) => console.error("Webcam error: ", e)}
                            onUserMedia={() => console.log("Webcam OK")}
                            style={{
                                position: 'absolute', 
                                top: 0, left: 0, 
                                width: '${CAM_WIDTH}px', 
                                height: '${CAM_HEIGHT}px' }}
                        />
                        <canvas 
                            ref={canvasRef} 
                            width={CAM_WIDTH}
                            height={CAM_HEIGHT}
                            style={{ 
                                position: 'absolute', 
                                top: 0, left: 0, 
                                width: '100%', height: '100%', 
                                zIndex: 2,
                                transform: 'scaleX(-1)' // Synchronizes canvas coordinate drawings with Webcam mirroring
                            }}
                        />
                    </div>
                    {/* <p>hand type: {isClosedFist(landmarkData)}</p> */}
                </div>
            </div>
            
            
        </div>
    );
}

export default Page;