"use client";

import { useEffect, useRef, useState } from "react";

const SkyBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [timeOfDay, setTimeOfDay] = useState<"day" | "night" | "dawn" | "dusk">(
    "day"
  );
  const [sunMoonPosition, setSunMoonPosition] = useState(0.5);

  useEffect(() => {
    // Get current time in Peru (UTC-5)
    const updateTimeOfDay = () => {
      const now = new Date();

      // Calculate Peru time (UTC-5)
      // Don't use getTimezoneOffset() and add 5, instead directly set hours to Peru time
      const peruHours = (now.getUTCHours() - 5 + 24) % 24; // UTC-5, adding 24 and mod 24 to handle negative hours
      const peruMinutes = now.getUTCMinutes();

      // Calculate time as decimal for positioning
      const timeDecimal = peruHours + peruMinutes / 60;

      console.log(`Peru time: ${peruHours}:${peruMinutes} (${timeDecimal})`);

      // Determine time of day
      if (peruHours >= 6 && peruHours < 8) {
        setTimeOfDay("dawn");
      } else if (peruHours >= 8 && peruHours < 17) {
        setTimeOfDay("day");
      } else if (peruHours >= 17 && peruHours < 19) {
        setTimeOfDay("dusk");
      } else {
        setTimeOfDay("night");
      }

      // Calculate sun/moon position (0 = just rising, 0.5 = highest point, 1 = setting)
      let position = 0.5;

      if (peruHours >= 6 && peruHours < 18) {
        // Daytime: map 6am-6pm to position 0-1
        position = (timeDecimal - 6) / 12;
      } else if (peruHours >= 18 || peruHours < 6) {
        // Nighttime: map 6pm-6am to position 0-1
        position =
          peruHours >= 18 ? (timeDecimal - 18) / 12 : (timeDecimal + 6) / 12;
      }

      setSunMoonPosition(position);
    };

    // Update time immediately, then every minute
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000);

    // Initial dimensions setup
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sky color palettes for different times of day
    const colorPalettes = {
      dawn: {
        skyTop: { r: 100, g: 170, b: 235 },
        skyMiddle: { r: 140, g: 190, b: 240 },
        horizon: { r: 175, g: 210, b: 245 },
        celestialBody: { r: 255, g: 196, b: 102 },
      },
      day: {
        skyTop: { r: 64, g: 156, b: 255 },
        skyMiddle: { r: 120, g: 190, b: 240 },
        horizon: { r: 155, g: 210, b: 250 },
        celestialBody: { r: 255, g: 214, b: 102 },
      },
      dusk: {
        skyTop: { r: 70, g: 140, b: 205 },
        skyMiddle: { r: 125, g: 170, b: 220 },
        horizon: { r: 160, g: 195, b: 235 },
        celestialBody: { r: 255, g: 180, b: 80 },
      },
      night: {
        skyTop: { r: 10, g: 40, b: 95 },
        skyMiddle: { r: 25, g: 55, b: 110 },
        horizon: { r: 40, g: 75, b: 130 },
        celestialBody: { r: 240, g: 240, b: 240 }, // Moon color (white)
      },
    };

    // Define the gradient drawing function
    const drawGradient = () => {
      // Clear canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Get colors based on time of day
      const colors = colorPalettes[timeOfDay];

      // Create linear gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);

      // Adjust gradient stops based on time of day
      gradient.addColorStop(
        0,
        `rgb(${colors.skyTop.r}, ${colors.skyTop.g}, ${colors.skyTop.b})`
      );
      gradient.addColorStop(
        0.5,
        `rgb(${colors.skyMiddle.r}, ${colors.skyMiddle.g}, ${colors.skyMiddle.b})`
      );
      gradient.addColorStop(
        0.85,
        `rgb(${colors.horizon.r}, ${colors.horizon.g}, ${colors.horizon.b})`
      );

      // Fill the entire canvas with the gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // Calculate celestial body position based on time
      const celestialRadius =
        Math.min(window.innerWidth, window.innerHeight) * 
        (window.innerWidth < 768 ? 0.25 : 0.15); // Larger size on mobile

      // X position based on time (0-1 motion across sky)
      const celestialX = window.innerWidth * (0.2 + sunMoonPosition * 0.6);

      // Y position forms an arc (lowest at sunrise/sunset, highest at noon/midnight)
      // Using a parabola where position=0.5 is the peak
      const arcHeight = 0.7; // 0.7 = highest point is 70% from bottom
      const baseline = 0.9; // 0.9 = sun/moon is 90% from top at sunrise/sunset

      // Calculate y-position using a parabola centered at position 0.5
      // This creates the arc effect in the sky
      const normalizedPosition = Math.abs(sunMoonPosition - 0.5) * 2; // 0 at peak, 1 at edges
      const celestialY =
        window.innerHeight *
        (baseline - arcHeight * (1 - normalizedPosition * normalizedPosition));

      // Is it the moon or the sun?
      const isMoon = timeOfDay === "night";

      if (isMoon) {
        // Draw moon with same diffused technique as the sun
        
        // Calculate mobile-responsive multipliers
        const glowMultiplier = window.innerWidth < 768 ? 8 : 10;
        const coreMultiplier = window.innerWidth < 768 ? 2.5 : 2;
        
        // Draw base glow layer
        const baseGlow = ctx.createRadialGradient(
          celestialX,
          celestialY,
          0,
          celestialX,
          celestialY,
          celestialRadius * glowMultiplier
        );
        baseGlow.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
        baseGlow.addColorStop(0.1, `rgba(230, 240, 255, 0.5)`);
        baseGlow.addColorStop(
          0.2,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.3)`
        );
        baseGlow.addColorStop(
          0.4,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.15)`
        );
        baseGlow.addColorStop(
          0.7,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.08)`
        );
        baseGlow.addColorStop(
          1,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0)`
        );

        ctx.fillStyle = baseGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, celestialRadius * glowMultiplier, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glowing core of the moon - brighter center
        const innerCore = ctx.createRadialGradient(
          celestialX,
          celestialY,
          0,
          celestialX,
          celestialY,
          celestialRadius * coreMultiplier
        );
        innerCore.addColorStop(0, `rgba(255, 255, 255, 0.9)`); // White center
        innerCore.addColorStop(0.2, `rgba(240, 245, 255, 0.8)`); // Slight blue-white
        innerCore.addColorStop(
          0.5,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.6)`
        );
        innerCore.addColorStop(
          0.8,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.3)`
        );
        innerCore.addColorStop(
          1,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0)`
        );

        ctx.fillStyle = innerCore;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, celestialRadius * coreMultiplier, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw sun with more diffused light rays
        
        // Calculate mobile-responsive multipliers
        const glowMultiplier = window.innerWidth < 768 ? 8 : 10;
        const coreMultiplier = window.innerWidth < 768 ? 2.5 : 2;
        
        // Draw base glow layer
        const baseGlow = ctx.createRadialGradient(
          celestialX,
          celestialY,
          0,
          celestialX,
          celestialY,
          celestialRadius * glowMultiplier
        );
        baseGlow.addColorStop(0, `rgba(255, 255, 255, 0.8)`);
        baseGlow.addColorStop(0.1, `rgba(255, 250, 230, 0.6)`);
        baseGlow.addColorStop(
          0.2,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.4)`
        );
        baseGlow.addColorStop(
          0.4,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.2)`
        );
        baseGlow.addColorStop(
          0.7,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.1)`
        );
        baseGlow.addColorStop(
          1,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0)`
        );

        ctx.fillStyle = baseGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, celestialRadius * glowMultiplier, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glowing core of the sun - brighter center
        const innerCore = ctx.createRadialGradient(
          celestialX,
          celestialY,
          0,
          celestialX,
          celestialY,
          celestialRadius * coreMultiplier
        );
        innerCore.addColorStop(0, `rgba(255, 255, 255, 1)`); // Pure white center
        innerCore.addColorStop(0.2, `rgba(255, 255, 220, 0.9)`);
        innerCore.addColorStop(
          0.5,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.7)`
        );
        innerCore.addColorStop(
          0.8,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0.4)`
        );
        innerCore.addColorStop(
          1,
          `rgba(${colors.celestialBody.r}, ${colors.celestialBody.g}, ${colors.celestialBody.b}, 0)`
        );

        ctx.fillStyle = innerCore;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, celestialRadius * coreMultiplier, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Set canvas dimensions
    const resizeCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;

      // Scale context for retina/high DPI displays
      ctx.scale(devicePixelRatio, devicePixelRatio);

      // Adjust canvas CSS size
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Redraw the gradient after resize
      drawGradient();
    };

    // Initial resize
    resizeCanvas();

    // Handle window resize
    window.addEventListener("resize", resizeCanvas);

    // Set up animation frame to update continuously
    const animate = () => {
      drawGradient();
      requestAnimationFrame(animate);
    };

    animate();

    // Clean up
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearInterval(interval);
    };
  }, [timeOfDay, sunMoonPosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    />
  );
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Function to update time
    const updateTime = () => {
      const timeStr = new Date().toLocaleTimeString("en-US", {
        timeZone: "America/Lima",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeStr);
    };

    // Update time immediately and then every minute
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Clean up the interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <SkyBackground />
      <div className="fixed w-full h-full flex flex-col justify-between p-8 text-white font-light">
        <div className="flex justify-between w-full">
          <div className="text-lg font-bold">Latino Excellence</div>
          <div className="text-lg hover:underline cursor-pointer font-bold">
            {currentTime}
          </div>
        </div>
      </div>
    </>
  );
}
