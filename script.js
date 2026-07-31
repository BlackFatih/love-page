// Particle Heart Animation in 3D
const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

// State variables
let settings = {
    text: "R",
    theme: "rose",
    template: "particle", // "particle", "ribbon", "burst"
    speed: 1.0,
    pulseSpeed: 1.0,
    particleCount: 1200
};

// Physics and rendering settings
let particles = [];
let ribbons = [];
let width, height;
let mouse = { x: null, y: null, active: false, radius: 80 };
let rotationX = 0;
let rotationY = 0.5; // Initial slight angle
let targetRotationX = 0;
let targetRotationY = 0.5;
let scaleVal = 1;
let pulseTime = 0;

// Setup canvas size
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    // Adapt particle sizing based on screen size
    scaleVal = Math.min(width, height) / 38;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Theme colors mapping matching CSS values
const themes = {
    rose: { r: 255, g: 46, b: 147 },
    violet: { r: 138, g: 43, b: 226 },
    gold: { r: 255, g: 215, b: 0 },
    emerald: { r: 0, g: 255, b: 204 }
};

// Particle Class
class Particle {
    constructor(tx, ty, tz, isBurst = false) {
        this.tx = tx;
        this.ty = ty;
        this.tz = tz;
        this.isBurst = isBurst;
        
        this.reset(isBurst);
    }

    reset(isBurst = false) {
        if (isBurst) {
            // Start scattered randomly far away
            this.x = (Math.random() - 0.5) * width * 1.5;
            this.y = (Math.random() - 0.5) * height * 1.5;
            this.z = (Math.random() * 800) - 200;
            this.burstAge = Math.random() * 100;
        } else {
            this.x = (Math.random() - 0.5) * width;
            this.y = (Math.random() - 0.5) * height;
            this.z = (Math.random() - 0.5) * 400;
        }
        
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.size = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.speedFactor = Math.random() * 0.05 + 0.03;
    }

    update(pulse, rotX, rotY) {
        let px = this.tx;
        let py = this.ty;
        let pz = this.tz;

        if (settings.template === 'burst') {
            this.burstAge += 0.8 * settings.speed;
            const cycle = this.burstAge % 200;
            
            if (cycle < 60) {
                // Phase 1: Starfield drift (flying around)
                this.x += (Math.random() - 0.5) * 5;
                this.y += (Math.random() - 0.5) * 5;
                this.z -= 4 * settings.speed;
                if (this.z < -400) this.z = 600;
                
                // Keep alpha low
                this.alpha = 0.2;
                this.depthZ = this.z;
                return;
            } else if (cycle >= 60 && cycle < 140) {
                // Phase 2: Pull violently into Heart shape
                this.alpha = 0.85;
                px = this.tx * pulse;
                py = this.ty * pulse;
                pz = this.tz * pulse;
            } else {
                // Phase 3: Fade and explode outward
                const explodeForce = (cycle - 140) * 0.8;
                px = (this.tx + (this.tx / Math.abs(this.tx || 1)) * explodeForce * 2) * pulse;
                py = (this.ty + (this.ty / Math.abs(this.ty || 1)) * explodeForce * 2) * pulse;
                pz = this.tz * pulse;
                this.alpha = Math.max(0, 1 - (cycle - 140) / 60);
            }
        } else {
            // Normal static shell particle behavior
            px *= pulse;
            py *= pulse;
            pz *= pulse;
        }

        // 2. Rotate around Y-axis
        let cosY = Math.cos(rotY);
        let sinY = Math.sin(rotY);
        let x1 = px * cosY - pz * sinY;
        let z1 = px * sinY + pz * cosY;

        // 3. Rotate around X-axis
        let cosX = Math.cos(rotX);
        let sinX = Math.sin(rotX);
        let y2 = py * cosX - z1 * sinX;
        let z2 = py * sinX + z1 * cosX;

        // 4. Project coordinates to 2D Canvas (Perspective projection)
        const fov = 600;
        const perspective = fov / (fov + z2);
        
        // Target screen positions
        const targetScreenX = width / 2 + x1 * scaleVal * perspective;
        const targetScreenY = height / 2 - y2 * scaleVal * perspective;

        // 5. Mouse Interaction (Repulsion)
        let dx = targetScreenX - mouse.x;
        let dy = targetScreenY - mouse.y;
        let dist = Math.hypot(dx, dy);
        
        let ox = 0;
        let oy = 0;
        if (mouse.active && dist < mouse.radius) {
            let force = (mouse.radius - dist) / mouse.radius;
            ox = (dx / dist) * force * 40;
            oy = (dy / dist) * force * 40;
        }

        // 6. Physics Spring animation
        this.vx += ((targetScreenX + ox) - this.x) * this.speedFactor;
        this.vy += ((targetScreenY + oy) - this.y) * this.speedFactor;
        this.vx *= 0.85;
        this.vy *= 0.85;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.depthZ = z2;
    }

    draw() {
        if (this.alpha <= 0) return;
        const themeColor = themes[settings.theme];
        ctx.fillStyle = `rgba(${themeColor.r}, ${themeColor.g}, ${themeColor.b}, ${this.alpha})`;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Generate Heart Shape 3D Coordinates
function generateHeartParticles() {
    particles = [];
    const count = settings.particleCount;
    const isBurst = settings.template === 'burst';
    
    for (let i = 0; i < count; i++) {
        const theta = Math.acos(1 - 2 * (i / count)); 
        const phi = Math.PI * (1 + Math.sqrt(5)) * i;

        const t = theta; 
        const p = phi;

        const x = 16 * Math.pow(Math.sin(t), 3) * Math.cos(p);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        const z = 16 * Math.pow(Math.sin(t), 3) * Math.sin(p);

        particles.push(new Particle(x * 0.85, y * 0.85, z * 0.85, isBurst));
    }
}

// Ribbon drawing generator
function generateRibbons() {
    ribbons = [];
    // We create 6 looping ribbons along different slices of the 3D heart
    for (let r = 0; r < 6; r++) {
        let points = [];
        const slicePhi = (r / 6) * Math.PI * 2;
        
        // Sample points along the heart profile
        for (let t = 0; t <= Math.PI; t += 0.05) {
            const x = 16 * Math.pow(Math.sin(t), 3) * Math.cos(slicePhi);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
            const z = 16 * Math.pow(Math.sin(t), 3) * Math.sin(slicePhi);
            points.push({ x: x * 0.85, y: y * 0.85, z: z * 0.85 });
        }
        ribbons.push({
            points: points,
            offset: Math.random() * Math.PI * 2
        });
    }
}

// Setup & controls interaction
const controlPanel = document.getElementById('controlPanel');
const togglePanelBtn = document.getElementById('togglePanelBtn');
const nameInput = document.getElementById('nameInput');
const targetLetter = document.getElementById('targetLetter');
const themeSelect = document.getElementById('themeSelect');
const templateSelect = document.getElementById('templateSelect');

const speedSlider = document.getElementById('speedSlider');
const speedVal = document.getElementById('speedVal');
const pulseSlider = document.getElementById('pulseSlider');
const pulseVal = document.getElementById('pulseVal');
const countSlider = document.getElementById('countSlider');
const countVal = document.getElementById('countVal');

const musicToggleBtn = document.getElementById('musicToggleBtn');

// Slide controls panel
togglePanelBtn.addEventListener('click', () => {
    controlPanel.classList.toggle('open');
});

// Update Name/Letter Live
nameInput.addEventListener('input', (e) => {
    let val = e.target.value || " ";
    settings.text = val;
    targetLetter.textContent = val;
});

// Change Theme
themeSelect.addEventListener('change', (e) => {
    document.body.className = `theme-${e.target.value}`;
    settings.theme = e.target.value;
});

// Change Template (Animation type)
templateSelect.addEventListener('change', (e) => {
    settings.template = e.target.value;
    if (settings.template === 'ribbon') {
        generateRibbons();
    } else {
        generateHeartParticles();
    }
});

// Slider values updating
speedSlider.addEventListener('input', (e) => {
    settings.speed = parseFloat(e.target.value);
    speedVal.textContent = settings.speed.toFixed(1) + 'x';
});

pulseSlider.addEventListener('input', (e) => {
    settings.pulseSpeed = parseFloat(e.target.value);
    pulseVal.textContent = settings.pulseSpeed.toFixed(1) + 'x';
});

countSlider.addEventListener('input', (e) => {
    settings.particleCount = parseInt(e.target.value);
    countVal.textContent = settings.particleCount;
    if (settings.template !== 'ribbon') {
        generateHeartParticles();
    }
});

// Tracking Mouse Moves
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    targetRotationY = ((e.clientX / width) - 0.5) * Math.PI * 2;
    targetRotationX = ((e.clientY / height) - 0.5) * Math.PI;
});

window.addEventListener('mouseleave', () => {
    mouse.active = false;
});

// Touch Devices compatibility
window.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
        
        targetRotationY = ((e.touches[0].clientX / width) - 0.5) * Math.PI * 2;
        targetRotationX = ((e.touches[0].clientY / height) - 0.5) * Math.PI;
    }
}, {passive: true});

window.addEventListener('touchend', () => {
    mouse.active = false;
});

// Audio Web Synthesizer logic
let audioCtx = null;
let synthInterval = null;
let mainLfo = null;
let activeNotes = [];

function initSynth() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const padOsc1 = audioCtx.createOscillator();
    const padOsc2 = audioCtx.createOscillator();
    const padFilter = audioCtx.createBiquadFilter();
    const padGain = audioCtx.createGain();

    padOsc1.type = 'sawtooth';
    padOsc2.type = 'triangle';
    padOsc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 Note
    padOsc2.frequency.setValueAtTime(165, audioCtx.currentTime); // E3 Note

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
    padFilter.Q.setValueAtTime(3, audioCtx.currentTime);

    mainLfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    mainLfo.frequency.setValueAtTime(0.1, audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(100, audioCtx.currentTime);
    
    mainLfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    mainLfo.start();

    padGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(audioCtx.destination);

    padOsc1.start();
    padOsc2.start();

    activeNotes = [padOsc1, padOsc2, mainLfo, padGain];

    const scale = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    
    synthInterval = setInterval(() => {
        if (Math.random() < 0.4 || (mouse.active && Math.random() < 0.75)) {
            triggerChime(scale[Math.floor(Math.random() * scale.length)]);
        }
    }, 1200);
}

function triggerChime(freq) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const delay = audioCtx.createDelay();
    const delayFeedback = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    delay.delayTime.setValueAtTime(0.4, audioCtx.currentTime);
    delayFeedback.gain.setValueAtTime(0.4, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, audioCtx.currentTime);

    osc.connect(filter);
    filter.connect(gainNode);
    
    gainNode.connect(audioCtx.destination);
    gainNode.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayFeedback.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 3.2);
}

function stopSynth() {
    activeNotes.forEach(node => {
        try { node.stop(); } catch(e) {}
        try { node.disconnect(); } catch(e) {}
    });
    activeNotes = [];
    clearInterval(synthInterval);
    if(audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}

musicToggleBtn.addEventListener('click', () => {
    musicToggleBtn.classList.toggle('active');
    
    if (musicToggleBtn.classList.contains('active')) {
        musicToggleBtn.innerHTML = `<span class="music-icon">🔊</span> O'chirish`;
        initSynth();
    } else {
        musicToggleBtn.innerHTML = `<span class="music-icon">🎵</span> Yoqish`;
        stopSynth();
    }
});

// Initialization
generateHeartParticles();

// Render Loop
function animate() {
    // Semi-transparent background clear
    ctx.fillStyle = 'rgba(7, 2, 13, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // 1. Calculate rotation
    if (!mouse.active) {
        targetRotationY += 0.004 * settings.speed;
        targetRotationX = Math.sin(Date.now() * 0.001) * 0.15;
    }
    
    rotationY += (targetRotationY - rotationY) * 0.08;
    rotationX += (targetRotationX - rotationX) * 0.08;

    // 2. Pulse factor calculation
    pulseTime += 0.04 * settings.pulseSpeed;
    let beatFactor = Math.sin(pulseTime);
    if (beatFactor < 0) beatFactor = Math.abs(beatFactor) * 0.2;
    const pulse = 1.0 + (beatFactor * 0.08);

    const themeColor = themes[settings.theme];

    if (settings.template === 'ribbon') {
        // Draw mathematical neon ribbons
        ribbons.forEach(ribbon => {
            ribbon.offset += 0.02 * settings.speed;
            ctx.beginPath();
            
            // Loop through points, rotate and project
            const projectedPoints = ribbon.points.map(pt => {
                let px = pt.x * pulse;
                let py = pt.y * pulse;
                let pz = pt.z * pulse;

                // Y rotation
                let cosY = Math.cos(rotationY);
                let sinY = Math.sin(rotationY);
                let x1 = px * cosY - pz * sinY;
                let z1 = px * sinY + pz * cosY;

                // X rotation
                let cosX = Math.cos(rotationX);
                let sinX = Math.sin(rotationX);
                let y2 = py * cosX - z1 * sinX;
                let z2 = py * sinX + z1 * cosX;

                const fov = 600;
                const perspective = fov / (fov + z2);
                
                return {
                    x: width / 2 + x1 * scaleVal * perspective,
                    y: height / 2 - y2 * scaleVal * perspective,
                    z: z2
                };
            });

            // Draw beautiful flowing neon ribbon
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = `rgba(${themeColor.r}, ${themeColor.g}, ${themeColor.b}, 0.85)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgb(${themeColor.r}, ${themeColor.g}, ${themeColor.b})`;
            
            ctx.moveTo(projectedPoints[0].x, projectedPoints[0].y);
            for (let i = 1; i < projectedPoints.length; i++) {
                ctx.lineTo(projectedPoints[i].x, projectedPoints[i].y);
            }
            ctx.stroke();
            
            // Reset shadow to keep performance high
            ctx.shadowBlur = 0;
            
            // Floating flow sparks along the ribbon lines
            const sparkIndex = Math.floor((Math.sin(ribbon.offset) * 0.5 + 0.5) * (projectedPoints.length - 1));
            const spark = projectedPoints[sparkIndex];
            if (spark) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    } else {
        // Draw shell particles / burst particles
        particles.forEach(p => p.update(pulse, rotationX, rotationY));
        particles.sort((a, b) => b.depthZ - a.depthZ);
        particles.forEach(p => p.draw());
    }

    requestAnimationFrame(animate);
}

// Start rendering loop
animate();
