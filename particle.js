import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ======================================================
// Scene
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// ======================================================
// Camera
// ======================================================

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 8, 20);

// ======================================================
// Renderer
// ======================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================================================
// Orbit Controls
// ======================================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

// ======================================================
// Light
// ======================================================

scene.add(new THREE.AmbientLight(0xffffff, 2));

function createSoftParticleTexture()
{
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.72)");
    gradient.addColorStop(0.55, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
}

const softParticleTexture = createSoftParticleTexture();

const RAIN_GROUND_Y = -4.5;
const MAX_PUDDLES = 96;
const puddles = [];
let nextPuddle = 0;

const rainGround = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({
        color: 0x15232b,
        transparent: true,
        opacity: 0.85
    })
);
rainGround.rotation.x = -Math.PI / 2;
rainGround.position.y = RAIN_GROUND_Y - 0.04;
rainGround.visible = false;
scene.add(rainGround);

const puddleGeometry = new THREE.CircleGeometry(1, 24);
const rippleGeometry = new THREE.RingGeometry(0.68, 0.8, 24);

const FIRE_SOURCE = new THREE.Vector3(2.4, 2.75, -2);
const house = new THREE.Group();
const houseGround = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 32),
    new THREE.MeshStandardMaterial({ color: 0x20271e, roughness: 1 })
);
houseGround.rotation.x = -Math.PI / 2;
houseGround.position.set(0, RAIN_GROUND_Y - 0.06, -2);
scene.add(houseGround);

const houseMaterials = {
    wall: new THREE.MeshStandardMaterial({ color: 0x684b38, roughness: 0.95 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x422a27, roughness: 0.9 }),
    chimney: new THREE.MeshStandardMaterial({ color: 0x65443a, roughness: 1 }),
    foundation: new THREE.MeshStandardMaterial({ color: 0x34312b, roughness: 1 }),
    door: new THREE.MeshStandardMaterial({ color: 0x38271f, roughness: 0.9 }),
    window: new THREE.MeshStandardMaterial({
        color: 0x80502b,
        emissive: 0xff5a13,
        emissiveIntensity: 0.7,
        roughness: 0.5
    })
};

function addHousePart(geometry, material, x, y, z, rotationZ = 0)
{
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.rotation.z = rotationZ;
    house.add(part);
    return part;
}

addHousePart(
    new THREE.BoxGeometry(8, 4, 6),
    houseMaterials.wall,
    0,
    RAIN_GROUND_Y + 2,
    -2
);
addHousePart(
    new THREE.BoxGeometry(8.35, 0.25, 6.35),
    houseMaterials.foundation,
    0,
    RAIN_GROUND_Y + 0.12,
    -2
);
const houseGable = new THREE.Shape();
houseGable.moveTo(-4, 0);
houseGable.lineTo(0, 2);
houseGable.lineTo(4, 0);
houseGable.closePath();
addHousePart(
    new THREE.ShapeGeometry(houseGable),
    houseMaterials.wall,
    0,
    -0.5,
    1.04
);
addHousePart(
    new THREE.BoxGeometry(4.8, 0.24, 6.5),
    houseMaterials.roof,
    -2,
    0.58,
    -2,
    0.48
);
addHousePart(
    new THREE.BoxGeometry(4.8, 0.24, 6.5),
    houseMaterials.roof,
    2,
    0.58,
    -2,
    -0.48
);
addHousePart(
    new THREE.BoxGeometry(0.85, 2.6, 1.05),
    houseMaterials.chimney,
    FIRE_SOURCE.x,
    1.45,
    FIRE_SOURCE.z
);
addHousePart(
    new THREE.BoxGeometry(1.05, 0.18, 1.25),
    houseMaterials.foundation,
    FIRE_SOURCE.x,
    2.8,
    FIRE_SOURCE.z
);
addHousePart(
    new THREE.BoxGeometry(1.5, 2.5, 0.16),
    houseMaterials.door,
    -0.8,
    RAIN_GROUND_Y + 1.3,
    1.08
);

for (const windowX of [-2.5, 2.5])
{
    addHousePart(
        new THREE.BoxGeometry(1.35, 1.35, 0.18),
        houseMaterials.foundation,
        windowX,
        -1.6,
        1.1
    );
    addHousePart(
        new THREE.BoxGeometry(1.05, 1.05, 0.2),
        houseMaterials.window,
        windowX,
        -1.6,
        1.2
    );
}

scene.add(house);

const fireLight = new THREE.PointLight(0xff5a1f, 9, 14, 2);
fireLight.position.copy(FIRE_SOURCE);
scene.add(fireLight);

const waterPool = new THREE.Group();
const poolFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0x35565a,
    roughness: 0.82
});
const poolWallMaterial = new THREE.MeshStandardMaterial({
    color: 0x718681,
    roughness: 0.76
});

const poolFloor = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.8, 14),
    poolFloorMaterial
);
poolFloor.position.y = -0.72;
waterPool.add(poolFloor);

for (const z of [-7.25, 7.25])
{
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(18.5, 1.1, 0.55),
        poolWallMaterial
    );
    wall.position.set(0, -0.15, z);
    waterPool.add(wall);
}

for (const x of [-9.25, 9.25])
{
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.1, 14),
        poolWallMaterial
    );
    wall.position.set(x, -0.15, 0);
    waterPool.add(wall);
}

const waterSurfaceGeometry = new THREE.PlaneGeometry(17, 13, 32, 24);
const waterSurface = new THREE.Mesh(
    waterSurfaceGeometry,
    new THREE.MeshStandardMaterial({
        color: 0x1689a2,
        roughness: 0.24,
        metalness: 0.16,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
    })
);
waterSurface.rotation.x = -Math.PI / 2;
waterSurface.position.y = -0.2;
waterPool.add(waterSurface);
waterPool.visible = false;
scene.add(waterPool);

const cannonScene = new THREE.Group();
cannonScene.visible = false;
scene.add(cannonScene);

const cannonGround = new THREE.Mesh(
    new THREE.PlaneGeometry(52, 28),
    new THREE.MeshStandardMaterial({ color: 0x45423b, roughness: 1 })
);
cannonGround.rotation.x = -Math.PI / 2;
cannonGround.position.y = RAIN_GROUND_Y - 0.06;
cannonScene.add(cannonGround);

const cannon = new THREE.Group();
cannon.position.set(-6.5, -3.05, 0);
cannonScene.add(cannon);

const cannonMetal = new THREE.MeshStandardMaterial({
    color: 0x263238,
    metalness: 0.72,
    roughness: 0.34
});
const cannonWood = new THREE.MeshStandardMaterial({
    color: 0x68452c,
    roughness: 0.88
});

const cannonBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.48, 3.1, 16),
    cannonMetal
);
cannonBarrel.rotation.z = -Math.PI / 2 + 0.12;
cannonBarrel.position.set(0, 0.18, 0);
cannon.add(cannonBarrel);

const cannonMuzzle = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.09, 8, 18),
    cannonMetal
);
cannonMuzzle.position.set(1.52, 0.36, 0);
cannonMuzzle.rotation.y = Math.PI / 2;
cannon.add(cannonMuzzle);

const cannonCarriage = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.38, 1.25),
    cannonWood
);
cannonCarriage.position.set(-0.2, -0.62, 0);
cannon.add(cannonCarriage);

for (const side of [-1, 1])
{
    const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.66, 0.66, 0.2, 20),
        cannonWood
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(-0.2, -0.78, side * 0.7);
    cannon.add(wheel);

    const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.5, 12),
        cannonMetal
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(-0.2, -0.78, 0);
    cannon.add(axle);
}

const cannonball = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshStandardMaterial({
        color: 0x171b1e,
        metalness: 0.82,
        roughness: 0.24
    })
);
cannonball.visible = false;
cannonScene.add(cannonball);

const cannonMuzzlePosition = new THREE.Vector3(-4.98, -2.68, 0);
const cannonImpactPosition = new THREE.Vector3(5, RAIN_GROUND_Y + 0.24, 0);
let cannonballProgress = 0;
let cannonCooldown = 0.4;
let cannonballInFlight = false;
let explosionAge = 0;
let explosionActive = false;
let explosionVelocities = new Float32Array(0);

const cannonSmokeCount = 72;
const cannonSmokeAges = new Float32Array(cannonSmokeCount);
const cannonSmokeLifetimes = new Float32Array(cannonSmokeCount);
const cannonSmokeVelocities = new Float32Array(cannonSmokeCount * 3);
const cannonSmokePositions = new Float32Array(cannonSmokeCount * 3);
const cannonSmokeColors = new Float32Array(cannonSmokeCount * 3);
cannonSmokeAges.fill(-1);

const cannonSmokeGeometry = new THREE.BufferGeometry();
cannonSmokeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(cannonSmokePositions, 3)
);
cannonSmokeGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(cannonSmokeColors, 3)
);
const cannonSmokeMaterial = new THREE.PointsMaterial({
    size: 0.72,
    map: softParticleTexture,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    vertexColors: true
});
const cannonSmokeSystem = new THREE.Points(cannonSmokeGeometry, cannonSmokeMaterial);
cannonSmokeSystem.visible = false;
scene.add(cannonSmokeSystem);

let cannonSmokeCursor = 0;
let cannonSmokeEmissionTimer = 0;

const GRASS_GROUND_Y = -2.2;
const grassScene = new THREE.Group();
grassScene.visible = false;
scene.add(grassScene);

const grassGround = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 38),
    new THREE.MeshStandardMaterial({ color: 0x426b37, roughness: 1 })
);
grassGround.rotation.x = -Math.PI / 2;
grassGround.position.y = GRASS_GROUND_Y - 0.08;
grassScene.add(grassGround);

const grassSun = new THREE.DirectionalLight(0xffedc4, 2.4);
grassSun.position.set(-7, 12, 8);
grassSun.visible = false;
scene.add(grassSun);

const sheep = new THREE.Group();
sheep.position.y = GRASS_GROUND_Y;
grassScene.add(sheep);
const sheepLegPivots = [];
const sheepDestination = new THREE.Vector3();
let sheepWalking = false;
let sheepPauseTimer = 1.2;
let sheepGaitPhase = 0;

function chooseSheepDestination()
{
    sheepDestination.set(
        (Math.random() - 0.5) * 18,
        GRASS_GROUND_Y,
        (Math.random() - 0.5) * 14
    );
    sheepWalking = true;
}

const sheepMaterials = {
    wool: new THREE.MeshStandardMaterial({ color: 0xe9e0ca, roughness: 1 }),
    face: new THREE.MeshStandardMaterial({ color: 0x554b49, roughness: 0.92 }),
    muzzle: new THREE.MeshStandardMaterial({ color: 0xb58d82, roughness: 0.9 }),
    innerEar: new THREE.MeshStandardMaterial({ color: 0xca8582, roughness: 0.9 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x171719, roughness: 0.4 }),
    hoof: new THREE.MeshStandardMaterial({ color: 0x312c29, roughness: 0.95 })
};

function addSheepEllipsoid(material, center, radii)
{
    const ellipsoid = new THREE.Mesh(
        new THREE.SphereGeometry(1, 24, 16),
        material
    );
    ellipsoid.position.set(center[0], center[1], center[2]);
    ellipsoid.scale.set(radii[0], radii[1], radii[2]);
    sheep.add(ellipsoid);
    return ellipsoid;
}

addSheepEllipsoid(sheepMaterials.wool, [0, 0.95, 0], [1.18, 0.86, 1.42]);
addSheepEllipsoid(sheepMaterials.wool, [0, 1.35, -1.12], [0.43, 0.43, 0.48]);
addSheepEllipsoid(sheepMaterials.face, [0, 1.15, 1.22], [0.48, 0.56, 0.48]);
addSheepEllipsoid(sheepMaterials.muzzle, [0, 0.85, 1.62], [0.34, 0.23, 0.2]);

for (const side of [-1, 1])
{
    const ear = addSheepEllipsoid(
        sheepMaterials.face,
        [side * 0.45, 1.55, 1.08],
        [0.14, 0.32, 0.13]
    );
    ear.rotation.z = side * -0.5;

    const innerEar = addSheepEllipsoid(
        sheepMaterials.innerEar,
        [side * 0.45, 1.55, 1.19],
        [0.065, 0.22, 0.045]
    );
    innerEar.rotation.z = side * -0.5;

    addSheepEllipsoid(
        sheepMaterials.eye,
        [side * 0.23, 1.27, 1.63],
        [0.07, 0.08, 0.045]
    );
}

for (const legX of [-0.66, 0.66])
{
    for (const legZ of [-0.88, 0.88])
    {
        const legPivot = new THREE.Group();
        legPivot.position.set(legX, 0.75, legZ);
        legPivot.userData.gaitOffset = legX * legZ > 0 ? 0 : Math.PI;
        sheep.add(legPivot);
        sheepLegPivots.push(legPivot);

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.115, 0.095, 0.74, 8),
            sheepMaterials.face
        );
        leg.position.y = -0.37;
        legPivot.add(leg);

        const hoof = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.15, 0.28),
            sheepMaterials.hoof
        );
        hoof.position.set(0, -0.7, 0.02);
        legPivot.add(hoof);
    }
}

const sheepFurPositions = [];
const sheepFurColors = [];

function addSheepFur(center, radii, strandCount)
{
    for (let strand = 0; strand < strandCount; strand++)
    {
        const vertical = Math.random() * 2 - 1;
        const angle = Math.random() * Math.PI * 2;
        const horizontal = Math.sqrt(1 - vertical * vertical);
        const unitX = horizontal * Math.cos(angle);
        const unitZ = horizontal * Math.sin(angle);
        const normal = new THREE.Vector3(
            unitX / radii[0],
            vertical / radii[1],
            unitZ / radii[2]
        ).normalize();
        const startX = center[0] + unitX * radii[0];
        const startY = center[1] + vertical * radii[1];
        const startZ = center[2] + unitZ * radii[2];
        const strandLength = 0.045 + Math.random() * 0.085;
        const tip = new THREE.Vector3(startX, startY, startZ)
            .addScaledVector(normal, strandLength);
        tip.x += (Math.random() - 0.5) * 0.035;
        tip.z += (Math.random() - 0.5) * 0.035;
        sheepFurPositions.push(startX, startY, startZ, tip.x, tip.y, tip.z);

        const shade = 0.78 + Math.random() * 0.2;
        sheepFurColors.push(shade, shade * 0.97, shade * 0.89);
        sheepFurColors.push(shade, shade * 0.98, shade * 0.92);
    }
}

addSheepFur([0, 0.95, 0], [1.18, 0.86, 1.42], 2600);
addSheepFur([0, 1.35, -1.12], [0.43, 0.43, 0.48], 420);

const sheepFurGeometry = new THREE.BufferGeometry();
sheepFurGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(sheepFurPositions, 3)
);
sheepFurGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(sheepFurColors, 3)
);
const sheepFurMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.92
});
const sheepFur = new THREE.LineSegments(sheepFurGeometry, sheepFurMaterial);
sheep.add(sheepFur);

const magicRaycaster = new THREE.Raycaster();
const magicPointerNdc = new THREE.Vector2();
const magicPointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const magicPointer = new THREE.Vector3();
let magicVelocities = new Float32Array(0);
let magicBurstTimer = 0;

const magicWand = new THREE.Group();
magicWand.visible = false;
scene.add(magicWand);

const wandWood = new THREE.MeshStandardMaterial({
    color: 0x593b2d,
    roughness: 0.64
});
const wandGold = new THREE.MeshStandardMaterial({
    color: 0xffc35d,
    metalness: 0.78,
    roughness: 0.24,
    emissive: 0x754112,
    emissiveIntensity: 0.45
});
const wandCrystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ce7ff,
    emissive: 0x19bddd,
    emissiveIntensity: 1.8,
    roughness: 0.18,
    metalness: 0.18
});

const wandShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.11, 1.9, 10),
    wandWood
);
wandShaft.position.y = -0.25;
magicWand.add(wandShaft);

for (const y of [-0.95, 0.35, 0.58])
{
    const band = new THREE.Mesh(
        new THREE.TorusGeometry(y > 0 ? 0.09 : 0.11, 0.035, 8, 12),
        wandGold
    );
    band.position.y = y;
    magicWand.add(band);
}

const wandCrystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25, 0),
    wandCrystalMaterial
);
wandCrystal.position.y = 0.82;
magicWand.add(wandCrystal);

const wandGlow = new THREE.PointLight(0x43dfff, 2.2, 5);
wandGlow.position.y = 0.82;
magicWand.add(wandGlow);

const magicPulse = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.82, 64),
    new THREE.MeshBasicMaterial({
        color: 0x58eaff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false
    })
);
magicPulse.visible = false;
magicPulse.position.z = 0.3;
scene.add(magicPulse);

// ======================================================
// Variables
// ======================================================

let particleSystem;
let particleGeometry;
let particleMaterial;
let smokeSystem;
let smokeGeometry;
let smokeMaterial;
let grassBladePhases = new Float32Array(0);

let particleCount = 2000;
let currentEffect = "fire";

// ======================================================
// Create Particles
// ======================================================

function createParticles(count)
{
    if (particleSystem)
    {
        scene.remove(particleSystem);
        particleGeometry.dispose();
        particleMaterial.dispose();
    }

    if (smokeSystem)
    {
        scene.remove(smokeSystem);
        smokeGeometry.dispose();
        smokeMaterial.dispose();
        smokeSystem = undefined;
    }

    particleGeometry = new THREE.BufferGeometry();

    const positions = [];
    const colors = [];

    for (let i = 0; i < count; i++)
    {
        let x, y, z;

        switch (currentEffect)
        {
            // FIRE

            case "fire":

                x = FIRE_SOURCE.x + (Math.random() - 0.5) * 0.8;
                y = FIRE_SOURCE.y - 0.35 + Math.random() * 1.1;
                z = FIRE_SOURCE.z + (Math.random() - 0.5) * 0.8;

                colors.push(
                    1,
                    0.2 + Math.random() * 0.55,
                    0.01
                );

                break;

            // WATER

            case "water":

                x = (Math.random() - 0.5) * 16.4;
                y = -0.2;
                z = (Math.random() - 0.5) * 12.4;

                colors.push(
                    0,
                    0.5,
                    1
                );

                break;

            // WEATHER

            case "weather":

                x = (Math.random() - 0.5) * 30;
                y = Math.random() * 20;
                z = (Math.random() - 0.5) * 30;

                colors.push(0.72, 0.88, 1, 0.72, 0.88, 1);

                break;

            // EXPLOSION

            case "explosion":

                x = 0;
                y = 0;
                z = 0;

                colors.push(
                    1,
                    0.2 + Math.random() * 0.65,
                    0.02
                );

                break;

            // GRASS

            case "grass":

                x = (Math.random() - 0.5) * 28;
                y = GRASS_GROUND_Y;
                z = (Math.random() - 0.5) * 22;

                break;

            // MAGIC

            case "magic":

                const radius = 2.2 + Math.random() * 4.8;
                const angle = Math.random() * Math.PI * 2;

                x = magicPointer.x + Math.cos(angle) * radius;
                y = magicPointer.y + Math.sin(angle) * radius;
                z = (Math.random() - 0.5) * 1.6;

                const magicPalette = [
                    [0.18, 0.88, 1],
                    [0.78, 0.28, 1],
                    [1, 0.62, 0.24]
                ];
                colors.push(...magicPalette[i % magicPalette.length]);

                break;
        }

        if (currentEffect === "weather")
        {
            const streakLength = 0.65 + Math.random() * 0.45;
            positions.push(x, y, z, x + 0.04, y - streakLength, z);
        }
        else if (currentEffect === "grass")
        {
            const bladeHeight = 0.24 + Math.random() * 0.72;
            const bend = (Math.random() - 0.5) * 0.16;
            positions.push(x, y, z, x + bend, y + bladeHeight, z + bend * 0.45);
            const green = 0.22 + Math.random() * 0.24;
            colors.push(green * 0.62, green * 0.82, green * 0.42);
            colors.push(green * 0.78, green * 1.24, green * 0.56);
        }
        else
        {
            positions.push(x, y, z);
        }
    }

    particleGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    particleGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
            colors,
            3
        )
    );

    if (currentEffect === "weather" || currentEffect === "grass")
    {
        particleMaterial = currentEffect === "weather"
            ? new THREE.LineBasicMaterial({
                color: 0xaedfff,
                transparent: true,
                opacity: 0.72
            })
            : new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.94
            });
        particleSystem = new THREE.LineSegments(
            particleGeometry,
            particleMaterial
        );
    }
    else
    {
        particleMaterial = new THREE.PointsMaterial({
            size: currentEffect === "fire" ? 0.42 : currentEffect === "explosion" ? 0.24 : currentEffect === "magic" ? 0.2 : 0.15,
            map: currentEffect === "fire" || currentEffect === "magic" ? softParticleTexture : null,
            transparent: currentEffect === "fire" || currentEffect === "explosion" || currentEffect === "magic",
            opacity: currentEffect === "fire" ? 0.92 : 1,
            blending: currentEffect === "fire" || currentEffect === "explosion" || currentEffect === "magic" ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: currentEffect !== "fire" && currentEffect !== "explosion",
            vertexColors: true
        });
        particleSystem = new THREE.Points(
            particleGeometry,
            particleMaterial
        );
    }

    scene.add(particleSystem);

    if (currentEffect === "grass")
    {
        grassBladePhases = new Float32Array(count);
        for (let blade = 0; blade < count; blade++)
        {
            grassBladePhases[blade] = Math.random() * Math.PI * 2;
        }
    }

    if (currentEffect === "explosion")
    {
        particleSystem.visible = false;
        explosionVelocities = new Float32Array(count * 3);
        explosionActive = false;
        cannonballInFlight = false;
        cannonball.visible = false;
        cannonCooldown = 0.4;
        cannonSmokeAges.fill(-1);
        cannonSmokeColors.fill(0);
        cannonSmokeSystem.visible = false;
    }

    if (currentEffect === "magic")
    {
        magicVelocities = new Float32Array(count * 3);
        magicBurstTimer = 0;
    }

    if (currentEffect === "fire")
    {
        const smokeCount = Math.max(120, Math.floor(count * 0.18));
        const smokePositions = [];
        const smokeColors = [];

        for (let i = 0; i < smokeCount; i++)
        {
            smokePositions.push(
                FIRE_SOURCE.x + (Math.random() - 0.5) * 0.65,
                FIRE_SOURCE.y + Math.random() * 3,
                FIRE_SOURCE.z + (Math.random() - 0.5) * 0.65
            );

            const shade = 0.17 + Math.random() * 0.16;
            smokeColors.push(shade, shade * 1.02, shade * 1.08);
        }

        smokeGeometry = new THREE.BufferGeometry();
        smokeGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(smokePositions, 3)
        );
        smokeGeometry.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(smokeColors, 3)
        );
        smokeMaterial = new THREE.PointsMaterial({
            size: 0.9,
            map: softParticleTexture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            vertexColors: true
        });
        smokeSystem = new THREE.Points(smokeGeometry, smokeMaterial);
        scene.add(smokeSystem);
    }
}

createParticles(particleCount);

// ======================================================
// UI
// ======================================================

const effectDropdown =
document.getElementById("effectType");

const particleSlider =
document.getElementById("particleCount");

const countDisplay =
document.getElementById("countDisplay");

effectDropdown.addEventListener("change", () =>
{
    currentEffect = effectDropdown.value;
    createParticles(particleCount);
    rainGround.visible = currentEffect === "weather";
    house.visible = currentEffect === "fire";
    houseGround.visible = currentEffect === "fire";
    fireLight.visible = currentEffect === "fire";
    waterPool.visible = currentEffect === "water";
    cannonScene.visible = currentEffect === "explosion";
    grassScene.visible = currentEffect === "grass";
    grassSun.visible = currentEffect === "grass";
    magicWand.visible = currentEffect === "magic";
    magicPulse.visible = currentEffect === "magic";
    scene.background.set(
        currentEffect === "magic" ? 0x090b20 :
        currentEffect === "grass" ? 0x9bc7d7 :
        0x111111
    );

    if (currentEffect !== "explosion")
    {
        cannonball.visible = false;
        cannonballInFlight = false;
        explosionActive = false;
        cannonSmokeSystem.visible = false;
        cannonSmokeAges.fill(-1);
    }

    if (currentEffect !== "weather")
    {
        for (const puddle of puddles)
        {
            puddle.active = false;
            puddle.disc.visible = false;
            puddle.ripple.visible = false;
        }
    }
});

window.addEventListener("pointermove", event =>
{
    magicPointerNdc.x = event.clientX / window.innerWidth * 2 - 1;
    magicPointerNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;
    magicRaycaster.setFromCamera(magicPointerNdc, camera);
    magicRaycaster.ray.intersectPlane(magicPointerPlane, magicPointer);
});

window.addEventListener("pointerdown", event =>
{
    if (currentEffect !== "magic" || event.button !== 0 || event.target.closest("#ui"))
    {
        return;
    }

    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3)
    {
        const direction = new THREE.Vector3(
            positions[i] - magicPointer.x,
            positions[i + 1] - magicPointer.y,
            positions[i + 2] * 0.4 + (Math.random() - 0.5) * 0.25
        ).normalize();
        const speed = 3.5 + Math.random() * 6;
        magicVelocities[i] = direction.x * speed;
        magicVelocities[i + 1] = direction.y * speed;
        magicVelocities[i + 2] = direction.z * speed;
    }
    magicBurstTimer = 0.42;
});

particleSlider.addEventListener("input", () =>
{
    particleCount = Number(particleSlider.value);

    countDisplay.textContent =
    particleCount;

    createParticles(particleCount);
});

// ======================================================
// Animation
// ======================================================

const clock = new THREE.Clock();

function launchCannonball()
{
    cannonballProgress = 0;
    cannonballInFlight = true;
    cannonSmokeAges.fill(-1);
    cannonSmokeColors.fill(0);
    cannonSmokeEmissionTimer = 0;
    cannonball.position.copy(cannonMuzzlePosition);
    cannonball.visible = true;
    cannonSmokeSystem.visible = true;
    particleSystem.visible = false;
}

function emitCannonSmoke()
{
    const smokeIndex = cannonSmokeCursor;
    const arrayIndex = smokeIndex * 3;
    const offsetX = (Math.random() - 0.5) * 0.22;
    const offsetY = (Math.random() - 0.5) * 0.22;
    const offsetZ = (Math.random() - 0.5) * 0.22;

    cannonSmokePositions[arrayIndex] = cannonball.position.x - 0.16 + offsetX;
    cannonSmokePositions[arrayIndex + 1] = cannonball.position.y + offsetY;
    cannonSmokePositions[arrayIndex + 2] = cannonball.position.z + offsetZ;
    cannonSmokeVelocities[arrayIndex] = -0.75 - Math.random() * 0.6;
    cannonSmokeVelocities[arrayIndex + 1] = 0.25 + Math.random() * 0.55;
    cannonSmokeVelocities[arrayIndex + 2] = (Math.random() - 0.5) * 0.65;
    cannonSmokeAges[smokeIndex] = 0;
    cannonSmokeLifetimes[smokeIndex] = 0.65 + Math.random() * 0.5;
    cannonSmokeCursor = (cannonSmokeCursor + 1) % cannonSmokeCount;
}

function updateCannonSmoke(delta)
{
    if (cannonballInFlight)
    {
        cannonSmokeEmissionTimer += delta;
        while (cannonSmokeEmissionTimer >= 0.045)
        {
            cannonSmokeEmissionTimer -= 0.045;
            emitCannonSmoke();
        }
    }

    let activeSmoke = false;
    for (let smokeIndex = 0; smokeIndex < cannonSmokeCount; smokeIndex++)
    {
        const arrayIndex = smokeIndex * 3;
        if (cannonSmokeAges[smokeIndex] < 0)
        {
            continue;
        }

        const age = cannonSmokeAges[smokeIndex] + delta;
        if (age >= cannonSmokeLifetimes[smokeIndex])
        {
            cannonSmokeAges[smokeIndex] = -1;
            cannonSmokeColors[arrayIndex] = 0;
            cannonSmokeColors[arrayIndex + 1] = 0;
            cannonSmokeColors[arrayIndex + 2] = 0;
            continue;
        }

        activeSmoke = true;
        cannonSmokeAges[smokeIndex] = age;
        cannonSmokePositions[arrayIndex] += cannonSmokeVelocities[arrayIndex] * delta;
        cannonSmokePositions[arrayIndex + 1] += cannonSmokeVelocities[arrayIndex + 1] * delta;
        cannonSmokePositions[arrayIndex + 2] += cannonSmokeVelocities[arrayIndex + 2] * delta;
        cannonSmokeVelocities[arrayIndex] -= 0.12 * delta;

        const fade = 1 - age / cannonSmokeLifetimes[smokeIndex];
        const brightness = (0.25 + Math.random() * 0.08) * fade;
        cannonSmokeColors[arrayIndex] = brightness;
        cannonSmokeColors[arrayIndex + 1] = brightness * 1.03;
        cannonSmokeColors[arrayIndex + 2] = brightness * 1.08;
    }

    cannonSmokeGeometry.attributes.position.needsUpdate = true;
    cannonSmokeGeometry.attributes.color.needsUpdate = true;
    cannonSmokeSystem.visible = cannonballInFlight || activeSmoke;
}

function detonateCannonball()
{
    const positions = particleGeometry.attributes.position.array;
    const colors = particleGeometry.attributes.color.array;

    for (let i = 0; i < positions.length; i += 3)
    {
        positions[i] = cannonImpactPosition.x;
        positions[i + 1] = cannonImpactPosition.y;
        positions[i + 2] = cannonImpactPosition.z;

        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() * 1.1 + 0.15,
            Math.random() - 0.5
        ).normalize();
        const speed = 2.2 + Math.random() * 5.2;
        explosionVelocities[i] = direction.x * speed;
        explosionVelocities[i + 1] = direction.y * speed;
        explosionVelocities[i + 2] = direction.z * speed;

        colors[i] = 1;
        colors[i + 1] = 0.2 + Math.random() * 0.65;
        colors[i + 2] = 0.015;
    }

    explosionAge = 0;
    explosionActive = true;
    particleSystem.visible = true;
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
}

function updateCannon(delta)
{
    if (cannonballInFlight)
    {
        cannonballProgress = Math.min(1, cannonballProgress + delta / 1.5);
        cannonball.position.lerpVectors(
            cannonMuzzlePosition,
            cannonImpactPosition,
            cannonballProgress
        );
        cannonball.position.y += Math.sin(cannonballProgress * Math.PI) * 3.4;

        if (cannonballProgress >= 1)
        {
            cannonball.visible = false;
            cannonballInFlight = false;
            detonateCannonball();
            cannonCooldown = 2.5;
        }
        return;
    }

    if (explosionActive)
    {
        explosionAge += delta;
        const fade = THREE.MathUtils.clamp(1 - explosionAge / 1.5, 0, 1);
        const positions = particleGeometry.attributes.position.array;
        const colors = particleGeometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3)
        {
            explosionVelocities[i + 1] -= 4.8 * delta;
            positions[i] += explosionVelocities[i] * delta;
            positions[i + 1] += explosionVelocities[i + 1] * delta;
            positions[i + 2] += explosionVelocities[i + 2] * delta;

            colors[i] = 0.38 + fade * 0.62;
            colors[i + 1] = 0.12 + fade * 0.58;
            colors[i + 2] = 0.035 + fade * 0.08;
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particleGeometry.attributes.color.needsUpdate = true;

        if (explosionAge >= 1.5)
        {
            explosionActive = false;
            particleSystem.visible = false;
        }
    }

    if (!explosionActive)
    {
        cannonCooldown -= delta;
        if (cannonCooldown <= 0)
        {
            launchCannonball();
        }
    }
}

function spawnPuddle(x, z)
{
    let puddle = puddles[nextPuddle];

    if (!puddle)
    {
        const discMaterial = new THREE.MeshBasicMaterial({
            color: 0x5599b3,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const rippleMaterial = new THREE.MeshBasicMaterial({
            color: 0xb9e9ff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const disc = new THREE.Mesh(puddleGeometry, discMaterial);
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);

        disc.rotation.x = -Math.PI / 2;
        ripple.rotation.x = -Math.PI / 2;
        scene.add(disc, ripple);

        puddle = {
            disc,
            ripple,
            age: 0,
            life: 1,
            size: 1,
            active: false
        };
        puddles[nextPuddle] = puddle;
    }

    nextPuddle = (nextPuddle + 1) % MAX_PUDDLES;
    puddle.age = 0;
    puddle.life = 0.8 + Math.random() * 0.5;
    puddle.size = 0.45 + Math.random() * 0.4;
    puddle.active = true;
    puddle.disc.visible = true;
    puddle.ripple.visible = true;
    puddle.disc.position.set(x, RAIN_GROUND_Y + 0.015, z);
    puddle.ripple.position.set(x, RAIN_GROUND_Y + 0.025, z);
}

function updatePuddles(delta)
{
    for (const puddle of puddles)
    {
        if (!puddle.active)
        {
            continue;
        }

        puddle.age += delta;
        const progress = puddle.age / puddle.life;

        if (progress >= 1)
        {
            puddle.active = false;
            puddle.disc.visible = false;
            puddle.ripple.visible = false;
            continue;
        }

        const fade = 1 - progress;
        puddle.disc.material.opacity = 0.28 * fade;
        puddle.disc.scale.set(
            puddle.size * (0.65 + progress * 0.45),
            puddle.size * (0.38 + progress * 0.24),
            1
        );
        puddle.ripple.material.opacity = 0.85 * fade;
        puddle.ripple.scale.set(
            puddle.size * (0.3 + progress * 1.35),
            puddle.size * (0.18 + progress * 0.85),
            1
        );
    }
}

function animate()
{
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    const positions =
    particleGeometry.attributes.position.array;

    switch (currentEffect)
    {
        // FIRE & SMOKE

        case "fire":

            for (let i = 0; i < positions.length; i += 3)
            {
                const height = positions[i + 1];
                positions[i] += (Math.random() - 0.5) * (0.8 + height * 0.15) * delta;
                positions[i + 2] += (Math.random() - 0.5) * 0.45 * delta;
                positions[i + 1] += (1.3 + Math.random() * 1.7) * delta;

                const heat = THREE.MathUtils.clamp(1 - height / 5, 0, 1);
                const colors = particleGeometry.attributes.color.array;
                colors[i] = 1;
                colors[i + 1] = 0.12 + heat * 0.72;
                colors[i + 2] = heat * 0.12;

                if (positions[i + 1] > 5)
                {
                    positions[i] = FIRE_SOURCE.x + (Math.random() - 0.5) * 0.8;
                    positions[i + 1] = FIRE_SOURCE.y - 0.35 + Math.random() * 0.5;
                    positions[i + 2] = FIRE_SOURCE.z + (Math.random() - 0.5) * 0.8;
                }
            }

            particleGeometry.attributes.color.needsUpdate = true;

            const smokePositions = smokeGeometry.attributes.position.array;
            const smokeColors = smokeGeometry.attributes.color.array;

            for (let i = 0; i < smokePositions.length; i += 3)
            {
                const smokeHeight = smokePositions[i + 1] - FIRE_SOURCE.y;
                const spread = 0.22 + Math.max(0, smokeHeight) * 0.08;
                smokePositions[i] += (
                    Math.sin(elapsed * 0.65 + i) * spread +
                    (Math.random() - 0.5) * spread
                ) * delta;
                smokePositions[i + 1] += (0.45 + Math.random() * 0.45) * delta;
                smokePositions[i + 2] += (
                    Math.cos(elapsed * 0.5 + i) * spread * 0.6 +
                    (Math.random() - 0.5) * spread * 0.7
                ) * delta;

                const density = 1 - THREE.MathUtils.clamp(smokeHeight / 10, 0, 1) * 0.72;
                const shade = 0.3 * density;
                smokeColors[i] = shade;
                smokeColors[i + 1] = shade * 1.02;
                smokeColors[i + 2] = shade * 1.08;

                if (smokePositions[i + 1] > FIRE_SOURCE.y + 10)
                {
                    smokePositions[i] = FIRE_SOURCE.x + (Math.random() - 0.5) * 0.65;
                    smokePositions[i + 1] = FIRE_SOURCE.y + Math.random() * 1.2;
                    smokePositions[i + 2] = FIRE_SOURCE.z + (Math.random() - 0.5) * 0.65;
                }
            }

            smokeGeometry.attributes.position.needsUpdate = true;
            smokeGeometry.attributes.color.needsUpdate = true;
            fireLight.intensity = 7.5 + Math.sin(elapsed * 17) * 1.2 + Math.random() * 0.8;

            break;

        // WATER

        case "water":

            for (let i = 0; i < positions.length; i += 3)
            {
                positions[i + 1] =
                -0.2 + Math.sin(
                    elapsed * 1.5 +
                    positions[i] * 0.45 +
                    positions[i + 2] * 0.55
                ) * 0.055;
            }

            const surfacePositions = waterSurface.geometry.attributes.position;
            for (let i = 0; i < surfacePositions.count; i++)
            {
                const x = surfacePositions.getX(i);
                const z = surfacePositions.getY(i);
                surfacePositions.setZ(
                    i,
                    Math.sin(elapsed * 1.4 + x * 0.42 + z * 0.5) * 0.035 +
                    Math.cos(elapsed * 0.9 - x * 0.28 + z * 0.34) * 0.025
                );
            }
            surfacePositions.needsUpdate = true;
            waterSurface.geometry.computeVertexNormals();

            break;

        // WEATHER

        case "weather":

            for (let i = 0; i < positions.length; i += 6)
            {
                positions[i + 1] -= 10 * delta;
                positions[i + 4] -= 10 * delta;

                if (positions[i + 1] <= RAIN_GROUND_Y)
                {
                    spawnPuddle(positions[i], positions[i + 2]);
                    positions[i + 1] = 15 + Math.random() * 10;
                    positions[i + 4] = positions[i + 1] - 0.9;
                }
            }

            break;

        // EXPLOSION

        case "explosion":

            updateCannon(delta);
            updateCannonSmoke(delta);

            break;

        // GRASS / FUR

        case "grass":

            if (sheepWalking)
            {
                const deltaX = sheepDestination.x - sheep.position.x;
                const deltaZ = sheepDestination.z - sheep.position.z;
                const distance = Math.hypot(deltaX, deltaZ);

                if (distance < 0.28)
                {
                    sheepWalking = false;
                    sheepPauseTimer = 1 + Math.random() * 2;
                }
                else
                {
                    const targetYaw = Math.atan2(deltaX, deltaZ);
                    const turn = Math.atan2(
                        Math.sin(targetYaw - sheep.rotation.y),
                        Math.cos(targetYaw - sheep.rotation.y)
                    );
                    sheep.rotation.y += THREE.MathUtils.clamp(turn, -2.8 * delta, 2.8 * delta);

                    const walkSpeed = Math.min(1.15, distance * 1.4);
                    sheep.position.x += Math.sin(sheep.rotation.y) * walkSpeed * delta;
                    sheep.position.z += Math.cos(sheep.rotation.y) * walkSpeed * delta;
                    sheepGaitPhase += delta * 8.5;
                }
            }
            else
            {
                sheepPauseTimer -= delta;
                if (sheepPauseTimer <= 0)
                {
                    chooseSheepDestination();
                }
            }

            for (let i = 0, blade = 0; i < positions.length; i += 6, blade++)
            {
                const rootX = positions[i];
                const rootZ = positions[i + 2];
                const phase = grassBladePhases[blade];
                positions[i + 3] = rootX + Math.sin(elapsed * 1.25 + phase) * 0.16;
                positions[i + 5] = rootZ + Math.cos(elapsed * 1.05 + phase) * 0.1;
            }

            const furPositions = sheepFurGeometry.attributes.position.array;
            for (let i = 0; i < furPositions.length; i += 6)
            {
                furPositions[i + 3] = furPositions[i] + Math.sin(elapsed * 1.6 + i) * 0.006;
                furPositions[i + 5] = furPositions[i + 2] + Math.cos(elapsed * 1.3 + i) * 0.006;
            }
            sheepFurGeometry.attributes.position.needsUpdate = true;
            sheep.position.y = GRASS_GROUND_Y + Math.sin(elapsed * 1.2) * 0.018 +
                (sheepWalking ? Math.abs(Math.sin(sheepGaitPhase * 2)) * 0.035 : 0);

            for (const legPivot of sheepLegPivots)
            {
                const gait = sheepWalking
                    ? Math.sin(sheepGaitPhase + legPivot.userData.gaitOffset) * 0.32
                    : 0;
                legPivot.rotation.x = THREE.MathUtils.damp(
                    legPivot.rotation.x,
                    gait,
                    8,
                    delta
                );
            }

            break;

        // MAGIC / SCI-FI

        case "magic":

            magicWand.position.lerp(magicPointer, 1 - Math.exp(-delta * 18));
            magicWand.position.z = 0.85;
            magicWand.rotation.z = -0.42 + Math.sin(elapsed * 2.2) * 0.06;
            wandCrystal.rotation.y += delta * 2.8;
            wandCrystal.rotation.x = Math.sin(elapsed * 3.2) * 0.12;
            magicPulse.position.set(magicPointer.x, magicPointer.y, 0.3);
            magicPulse.scale.setScalar(0.85 + Math.sin(elapsed * 6) * 0.12);
            magicPulse.material.opacity = 0.3 + Math.sin(elapsed * 6) * 0.12;

            magicBurstTimer = Math.max(0, magicBurstTimer - delta);

            for (let i = 0; i < positions.length; i += 3)
            {
                const dx = magicPointer.x - positions[i];
                const dy = magicPointer.y - positions[i + 1];
                const distance = Math.max(0.1, Math.hypot(dx, dy));
                const inverseDistance = 1 / distance;
                const pull = magicBurstTimer > 0 ? 0.12 : Math.min(7, distance * 1.8);
                const swirl = magicBurstTimer > 0 ? 0.25 : 1.6;

                magicVelocities[i] += (
                    dx * inverseDistance * pull - dy * inverseDistance * swirl
                ) * delta;
                magicVelocities[i + 1] += (
                    dy * inverseDistance * pull + dx * inverseDistance * swirl
                ) * delta;
                magicVelocities[i + 2] += (-positions[i + 2] * 1.8) * delta;

                const drag = Math.exp(-1.05 * delta);
                magicVelocities[i] *= drag;
                magicVelocities[i + 1] *= drag;
                magicVelocities[i + 2] *= drag;

                positions[i] += magicVelocities[i] * delta;
                positions[i + 1] += magicVelocities[i + 1] * delta;
                positions[i + 2] += magicVelocities[i + 2] * delta;
            }

            break;
    }

    if (currentEffect === "weather")
    {
        updatePuddles(delta);
    }

    particleGeometry.attributes.position.needsUpdate = true;

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();

// ======================================================
// Resize
// ======================================================

window.addEventListener("resize", () =>
{
    camera.aspect =
    window.innerWidth /
    window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});