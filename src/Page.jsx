import React, {useRef, useEffect} from 'react';
import Webcam from "react-webcam";
import './Page.css';

function Page() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

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