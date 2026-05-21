import React, {useRef, useEffect} from 'react';
import Webcam from "react-webcam";
import './Page.css';

function Page() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const loadHandPose = async () => {
            const handPoseDetection = window.handPoseDetection;
            if (!handPoseDetection){
                console.error("handPoseDetection not loaded from CDN");
                return;
            }

            const model = handPoseDetection.SupportedModels.MediaPipeHands;
            const detectorConfig = {
                runtime: 'mediapipe',
                modelType: 'full',
                maxHands: 2,
                solutionPath: 'https://cdn.jsdelivr.net/npm@mediapipe/hands@0.4.1646424915/'
            };

            console.log("loading model");
            const detector = await handPoseDetection.createDetector(model, detectorConfig);
            console.log("model loaded");

            startDetection(detector);
        };

        loadHandPose();
    }, []);

    const startDetectionLoop = async (detector) => {
        const detect = async () => {
            if(
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.readyState === 4
            ){
                const video = webcamRef.current.video;
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                webcamRef.current.video.width = videoWidth;
                webcamRef.current.video.height = videoHeight;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;

                const hands = await detector.estimateHands(video);

                if(hands.length > 0){
                    console.log(hands);
                }
            }
            requestAnimationFrame(detect);
        };
        detect();
    }

    return (
        <>
            <h1>Moosic</h1>
            <div className="webcam-container">
                <Webcam ref={webcamRef}/>
                <canvas ref={canvasRef}/>
            </div>
        </>
    )
}

export default Page;