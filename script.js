// --- Three.js Neural Void Implementation ---
let scene, camera, renderer, particles;
const particleCount = 12000; // Reduced for clarity and performance
const positions = new Float32Array(particleCount * 3);
const originalPositions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

const mouse = new THREE.Vector2();
const targetMouse = new THREE.Vector2();

const initThree = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    for (let i = 0; i < particleCount; i++) {
        const valX = (Math.random() - 0.5) * 15;
        const valY = (Math.random() - 0.5) * 15;
        const valZ = (Math.random() - 0.5) * 15;

        positions[i * 3] = valX;
        positions[i * 3 + 1] = valY;
        positions[i * 3 + 2] = valZ;

        originalPositions[i * 3] = valX;
        originalPositions[i * 3 + 1] = valY;
        originalPositions[i * 3 + 2] = valZ;

        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02, // Restored to impactful "original" scale
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    animate();
};

// --- Section-Specific Particle Geometries ---
const geometryShapes = {
    hero: 'globe-small',
    about: 'ribbon',
    experience: 'helix',
    education: 'grid',
    skills: 'torus',
    projects: 'dodecahedron',
    contact: 'spiral'
};

let currentShape = 'sphere';
let targetPositions = new Float32Array(particleCount * 3);
let morphTween = null;

function generateShapePositions(shape) {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        let x, y, z;

        switch (shape) {
            case 'globe-small':
                // Dense small sphere shell (hero globe)
                {
                    const theta_g = Math.random() * Math.PI * 2;
                    const phi_g = Math.acos(2 * Math.random() - 1);
                    const radius_g = 2.8;
                    x = radius_g * Math.sin(phi_g) * Math.cos(theta_g);
                    y = radius_g * Math.sin(phi_g) * Math.sin(theta_g);
                    z = radius_g * Math.cos(phi_g);
                }
                break;
            case 'helix':
                // Vertical helix (journey)
                {
                    const ratio = i / particleCount;
                    const angle = ratio * Math.PI * 18;
                    const radius_h = 4.2;
                    x = Math.cos(angle) * radius_h;
                    y = (ratio - 0.5) * 14;
                    z = Math.sin(angle) * radius_h;
                }
                break;
            case 'grid':
                // Flat grid wave (education)
                {
                    const size = Math.ceil(Math.sqrt(particleCount));
                    const gx = (i % size) - size / 2;
                    const gy = (Math.floor(i / size) - size / 2);
                    x = gx * 0.18;
                    y = Math.sin(gx * 0.15) * 1.6;
                    z = gy * 0.18;
                }
                break;
            case 'spiral':
                // Spiral vortex for contact section
                {
                    const t = (i / particleCount) * Math.PI * 10;
                    const radius_s = 0.4 * t;
                    x = Math.cos(t) * radius_s * 0.25;
                    y = (t - Math.PI * 5) * 0.15;
                    z = Math.sin(t) * radius_s * 0.25;
                }
                break;
            case 'ribbon':
                // Wavy ribbon/line field
                {
                    const t = (i / particleCount) * Math.PI * 6;
                    const spread = (Math.random() - 0.5) * 1.2;
                    x = (t - Math.PI * 3) * 0.8;
                    y = Math.sin(t) * 2.2 + spread;
                    z = Math.cos(t * 0.7) * 2.0 + spread;
                }
                break;
            case 'cube':
                // Distribute on cube surface
                const face = Math.floor(Math.random() * 6);
                const u = (Math.random() - 0.5) * 10;
                const v = (Math.random() - 0.5) * 10;
                if (face === 0) { x = 5; y = u; z = v; }
                else if (face === 1) { x = -5; y = u; z = v; }
                else if (face === 2) { x = u; y = 5; z = v; }
                else if (face === 3) { x = u; y = -5; z = v; }
                else if (face === 4) { x = u; y = v; z = 5; }
                else { x = u; y = v; z = -5; }
                break;

            case 'tetrahedron':
                // Distribute on tetrahedron vertices/edges
                const t = Math.random();
                const phi = Math.random() * Math.PI * 2;
                x = 7 * Math.cos(phi) * Math.sin(t * Math.PI);
                y = 7 * Math.sin(phi) * Math.sin(t * Math.PI);
                z = 7 * Math.cos(t * Math.PI);
                break;

            case 'octahedron':
                // Diamond shape
                const theta = Math.random() * Math.PI * 2;
                const rOct = Math.random() * 6;
                x = rOct * Math.cos(theta);
                y = (Math.random() - 0.5) * 12;
                z = rOct * Math.sin(theta);
                break;

            case 'torus':
                // Ring/donut shape
                const angle1 = Math.random() * Math.PI * 2;
                const angle2 = Math.random() * Math.PI * 2;
                const R = 5;
                const rTorus = 2;
                x = (R + rTorus * Math.cos(angle2)) * Math.cos(angle1);
                y = (R + rTorus * Math.cos(angle2)) * Math.sin(angle1);
                z = rTorus * Math.sin(angle2);
                break;

            case 'dodecahedron':
                // Complex multi-faceted shape
                const phi_d = (1 + Math.sqrt(5)) / 2;
                const rand = Math.random();
                if (rand < 0.33) {
                    x = (Math.random() - 0.5) * 10;
                    y = (Math.random() - 0.5) * 10 * phi_d;
                    z = 0;
                } else if (rand < 0.66) {
                    x = 0;
                    y = (Math.random() - 0.5) * 10;
                    z = (Math.random() - 0.5) * 10 * phi_d;
                } else {
                    x = (Math.random() - 0.5) * 10 * phi_d;
                    y = 0;
                    z = (Math.random() - 0.5) * 10;
                }
                break;

            case 'sphere-large':
                // Larger sphere for contact
                const theta_s = Math.random() * Math.PI * 2;
                const phi_s = Math.acos(2 * Math.random() - 1);
                const radius = 8;
                x = radius * Math.sin(phi_s) * Math.cos(theta_s);
                y = radius * Math.sin(phi_s) * Math.sin(theta_s);
                z = radius * Math.cos(phi_s);
                break;

            default: // sphere
                const theta_default = Math.random() * Math.PI * 2;
                const phi_default = Math.acos(2 * Math.random() - 1);
                const radius_default = 6;
                x = radius_default * Math.sin(phi_default) * Math.cos(theta_default);
                y = radius_default * Math.sin(phi_default) * Math.sin(theta_default);
                z = radius_default * Math.cos(phi_default);
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    return positions;
}

function morphToShape(shape) {
    if (currentShape === shape) return;
    currentShape = shape;
    targetPositions = generateShapePositions(shape);

    // Animate morph with GSAP (deterministic lerp from current to target)
    if (morphTween) morphTween.kill();
    const startPositions = originalPositions.slice();
    const morphState = { t: 0 };
    morphTween = gsap.to(morphState, {
        t: 1,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate: () => {
            const t = morphState.t;
            for (let i = 0; i < particleCount * 3; i++) {
                originalPositions[i] = startPositions[i] + (targetPositions[i] - startPositions[i]) * t;
            }
        }
    });
}

const animate = () => {
    requestAnimationFrame(animate);

    // Direct mouse mapping for precise interaction
    mouse.x = targetMouse.x;
    mouse.y = targetMouse.y;

    particles.rotation.y += 0.0006; // Slightly faster rotation
    particles.updateMatrixWorld();
    updatePhysics();
    renderer.render(scene, camera);
};

const updatePhysics = () => {
    if (!particles || !camera) return;
    const posAttr = particles.geometry.attributes.position;

    // 1. Calculate Ray in World Space
    // Convert 2D mouse (normalized) to 3D ray direction
    const rayOrigin = camera.position;
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const rayDir = vector.sub(rayOrigin).clone().normalize();

    // Cache camera positions for slight performance boost
    const cx = rayOrigin.x;
    const cy = rayOrigin.y;
    const cz = rayOrigin.z;
    const dx = rayDir.x;
    const dy = rayDir.y;
    const dz = rayDir.z;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        let px = posAttr.array[i3];
        let py = posAttr.array[i3 + 1];
        let pz = posAttr.array[i3 + 2];

        // 2. Ray-Point Distance Logic (Tube interaction)
        // Vector from Cam to Particle (v)
        const vx = px - cx;
        const vy = py - cy;
        const vz = pz - cz;

        // Project v onto Ray Direction (t = v dot d)
        const t = vx * dx + vy * dy + vz * dz;

        // Only interact in front of the camera
        if (t > 0) {
            // Closest point on ray (C = O + t*d)
            const cpx = cx + t * dx;
            const cpy = cy + t * dy;
            const cpz = cz + t * dz;

            // Distance vector from Ray to Particle (r = P - C)
            const rx = px - cpx;
            const ry = py - cpy;
            const rz = pz - cpz;

            // Distance Squared
            const distSq = rx * rx + ry * ry + rz * rz;
            const influenceSq = 1.2; // Reduced area (Precision interaction)

            if (distSq < influenceSq) {
                const dist = Math.sqrt(distSq);
                const force = (Math.sqrt(influenceSq) - dist) * 0.008; // More subtle force
                const inv = dist === 0 ? 0 : 1 / dist;

                // Push perpendicular to the view ray (opens a tunnel)
                velocities[i3] += rx * inv * force;
                velocities[i3 + 1] += ry * inv * force;
                velocities[i3 + 2] += rz * inv * force;
            }
        }

        // 3. Return to Original (Elasticity)
        const ox = originalPositions[i3];
        const oy = originalPositions[i3 + 1];
        const oz = originalPositions[i3 + 2];

        velocities[i3] += (ox - px) * 0.01;
        velocities[i3 + 1] += (oy - py) * 0.01;
        velocities[i3 + 2] += (oz - pz) * 0.01;

        // 4. Damping
        velocities[i3] *= 0.90; // Zero-G Friction
        velocities[i3 + 1] *= 0.90;
        velocities[i3 + 2] *= 0.90;

        // 5. Update
        posAttr.array[i3] += velocities[i3];
        posAttr.array[i3 + 1] += velocities[i3 + 1];
        posAttr.array[i3 + 2] += velocities[i3 + 2];
    }
    posAttr.needsUpdate = true;
};

// Listeners
window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Custom Cursor
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    }

    // HUD Damped Magnetism (REMOVED: User requested no magnetic effect on HUD)
    /*
    const hud = document.getElementById('hud-nav');
    if (hud) {
        const rect = hud.getBoundingClientRect();
        const hudX = rect.left + rect.width / 2;
        const hudY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - hudX, e.clientY - hudY);
        if (dist < 250) {
            gsap.to(hud, {
                x: (e.clientX - hudX) * 0.15, // Reduced from 0.5
                y: (e.clientY - hudY) * 0.15,
                duration: 0.8,
                ease: "power2.out"
            });
        } else {
            gsap.to(hud, { x: 0, y: 0, duration: 1, ease: "power4.out" });
        }
    }
    */

    // Stable Parallax (REMOVED: User requested no magnetic effect on text)
    /*
    gsap.to(".title-xl", {
        x: targetMouse.x * 12,
        y: -targetMouse.y * 12,
        duration: 2,
        ease: "power3.out"
    });
    */
});

// --- Magnetic Effects for Specific Elements ---
document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - (rect.left + rect.width / 2)) * 0.4;
        const y = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
        gsap.to(el, { x: x, y: y, duration: 0.3, ease: "power2.out" });
    });
    el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- GSAP Scroll Morphing ---
gsap.registerPlugin(ScrollTrigger);

const initAnimations = () => {
    gsap.to(".line span", { y: 0, stagger: 0.1, duration: 1.2, ease: "power4.out" });
    gsap.to(".label", { y: 0, duration: 1.2, ease: "power4.out", delay: 0.3 });
    gsap.to(".hero-footer", { opacity: 1, duration: 0.8, delay: 0.6 });

    // Section-specific particle morphing
    ScrollTrigger.create({
        trigger: ".hero-panel",
        start: "top center",
        onEnter: () => morphToShape('globe-small'),
        onEnterBack: () => morphToShape('globe-small')
    });

    ScrollTrigger.create({
        trigger: ".about-panel",
        start: "top center",
        onEnter: () => morphToShape('ribbon'),
        onEnterBack: () => morphToShape('ribbon')
    });

    ScrollTrigger.create({
        trigger: ".experience-panel",
        start: "top center",
        onEnter: () => morphToShape('helix'),
        onEnterBack: () => morphToShape('helix')
    });

    ScrollTrigger.create({
        trigger: ".education-panel",
        start: "top center",
        onEnter: () => morphToShape('grid'),
        onEnterBack: () => morphToShape('grid')
    });

    ScrollTrigger.create({
        trigger: ".skills-detail-panel",
        start: "top center",
        onEnter: () => morphToShape('torus'),
        onEnterBack: () => morphToShape('torus')
    });

    ScrollTrigger.create({
        trigger: ".projects-panel",
        start: "top center",
        onEnter: () => morphToShape('dodecahedron'),
        onEnterBack: () => morphToShape('dodecahedron')
    });

    ScrollTrigger.create({
        trigger: ".contact-panel",
        start: "top center",
        onEnter: () => morphToShape('spiral'),
        onEnterBack: () => morphToShape('spiral')
    });

    // Smooth scroll without snap to avoid forced section jumps
    gsap.utils.toArray('.panel').forEach(panel => {
        ScrollTrigger.create({
            trigger: panel,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.2
        });
    });
};



// --- Particle Tunnel Preloader ---
function initPreloaderTunnel() {
    const canvas = document.getElementById('preloader-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 200;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 1500,
            size: Math.random() * 2 + 1
        });
    }

    function animateTunnel() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            // Move particles toward viewer (hyperspace effect)
            p.z -= 15;
            if (p.z <= 0) {
                p.z = 1500;
                p.x = Math.random() * canvas.width;
                p.y = Math.random() * canvas.height;
            }

            // Calculate perspective
            const scale = 1000 / p.z;
            const x2d = (p.x - canvas.width / 2) * scale + canvas.width / 2;
            const y2d = (p.y - canvas.height / 2) * scale + canvas.height / 2;
            const size = p.size * scale;

            // Draw particle with glow
            const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 2);
            gradient.addColorStop(0, 'rgba(0, 212, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            ctx.fill();
        });

        if (document.getElementById('preloader').classList.contains('hidden')) {
            return;
        }
        requestAnimationFrame(animateTunnel);
    }

    animateTunnel();
}

window.onload = () => {
    // Lock body scroll during preloader
    document.body.classList.add('preloader-active');

    // Start particle tunnel animation
    initPreloaderTunnel();

    // Hide preloader with smooth transition (shorter)
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        preloader.classList.add('hidden');

        // Remove body scroll lock
        document.body.classList.remove('preloader-active');

        setTimeout(() => {
            preloader.style.display = 'none';
        }, 1200);
    }, 1000);

    // Initialize Three.js slightly after preloader starts fading
    setTimeout(() => {
        initThree();
        initAnimations();
    }, 400);

    // --- EmailJS Form Handling ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const btn = this.querySelector('.submit-btn');
            const btnText = btn.querySelector('span');
            const originalText = btnText.innerText;

            btnText.innerText = "SENDING...";
            btn.style.opacity = "0.5";

            // These IDs have been updated based on your input
            const serviceID = 'service_jf3oesd';
            const templateID = 'template_kqoi6o4';

            emailjs.sendForm(serviceID, templateID, this)
                .then(() => {
                    btnText.innerText = "TRANSMISSION SENT";
                    btn.style.background = "#00FFAA";
                    btn.style.opacity = "1";
                    this.reset();
                    setTimeout(() => {
                        btnText.innerText = originalText;
                        btn.style.background = "white";
                    }, 3000);
                }, (err) => {
                    btnText.innerText = "ERROR - RETRY";
                    btn.style.background = "#FF5D22";
                    btn.style.opacity = "1";
                    console.error("EmailJS Error:", err);
                });
        });
    }
};
