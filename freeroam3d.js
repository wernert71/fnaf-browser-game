// ==========================================
// FNAF 3D FREE ROAM ENGINE - Enhanced Edition
// First-person exploration like classic FPS games
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
        this.doorways = [];
        this.clock = new THREE.Clock();

        // Enhanced camera controls
        this.moveSpeed = 0.12;
        this.runSpeed = 0.22;
        this.turnSpeed = 0.03;
        this.lookSpeed = 0.002;
        this.isRunning = false;

        // Movement keys (WASD + Arrow keys)
        this.keys = {
            w: false, a: false, s: false, d: false,
            arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
            q: false, e: false, shift: false
        };

        // Camera rotation
        this.pitch = 0;
        this.yaw = 0;
        this.targetYaw = 0;
        this.smoothYaw = 0;

        // Player state
        this.playerHeight = 1.7;
        this.headBob = 0;
        this.footstepTimer = 0;
        this.isMoving = false;
        this.isTransitioning = false; // Prevent rapid door transitions

        // Room definitions with connections and doorway positions
        this.roomData = {
            stage: {
                name: 'Hoofdpodium',
                emoji: '🎭',
                size: { width: 20, height: 8, depth: 15 },
                color: 0x4a1a4a,
                floorColor: 0x2a0a2a,
                ceilingColor: 0x1a0a1a,
                animatronics: ['freddy', 'bonnie', 'chica'],
                doorways: [
                    { to: 'dining', position: { x: 0, z: 7.5 }, rotation: 0 },
                    { to: 'backstage', position: { x: -10, z: 0 }, rotation: Math.PI / 2 }
                ],
                props: ['stage_platform', 'curtains', 'spotlights']
            },
            dining: {
                name: 'Eetzaal',
                emoji: '🍕',
                size: { width: 25, height: 6, depth: 20 },
                color: 0x3a2a1a,
                floorColor: 0x1a1510,
                ceilingColor: 0x151008,
                animatronics: [],
                doorways: [
                    { to: 'stage', position: { x: 0, z: -10 }, rotation: Math.PI },
                    { to: 'westHall', position: { x: -12.5, z: 0 }, rotation: Math.PI / 2 },
                    { to: 'eastHall', position: { x: 12.5, z: 0 }, rotation: -Math.PI / 2 },
                    { to: 'pirateCove', position: { x: 8, z: -10 }, rotation: Math.PI },
                    { to: 'kitchen', position: { x: -8, z: 10 }, rotation: 0 }
                ],
                props: ['tables', 'chairs', 'party_decorations']
            },
            westHall: {
                name: 'West Gang',
                emoji: '🚪',
                size: { width: 5, height: 5, depth: 25 },
                color: 0x1a2a3a,
                floorColor: 0x0a1520,
                ceilingColor: 0x050a10,
                animatronics: [],
                doorways: [
                    { to: 'dining', position: { x: 2.5, z: 0 }, rotation: -Math.PI / 2 },
                    { to: 'westCorner', position: { x: 0, z: 12.5 }, rotation: 0 },
                    { to: 'supplyCloset', position: { x: -2.5, z: -5 }, rotation: Math.PI / 2 }
                ],
                props: ['pictures', 'lights']
            },
            westCorner: {
                name: 'West Hoek',
                emoji: '📸',
                size: { width: 8, height: 5, depth: 8 },
                color: 0x1a1a2a,
                floorColor: 0x0a0a15,
                ceilingColor: 0x05050a,
                animatronics: [],
                doorways: [
                    { to: 'westHall', position: { x: 0, z: -4 }, rotation: Math.PI },
                    { to: 'office', position: { x: 4, z: 0 }, rotation: -Math.PI / 2 }
                ],
                props: ['camera', 'window']
            },
            eastHall: {
                name: 'Oost Gang',
                emoji: '🚪',
                size: { width: 5, height: 5, depth: 25 },
                color: 0x1a3a2a,
                floorColor: 0x0a2015,
                ceilingColor: 0x05100a,
                animatronics: [],
                doorways: [
                    { to: 'dining', position: { x: -2.5, z: 0 }, rotation: Math.PI / 2 },
                    { to: 'eastCorner', position: { x: 0, z: 12.5 }, rotation: 0 },
                    { to: 'restrooms', position: { x: 2.5, z: -5 }, rotation: -Math.PI / 2 }
                ],
                props: ['posters', 'lights']
            },
            eastCorner: {
                name: 'Oost Hoek',
                emoji: '📸',
                size: { width: 8, height: 5, depth: 8 },
                color: 0x2a1a2a,
                floorColor: 0x150a15,
                ceilingColor: 0x0a050a,
                animatronics: [],
                doorways: [
                    { to: 'eastHall', position: { x: 0, z: -4 }, rotation: Math.PI },
                    { to: 'office', position: { x: -4, z: 0 }, rotation: Math.PI / 2 }
                ],
                props: ['camera', 'window']
            },
            pirateCove: {
                name: 'Piraten Hoek',
                emoji: '🏴‍☠️',
                size: { width: 12, height: 6, depth: 10 },
                color: 0x4a1a2a,
                floorColor: 0x250a15,
                ceilingColor: 0x12050a,
                animatronics: ['foxy'],
                doorways: [
                    { to: 'dining', position: { x: 0, z: 5 }, rotation: 0 }
                ],
                props: ['curtain', 'stage', 'pirate_decor']
            },
            office: {
                name: 'Beveiligingskantoor',
                emoji: '🖥️',
                size: { width: 10, height: 5, depth: 8 },
                color: 0x2a2a3a,
                floorColor: 0x151520,
                ceilingColor: 0x0a0a10,
                animatronics: [],
                doorways: [
                    { to: 'westCorner', position: { x: -5, z: 0 }, rotation: Math.PI / 2 },
                    { to: 'eastCorner', position: { x: 5, z: 0 }, rotation: -Math.PI / 2 }
                ],
                props: ['desk', 'monitors', 'fan', 'doors']
            },
            supplyCloset: {
                name: 'Voorraadkast',
                emoji: '🧹',
                size: { width: 5, height: 4, depth: 5 },
                color: 0x1a1a1a,
                floorColor: 0x0a0a0a,
                ceilingColor: 0x050505,
                animatronics: ['endoskeleton'],
                doorways: [
                    { to: 'westHall', position: { x: 2.5, z: 0 }, rotation: -Math.PI / 2 }
                ],
                props: ['shelves', 'endoskeleton']
            },
            restrooms: {
                name: 'Toiletten',
                emoji: '🚻',
                size: { width: 10, height: 5, depth: 8 },
                color: 0x2a3a3a,
                floorColor: 0x152020,
                ceilingColor: 0x0a1010,
                animatronics: [],
                doorways: [
                    { to: 'eastHall', position: { x: -5, z: 0 }, rotation: Math.PI / 2 }
                ],
                props: ['sinks', 'stalls', 'mirrors']
            },
            kitchen: {
                name: 'Keuken',
                emoji: '🍳',
                size: { width: 12, height: 5, depth: 10 },
                color: 0x3a3a1a,
                floorColor: 0x20200a,
                ceilingColor: 0x101005,
                animatronics: [],
                doorways: [
                    { to: 'dining', position: { x: 0, z: -5 }, rotation: Math.PI }
                ],
                props: ['counters', 'ovens', 'pots']
            },
            backstage: {
                name: 'Backstage',
                emoji: '🎪',
                size: { width: 14, height: 5, depth: 10 },
                color: 0x2a1a3a,
                floorColor: 0x150a20,
                ceilingColor: 0x0a0510,
                animatronics: ['spareParts'],
                doorways: [
                    { to: 'stage', position: { x: 7, z: 0 }, rotation: -Math.PI / 2 }
                ],
                props: ['suits', 'heads', 'worktable']
            }
        };

        // Animatronic definitions with animations
        this.animatronicData = {
            freddy: {
                name: 'Freddy Fazbear',
                color: 0x8B4513,
                position: { x: 0, y: 0, z: -5 },
                eyeColor: 0x00ff00,
                idleAnim: 'breathe',
                hasHat: true,
                hasMic: true
            },
            bonnie: {
                name: 'Bonnie',
                color: 0x4169E1,
                position: { x: -3, y: 0, z: -5 },
                eyeColor: 0xff0000,
                idleAnim: 'sway',
                hasGuitar: true
            },
            chica: {
                name: 'Chica',
                color: 0xFFD700,
                position: { x: 3, y: 0, z: -5 },
                eyeColor: 0xff00ff,
                idleAnim: 'lookAround',
                hasCupcake: true
            },
            foxy: {
                name: 'Foxy',
                color: 0xCC4400,
                position: { x: 0, y: 0, z: -3 },
                eyeColor: 0xffff00,
                idleAnim: 'peek',
                hasHook: true,
                behindCurtain: true
            },
            endoskeleton: {
                name: 'Endoskeleton',
                color: 0x555555,
                position: { x: 0, y: 0, z: 0 },
                eyeColor: 0xff0000,
                idleAnim: 'twitch'
            },
            spareParts: {
                name: 'Spare Parts',
                color: 0x444444,
                position: { x: -3, y: 0, z: -3 },
                eyeColor: 0xff0000,
                idleAnim: 'stare',
                isHead: true
            }
        };
    }

    init() {
        const container = document.getElementById('threejs-container');
        if (!container) return;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.025); // Less fog for better visibility

        // Camera setup - First person view
        this.camera = new THREE.PerspectiveCamera(
            80, // Wider FOV for immersion
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, this.playerHeight, 5);

        // Renderer setup with better quality
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2; // Brighter exposure
        container.appendChild(this.renderer.domElement);

        // Ambient light (brighter for better visibility)
        const ambient = new THREE.AmbientLight(0x334455, 0.8);
        this.scene.add(ambient);

        // Global hemisphere light for outdoor feel
        const hemi = new THREE.HemisphereLight(0x8899aa, 0x222233, 0.4);
        this.scene.add(hemi);

        // Build initial room
        this.buildRoom('stage');

        // Event listeners
        this.setupEventListeners();

        // Add crosshair
        this.addCrosshair();

        // Hide loading
        setTimeout(() => {
            document.getElementById('loading-3d')?.classList.add('hidden');
        }, 1500);

        // Start render loop
        this.isActive = true;
        this.animate();
    }

    addCrosshair() {
        const crosshair = document.createElement('div');
        crosshair.className = 'crosshair';
        crosshair.id = 'crosshair-3d';
        document.getElementById('freeroam-3d-hud')?.appendChild(crosshair);
    }

    setupEventListeners() {
        // Keyboard down
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                e.preventDefault();
            }
            if (key === 'shift') this.isRunning = true;
        });

        // Keyboard up
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
            if (key === 'shift') this.isRunning = false;
        });

        // Mouse look (with pointer lock)
        document.addEventListener('mousemove', (e) => {
            if (!this.isActive || !document.pointerLockElement) return;
            this.yaw -= e.movementX * this.lookSpeed;
            this.pitch -= e.movementY * this.lookSpeed;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        });

        // Click to enable mouse look
        const container = document.getElementById('threejs-container');
        container?.addEventListener('click', () => {
            if (this.isActive && !document.pointerLockElement) {
                container.requestPointerLock();
            }
        });

        // Escape to exit pointer lock
        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement && this.isActive) {
                // Show hint that click will re-enable look
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

        // Floor with texture-like pattern
        const floorGeo = new THREE.PlaneGeometry(width, depth, 10, 10);
        const floorMat = new THREE.MeshStandardMaterial({
            color: data.floorColor,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Floor tiles pattern
        this.addFloorPattern(width, depth, data.floorColor);

        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(width, depth);
        const ceilingMat = new THREE.MeshStandardMaterial({
            color: data.ceilingColor || 0x1a1a1a,
            roughness: 0.95
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        this.scene.add(ceiling);

        // Walls
        this.buildWalls(data, width, height, depth);

        // Add doorways
        this.buildDoorways(data, height);

        // Add room-specific lighting
        this.addRoomLighting(roomId, data);

        // Add props based on room
        this.addRoomProps(roomId, data);

        // Add animatronics if present
        if (data.animatronics && data.animatronics.length > 0) {
            this.addAnimatronics(roomId, data.animatronics);
        }

        // Reset camera position
        this.camera.position.set(0, this.playerHeight, depth / 3);
        this.pitch = 0;
        this.yaw = 0;

        // Update UI
        this.updateUI(data);
    }

    addFloorPattern(width, depth, baseColor) {
        const tileSize = 2;
        const tileMat1 = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.85
        });
        const tileMat2 = new THREE.MeshStandardMaterial({
            color: new THREE.Color(baseColor).multiplyScalar(0.8),
            roughness: 0.85
        });

        for (let x = -width / 2; x < width / 2; x += tileSize) {
            for (let z = -depth / 2; z < depth / 2; z += tileSize) {
                const isAlt = ((Math.floor(x / tileSize) + Math.floor(z / tileSize)) % 2 === 0);
                const tileGeo = new THREE.PlaneGeometry(tileSize * 0.95, tileSize * 0.95);
                const tile = new THREE.Mesh(tileGeo, isAlt ? tileMat1 : tileMat2);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(x + tileSize / 2, 0.01, z + tileSize / 2);
                this.scene.add(tile);
            }
        }
    }

    buildWalls(data, width, height, depth) {
        const wallMat = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.05
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            wallMat
        );
        backWall.position.set(0, height / 2, -depth / 2);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Front wall
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

        // Add wall details (baseboards, etc)
        this.addWallDetails(width, height, depth, data.color);
    }

    addWallDetails(width, height, depth, wallColor) {
        const baseboardMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(wallColor).multiplyScalar(0.5),
            roughness: 0.6
        });

        // Baseboards
        const baseboardHeight = 0.15;
        const positions = [
            { x: 0, z: -depth / 2 + 0.05, rot: 0, len: width },
            { x: 0, z: depth / 2 - 0.05, rot: Math.PI, len: width },
            { x: -width / 2 + 0.05, z: 0, rot: Math.PI / 2, len: depth },
            { x: width / 2 - 0.05, z: 0, rot: -Math.PI / 2, len: depth }
        ];

        positions.forEach(pos => {
            const geo = new THREE.BoxGeometry(pos.len, baseboardHeight, 0.05);
            const baseboard = new THREE.Mesh(geo, baseboardMat);
            baseboard.position.set(pos.x, baseboardHeight / 2, pos.z);
            baseboard.rotation.y = pos.rot;
            this.scene.add(baseboard);
        });
    }

    buildDoorways(data, height) {
        if (!data.doorways) return;

        data.doorways.forEach(doorway => {
            const doorWidth = 2.0;
            const doorHeight = 2.8;

            // Door frame - wooden frame around opening
            const frameMat = new THREE.MeshStandardMaterial({
                color: 0x5a3a1a,
                roughness: 0.6
            });

            // Top frame
            const topFrameGeo = new THREE.BoxGeometry(doorWidth + 0.4, 0.2, 0.25);
            const topFrame = new THREE.Mesh(topFrameGeo, frameMat);
            topFrame.position.set(doorway.position.x, doorHeight, doorway.position.z);
            topFrame.rotation.y = doorway.rotation;
            this.scene.add(topFrame);

            // Left frame
            const sideFrameGeo = new THREE.BoxGeometry(0.15, doorHeight, 0.25);
            const leftFrame = new THREE.Mesh(sideFrameGeo, frameMat);
            const rightFrame = new THREE.Mesh(sideFrameGeo, frameMat);

            // Calculate offset based on rotation
            const offsetX = Math.cos(doorway.rotation + Math.PI / 2) * (doorWidth / 2 + 0.1);
            const offsetZ = Math.sin(doorway.rotation + Math.PI / 2) * (doorWidth / 2 + 0.1);

            leftFrame.position.set(
                doorway.position.x - offsetX,
                doorHeight / 2,
                doorway.position.z - offsetZ
            );
            leftFrame.rotation.y = doorway.rotation;
            this.scene.add(leftFrame);

            rightFrame.position.set(
                doorway.position.x + offsetX,
                doorHeight / 2,
                doorway.position.z + offsetZ
            );
            rightFrame.rotation.y = doorway.rotation;
            this.scene.add(rightFrame);

            // Door opening - visible dark passage suggesting another room
            const openingMat = new THREE.MeshBasicMaterial({
                color: 0x0a0a12,
                transparent: true,
                opacity: 0.85
            });
            const openingGeo = new THREE.PlaneGeometry(doorWidth, doorHeight);
            const opening = new THREE.Mesh(openingGeo, openingMat);
            opening.position.set(doorway.position.x, doorHeight / 2, doorway.position.z);
            opening.rotation.y = doorway.rotation;
            this.scene.add(opening);

            // Glowing floor strip at doorway (like EXIT path lighting)
            const stripMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
            const stripGeo = new THREE.PlaneGeometry(doorWidth - 0.2, 0.3);
            const strip = new THREE.Mesh(stripGeo, stripMat);
            strip.rotation.x = -Math.PI / 2;
            strip.rotation.z = doorway.rotation;
            strip.position.set(doorway.position.x, 0.02, doorway.position.z);
            this.scene.add(strip);

            // Store doorway for collision/interaction
            this.doorways.push({
                ...doorway,
                bounds: {
                    minX: doorway.position.x - doorWidth / 2,
                    maxX: doorway.position.x + doorWidth / 2,
                    minZ: doorway.position.z - 0.5,
                    maxZ: doorway.position.z + 0.5
                }
            });

            // Add illuminated sign above door
            this.addDoorSign(doorway, doorHeight);
        });
    }

    addDoorSign(doorway, doorHeight) {
        const targetRoom = this.roomData[doorway.to];
        if (!targetRoom) return;

        // EXIT-style illuminated sign box
        const signBoxMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const signBoxGeo = new THREE.BoxGeometry(2, 0.5, 0.15);
        const signBox = new THREE.Mesh(signBoxGeo, signBoxMat);
        signBox.position.set(
            doorway.position.x,
            doorHeight + 0.35,
            doorway.position.z
        );
        signBox.rotation.y = doorway.rotation;
        this.scene.add(signBox);

        // Glowing sign face
        const signMat = new THREE.MeshBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.95
        });
        const signGeo = new THREE.PlaneGeometry(1.8, 0.4);
        const sign = new THREE.Mesh(signGeo, signMat);

        // Position slightly in front of sign box
        const signOffsetX = Math.sin(doorway.rotation) * 0.08;
        const signOffsetZ = Math.cos(doorway.rotation) * 0.08;
        sign.position.set(
            doorway.position.x + signOffsetX,
            doorHeight + 0.35,
            doorway.position.z + signOffsetZ
        );
        sign.rotation.y = doorway.rotation;
        this.scene.add(sign);

        // Bright light illuminating the doorway
        const signLight = new THREE.PointLight(0x44ff66, 1.0, 6);
        signLight.position.set(
            doorway.position.x,
            doorHeight + 0.5,
            doorway.position.z
        );
        this.scene.add(signLight);

        // Additional warm light inside doorway
        const innerLight = new THREE.PointLight(0xffaa66, 0.6, 4);
        const innerOffsetX = -Math.sin(doorway.rotation) * 1;
        const innerOffsetZ = -Math.cos(doorway.rotation) * 1;
        innerLight.position.set(
            doorway.position.x + innerOffsetX,
            2,
            doorway.position.z + innerOffsetZ
        );
        this.scene.add(innerLight);
    }

    addRoomLighting(roomId, data) {
        const height = data.size.height;
        const width = data.size.width;
        const depth = data.size.depth;

        // Main ceiling light (BRIGHTER)
        const mainLight = new THREE.PointLight(0xffeedd, 1.2, 25);
        mainLight.position.set(0, height - 0.5, 0);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 512;
        mainLight.shadow.mapSize.height = 512;
        this.scene.add(mainLight);
        this.lights.main = mainLight;

        // Additional ceiling lights spread across room
        const numLightsX = Math.ceil(width / 8);
        const numLightsZ = Math.ceil(depth / 8);
        for (let i = 0; i < numLightsX; i++) {
            for (let j = 0; j < numLightsZ; j++) {
                const extraLight = new THREE.PointLight(0xffffee, 0.6, 12);
                extraLight.position.set(
                    -width / 2 + (i + 0.5) * (width / numLightsX),
                    height - 0.8,
                    -depth / 2 + (j + 0.5) * (depth / numLightsZ)
                );
                this.scene.add(extraLight);

                // Visible light fixture
                const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
                const fixtureGeo = new THREE.BoxGeometry(0.6, 0.1, 0.3);
                const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
                fixture.position.copy(extraLight.position);
                fixture.position.y = height - 0.05;
                this.scene.add(fixture);
            }
        }

        // Subtle flickering effect (less intense)
        this.startLightFlicker();

        // Room-specific lighting
        switch (roomId) {
            case 'stage':
                // Bright spotlights on stage
                const colors = [0xff0066, 0x0066ff, 0x00ff66];
                colors.forEach((color, i) => {
                    const spot = new THREE.SpotLight(color, 1.5, 20, Math.PI / 5);
                    spot.position.set(-4 + i * 4, height - 1, 2);
                    spot.target.position.set(-4 + i * 4, 0, -5);
                    this.scene.add(spot);
                    this.scene.add(spot.target);
                });
                break;

            case 'pirateCove':
                const purpleLight = new THREE.PointLight(0x9900ff, 0.8, 12);
                purpleLight.position.set(0, 3, -2);
                this.scene.add(purpleLight);
                // Extra atmosphere light
                const redLight = new THREE.PointLight(0xff3300, 0.4, 8);
                redLight.position.set(-3, 2, 0);
                this.scene.add(redLight);
                break;

            case 'kitchen':
                // Kitchen is darker but still visible
                mainLight.intensity = 0.5;
                // Stove glow
                const stoveGlow = new THREE.PointLight(0xff6600, 0.4, 5);
                stoveGlow.position.set(-3, 0.5, -depth / 2 + 1);
                this.scene.add(stoveGlow);
                break;

            case 'office':
                // Monitor glow (brighter)
                const monitorGlow = new THREE.PointLight(0x00ff00, 0.8, 8);
                monitorGlow.position.set(0, 1.5, -2);
                this.scene.add(monitorGlow);
                // Red button lights
                const redBtn = new THREE.PointLight(0xff0000, 0.3, 3);
                redBtn.position.set(-4, 1.2, 0);
                this.scene.add(redBtn);
                const redBtn2 = new THREE.PointLight(0xff0000, 0.3, 3);
                redBtn2.position.set(4, 1.2, 0);
                this.scene.add(redBtn2);
                break;

            case 'backstage':
                // Eerie red light
                const eerieLight = new THREE.PointLight(0xff2200, 0.5, 10);
                eerieLight.position.set(0, 2, -2);
                this.scene.add(eerieLight);
                break;

            case 'supplyCloset':
                // Single dim bulb
                mainLight.intensity = 0.8;
                mainLight.color.setHex(0xffcc88);
                break;
        }

        // Door lights - illuminate doorways
        if (data.doorways) {
            data.doorways.forEach(doorway => {
                const doorLight = new THREE.PointLight(0x88ff88, 0.6, 5);
                doorLight.position.set(doorway.position.x, 2.8, doorway.position.z);
                this.scene.add(doorLight);
            });
        }
    }

    startLightFlicker() {
        const flicker = () => {
            if (!this.isActive || !this.lights.main) return;

            // Subtle flicker (less dramatic)
            const rand = Math.random();
            if (rand < 0.01) {
                // Rare brief dim
                this.lights.main.intensity = 0.8;
            } else {
                // Normal with slight variation
                this.lights.main.intensity = 1.1 + Math.random() * 0.2;
            }

            setTimeout(flicker, 100 + Math.random() * 300);
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
                this.addPartyDecorations(data);
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
            case 'kitchen':
                this.addKitchenProps(data);
                break;
            case 'restrooms':
                this.addRestroomProps(data);
                break;
            case 'supplyCloset':
                this.addClosetProps(data);
                break;
        }

        // Add posters/pictures to halls
        if (roomId.includes('Hall') || roomId.includes('Corner')) {
            this.addHallwayProps(data);
        }
    }

    addStagePlatform(data) {
        const depth = data.size.depth;

        // Stage platform
        const platformGeo = new THREE.BoxGeometry(12, 1.2, 5);
        const platformMat = new THREE.MeshStandardMaterial({
            color: 0x4a3020,
            roughness: 0.8
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(0, 0.6, -depth / 2 + 3);
        platform.castShadow = true;
        platform.receiveShadow = true;
        this.scene.add(platform);

        // Stage steps
        const stepGeo = new THREE.BoxGeometry(4, 0.3, 0.8);
        for (let i = 0; i < 3; i++) {
            const step = new THREE.Mesh(stepGeo, platformMat);
            step.position.set(0, 0.15 + i * 0.3, -depth / 2 + 5.5 + i * 0.6);
            this.scene.add(step);
        }

        // Curtains
        const curtainMat = new THREE.MeshStandardMaterial({
            color: 0x8b0000,
            roughness: 0.95,
            side: THREE.DoubleSide
        });

        [-7, 7].forEach(x => {
            const curtainGeo = new THREE.PlaneGeometry(4, 6);
            const curtain = new THREE.Mesh(curtainGeo, curtainMat);
            curtain.position.set(x, 4, -depth / 2 + 1);
            // Add wave effect
            const positions = curtain.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const y = positions.getY(i);
                positions.setZ(i, Math.sin(y * 2) * 0.3);
            }
            this.scene.add(curtain);
        });

        // Star decorations on back wall
        for (let i = 0; i < 10; i++) {
            const starMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const starGeo = new THREE.CircleGeometry(0.1, 5);
            const star = new THREE.Mesh(starGeo, starMat);
            star.position.set(
                -8 + Math.random() * 16,
                3 + Math.random() * 3,
                -depth / 2 + 0.1
            );
            this.scene.add(star);
        }
    }

    addTables(data) {
        const tableMat = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.7
        });
        const chairMat = new THREE.MeshStandardMaterial({
            color: 0x2a1a0a,
            roughness: 0.8
        });

        const tablePositions = [
            { x: -6, z: -4 }, { x: 0, z: -4 }, { x: 6, z: -4 },
            { x: -6, z: 2 }, { x: 0, z: 2 }, { x: 6, z: 2 },
            { x: -6, z: 8 }, { x: 0, z: 8 }, { x: 6, z: 8 }
        ];

        tablePositions.forEach(pos => {
            // Round table
            const tableGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 24);
            const table = new THREE.Mesh(tableGeo, tableMat);
            table.position.set(pos.x, 0.9, pos.z);
            table.castShadow = true;
            this.scene.add(table);

            // Table leg
            const legGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.9, 8);
            const leg = new THREE.Mesh(legGeo, tableMat);
            leg.position.set(pos.x, 0.45, pos.z);
            this.scene.add(leg);

            // Chairs around table
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const chairX = pos.x + Math.cos(angle) * 1.8;
                const chairZ = pos.z + Math.sin(angle) * 1.8;

                // Chair seat
                const seatGeo = new THREE.BoxGeometry(0.5, 0.08, 0.5);
                const seat = new THREE.Mesh(seatGeo, chairMat);
                seat.position.set(chairX, 0.5, chairZ);
                this.scene.add(seat);

                // Chair back
                const backGeo = new THREE.BoxGeometry(0.5, 0.6, 0.08);
                const back = new THREE.Mesh(backGeo, chairMat);
                back.position.set(
                    chairX - Math.cos(angle) * 0.25,
                    0.8,
                    chairZ - Math.sin(angle) * 0.25
                );
                back.rotation.y = angle;
                this.scene.add(back);
            }

            // Pizza or cake on some tables
            if (Math.random() > 0.5) {
                const pizzaMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
                const pizzaGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
                const pizza = new THREE.Mesh(pizzaGeo, pizzaMat);
                pizza.position.set(pos.x, 0.97, pos.z);
                this.scene.add(pizza);
            }
        });
    }

    addPartyDecorations(data) {
        // Balloons
        const balloonColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        for (let i = 0; i < 15; i++) {
            const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
            const balloonMat = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.3,
                metalness: 0.1
            });
            const balloonGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const balloon = new THREE.Mesh(balloonGeo, balloonMat);
            balloon.position.set(
                -10 + Math.random() * 20,
                4 + Math.random() * 1.5,
                -8 + Math.random() * 16
            );
            balloon.scale.y = 1.2;
            this.scene.add(balloon);

            // String
            const stringMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
            const stringGeo = new THREE.CylinderGeometry(0.01, 0.01, 1);
            const string = new THREE.Mesh(stringGeo, stringMat);
            string.position.set(balloon.position.x, balloon.position.y - 0.7, balloon.position.z);
            this.scene.add(string);
        }

        // Birthday banner
        const bannerMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            side: THREE.DoubleSide
        });
        const bannerGeo = new THREE.PlaneGeometry(6, 0.8);
        const banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 4.5, -9);
        this.scene.add(banner);
    }

    addOfficeDesk(data) {
        const depth = data.size.depth;

        // Large desk
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const deskGeo = new THREE.BoxGeometry(6, 0.8, 2);
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.4, -depth / 2 + 1.5);
        desk.castShadow = true;
        this.scene.add(desk);

        // Monitors with screens
        const monitorPositions = [-1.5, 0, 1.5];
        monitorPositions.forEach(x => {
            // Monitor frame
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const frameGeo = new THREE.BoxGeometry(1, 0.8, 0.1);
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(x, 1.2, -depth / 2 + 1);
            this.scene.add(frame);

            // Screen (glowing)
            const screenMat = new THREE.MeshBasicMaterial({ color: 0x003300 });
            const screenGeo = new THREE.PlaneGeometry(0.85, 0.65);
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.set(x, 1.2, -depth / 2 + 1.06);
            this.scene.add(screen);

            // Static lines on screen
            for (let i = 0; i < 5; i++) {
                const lineMat = new THREE.MeshBasicMaterial({
                    color: 0x004400,
                    transparent: true,
                    opacity: 0.5
                });
                const lineGeo = new THREE.PlaneGeometry(0.8, 0.02);
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.position.set(x, 0.95 + i * 0.12, -depth / 2 + 1.07);
                this.scene.add(line);
            }
        });

        // Fan
        const fanBaseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const fanBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16);
        const fanBase = new THREE.Mesh(fanBaseGeo, fanBaseMat);
        fanBase.position.set(2.5, 0.85, -depth / 2 + 1.5);
        this.scene.add(fanBase);

        // Fan cage
        const fanCageGeo = new THREE.TorusGeometry(0.25, 0.02, 8, 16);
        const fanCage = new THREE.Mesh(fanCageGeo, fanBaseMat);
        fanCage.position.set(2.5, 1.1, -depth / 2 + 1.3);
        this.scene.add(fanCage);

        // Coffee mug
        const mugMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const mugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
        const mug = new THREE.Mesh(mugGeo, mugMat);
        mug.position.set(-2.2, 0.88, -depth / 2 + 1.5);
        this.scene.add(mug);

        // Papers
        const paperMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for (let i = 0; i < 3; i++) {
            const paperGeo = new THREE.PlaneGeometry(0.3, 0.4);
            const paper = new THREE.Mesh(paperGeo, paperMat);
            paper.position.set(-1.8 + i * 0.15, 0.82, -depth / 2 + 1.8 - i * 0.1);
            paper.rotation.x = -Math.PI / 2;
            paper.rotation.z = Math.random() * 0.3 - 0.15;
            this.scene.add(paper);
        }

        // Door buttons (for atmosphere)
        [-4, 4].forEach(x => {
            const btnMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const btnGeo = new THREE.BoxGeometry(0.3, 0.5, 0.1);
            const btn = new THREE.Mesh(btnGeo, btnMat);
            btn.position.set(x, 1.2, 0);
            this.scene.add(btn);
        });
    }

    addPirateCurtain(data) {
        const depth = data.size.depth;

        // Large purple curtain
        const curtainMat = new THREE.MeshStandardMaterial({
            color: 0x4a0080,
            roughness: 0.95,
            side: THREE.DoubleSide
        });
        const curtainGeo = new THREE.PlaneGeometry(8, 5);
        const curtain = new THREE.Mesh(curtainGeo, curtainMat);
        curtain.position.set(0, 2.5, -depth / 2 + 1);

        // Add wave effect
        const positions = curtain.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            positions.setZ(i, Math.sin(x * 1.5) * 0.2 + Math.sin(y * 2) * 0.15);
        }
        curtain.geometry.attributes.position.needsUpdate = true;
        curtain.geometry.computeVertexNormals();
        this.scene.add(curtain);

        // "OUT OF ORDER" sign
        const signMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const signGeo = new THREE.PlaneGeometry(2.5, 0.6);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 4, -depth / 2 + 1.1);
        this.scene.add(sign);

        // Pirate decorations
        const decorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.8, 12);
        const barrel = new THREE.Mesh(barrelGeo, decorMat);
        barrel.position.set(-3, 0.4, -depth / 2 + 2);
        this.scene.add(barrel);

        // Anchor symbol on wall
        const anchorMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const anchorGeo = new THREE.RingGeometry(0.3, 0.4, 6);
        const anchor = new THREE.Mesh(anchorGeo, anchorMat);
        anchor.position.set(4, 2, -depth / 2 + 0.1);
        this.scene.add(anchor);
    }

    addBackstageProps(data) {
        const depth = data.size.depth;

        // Work table
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        const tableGeo = new THREE.BoxGeometry(4, 0.8, 1.5);
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(3, 0.4, 0);
        this.scene.add(table);

        // Empty suits hanging on wall
        const suitMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
        for (let i = 0; i < 4; i++) {
            // Body
            const bodyGeo = new THREE.CapsuleGeometry(0.35, 1, 4, 8);
            const body = new THREE.Mesh(bodyGeo, suitMat);
            body.position.set(-5 + i * 2.5, 1.8, -depth / 2 + 1);
            this.scene.add(body);

            // Head (empty)
            const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
            const head = new THREE.Mesh(headGeo, suitMat);
            head.position.set(-5 + i * 2.5, 2.8, -depth / 2 + 1);
            this.scene.add(head);

            // Empty eye holes
            const eyeHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            [-0.12, 0.12].forEach(offset => {
                const eyeGeo = new THREE.CircleGeometry(0.08, 8);
                const eye = new THREE.Mesh(eyeGeo, eyeHoleMat);
                eye.position.set(-5 + i * 2.5 + offset, 2.85, -depth / 2 + 1.4);
                this.scene.add(eye);
            });
        }

        // Heads on table (creepy)
        const headColors = [0x8B4513, 0x4169E1, 0xFFD700, 0xCC4400];
        headColors.forEach((color, i) => {
            const headMat = new THREE.MeshStandardMaterial({ color });
            const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(2 + i * 0.7, 1.1, 0);
            this.scene.add(head);

            // Glowing eyes
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            [-0.1, 0.1].forEach(offset => {
                const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
                const eye = new THREE.Mesh(eyeGeo, eyeMat);
                eye.position.set(2 + i * 0.7 + offset, 1.15, 0.25);
                this.scene.add(eye);
            });
        });

        // Tools
        const toolMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const wrenchGeo = new THREE.BoxGeometry(0.05, 0.3, 0.02);
        const wrench = new THREE.Mesh(wrenchGeo, toolMat);
        wrench.position.set(1.5, 0.95, -0.3);
        wrench.rotation.z = 0.3;
        this.scene.add(wrench);
    }

    addKitchenProps(data) {
        const depth = data.size.depth;

        // Counter along back wall
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const counterGeo = new THREE.BoxGeometry(10, 1, 1);
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.set(0, 0.5, -depth / 2 + 1);
        this.scene.add(counter);

        // Oven
        const ovenMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ovenGeo = new THREE.BoxGeometry(1.5, 1.5, 1);
        const oven = new THREE.Mesh(ovenGeo, ovenMat);
        oven.position.set(-3, 0.75, -depth / 2 + 1);
        this.scene.add(oven);

        // Oven door
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const doorGeo = new THREE.PlaneGeometry(1.2, 0.8);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(-3, 0.6, -depth / 2 + 1.51);
        this.scene.add(door);

        // Pots and pans
        const potMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        const potGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.3, 16);
        const pot = new THREE.Mesh(potGeo, potMat);
        pot.position.set(2, 1.15, -depth / 2 + 1);
        this.scene.add(pot);

        // Hanging utensils
        for (let i = 0; i < 5; i++) {
            const utensilGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
            const utensil = new THREE.Mesh(utensilGeo, potMat);
            utensil.position.set(-2 + i * 0.3, 2.5, -depth / 2 + 0.5);
            this.scene.add(utensil);
        }

        // Dark atmosphere - camera broken text
        const textMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const textGeo = new THREE.PlaneGeometry(2, 0.5);
        const text = new THREE.Mesh(textGeo, textMat);
        text.position.set(0, 3, 0);
        text.rotation.x = -0.3;
        this.scene.add(text);
    }

    addRestroomProps(data) {
        const depth = data.size.depth;

        // Sinks
        const sinkMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        for (let i = 0; i < 3; i++) {
            const sinkGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4);
            const sink = new THREE.Mesh(sinkGeo, sinkMat);
            sink.position.set(-2 + i * 1.5, 0.9, -depth / 2 + 0.7);
            this.scene.add(sink);

            // Mirror above sink
            const mirrorMat = new THREE.MeshStandardMaterial({
                color: 0x888899,
                metalness: 0.9,
                roughness: 0.1
            });
            const mirrorGeo = new THREE.PlaneGeometry(0.5, 0.7);
            const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
            mirror.position.set(-2 + i * 1.5, 1.6, -depth / 2 + 0.51);
            this.scene.add(mirror);
        }

        // Stalls
        const stallMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
        for (let i = 0; i < 3; i++) {
            // Stall walls
            const wallGeo = new THREE.BoxGeometry(0.05, 2, 1.5);
            const wall = new THREE.Mesh(wallGeo, stallMat);
            wall.position.set(-2 + i * 1.5, 1, depth / 2 - 1.25);
            this.scene.add(wall);

            // Door
            const doorGeo = new THREE.BoxGeometry(1, 1.8, 0.05);
            const door = new THREE.Mesh(doorGeo, stallMat);
            door.position.set(-1.5 + i * 1.5, 1, depth / 2 - 0.5);
            this.scene.add(door);
        }

        // Wet floor sign
        const signMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const signGeo = new THREE.ConeGeometry(0.3, 0.6, 4);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(2, 0.3, 1);
        this.scene.add(sign);
    }

    addClosetProps(data) {
        const depth = data.size.depth;

        // Shelves
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
        for (let i = 0; i < 3; i++) {
            const shelfGeo = new THREE.BoxGeometry(data.size.width - 1, 0.1, 0.8);
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(0, 1 + i * 1, -depth / 2 + 0.5);
            this.scene.add(shelf);
        }

        // Cleaning supplies
        const supplyMat = new THREE.MeshStandardMaterial({ color: 0x0066ff });
        for (let i = 0; i < 4; i++) {
            const bottleGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8);
            const bottle = new THREE.Mesh(bottleGeo, supplyMat);
            bottle.position.set(-1 + i * 0.5, 1.2, -depth / 2 + 0.5);
            this.scene.add(bottle);
        }

        // Mop and bucket
        const bucketMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const bucketGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 12);
        const bucket = new THREE.Mesh(bucketGeo, bucketMat);
        bucket.position.set(1, 0.15, 1);
        this.scene.add(bucket);

        const mopGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
        const mop = new THREE.Mesh(mopGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        mop.position.set(1.2, 0.75, 1);
        mop.rotation.z = 0.1;
        this.scene.add(mop);
    }

    addHallwayProps(data) {
        const depth = data.size.depth;
        const width = data.size.width;

        // Pictures on walls
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
        const pictureMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

        for (let i = 0; i < 3; i++) {
            // Frame
            const frameGeo = new THREE.BoxGeometry(0.8, 1, 0.05);
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(-width / 2 + 0.05, 2, -depth / 3 + i * (depth / 3));
            frame.rotation.y = Math.PI / 2;
            this.scene.add(frame);

            // Picture
            const pictureGeo = new THREE.PlaneGeometry(0.65, 0.85);
            const picture = new THREE.Mesh(pictureGeo, pictureMat);
            picture.position.set(-width / 2 + 0.08, 2, -depth / 3 + i * (depth / 3));
            picture.rotation.y = Math.PI / 2;
            this.scene.add(picture);
        }

        // Ceiling lights
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        for (let i = 0; i < Math.floor(depth / 5); i++) {
            const lightGeo = new THREE.BoxGeometry(0.5, 0.1, 0.3);
            const light = new THREE.Mesh(lightGeo, lightMat);
            light.position.set(0, data.size.height - 0.1, -depth / 2 + 2 + i * 5);
            this.scene.add(light);
        }
    }

    addAnimatronics(roomId, animatronicIds) {
        animatronicIds.forEach(id => {
            const animData = this.animatronicData[id];
            if (!animData) return;

            const animatronic = this.createAnimatronic(animData, roomId);
            if (animatronic) {
                this.animatronics3D[id] = animatronic;
                this.scene.add(animatronic.group);
            }
        });
    }

    createAnimatronic(data, roomId) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.6,
            metalness: 0.2
        });

        // Body
        const bodyGeo = new THREE.CapsuleGeometry(0.45, 1.2, 8, 16);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 1.3;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(0.5, 24, 24);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 2.4;
        head.castShadow = true;
        group.add(head);

        // Eyes (glowing)
        const eyeMat = new THREE.MeshBasicMaterial({ color: data.eyeColor });
        [-0.15, 0.15].forEach(offset => {
            const eyeGeo = new THREE.SphereGeometry(0.1, 12, 12);
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(offset, 2.5, 0.4);
            group.add(eye);

            // Eye glow light
            const eyeLight = new THREE.PointLight(data.eyeColor, 0.3, 2);
            eyeLight.position.copy(eye.position);
            group.add(eyeLight);
        });

        // Snout/muzzle
        const snoutGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.2, 12);
        const snout = new THREE.Mesh(snoutGeo, mat);
        snout.position.set(0, 2.3, 0.45);
        snout.rotation.x = Math.PI / 2;
        group.add(snout);

        // Ears
        if (!data.isHead) {
            const earGeo = new THREE.SphereGeometry(0.15, 12, 12);
            [-0.35, 0.35].forEach(offset => {
                const ear = new THREE.Mesh(earGeo, mat);
                ear.position.set(offset, 2.85, 0);
                ear.scale.y = 1.3;
                group.add(ear);
            });
        }

        // Arms
        if (!data.isHead) {
            const armGeo = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
            [-0.6, 0.6].forEach((offset, i) => {
                const arm = new THREE.Mesh(armGeo, mat);
                arm.position.set(offset, 1.3, 0);
                arm.rotation.z = offset > 0 ? -0.3 : 0.3;
                group.add(arm);
            });
        }

        // Legs
        if (!data.isHead) {
            const legGeo = new THREE.CapsuleGeometry(0.15, 0.5, 4, 8);
            [-0.25, 0.25].forEach(offset => {
                const leg = new THREE.Mesh(legGeo, mat);
                leg.position.set(offset, 0.4, 0);
                group.add(leg);
            });
        }

        // Special accessories
        if (data.hasHat) {
            const hatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const hatGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 16);
            const hat = new THREE.Mesh(hatGeo, hatMat);
            hat.position.set(0, 2.95, 0);
            group.add(hat);

            const brimGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16);
            const brim = new THREE.Mesh(brimGeo, hatMat);
            brim.position.set(0, 2.75, 0);
            group.add(brim);
        }

        if (data.hasMic) {
            const micMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const micGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
            const mic = new THREE.Mesh(micGeo, micMat);
            mic.position.set(0.5, 1.5, 0.3);
            mic.rotation.x = Math.PI / 4;
            group.add(mic);
        }

        if (data.hasGuitar) {
            const guitarMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
            const guitarBodyGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const guitarBody = new THREE.Mesh(guitarBodyGeo, guitarMat);
            guitarBody.position.set(-0.4, 1.2, 0.4);
            guitarBody.scale.set(1, 0.6, 0.3);
            group.add(guitarBody);
        }

        if (data.hasCupcake) {
            const plateMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
            const plateGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(0.5, 1.5, 0.3);
            group.add(plate);

            const cupcakeMat = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
            const cupcakeGeo = new THREE.ConeGeometry(0.1, 0.15, 12);
            const cupcake = new THREE.Mesh(cupcakeGeo, cupcakeMat);
            cupcake.position.set(0.5, 1.6, 0.3);
            group.add(cupcake);
        }

        if (data.hasHook) {
            const hookMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
            const hookGeo = new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI);
            const hook = new THREE.Mesh(hookGeo, hookMat);
            hook.position.set(0.6, 1.3, 0.2);
            hook.rotation.z = Math.PI;
            group.add(hook);
        }

        // Position in room
        group.position.set(data.position.x, data.position.y, data.position.z);

        // Special positioning
        if (data.behindCurtain && roomId === 'pirateCove') {
            group.position.z = -3;
            group.visible = true; // Partially visible
        }

        return {
            group,
            data,
            animationTime: Math.random() * Math.PI * 2,
            head: head
        };
    }

    animateAnimatronics(delta) {
        Object.values(this.animatronics3D).forEach(anim => {
            if (!anim || !anim.group) return;

            anim.animationTime += delta;
            const t = anim.animationTime;

            switch (anim.data.idleAnim) {
                case 'breathe':
                    // Subtle breathing
                    anim.group.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
                    break;

                case 'sway':
                    // Side to side sway
                    anim.group.rotation.y = Math.sin(t * 0.8) * 0.1;
                    break;

                case 'lookAround':
                    // Head looking around
                    if (anim.head) {
                        anim.head.rotation.y = Math.sin(t * 0.5) * 0.3;
                        anim.head.rotation.x = Math.sin(t * 0.3) * 0.1;
                    }
                    break;

                case 'peek':
                    // Foxy peeking
                    anim.group.position.x = Math.sin(t * 0.3) * 0.2;
                    break;

                case 'twitch':
                    // Endoskeleton twitching
                    if (Math.random() < 0.01) {
                        anim.group.rotation.z = (Math.random() - 0.5) * 0.2;
                        setTimeout(() => {
                            if (anim.group) anim.group.rotation.z = 0;
                        }, 100);
                    }
                    break;

                case 'stare':
                    // Just staring at player (head follows camera)
                    if (anim.head && this.camera) {
                        const lookDir = new THREE.Vector3();
                        lookDir.subVectors(this.camera.position, anim.group.position);
                        anim.head.rotation.y = Math.atan2(lookDir.x, lookDir.z);
                    }
                    break;
            }

            // Random eye flicker
            anim.group.children.forEach(child => {
                if (child.type === 'PointLight') {
                    child.intensity = 0.2 + Math.random() * 0.2;
                }
            });
        });
    }

    clearRoom() {
        this.doorways = [];
        this.animatronics3D = {};

        if (!this.scene) return;

        // Remove all objects except camera
        while (this.scene.children.length > 0) {
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

        this.lights = {};
    }

    updateUI(data) {
        const nameEl = document.getElementById('location-name-3d');
        const animEl = document.getElementById('location-animatronics-3d');
        const hintEl = document.getElementById('door-hint-3d');

        if (nameEl) {
            nameEl.textContent = `${data.emoji} ${data.name}`;
        }

        if (animEl) {
            if (data.animatronics && data.animatronics.length > 0) {
                const names = data.animatronics.map(id => {
                    const a = this.animatronicData[id];
                    return a ? a.name : id;
                }).join(', ');
                animEl.innerHTML = `<span class="warning">⚠️ ${names}</span>`;
            } else {
                animEl.innerHTML = '<span style="color: #666;">De ruimte lijkt leeg...</span>';
            }
        }

        // Hide door hint when entering new room
        if (hintEl) {
            hintEl.classList.remove('visible');
        }
    }

    hideDoorHint() {
        const hintEl = document.getElementById('door-hint-3d');
        if (hintEl) {
            hintEl.classList.remove('visible');
        }
    }

    goToRoom(roomId) {
        // Fade transition
        const container = document.getElementById('threejs-container');
        if (container) {
            container.style.transition = 'opacity 0.4s';
            container.style.opacity = '0';

            // Play door sound
            if (typeof playSound === 'function') {
                playSound('door');
            }

            setTimeout(() => {
                this.buildRoom(roomId);
                container.style.opacity = '1';
            }, 400);
        }
    }

    checkDoorwayCollision() {
        if (!this.camera || this.isTransitioning) return;

        const playerPos = this.camera.position;
        let nearDoor = false;

        for (const doorway of this.doorways) {
            const distX = Math.abs(playerPos.x - doorway.position.x);
            const distZ = Math.abs(playerPos.z - doorway.position.z);

            // Check if player walks through doorway (trigger zone)
            if (distX < 1.2 && distZ < 1.0) {
                // Trigger room transition!
                this.walkThroughDoor(doorway.to);
                return;
            }

            // Show proximity hint when near door
            if (distX < 3.0 && distZ < 3.0) {
                this.showDoorHint(doorway.to);
                nearDoor = true;
            }
        }

        // Hide hint if not near any door
        if (!nearDoor) {
            this.hideDoorHint();
        }
    }

    walkThroughDoor(roomId) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Play door sound
        if (typeof playSound === 'function') {
            playSound('door');
        }

        // Screen fade effect
        const container = document.getElementById('threejs-container');
        if (container) {
            container.style.transition = 'opacity 0.3s';
            container.style.opacity = '0';

            setTimeout(() => {
                this.buildRoom(roomId);
                container.style.opacity = '1';

                // Cooldown before next transition
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 500);
            }, 300);
        } else {
            this.buildRoom(roomId);
            setTimeout(() => {
                this.isTransitioning = false;
            }, 500);
        }
    }

    showDoorHint(roomId) {
        const targetRoom = this.roomData[roomId];
        if (!targetRoom) return;

        // Update hint text (optional visual feedback)
        const hintEl = document.getElementById('door-hint-3d');
        if (hintEl) {
            hintEl.textContent = `→ ${targetRoom.emoji} ${targetRoom.name}`;
            hintEl.classList.add('visible');
        }
    }

    update() {
        if (!this.camera || !this.isActive) return;

        const delta = this.clock.getDelta();

        // Update camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Handle keyboard turning (Q/E or without pointer lock)
        if (this.keys.q) {
            this.yaw += this.turnSpeed;
        }
        if (this.keys.e) {
            this.yaw -= this.turnSpeed;
        }

        // Movement direction
        const direction = new THREE.Vector3();
        const forward = this.keys.w || this.keys.arrowup;
        const backward = this.keys.s || this.keys.arrowdown;
        const left = this.keys.a || this.keys.arrowleft;
        const right = this.keys.d || this.keys.arrowright;

        if (forward) direction.z -= 1;
        if (backward) direction.z += 1;
        if (left) direction.x -= 1;
        if (right) direction.x += 1;

        this.isMoving = direction.length() > 0;

        if (this.isMoving) {
            direction.normalize();
            direction.applyQuaternion(this.camera.quaternion);
            direction.y = 0;
            direction.normalize();

            const speed = this.isRunning ? this.runSpeed : this.moveSpeed;
            this.camera.position.add(direction.multiplyScalar(speed));

            // Head bob effect
            this.headBob += delta * (this.isRunning ? 15 : 10);
            const bobAmount = this.isRunning ? 0.08 : 0.04;
            this.camera.position.y = this.playerHeight + Math.sin(this.headBob) * bobAmount;

            // Footstep sounds
            this.footstepTimer += delta;
            if (this.footstepTimer > (this.isRunning ? 0.3 : 0.5)) {
                this.footstepTimer = 0;
                // Play footstep sound if available
            }

            // Clamp to room bounds
            const data = this.roomData[this.currentRoom];
            if (data) {
                const halfW = data.size.width / 2 - 0.5;
                const halfD = data.size.depth / 2 - 0.5;
                this.camera.position.x = Math.max(-halfW, Math.min(halfW, this.camera.position.x));
                this.camera.position.z = Math.max(-halfD, Math.min(halfD, this.camera.position.z));
            }
        } else {
            // Reset to standing height when not moving
            this.camera.position.y = this.playerHeight;
        }

        // Check doorway collision
        this.checkDoorwayCollision();

        // Animate animatronics
        this.animateAnimatronics(delta);
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
        this.keys = {
            w: false, a: false, s: false, d: false,
            arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
            q: false, e: false, shift: false
        };

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    dispose() {
        this.stop();
        this.clearRoom();

        // Remove crosshair
        document.getElementById('crosshair-3d')?.remove();

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
