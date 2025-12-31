import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import confetti from 'canvas-confetti';
import './LoadingScreen.scss';

const LoadingScreen = () => {
    const { show, context, subcontext, celebration } = useSelector((state) => state.loading);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (show && celebration && canvasRef.current) {
            const myConfetti = confetti.create(canvasRef.current, {
                resize: true,
                useWorker: true
            });

            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                myConfetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                    colors: ['#54a134', '#66b346', '#336c1b', '#ffffff']
                }));
                myConfetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                    colors: ['#54a134', '#66b346', '#336c1b', '#ffffff']
                }));
            }, 250);

            return () => clearInterval(interval);
        }
    }, [show, celebration]);

    if (!show) {
        return null;
    }

    return (
        <div className="loading-container">
            {celebration && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            )}
            <div className="loading-spinner"></div>
            <div className="loading-context-container">
                <p className="loading-context">{context}</p>
                <p className="loading-subcontext">{subcontext}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
