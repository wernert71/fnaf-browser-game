// ==========================================
// FNAF 3D FREE ROAM ENGINE
// Gebruikt Three.js voor realistische 3D omgevingen
// ==========================================

class FNAFWorld {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentRoom = 'stage';
        this.isActive = false;
        this.animatronics3D = {};
        this.rooms = {};
        this.lights = {};

        // Camera controls
        this.moveSpeed = 0.15;
        this.lookSpeed = 0.002;
        this.keys = { w: false, a: false, s: false, d: false };
        this.mouseX = 0;
        this.mouseY = 0;
        this.pitch = 0;
        this.yaw = 0;

        // Room definitions
        this.roomData = {
            stage: {
                name: 'Hoofdpodium',
                emoji: '🎭',
                size: { width: 20, height: 8, depth: 15 },
                color: 0x4a1a4a,
                floorColor: 0x2a0a2a,
                hasAnimatronics: true,
                connections: ['dining', 'backstage'],
                props: ['stage_platform', 'curtains', 'spotlights']
            },
            dining: {
                name: 'Eetzaal',
                emoji: '🍕',
                size: { width: 25, height: 6, depth: 20 },
                color: 0x3a2a1a,
                floorColor: 0x1a1510,
                hasAnimatronics: false,
                connections: ['stage', 'westHall', 'eastHall', 'pirateCove', 'kitchen', 'backstage'],
                props: ['tables', 'chairs', 'party_decorations']
            },
            westHall: {
                name: 'West Gang',
                emoji: '🚪',
                size: { width: 5, height: 5, depth: 20 },
                color: 0x1a2a3a,
                floorColor: 0x0a1520,
                hasAnimatronics: false,
                connections: ['dining', 'westCorner', 'supplyCloset'],
                props: ['pictures', 'lights']
            },
            westCorner: {
                name: 'West Hoek',
                emoji: '📸',
                size: { width: 6, height: 5, depth: 6 },
                color: 0x1a1a2a,
                floorColor: 0x0a0a15,
                hasAnimatronics: false,
                connections: ['westHall', 'office'],
                props: ['camera', 'door']
            },
            eastHall: {
                name: 'Oost Gang',
                emoji: '🚪',
                size: { width: 5, height: 5, depth: 20 },
                color: 0x1a3a2a,
                floorColor: 0x0a2015,
                hasAnimatronics: false,
                connections: ['dining', 'eastCorner', 'restrooms'],
                props: ['posters', 'lights']
            },
            eastCorner: {
                name: 'Oost Hoek',
                emoji: '📸',
                size: { width: 6, height: 5, depth: 6 },
                color: 0x2a1a2a,
                floorColor: 0x150a15,
                hasAnimatronics: false,
                connections: ['eastHall', 'office'],
                props: ['camera', 'door']
            },
            pirateCove: {
                name: 'Piraten Hoek',
                emoji: '🏴‍☠️',
                size: { width: 10, height: 6, depth: 8 },
                color: 0x4a1a2a,
                floorColor: 0x250a15,
                hasAnimatronics: true,
                connections: ['dining'],
                props: ['curtain', 'stage', 'pirate_decor']
            },
            office: {
                name: 'Beveiligingskantoor',
                emoji: '🖥️',
                size: { width: 8, height: 5, depth: 6 },
                color: 0x2a2a3a,
                floorColor: 0x151520,
                hasAnimatronics: false,
                connections: ['westCorner', 'eastCorner'],
                props: ['desk', 'monitors', 'fan', 'doors']
            },
            supplyCloset: {
                name: 'Voorraadkast',
                emoji: '🧹',
                size: { width: 4, height: 4, depth: 4 },
                color: 0x1a1a1a,
                floorColor: 0x0a0a0a,
                hasAnimatronics: true,
                connections: ['westHall'],
                props: ['shelves', 'endoskeleton']
            },
            restrooms: {
                name: 'Toiletten',
                emoji: '🚻',
                size: { width: 8, height: 5, depth: 6 },
                color: 0x2a3a3a,
                floorColor: 0x152020,
                hasAnimatronics: false,
                connections: ['eastHall'],
                props: ['sinks', 'stalls', 'mirrors']
            },
            kitchen: {
                name: 'Keuken',
                emoji: '🍳',
                size: { width: 10, height: 5, depth: 8 },
                color: 0x3a3a1a,
                floorColor: 0x20200a,
                hasAnimatronics: true,
                connections: ['dining'],
                props: ['counters', 'ovens', 'darkness']
            },
            backstage: {
                name: 'Backstage',
                emoji: '🎪',
                size: { width: 12, height: 5, depth: 8 },
                color: 0x2a1a3a,
                floorColor: 0x150a20,
                hasAnimatronics: true,
                connections: ['stage', 'dining'],
                props: ['suits', 'heads', 'worktable']
            }
        };
    }

    init() {
        const container = document.getElementById('threejs-container');
        if (!container) return;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 1, 25);

        // Camera setup - First person view
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 2, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Add ambient light
        const ambient = new THREE.AmbientLight(0x111111, 0.5);
        this.scene.add(ambient);

        // Build initial room
        this.buildRoom('stage');

        // Event listeners
        this.setupEventListeners();

        // Hide loading
        setTimeout(() => {
            document.getElementById('loading-3d')?.classList.add('hidden');
        }, 1000);

        // Start render loop
        this.isActive = true;
        this.animate();
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });

        // Mouse look
        document.addEventListener('mousemove', (e) => {
            if (!this.isActive || !document.pointerLockElement) return;
            this.yaw -= e.movementX * this.lookSpeed;
            this.pitch -= e.movementY * this.lookSpeed;
            this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
        });

        // Click to enable mouse look
        const container = document.getElementById('threejs-container');
        container?.addEventListener('click', () => {
            if (this.isActive) {
                container.requestPointerLock();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (!this.camera || !this.renderer) return;
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    buildRoom(roomId) {
        // Clear previous room
        this.clearRoom();

        const data = this.roomData[roomId];
        if (!data) return;

        this.currentRoom = roomId;

        // Create room geometry
        const { width, height, depth } = data.size;

        // Floor
        const floorGeo = new THREE.PlaneGeometry(width, depth);
        const floorMat = new THREE.MeshStandardMaterial({
            color: data.floorColor,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(width, depth);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        this.scene.add(ceiling);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.7,
            metalness: 0.1
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            wallMat
        );
        backWall.position.set(0, height / 2, -depth / 2);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Front wall (with doorway)
        const frontWall = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            wallMat
        );
        frontWall.position.set(0, height / 2, depth / 2);
        frontWall.rotation.y = Math.PI;
        this.scene.add(frontWall);

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(depth, height),
            wallMat
        );
        leftWall.position.set(-width / 2, height / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(depth, height),
            wallMat
        );
        rightWall.position.set(width / 2, height / 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);

        // Add room-specific lighting
        this.addRoomLighting(roomId, data);

        // Add props based on room
        this.addRoomProps(roomId, data);

        // Add animatronics if present
        if (data.hasAnimatronics) {
            this.addAnimatronics(roomId);
        }

        // Reset camera position
        this.camera.position.set(0, 2, depth / 3);
        this.pitch = 0;
        this.yaw = 0;

        // Update UI
        this.updateUI(data);
    }

    addRoomLighting(roomId, data) {
        // Main room light
        const pointLight = new THREE.PointLight(0xffaa66, 0.8, 20);
        pointLight.position.set(0, data.size.height - 1, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // Flickering effect for horror atmosphere
        this.lights.main = pointLight;
        this.flickerLight();

        // Add colored accent lights based on room
        if (roomId === 'stage') {
            const spotlight = new THREE.SpotLight(0xff0066, 1, 15, Math.PI / 4);
            spotlight.position.set(0, data.size.height - 0.5, -data.size.depth / 3);
            spotlight.target.position.set(0, 0, -data.size.depth / 3);
            this.scene.add(spotlight);
            this.scene.add(spotlight.target);
        }

        if (roomId === 'pirateCove') {
            const purpleLight = new THREE.PointLight(0x6600ff, 0.5, 10);
            purpleLight.position.set(0, 3, -2);
            this.scene.add(purpleLight);
        }

        if (roomId === 'kitchen') {
            // Kitchen is darker
            pointLight.intensity = 0.2;
        }
    }

    flickerLight() {
        if (!this.lights.main || !this.isActive) return;

        // Random flicker
        const flicker = () => {
            if (!this.isActive) return;
            const intensity = 0.5 + Math.random() * 0.5;
            if (this.lights.main) {
                this.lights.main.intensity = intensity;
            }
            setTimeout(flicker, 100 + Math.random() * 200);
        };
        flicker();
    }

    addRoomProps(roomId, data) {
        switch (roomId) {
            case 'stage':
                this.addStagePlatform(data);
                break;
            case 'dining':
                this.addTables(data);
                break;
            case 'office':
                this.addOfficeDesk(data);
                break;
            case 'pirateCove':
                this.addPirateCurtain(data);
                break;
            case 'backstage':
                this.addBackstageProps(data);
                break;
        }
    }

    addStagePlatform(data) {
        // Stage platform
        const platformGeo = new THREE.BoxGeometry(8, 1, 4);
        const platformMat = new THREE.MeshStandardMaterial({ color: 0x4a3020 });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(0, 0.5, -data.size.depth / 3);
        platform.castShadow = true;
        platform.receiveShadow = true;
        this.scene.add(platform);

        // Curtains (red)
        const curtainMat = new THREE.MeshStandardMaterial({
            color: 0x8b0000,
            roughness: 0.9
        });
        const curtainGeo = new THREE.PlaneGeometry(3, 5);

        const leftCurtain = new THREE.Mesh(curtainGeo, curtainMat);
        leftCurtain.position.set(-5, 2.5, -data.size.depth / 2 + 0.1);
        this.scene.add(leftCurtain);

        const rightCurtain = new THREE.Mesh(curtainGeo, curtainMat);
        rightCurtain.position.set(5, 2.5, -data.size.depth / 2 + 0.1);
        this.scene.add(rightCurtain);
    }

    addTables(data) {
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                // Table top
                const tableGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
                const table = new THREE.Mesh(tableGeo, tableMat);
                table.position.set(
                    -6 + i * 4,
                    1,
                    -4 + j * 4
                );
                table.castShadow = true;
                table.receiveShadow = true;
                this.scene.add(table);

                // Table leg
                const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
                const leg = new THREE.Mesh(legGeo, tableMat);
                leg.position.set(table.position.x, 0.5, table.position.z);
                this.scene.add(leg);
            }
        }
    }

    addOfficeDesk(data) {
        // Desk
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const deskGeo = new THREE.BoxGeometry(4, 1, 1.5);
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.5, 0);
        desk.castShadow = true;
        this.scene.add(desk);

        // Monitors (glowing screens)
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x004400 });
        for (let i = -1; i <= 1; i++) {
            const screenGeo = new THREE.PlaneGeometry(0.8, 0.6);
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.set(i * 1.2, 1.5, -0.5);
            screen.rotation.x = -0.2;
            this.scene.add(screen);
        }

        // Fan
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const fanGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const fan = new THREE.Mesh(fanGeo, fanMat);
        fan.position.set(1.5, 1.2, 0.3);
        fan.rotation.x = Math.PI / 2;
        this.scene.add(fan);
    }

    addPirateCurtain(data) {
        // Purple curtain
        const curtainMat = new THREE.MeshStandardMaterial({
            color: 0x4a0080,
            roughness: 0.9
        });
        const curtainGeo = new THREE.PlaneGeometry(6, 4);
        const curtain = new THREE.Mesh(curtainGeo, curtainMat);
        curtain.position.set(0, 2, -data.size.depth / 2 + 0.5);
        this.scene.add(curtain);

        // "OUT OF ORDER" sign
        const signMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const signGeo = new THREE.PlaneGeometry(2, 0.5);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 3.5, -data.size.depth / 2 + 0.6);
        this.scene.add(sign);
    }

    addBackstageProps(data) {
        // Animatronic suits on wall
        const suitMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

        for (let i = 0; i < 4; i++) {
            // Body
            const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
            const body = new THREE.Mesh(bodyGeo, suitMat);
            body.position.set(-3 + i * 2, 1.5, -data.size.depth / 2 + 1);
            this.scene.add(body);

            // Head
            const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
            const head = new THREE.Mesh(headGeo, suitMat);
            head.position.set(-3 + i * 2, 2.5, -data.size.depth / 2 + 1);
            this.scene.add(head);
        }

        // Worktable with heads
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const tableGeo = new THREE.BoxGeometry(3, 0.1, 1.5);
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(2, 1, 1);
        this.scene.add(table);

        // Heads on table (creepy)
        const headColors = [0x8B4513, 0xD2691E, 0xFFD700];
        headColors.forEach((color, i) => {
            const headMat = new THREE.MeshStandardMaterial({ color });
            const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(1.5 + i * 0.6, 1.3, 1);
            this.scene.add(head);

            // Glowing eyes
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            [-0.1, 0.1].forEach(offset => {
                const eye = new THREE.Mesh(eyeGeo, eyeMat);
                eye.position.set(1.5 + i * 0.6 + offset, 1.35, 1.2);
                this.scene.add(eye);
            });
        });
    }

    addAnimatronics(roomId) {
        const animMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        if (roomId === 'stage') {
            // Freddy, Bonnie, Chica on stage
            const positions = [
                { x: -2, name: 'Bonnie', color: 0x4169E1 },
                { x: 0, name: 'Freddy', color: 0x8B4513 },
                { x: 2, name: 'Chica', color: 0xFFD700 }
            ];

            positions.forEach(pos => {
                const mat = new THREE.MeshStandardMaterial({ color: pos.color });

                // Body
                const bodyGeo = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
                const body = new THREE.Mesh(bodyGeo, mat);
                body.position.set(pos.x, 1.8, -5);
                body.castShadow = true;
                this.scene.add(body);

                // Head
                const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
                const head = new THREE.Mesh(headGeo, mat);
                head.position.set(pos.x, 2.8, -5);
                head.castShadow = true;
                this.scene.add(head);

                // Glowing eyes
                const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
                [-0.15, 0.15].forEach(offset => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(pos.x + offset, 2.85, -4.5);
                    this.scene.add(eye);
                });
            });
        }

        if (roomId === 'pirateCove') {
            // Foxy peeking from curtain
            const foxyMat = new THREE.MeshStandardMaterial({ color: 0xCC4400 });

            // Just visible head/eye
            const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
            const head = new THREE.Mesh(headGeo, foxyMat);
            head.position.set(2, 2, -3.5);
            this.scene.add(head);

            // Glowing eye
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(2.15, 2.1, -3.2);
            this.scene.add(eye);
        }
    }

    clearRoom() {
        // Remove all objects from scene except camera
        while (this.scene && this.scene.children.length > 0) {
            const obj = this.scene.children[0];
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        }
    }

    updateUI(data) {
        const nameEl = document.getElementById('location-name-3d');
        const animEl = document.getElementById('location-animatronics-3d');
        const navEl = document.getElementById('nav-buttons-3d');

        if (nameEl) {
            nameEl.textContent = `${data.emoji} ${data.name}`;
        }

        if (animEl) {
            if (data.hasAnimatronics) {
                animEl.innerHTML = '<span class="warning">⚠️ Animatronics aanwezig!</span>';
            } else {
                animEl.innerHTML = '<span style="color: #666;">De ruimte lijkt leeg...</span>';
            }
        }

        if (navEl) {
            navEl.innerHTML = '';
            data.connections.forEach(connId => {
                const connData = this.roomData[connId];
                if (connData) {
                    const btn = document.createElement('button');
                    btn.className = 'nav-btn-3d';
                    btn.textContent = `${connData.emoji} ${connData.name}`;
                    btn.onclick = () => this.goToRoom(connId);
                    navEl.appendChild(btn);
                }
            });
        }
    }

    goToRoom(roomId) {
        // Fade transition
        const container = document.getElementById('threejs-container');
        if (container) {
            container.style.transition = 'opacity 0.3s';
            container.style.opacity = '0';

            setTimeout(() => {
                this.buildRoom(roomId);
                container.style.opacity = '1';
            }, 300);
        }
    }

    update() {
        if (!this.camera || !this.isActive) return;

        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Movement
        const direction = new THREE.Vector3();

        if (this.keys.w) direction.z -= 1;
        if (this.keys.s) direction.z += 1;
        if (this.keys.a) direction.x -= 1;
        if (this.keys.d) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
            direction.applyQuaternion(this.camera.quaternion);
            direction.y = 0; // Keep on ground level
            direction.normalize();

            this.camera.position.add(direction.multiplyScalar(this.moveSpeed));

            // Clamp to room bounds
            const data = this.roomData[this.currentRoom];
            if (data) {
                const halfW = data.size.width / 2 - 1;
                const halfD = data.size.depth / 2 - 1;
                this.camera.position.x = Math.max(-halfW, Math.min(halfW, this.camera.position.x));
                this.camera.position.z = Math.max(-halfD, Math.min(halfD, this.camera.position.z));
            }
        }
    }

    animate() {
        if (!this.isActive) return;

        requestAnimationFrame(() => this.animate());
        this.update();

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    start() {
        this.isActive = true;
        document.getElementById('loading-3d')?.classList.remove('hidden');

        if (!this.scene) {
            this.init();
        } else {
            this.buildRoom('stage');
            document.getElementById('loading-3d')?.classList.add('hidden');
            this.animate();
        }
    }

    stop() {
        this.isActive = false;
        this.keys = { w: false, a: false, s: false, d: false };

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    dispose() {
        this.stop();
        this.clearRoom();

        if (this.renderer) {
            this.renderer.dispose();
            const container = document.getElementById('threejs-container');
            if (container && this.renderer.domElement) {
                container.removeChild(this.renderer.domElement);
            }
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
    }
}

// Global instance
let fnafWorld = null;

function startFreeRoam3D() {
    if (!fnafWorld) {
        fnafWorld = new FNAFWorld();
    }
    fnafWorld.start();
}

function stopFreeRoam3D() {
    if (fnafWorld) {
        fnafWorld.stop();
    }
}

// Export for use in game.js
window.FNAFWorld = FNAFWorld;
window.startFreeRoam3D = startFreeRoam3D;
window.stopFreeRoam3D = stopFreeRoam3D;
