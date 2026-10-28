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

function createFlameParticleTexture()
{
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 96;

    const context = canvas.getContext("2d");
    const flameGradient = context.createLinearGradient(0, 4, 0, 96);
    flameGradient.addColorStop(0, "rgba(255,255,255,0)");
    flameGradient.addColorStop(0.18, "rgba(255,255,255,0.42)");
    flameGradient.addColorStop(0.52, "rgba(255,255,255,0.86)");
    flameGradient.addColorStop(0.82, "rgba(255,255,255,0.92)");
    flameGradient.addColorStop(1, "rgba(255,255,255,0)");

    context.beginPath();
    context.moveTo(32, 95);
    context.bezierCurveTo(10, 81, 11, 61, 23, 43);
    context.bezierCurveTo(31, 31, 31, 20, 39, 5);
    context.bezierCurveTo(43, 26, 60, 39, 55, 60);
    context.bezierCurveTo(68, 79, 51, 92, 32, 95);
    context.closePath();
    context.fillStyle = flameGradient;
    context.fill();

    const coreGradient = context.createRadialGradient(32, 74, 2, 32, 70, 24);
    coreGradient.addColorStop(0, "rgba(255,255,255,0.9)");
    coreGradient.addColorStop(0.55, "rgba(255,255,255,0.42)");
    coreGradient.addColorStop(1, "rgba(255,255,255,0)");
    context.beginPath();
    context.ellipse(32, 73, 11, 21, 0, 0, Math.PI * 2);
    context.fillStyle = coreGradient;
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createWaterTextures()
{
    const size = 256;
    const colorCanvas = document.createElement("canvas");
    const normalCanvas = document.createElement("canvas");
    colorCanvas.width = size;
    colorCanvas.height = size;
    normalCanvas.width = size;
    normalCanvas.height = size;

    const colorContext = colorCanvas.getContext("2d");
    const normalContext = normalCanvas.getContext("2d");
    const colorImage = colorContext.createImageData(size, size);
    const normalImage = normalContext.createImageData(size, size);
    const heights = new Float32Array(size * size);

    for (let y = 0; y < size; y++)
    {
        const v = y / size * Math.PI * 2;
        for (let x = 0; x < size; x++)
        {
            const u = x / size * Math.PI * 2;
            const index = y * size + x;
            const ripple = Math.sin(u * 3 + Math.sin(v * 2)) *
                Math.cos(v * 5 - u * 2);
            const fineRipples = Math.sin(u * 9 + v * 7) * 0.22 +
                Math.sin(v * 13 - u * 4) * 0.12;
            const height = ripple * 0.5 + fineRipples;
            heights[index] = height;

            const variation = Math.max(0, ripple * 0.5 + fineRipples + 0.22);
            const grain = (
                Math.sin(u * 37 + v * 53) * Math.sin(v * 41 - u * 29) + 1
            ) * 2.5;
            const pixelIndex = index * 4;
            colorImage.data[pixelIndex] = 9 + variation * 24 + grain * 0.22;
            colorImage.data[pixelIndex + 1] = 83 + variation * 75 + grain;
            colorImage.data[pixelIndex + 2] = 103 + variation * 84 + grain;
            colorImage.data[pixelIndex + 3] = 255;
        }
    }

    for (let y = 0; y < size; y++)
    {
        for (let x = 0; x < size; x++)
        {
            const index = y * size + x;
            const left = y * size + (x + size - 1) % size;
            const right = y * size + (x + 1) % size;
            const above = ((y + size - 1) % size) * size + x;
            const below = ((y + 1) % size) * size + x;
            const normalX = (heights[left] - heights[right]) * 2.4;
            const normalY = (heights[above] - heights[below]) * 2.4;
            const inverseLength = 1 / Math.hypot(normalX, normalY, 1);
            const pixelIndex = index * 4;
            normalImage.data[pixelIndex] = (normalX * inverseLength * 0.5 + 0.5) * 255;
            normalImage.data[pixelIndex + 1] = (normalY * inverseLength * 0.5 + 0.5) * 255;
            normalImage.data[pixelIndex + 2] = (inverseLength * 0.5 + 0.5) * 255;
            normalImage.data[pixelIndex + 3] = 255;
        }
    }

    colorContext.putImageData(colorImage, 0, 0);
    normalContext.putImageData(normalImage, 0, 0);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    for (const texture of [colorMap, normalMap])
    {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2.5, 2);
        texture.colorSpace = THREE.NoColorSpace;
    }
    colorMap.colorSpace = THREE.SRGBColorSpace;

    return { colorMap, normalMap };
}

function createPoolTileTexture()
{
    const size = 256;
    const tileCount = 8;
    const tileSize = size / tileCount;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    context.fillStyle = "#b8c9c5";
    context.fillRect(0, 0, size, size);

    for (let row = 0; row < tileCount; row++)
    {
        for (let column = 0; column < tileCount; column++)
        {
            const variation = Math.floor(Math.random() * 14);
            const red = 57 + variation;
            const green = 127 + variation;
            const blue = 139 + variation;
            context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            context.fillRect(
                column * tileSize + 2,
                row * tileSize + 2,
                tileSize - 4,
                tileSize - 4
            );
            context.fillStyle = "rgba(255, 255, 255, 0.12)";
            context.fillRect(
                column * tileSize + 3,
                row * tileSize + 3,
                tileSize - 6,
                2
            );
        }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(5, 4);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
}

function getFireParticleOrigin()
{
    const rebuildStart = FIRE_SPREAD_DURATION + FIRE_COLLAPSE_DURATION;
    const spread = fireCycleAge < FIRE_SPREAD_DURATION
        ? THREE.MathUtils.clamp(
            (fireCycleAge - 1.2) / (FIRE_SPREAD_DURATION - 1.2),
            0,
            1
        )
        : fireCycleAge < rebuildStart
            ? 1
            : 1 - THREE.MathUtils.clamp(
                (fireCycleAge - rebuildStart) / FIRE_REBUILD_DURATION,
                0,
                1
            );

    if (Math.random() > spread)
    {
        return {
            x: FIRE_SOURCE.x + (Math.random() - 0.5) * 0.3,
            y: FIRE_SOURCE.y - 0.18 + Math.random() * 0.2,
            z: FIRE_SOURCE.z + (Math.random() - 0.5) * 0.3
        };
    }

    if (Math.random() < 0.42)
    {
        return {
            x: (Math.random() - 0.5) * 7.2,
            y: -3.3 + Math.random() * 2.7,
            z: 1.14 + Math.random() * 0.12
        };
    }

    const roofX = (Math.random() - 0.5) * 3.8;
    return {
        x: roofX,
        y: 0.55 + Math.random() * 0.55,
        z: -2 + (roofX < 0 ? -1 : 1) * (2 - Math.abs(roofX) * 0.48)
    };
}

const softParticleTexture = createSoftParticleTexture();
const flameParticleTexture = createFlameParticleTexture();

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
const houseParts = [];
const housePartCorner = new THREE.Vector3();
let fireCycleAge = 0;
const FIRE_SPREAD_DURATION = 7.5;
const FIRE_COLLAPSE_DURATION = 3;
const FIRE_REBUILD_DURATION = 4;
const FIRE_CYCLE_DURATION = FIRE_SPREAD_DURATION + FIRE_COLLAPSE_DURATION + FIRE_REBUILD_DURATION;
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
    houseParts.push({
        mesh: part,
        startPosition: part.position.clone(),
        startRotation: part.rotation.clone(),
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3()
    });
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
const poolTileMap = createPoolTileTexture();
const poolFloorMaterial = new THREE.MeshStandardMaterial({
    color: 0xd3e0dc,
    map: poolTileMap,
    roughness: 0.72
});
const poolWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0e5df,
    map: poolTileMap,
    roughness: 0.7
});
const poolCopingMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9c3bd,
    roughness: 0.78
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

function addPoolCoping(width, depth, x, z)
{
    const coping = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.18, depth),
        poolCopingMaterial
    );
    coping.position.set(x, 0.49, z);
    waterPool.add(coping);
}

addPoolCoping(18.9, 0.78, 0, -7.25);
addPoolCoping(18.9, 0.78, 0, 7.25);
addPoolCoping(0.78, 13.8, -9.25, 0);
addPoolCoping(0.78, 13.8, 9.25, 0);

const poolLight = new THREE.DirectionalLight(0xe4f7ff, 1.8);
poolLight.position.set(-5, 9, 7);
poolLight.target.position.set(0, -0.4, 0);
waterPool.add(poolLight, poolLight.target);

const waterSurfaceGeometry = new THREE.PlaneGeometry(17, 13, 32, 24);
const waterTextures = createWaterTextures();
const waterSurface = new THREE.Mesh(
    waterSurfaceGeometry,
    new THREE.MeshPhysicalMaterial({
        color: 0xb5e3e8,
        map: waterTextures.colorMap,
        normalMap: waterTextures.normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.9,
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
let cannonFlashAge = 1;
let explosionAge = 0;
let explosionActive = false;
let explosionVelocities = new Float32Array(0);

const cannonFlash = new THREE.Group();
cannonFlash.position.copy(cannonMuzzlePosition);
cannonFlash.visible = false;
cannonScene.add(cannonFlash);

const cannonFlashOuterMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4b0b,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const cannonFlashInnerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdf75,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const cannonFlashOuter = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    cannonFlashOuterMaterial
);
cannonFlashOuter.scale.set(0.82, 0.32, 0.32);
cannonFlash.add(cannonFlashOuter);
const cannonFlashInner = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    cannonFlashInnerMaterial
);
cannonFlashInner.position.x = 0.16;
cannonFlashInner.scale.set(0.48, 0.2, 0.2);
cannonFlash.add(cannonFlashInner);
const cannonFlashLight = new THREE.PointLight(0xff6a20, 0, 5, 2);
cannonFlashLight.position.copy(cannonMuzzlePosition);
cannonScene.add(cannonFlashLight);

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
// PARTICLE SYSTEM: cannonball smoke trail.
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
// PARTICLE SYSTEM: sheep coat / fur strands.
const sheepFur = new THREE.LineSegments(sheepFurGeometry, sheepFurMaterial);
sheep.add(sheepFur);

const magicRaycaster = new THREE.Raycaster();
const magicPointerNdc = new THREE.Vector2();
const magicPointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const magicPointer = new THREE.Vector3();
let magicVelocities = new Float32Array(0);
let magicParticleAges = new Float32Array(0);
let magicParticleLifetimes = new Float32Array(0);
let magicEmissionCursor = 0;
let magicEmissionTimer = 0;
let magicBurstAge = -1;
const magicPreviousWandPosition = new THREE.Vector3();
const MAGIC_PALETTE = [
    [0.18, 0.88, 1],
    [0.78, 0.28, 1],
    [1, 0.62, 0.24]
];

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
let fireParticleAges = new Float32Array(0);
let fireParticleLifetimes = new Float32Array(0);
let fireParticleVelocities = new Float32Array(0);
let fireSmokeAges = new Float32Array(0);
let fireSmokeLifetimes = new Float32Array(0);
let fireSmokeVelocities = new Float32Array(0);
let grassBladePhases = new Float32Array(0);

let particleCount = 2000;
let currentEffect = "fire";

// ======================================================
// PARTICLE SYSTEM: create or rebuild particles for the selected effect.
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

    if (currentEffect === "fire")
    {
        fireParticleAges = new Float32Array(count);
        fireParticleLifetimes = new Float32Array(count);
        fireParticleVelocities = new Float32Array(count * 3);
        for (let i = 0; i < count; i++)
        {
            fireParticleLifetimes[i] = 0.65 + Math.random() * 0.65;
            fireParticleAges[i] = Math.random() * fireParticleLifetimes[i];
            fireParticleVelocities[i * 3] = (Math.random() - 0.5) * 0.7;
            fireParticleVelocities[i * 3 + 1] = 1.9 + Math.random() * 1.8;
            fireParticleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
    }

    const positions = [];
    const colors = [];

    for (let i = 0; i < count; i++)
    {
        let x, y, z;

        switch (currentEffect)
        {
            // FIRE

            case "fire":

                const fireProgress = fireParticleAges[i] / fireParticleLifetimes[i];
                const fireOrigin = getFireParticleOrigin();
                x = fireOrigin.x + (Math.random() - 0.5) * (0.2 + fireProgress * 0.8);
                y = fireOrigin.y + fireProgress * (fireOrigin.y > 1 ? 2.5 : 2);
                z = fireOrigin.z + (Math.random() - 0.5) * (0.2 + fireProgress * 0.8);

                colors.push(
                    1,
                    0.9 - fireProgress * 0.78,
                    0.34 * (1 - fireProgress)
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

                const wandTip = getWandTipPosition();
                x = wandTip.x + (Math.random() - 0.5) * 0.2;
                y = wandTip.y + (Math.random() - 0.5) * 0.2;
                z = wandTip.z + (Math.random() - 0.5) * 0.2;
                colors.push(...MAGIC_PALETTE[i % MAGIC_PALETTE.length]);

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
        // PARTICLE SYSTEM: line-based rain streaks or grass blades.
        particleSystem = new THREE.LineSegments(
            particleGeometry,
            particleMaterial
        );
    }
    else
    {
        particleMaterial = new THREE.PointsMaterial({
            size: currentEffect === "fire" ? 0.58 : currentEffect === "explosion" ? 0.24 : currentEffect === "magic" ? 0.2 : 0.15,
            map: currentEffect === "fire" ? flameParticleTexture : currentEffect === "magic" ? softParticleTexture : null,
            transparent: currentEffect === "fire" || currentEffect === "explosion" || currentEffect === "magic",
            opacity: currentEffect === "fire" ? 0.92 : 1,
            blending: currentEffect === "fire" || currentEffect === "explosion" || currentEffect === "magic" ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: currentEffect !== "fire" && currentEffect !== "explosion",
            vertexColors: true
        });
        // PARTICLE SYSTEM: point-based fire, water, explosion, or magic effect.
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
        cannonFlash.visible = false;
        cannonFlashAge = 1;
        cannonFlashLight.intensity = 0;
    }

    if (currentEffect === "magic")
    {
        magicVelocities = new Float32Array(count * 3);
        magicParticleAges = new Float32Array(count);
        magicParticleLifetimes = new Float32Array(count);
        for (let i = 0; i < count; i++)
        {
            magicParticleLifetimes[i] = 1.2 + Math.random() * 1.2;
            magicParticleAges[i] = Math.random() * magicParticleLifetimes[i];
            magicVelocities[i * 3] = (Math.random() - 0.5) * 0.45;
            magicVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.45;
            magicVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
        }
        magicEmissionCursor = 0;
        magicEmissionTimer = 0;
        magicBurstAge = -1;
        magicPreviousWandPosition.copy(magicWand.position);
    }

    if (currentEffect === "fire")
    {
        const smokeCount = Math.max(120, Math.floor(count * 0.18));
        const smokePositions = [];
        const smokeColors = [];
        fireSmokeAges = new Float32Array(smokeCount);
        fireSmokeLifetimes = new Float32Array(smokeCount);
        fireSmokeVelocities = new Float32Array(smokeCount * 3);

        for (let i = 0; i < smokeCount; i++)
        {
            fireSmokeLifetimes[i] = 2.4 + Math.random() * 1.8;
            fireSmokeAges[i] = Math.random() * fireSmokeLifetimes[i];
            fireSmokeVelocities[i * 3] = (Math.random() - 0.5) * 0.28;
            fireSmokeVelocities[i * 3 + 1] = 0.55 + Math.random() * 0.55;
            fireSmokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.28;
            smokePositions.push(
                FIRE_SOURCE.x + fireSmokeVelocities[i * 3] * fireSmokeAges[i],
                FIRE_SOURCE.y + 2.5 + fireSmokeAges[i] * fireSmokeVelocities[i * 3 + 1],
                FIRE_SOURCE.z + fireSmokeVelocities[i * 3 + 2] * fireSmokeAges[i]
            );

            const shade = 0.13 + Math.random() * 0.1;
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
            size: 1.15,
            map: softParticleTexture,
            transparent: true,
            opacity: 0.34,
            blending: THREE.NormalBlending,
            depthWrite: false,
            vertexColors: true
        });
        // PARTICLE SYSTEM: chimney smoke.
        smokeSystem = new THREE.Points(smokeGeometry, smokeMaterial);
        scene.add(smokeSystem);
    }
}

// PARTICLE SYSTEM CALL: initialize the default effect.
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

function handleEffectChange()
{
    currentEffect = effectDropdown.value;
    // PARTICLE SYSTEM CALL: rebuild particle data for the newly selected effect.
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
        cannonFlash.visible = false;
        cannonFlashAge = 1;
        cannonFlashLight.intensity = 0;
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
}

function handlePointerMove(event)
{
    magicPointerNdc.x = event.clientX / window.innerWidth * 2 - 1;
    magicPointerNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;
    magicRaycaster.setFromCamera(magicPointerNdc, camera);
    magicRaycaster.ray.intersectPlane(magicPointerPlane, magicPointer);
}

function handlePointerDown(event)
{
    if (currentEffect !== "magic" || event.button !== 0 || event.target.closest("#ui"))
    {
        return;
    }

    const positions = particleGeometry.attributes.position.array;
    const wandTip = getWandTipPosition();
    for (let i = 0; i < positions.length; i += 3)
    {
        const direction = new THREE.Vector3(
            positions[i] - wandTip.x,
            positions[i + 1] - wandTip.y,
            positions[i + 2] - wandTip.z
        ).normalize();
        const speed = 3.5 + Math.random() * 6;
        magicVelocities[i] = direction.x * speed;
        magicVelocities[i + 1] = direction.y * speed;
        magicVelocities[i + 2] = direction.z * speed;
    }
    magicBurstAge = 0;
}

function handleParticleCountChange()
{
    particleCount = Number(particleSlider.value);
    countDisplay.textContent = particleCount;
    // PARTICLE SYSTEM CALL: rebuild particles at the requested density.
    createParticles(particleCount);
}

function setupEventListeners()
{
    effectDropdown.addEventListener("change", handleEffectChange);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    particleSlider.addEventListener("input", handleParticleCountChange);
    window.addEventListener("resize", handleResize);
}

// ======================================================
// Animation
// ======================================================

const clock = new THREE.Clock();

function launchCannonball()
{
    cannonballProgress = 0;
    cannonballInFlight = true;
    cannonFlashAge = 0;
    cannonFlash.visible = true;
    cannonFlash.scale.setScalar(1);
    cannonFlashOuterMaterial.opacity = 0.95;
    cannonFlashInnerMaterial.opacity = 1;
    cannonFlashLight.intensity = 5;
    cannonSmokeAges.fill(-1);
    cannonSmokeColors.fill(0);
    cannonSmokeEmissionTimer = 0;
    cannonball.position.copy(cannonMuzzlePosition);
    cannonball.visible = true;
    cannonSmokeSystem.visible = true;
    particleSystem.visible = false;
}

function updateCannonFlash(delta)
{
    if (!cannonFlash.visible)
    {
        return;
    }

    cannonFlashAge += delta;
    const lifetime = 0.18;
    if (cannonFlashAge >= lifetime)
    {
        cannonFlash.visible = false;
        cannonFlashLight.intensity = 0;
        return;
    }

    const fade = 1 - cannonFlashAge / lifetime;
    cannonFlash.scale.setScalar(0.65 + fade * 0.55);
    cannonFlashOuterMaterial.opacity = fade * 0.95;
    cannonFlashInnerMaterial.opacity = fade;
    cannonFlashLight.intensity = fade * 5;
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
            // PARTICLE SYSTEM CALL: emit a cannon smoke particle.
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
    updateCannonFlash(delta);

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
            // PARTICLE SYSTEM CALL: start the cannon impact burst.
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
            // PARTICLE SYSTEM CALL: launch the next cannon shot.
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

function handleResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetHouse()
{
    house.position.set(0, 0, 0);
    house.rotation.set(0, 0, 0);
    for (const part of houseParts)
    {
        part.mesh.position.copy(part.startPosition);
        part.mesh.rotation.copy(part.startRotation);
        part.velocity.set(0, 0, 0);
        part.angularVelocity.set(0, 0, 0);
    }

    for (const material of [
        houseMaterials.wall,
        houseMaterials.roof,
        houseMaterials.chimney,
        houseMaterials.foundation,
        houseMaterials.door
    ])
    {
        material.emissive.set(0x000000);
        material.emissiveIntensity = 0;
    }
}

function startHouseCollapse()
{
    for (const part of houseParts)
    {
        const outward = Math.sign(part.startPosition.x || (Math.random() - 0.5));
        part.velocity.set(
            outward * (0.5 + Math.random() * 1.4),
            1.2 + Math.random() * 2.4,
            (Math.random() - 0.5) * 2
        );
        part.angularVelocity.set(
            (Math.random() - 0.5) * 3.2,
            (Math.random() - 0.5) * 2.2,
            outward * (0.6 + Math.random() * 2.4)
        );
    }
}

function getHousePartLowestY(part)
{
    if (!part.mesh.geometry.boundingBox)
    {
        part.mesh.geometry.computeBoundingBox();
    }
    const bounds = part.mesh.geometry.boundingBox;
    let lowestY = Infinity;
    for (const x of [bounds.min.x, bounds.max.x])
    {
        for (const y of [bounds.min.y, bounds.max.y])
        {
            for (const z of [bounds.min.z, bounds.max.z])
            {
                housePartCorner.set(x, y, z).applyEuler(part.mesh.rotation);
                lowestY = Math.min(lowestY, housePartCorner.y);
            }
        }
    }
    return lowestY;
}

function updateHouseCycle(delta, elapsed)
{
    const previousPhase = fireCycleAge < FIRE_SPREAD_DURATION
        ? "burning"
        : fireCycleAge < FIRE_SPREAD_DURATION + FIRE_COLLAPSE_DURATION
            ? "collapsing"
            : "rebuilding";

    fireCycleAge += delta;
    if (fireCycleAge >= FIRE_CYCLE_DURATION)
    {
        fireCycleAge %= FIRE_CYCLE_DURATION;
        resetHouse();
    }

    const collapseStart = FIRE_SPREAD_DURATION;
    const rebuildStart = collapseStart + FIRE_COLLAPSE_DURATION;
    const phase = fireCycleAge < collapseStart
        ? "burning"
        : fireCycleAge < rebuildStart
            ? "collapsing"
            : "rebuilding";

    if (phase === "collapsing" && previousPhase !== "collapsing")
    {
        startHouseCollapse();
    }

    const burnAmount = THREE.MathUtils.clamp(
        fireCycleAge / FIRE_SPREAD_DURATION,
        0,
        1
    );
    for (const material of [
        houseMaterials.wall,
        houseMaterials.roof,
        houseMaterials.chimney,
        houseMaterials.foundation,
        houseMaterials.door
    ])
    {
        material.emissive.setRGB(0.8, 0.12, 0.015);
        material.emissiveIntensity = phase === "rebuilding"
            ? (1 - (fireCycleAge - rebuildStart) / FIRE_REBUILD_DURATION) * 0.5
            : burnAmount * 0.65;
    }

    if (phase === "burning")
    {
        const shake = burnAmount * 0.035;
        house.position.set(
            Math.sin(elapsed * 31) * shake,
            Math.sin(elapsed * 37) * shake,
            0
        );
    }
    else if (phase === "collapsing")
    {
        house.position.set(
            Math.sin(elapsed * 43) * 0.09,
            Math.sin(elapsed * 47) * 0.04,
            0
        );

        for (const part of houseParts)
        {
            part.velocity.y -= 5.2 * delta;
            part.mesh.position.addScaledVector(part.velocity, delta);
            part.mesh.rotation.x += part.angularVelocity.x * delta;
            part.mesh.rotation.y += part.angularVelocity.y * delta;
            part.mesh.rotation.z += part.angularVelocity.z * delta;

            const lowestY = part.mesh.position.y + getHousePartLowestY(part);
            if (lowestY < RAIN_GROUND_Y + 0.04)
            {
                part.mesh.position.y += RAIN_GROUND_Y + 0.04 - lowestY;
                part.velocity.y = Math.max(0, part.velocity.y) * 0.12;
                part.velocity.x *= 0.82;
                part.velocity.z *= 0.82;
                part.angularVelocity.multiplyScalar(0.72);
            }
        }
    }
    else
    {
        const rebuildProgress = THREE.MathUtils.clamp(
            (fireCycleAge - rebuildStart) / FIRE_REBUILD_DURATION,
            0,
            1
        );
        house.position.set(0, 0, 0);
        for (const part of houseParts)
        {
            part.mesh.position.lerp(part.startPosition, 1 - Math.exp(-delta * 1.8));
            part.mesh.rotation.x = THREE.MathUtils.damp(
                part.mesh.rotation.x,
                part.startRotation.x,
                1.8,
                delta
            );
            part.mesh.rotation.y = THREE.MathUtils.damp(
                part.mesh.rotation.y,
                part.startRotation.y,
                1.8,
                delta
            );
            part.mesh.rotation.z = THREE.MathUtils.damp(
                part.mesh.rotation.z,
                part.startRotation.z,
                1.8,
                delta
            );
        }

        if (rebuildProgress >= 1)
        {
            for (const part of houseParts)
            {
                part.mesh.position.copy(part.startPosition);
                part.mesh.rotation.copy(part.startRotation);
            }
        }
    }

    const rebuildProgress = phase === "rebuilding"
        ? THREE.MathUtils.clamp(
            (fireCycleAge - rebuildStart) / FIRE_REBUILD_DURATION,
            0,
            1
        )
        : 0;
    const phaseHeat = phase === "burning"
        ? 7.5 + burnAmount * 3
        : phase === "collapsing"
            ? 8.5
            : 6 * (1 - rebuildProgress);
    fireLight.intensity = phaseHeat +
        Math.sin(elapsed * 17) * Math.min(1.2, phaseHeat * 0.12) +
        Math.random() * Math.min(0.8, phaseHeat * 0.08);
}

function updateFireEffect(positions, delta, elapsed)
{
    updateHouseCycle(delta, elapsed);

    const colors = particleGeometry.attributes.color.array;
    for (let i = 0; i < positions.length; i += 3)
    {
        const particleIndex = i / 3;
        let age = fireParticleAges[particleIndex] + delta;
        if (age >= fireParticleLifetimes[particleIndex])
        {
            age = 0;
            fireParticleLifetimes[particleIndex] = 0.65 + Math.random() * 0.65;
            fireParticleVelocities[i] = (Math.random() - 0.5) * 0.7;
            fireParticleVelocities[i + 1] = 1.9 + Math.random() * 1.8;
            fireParticleVelocities[i + 2] = (Math.random() - 0.5) * 0.7;
            const origin = getFireParticleOrigin();
            positions[i] = origin.x + (Math.random() - 0.5) * 0.24;
            positions[i + 1] = origin.y + (Math.random() - 0.5) * 0.2;
            positions[i + 2] = origin.z + (Math.random() - 0.5) * 0.24;
        }

        fireParticleAges[particleIndex] = age;
        const progress = age / fireParticleLifetimes[particleIndex];
        fireParticleVelocities[i] += Math.sin(elapsed * 8 + particleIndex * 0.31) * 0.55 * delta;
        fireParticleVelocities[i + 2] += Math.cos(elapsed * 6 + particleIndex * 0.27) * 0.45 * delta;
        positions[i] += (
            fireParticleVelocities[i] + Math.sin(elapsed * 5 + particleIndex) * progress * 0.3
        ) * delta;
        positions[i + 1] += fireParticleVelocities[i + 1] * delta;
        positions[i + 2] += (
            fireParticleVelocities[i + 2] + Math.cos(elapsed * 4 + particleIndex) * progress * 0.25
        ) * delta;

        const flicker = 0.9 + Math.random() * 0.2;
        colors[i] = 1;
        if (progress < 0.22)
        {
            colors[i + 1] = (0.82 + Math.random() * 0.16) * flicker;
            colors[i + 2] = 0.32 * flicker;
        }
        else
        {
            const cooling = (progress - 0.22) / 0.78;
            colors[i] = (1 - cooling * 0.45) * flicker;
            colors[i + 1] = (0.88 * (1 - cooling) + 0.08) * flicker;
            colors[i + 2] = 0.3 * (1 - cooling);
        }
    }

    particleGeometry.attributes.color.needsUpdate = true;

    const smokePositions = smokeGeometry.attributes.position.array;
    const smokeColors = smokeGeometry.attributes.color.array;
    for (let i = 0; i < smokePositions.length; i += 3)
    {
        const smokeIndex = i / 3;
        let age = fireSmokeAges[smokeIndex] + delta;
        if (age >= fireSmokeLifetimes[smokeIndex])
        {
            age = 0;
            fireSmokeLifetimes[smokeIndex] = 2.4 + Math.random() * 1.8;
            fireSmokeVelocities[i] = (Math.random() - 0.5) * 0.28;
            fireSmokeVelocities[i + 1] = 0.55 + Math.random() * 0.55;
            fireSmokeVelocities[i + 2] = (Math.random() - 0.5) * 0.28;
            smokePositions[i] = FIRE_SOURCE.x + (Math.random() - 0.5) * 0.45;
            smokePositions[i + 1] = FIRE_SOURCE.y + 2.35 + Math.random() * 0.3;
            smokePositions[i + 2] = FIRE_SOURCE.z + (Math.random() - 0.5) * 0.45;
        }

        fireSmokeAges[smokeIndex] = age;
        const progress = age / fireSmokeLifetimes[smokeIndex];
        const spread = 0.12 + progress * 0.48;
        fireSmokeVelocities[i] += Math.sin(elapsed * 0.8 + smokeIndex) * 0.08 * delta;
        fireSmokeVelocities[i + 2] += Math.cos(elapsed * 0.7 + smokeIndex) * 0.08 * delta;
        smokePositions[i] += (
            fireSmokeVelocities[i] + Math.sin(elapsed + smokeIndex) * spread * 0.16
        ) * delta;
        smokePositions[i + 1] += fireSmokeVelocities[i + 1] * delta;
        smokePositions[i + 2] += (
            fireSmokeVelocities[i + 2] + Math.cos(elapsed * 0.9 + smokeIndex) * spread * 0.12
        ) * delta;

        const fadeIn = THREE.MathUtils.clamp(progress / 0.12, 0, 1);
        const fadeOut = THREE.MathUtils.clamp((1 - progress) / 0.24, 0, 1);
        const shade = (0.22 + 0.05 * Math.sin(elapsed * 1.7 + smokeIndex)) * fadeIn * fadeOut;
        smokeColors[i] = shade;
        smokeColors[i + 1] = shade * 1.02;
        smokeColors[i + 2] = shade * 1.08;
    }

    smokeGeometry.attributes.position.needsUpdate = true;
    smokeGeometry.attributes.color.needsUpdate = true;
}

function updateGrassEffect(positions, delta, elapsed)
{
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
}

function getWandTipPosition()
{
    const tipOffset = 0.82;
    return new THREE.Vector3(
        magicWand.position.x - Math.sin(magicWand.rotation.z) * tipOffset,
        magicWand.position.y + Math.cos(magicWand.rotation.z) * tipOffset,
        magicWand.position.z
    );
}

function emitMagicParticle(index, positions, wandVelocity)
{
    const arrayIndex = index * 3;
    const wandTip = getWandTipPosition();
    positions[arrayIndex] = wandTip.x + (Math.random() - 0.5) * 0.12;
    positions[arrayIndex + 1] = wandTip.y + (Math.random() - 0.5) * 0.12;
    positions[arrayIndex + 2] = wandTip.z + (Math.random() - 0.5) * 0.16;

    magicVelocities[arrayIndex] = -wandVelocity.x * 0.85 + (Math.random() - 0.5) * 0.8;
    magicVelocities[arrayIndex + 1] = -wandVelocity.y * 0.85 + (Math.random() - 0.5) * 0.8;
    magicVelocities[arrayIndex + 2] = -wandVelocity.z * 0.55 + (Math.random() - 0.5) * 0.7;
    magicParticleAges[index] = 0;
    magicParticleLifetimes[index] = 1.2 + Math.random() * 1.2;
}

function updateMagicEffect(positions, delta, elapsed)
{
    magicWand.position.lerp(magicPointer, 1 - Math.exp(-delta * 18));
    magicWand.position.z = 0.85;
    magicWand.rotation.z = -0.42 + Math.sin(elapsed * 2.2) * 0.06;
    wandCrystal.rotation.y += delta * 2.8;
    wandCrystal.rotation.x = Math.sin(elapsed * 3.2) * 0.12;
    magicPulse.position.set(magicPointer.x, magicPointer.y, 0.3);
    magicPulse.scale.setScalar(0.85 + Math.sin(elapsed * 6) * 0.12);
    magicPulse.material.opacity = 0.3 + Math.sin(elapsed * 6) * 0.12;

    const wandVelocity = magicWand.position.clone()
        .sub(magicPreviousWandPosition)
        .divideScalar(Math.max(delta, 0.001))
        .clampLength(0, 7);
    magicPreviousWandPosition.copy(magicWand.position);

    if (magicBurstAge < 0)
    {
        // PARTICLE SYSTEM CALL: emit the moving wand's trailing particles.
        magicEmissionTimer += delta;
        while (magicEmissionTimer >= 0.025)
        {
            magicEmissionTimer -= 0.025;
            emitMagicParticle(magicEmissionCursor, positions, wandVelocity);
            magicEmissionCursor = (magicEmissionCursor + 1) % magicParticleAges.length;
        }
    }

    const wandTip = getWandTipPosition();
    if (magicBurstAge >= 0)
    {
        magicBurstAge += delta;
        if (magicBurstAge >= 1.45)
        {
            for (let i = 0; i < positions.length; i += 3)
            {
                positions[i] = wandTip.x;
                positions[i + 1] = wandTip.y;
                positions[i + 2] = wandTip.z;
                magicVelocities[i] = 0;
                magicVelocities[i + 1] = 0;
                magicVelocities[i + 2] = 0;
                magicParticleAges[i / 3] = 0;
            }
            magicBurstAge = -1;
            magicEmissionTimer = 0;
        }
    }

    for (let i = 0; i < positions.length; i += 3)
    {
        const particleIndex = i / 3;
        const dx = wandTip.x - positions[i];
        const dy = wandTip.y - positions[i + 1];
        const dz = wandTip.z - positions[i + 2];
        const distance = Math.max(0.001, Math.hypot(dx, dy, dz));
        const colors = particleGeometry.attributes.color.array;

        if (magicBurstAge >= 0)
        {
            if (magicBurstAge < 0.32)
            {
                const outwardForce = 7 / distance;
                magicVelocities[i] -= dx * outwardForce * delta;
                magicVelocities[i + 1] -= dy * outwardForce * delta;
                magicVelocities[i + 2] -= dz * outwardForce * delta;
            }
            else
            {
                const returnForce = 30;
                magicVelocities[i] += dx * returnForce * delta;
                magicVelocities[i + 1] += dy * returnForce * delta;
                magicVelocities[i + 2] += dz * returnForce * delta;
            }

            const burstDrag = Math.exp(-(magicBurstAge < 0.32 ? 0.18 : 1.8) * delta);
            magicVelocities[i] *= burstDrag;
            magicVelocities[i + 1] *= burstDrag;
            magicVelocities[i + 2] *= burstDrag;
            colors[i] = 0.8;
            colors[i + 1] = 0.8;
            colors[i + 2] = 0.8;
        }
        else
        {
            magicParticleAges[particleIndex] += delta;
            if (magicParticleAges[particleIndex] >= magicParticleLifetimes[particleIndex])
            {
                emitMagicParticle(particleIndex, positions, wandVelocity);
            }

            const drift = Math.sin(elapsed * 2.5 + particleIndex) * 0.24;
            magicVelocities[i] += drift * delta;
            magicVelocities[i + 1] += 0.08 * delta;
            const drag = Math.exp(-0.22 * delta);
            magicVelocities[i] *= drag;
            magicVelocities[i + 1] *= drag;
            magicVelocities[i + 2] *= drag;

            const fade = 1 - magicParticleAges[particleIndex] /
                magicParticleLifetimes[particleIndex];
            const palette = MAGIC_PALETTE[particleIndex % MAGIC_PALETTE.length];
            colors[i] = palette[0] * fade;
            colors[i + 1] = palette[1] * fade;
            colors[i + 2] = palette[2] * fade;
        }

        if (magicBurstAge >= 0 && magicBurstAge >= 0.32 && distance < 0.14)
        {
            positions[i] = wandTip.x;
            positions[i + 1] = wandTip.y;
            positions[i + 2] = wandTip.z;
            magicVelocities[i] = 0;
            magicVelocities[i + 1] = 0;
            magicVelocities[i + 2] = 0;
            colors[i] = 0.8;
            colors[i + 1] = 0.8;
            colors[i + 2] = 0.8;
        }
        else
        {
            positions[i] += magicVelocities[i] * delta;
            positions[i + 1] += magicVelocities[i + 1] * delta;
            positions[i + 2] += magicVelocities[i + 2] * delta;
        }
    }
    particleGeometry.attributes.color.needsUpdate = true;
}

function updateWaterEffect(positions, elapsed)
{
    waterTextures.colorMap.offset.set(elapsed * 0.012, elapsed * 0.007);
    waterTextures.normalMap.offset.copy(waterTextures.colorMap.offset);

    for (let i = 0; i < positions.length; i += 3)
    {
        positions[i + 1] = -0.2 + Math.sin(
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
}

function updateWeatherEffect(positions, delta)
{
    for (let i = 0; i < positions.length; i += 6)
    {
        positions[i + 1] -= 10 * delta;
        positions[i + 4] -= 10 * delta;

        if (positions[i + 1] <= RAIN_GROUND_Y)
        {
            // PARTICLE SYSTEM CALL: spawn a splash where a raindrop lands.
            spawnPuddle(positions[i], positions[i + 2]);
            positions[i + 1] = 15 + Math.random() * 10;
            positions[i + 4] = positions[i + 1] - 0.9;
        }
    }
}

function updateEffect(delta, elapsed)
{
    const positions =
    particleGeometry.attributes.position.array;

    switch (currentEffect)
    {
        // FIRE & SMOKE

        case "fire":
            // PARTICLE SYSTEM CALL: advance chimney flames and smoke.
            updateFireEffect(positions, delta, elapsed);
            break;

        // WATER

        case "water":
            // PARTICLE SYSTEM CALL: animate water particles and the pool surface.
            updateWaterEffect(positions, elapsed);
            break;

        // WEATHER

        case "weather":
            // PARTICLE SYSTEM CALL: move rain streaks; puddle ripples update below.
            updateWeatherEffect(positions, delta);
            break;

        // EXPLOSION

        case "explosion":

            // PARTICLE SYSTEM CALL: update cannonball, blast, and smoke trail.
            updateCannon(delta);
            updateCannonSmoke(delta);

            break;

        // GRASS / FUR

        case "grass":
            // PARTICLE SYSTEM CALL: animate grass blades and sheep fur.
            updateGrassEffect(positions, delta, elapsed);
            break;

        // MAGIC / SCI-FI

        case "magic":
            // PARTICLE SYSTEM CALL: update wand trail and click burst/return.
            updateMagicEffect(positions, delta, elapsed);
            break;
    }

    if (currentEffect === "weather")
    {
        // PARTICLE SYSTEM CALL: animate active puddles and splash ripples.
        updatePuddles(delta);
    }

    particleGeometry.attributes.position.needsUpdate = true;
}

function animate()
{
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    updateEffect(delta, clock.elapsedTime);
    controls.update();

    renderer.render(
        scene,
        camera
    );
}

setupEventListeners();
animate();