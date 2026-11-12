import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { StellarSystem } from '../domain/catalog';
import { properMotionDirection } from '../domain/motion';
import type { OriginMode } from '../app/viewState';
import type { LabelMode, MarkerMode } from '../services/catalogFilters';
import { toSceneSystem } from './sceneModel';
import {
  createReferenceLayerObjects,
  disposeObject,
  updateReferenceLayers,
  type ReferenceLayerKey,
  type ReferenceLayers,
} from './referenceLayers';

type SceneStatus = 'loading' | 'ready' | 'unavailable';

type SceneViewportProps = Readonly<{
  systems: readonly StellarSystem[];
  selectedSystemId: string | null;
  onSelectSystem: (systemId: string) => void;
  labelMode: LabelMode;
  markerMode: MarkerMode;
  stellarColors: boolean;
  origin: OriginMode;
  layers: ReferenceLayers;
  layerOpacity: number;
  showProperMotion: boolean;
  onDiagnostics?: (diagnostics: SceneDiagnostics) => void;
}>;

export type SceneDiagnostics = Readonly<{
  webglVersion: string;
  renderer: string;
  pixelRatio: number;
  drawCalls: number;
  triangles: number;
  initializationMs: number;
}>;

export type SceneViewportHandle = Readonly<{
  resetView: () => void;
  focusSystem: (systemId: string) => void;
  toggleFullscreen: () => Promise<void>;
}>;

type StarEntry = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  label: HTMLButtonElement;
  baseRadius: number;
  prominent: boolean;
};

type SceneRuntime = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  render: () => void;
  resetView: () => void;
  focusSystem: (systemId: string) => void;
  orbitKeyboard: (azimuthDelta: number, polarDelta: number) => void;
  zoomKeyboard: (factor: number) => void;
  starEntries: Map<string, StarEntry>;
  selectionRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  referenceObjects: Record<ReferenceLayerKey, THREE.Object3D>;
};

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(5.8, -7.2, 4.6);
const AU_IN_PARSEC = 1 / 206264.806;

function appendLabelDetails(label: HTMLButtonElement, system: StellarSystem): void {
  const name = document.createElement('span');
  name.className = 'star-label__name';
  name.textContent = system.displayName;

  const details = document.createElement('span');
  details.className = 'star-label__details';
  const fields = [
    ['Distance', `${system.distance.lightYear.toFixed(2)} ly`],
    ['Class', system.photometry.spectralType ?? 'Unavailable'],
    ['Constellation', `${system.constellation.name} (${system.constellation.abbreviation})`],
    [
      'Coordinates',
      `RA ${system.astrometry.raDeg.value.toFixed(4)}\u00b0 \u00b7 Dec ${system.astrometry.decDeg.value >= 0 ? '+' : ''}${system.astrometry.decDeg.value.toFixed(4)}\u00b0`,
    ],
    [
      'Apparent mag.',
      system.photometry.apparentMagnitudeG
        ? `${system.photometry.apparentMagnitudeG.value.toFixed(2)} (Gaia G)`
        : 'Unavailable',
    ],
  ] as const;
  for (const [term, value] of fields) {
    const row = document.createElement('span');
    const key = document.createElement('span');
    key.className = 'star-label__term';
    key.textContent = term;
    const result = document.createElement('span');
    result.textContent = value;
    row.append(key, result);
    details.append(row);
  }
  label.append(name, details);
}

function createBackgroundStars(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const positions: number[] = [];
  let seed = 1937;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < 420; index += 1) {
    const radius = 18 + random() * 12;
    const azimuth = random() * Math.PI * 2;
    const z = random() * 2 - 1;
    const projectedRadius = Math.sqrt(1 - z * z);
    positions.push(
      radius * projectedRadius * Math.cos(azimuth),
      radius * projectedRadius * Math.sin(azimuth),
      radius * z,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x6f87a3, size: 0.025, transparent: true, opacity: 0.65 }),
  );
}

export const SceneViewport = forwardRef<SceneViewportHandle, SceneViewportProps>(
  function SceneViewport(
    {
      systems,
      selectedSystemId,
      onSelectSystem,
      labelMode,
      markerMode,
      stellarColors,
      origin,
      layers,
      layerOpacity,
      showProperMotion,
      onDiagnostics,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const runtimeRef = useRef<SceneRuntime | null>(null);
    const onSelectRef = useRef(onSelectSystem);
    const [status, setStatus] = useState<SceneStatus>('loading');
    const [expandedLabelId, setExpandedLabelId] = useState<string | null>(null);
    onSelectRef.current = onSelectSystem;

    useImperativeHandle(
      ref,
      () => ({
        resetView: () => runtimeRef.current?.resetView(),
        focusSystem: (systemId) => runtimeRef.current?.focusSystem(systemId),
        toggleFullscreen: async () => {
          const target = containerRef.current?.parentElement;
          if (!target) return;
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (target.requestFullscreen) await target.requestFullscreen();
          else target.classList.toggle('scene-panel--maximized');
        },
      }),
      [],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const initializationStarted = performance.now();

      let active = true;
      const reportStatus = (nextStatus: SceneStatus) => {
        queueMicrotask(() => {
          if (active) setStatus(nextStatus);
        });
      };

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        reportStatus('unavailable');
        return () => {
          active = false;
        };
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'webgl-layer';
      container.append(renderer.domElement);

      const labelRenderer = new CSS2DRenderer();
      labelRenderer.domElement.className = 'label-layer';
      container.append(labelRenderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 80);
      camera.up.set(0, 0, 1);
      camera.position.copy(DEFAULT_CAMERA_POSITION);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.enablePan = true;
      controls.minDistance = 1;
      controls.maxDistance = 24;
      controls.target.set(0, 0, 0);
      controls.update();

      const referenceObjects = createReferenceLayerObjects(1);
      for (const object of Object.values(referenceObjects)) scene.add(object);

      const backgroundStars = createBackgroundStars();
      scene.add(backgroundStars);

      const sunGeometry = new THREE.SphereGeometry(0.1, 24, 16);
      const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc73 });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      sun.name = 'Sun';
      sun.position.x = origin === 'earth' ? -AU_IN_PARSEC : 0;
      scene.add(sun);

      const sunHaloGeometry = new THREE.RingGeometry(0.18, 0.205, 48);
      const sunHaloMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc73,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const sunHalo = new THREE.Mesh(sunHaloGeometry, sunHaloMaterial);
      sunHalo.rotation.x = Math.PI / 2;
      sunHalo.position.copy(sun.position);
      scene.add(sunHalo);

      if (origin === 'earth') {
        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 20, 12),
          new THREE.MeshBasicMaterial({ color: 0x68a8df }),
        );
        earth.name = 'Earth';
        scene.add(earth);
      }

      const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
      const starEntries = new Map<string, StarEntry>();
      const selectableMeshes: THREE.Mesh[] = [];

      for (const system of systems) {
        const view = toSceneSystem(system, stellarColors, markerMode === 'brightness');
        const material = new THREE.MeshBasicMaterial({ color: view.color });
        const mesh = new THREE.Mesh(sphereGeometry, material);
        mesh.position.set(view.xPc - (origin === 'earth' ? AU_IN_PARSEC : 0), view.yPc, view.zPc);
        mesh.scale.setScalar(view.radius);
        mesh.userData.systemId = view.id;
        scene.add(mesh);
        selectableMeshes.push(mesh);

        const label = document.createElement('button');
        label.type = 'button';
        label.className = 'star-label';
        appendLabelDetails(label, system);
        label.dataset.systemId = view.id;
        label.setAttribute('aria-label', `Select ${view.name}`);
        label.setAttribute('aria-controls', `star-label-details-${view.id}`);
        label.setAttribute('aria-expanded', 'false');
        label
          .querySelector('.star-label__details')
          ?.setAttribute('id', `star-label-details-${view.id}`);
        label.addEventListener('click', (event) => {
          event.stopPropagation();
          setExpandedLabelId(view.id);
          onSelectRef.current(view.id);
        });

        const labelObject = new CSS2DObject(label);
        labelObject.position.copy(mesh.position).add(new THREE.Vector3(0, view.radius + 0.1, 0));
        scene.add(labelObject);
        starEntries.set(view.id, {
          mesh,
          label,
          baseRadius: view.radius,
          prominent:
            system.distance.lightYear <= 8 ||
            (system.photometry.apparentMagnitudeG?.value ?? Number.POSITIVE_INFINITY) <= 3,
        });

        if (showProperMotion) {
          const direction = properMotionDirection(
            system.astrometry.raDeg.value,
            system.astrometry.decDeg.value,
            system.astrometry.properMotionRaMasYr.value,
            system.astrometry.properMotionDecMasYr.value,
          );
          if (direction) {
            const rate = Math.hypot(
              system.astrometry.properMotionRaMasYr.value,
              system.astrometry.properMotionDecMasYr.value,
            );
            const length = THREE.MathUtils.clamp(
              0.18 + Math.log10(Math.max(1, rate)) * 0.12,
              0.22,
              0.7,
            );
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(direction.x, direction.y, direction.z),
              mesh.position,
              length,
              0x78d8c4,
              0.09,
              0.045,
            );
            arrow.name = 'proper-motion-vector';
            scene.add(arrow);
          }
        }
      }

      const selectionRingGeometry = new THREE.RingGeometry(0.19, 0.225, 48);
      const selectionRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const selectionRing = new THREE.Mesh(selectionRingGeometry, selectionRingMaterial);
      selectionRing.visible = false;
      selectionRing.renderOrder = 10;
      scene.add(selectionRing);

      const render = () => {
        if (selectionRing.visible) selectionRing.lookAt(camera.position);
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };

      const resetView = () => {
        controls.target.set(0, 0, 0);
        camera.position.copy(DEFAULT_CAMERA_POSITION);
        controls.update();
        render();
      };

      const focusSystem = (systemId: string) => {
        const entry = starEntries.get(systemId);
        if (!entry) return;
        const previousOffset = camera.position
          .clone()
          .sub(controls.target)
          .normalize()
          .multiplyScalar(2.2);
        controls.target.copy(entry.mesh.position);
        camera.position.copy(entry.mesh.position).add(previousOffset);
        controls.update();
        render();
      };

      const orbitKeyboard = (azimuthDelta: number, polarDelta: number) => {
        const offset = camera.position.clone().sub(controls.target);
        const radius = offset.length();
        const azimuth = Math.atan2(offset.y, offset.x) + azimuthDelta;
        const polar = Math.min(
          Math.PI - 0.05,
          Math.max(0.05, Math.acos(offset.z / radius) + polarDelta),
        );
        const projectedRadius = radius * Math.sin(polar);
        offset.set(
          projectedRadius * Math.cos(azimuth),
          projectedRadius * Math.sin(azimuth),
          radius * Math.cos(polar),
        );
        camera.position.copy(controls.target).add(offset);
        controls.update();
        render();
      };

      const zoomKeyboard = (factor: number) => {
        const offset = camera.position.clone().sub(controls.target);
        const nextDistance = THREE.MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance,
        );
        camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(nextDistance));
        controls.update();
        render();
      };

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pointerStart = new THREE.Vector2();

      const onPointerDown = (event: PointerEvent) => {
        pointerStart.set(event.clientX, event.clientY);
      };

      const onPointerUp = (event: PointerEvent) => {
        if (pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) return;
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(selectableMeshes, false)[0];
        const systemId = hit?.object.userData.systemId;
        if (typeof systemId === 'string') onSelectRef.current(systemId);
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      controls.addEventListener('change', render);

      const resize = () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        labelRenderer.setSize(width, height);
        render();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      runtimeRef.current = {
        camera,
        controls,
        render,
        resetView,
        focusSystem,
        orbitKeyboard,
        zoomKeyboard,
        starEntries,
        selectionRing,
        referenceObjects,
      };
      resize();
      const graphics = renderer.getContext();
      const debugInfo = graphics.getExtension('WEBGL_debug_renderer_info');
      onDiagnostics?.({
        webglVersion: String(graphics.getParameter(graphics.VERSION)),
        renderer: debugInfo
          ? String(graphics.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
          : 'Browser-protected renderer',
        pixelRatio: renderer.getPixelRatio(),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        initializationMs: performance.now() - initializationStarted,
      });
      reportStatus('ready');

      return () => {
        active = false;
        runtimeRef.current = null;
        resizeObserver.disconnect();
        controls.removeEventListener('change', render);
        controls.dispose();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        sphereGeometry.dispose();
        starEntries.forEach(({ mesh }) => mesh.material.dispose());
        selectionRingGeometry.dispose();
        selectionRingMaterial.dispose();
        sunGeometry.dispose();
        sunMaterial.dispose();
        sunHaloGeometry.dispose();
        sunHaloMaterial.dispose();
        Object.values(referenceObjects).forEach(disposeObject);
        scene.getObjectByName('Earth')?.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            object.material.dispose();
          }
        });
        scene.children
          .filter((object) => object.name === 'proper-motion-vector')
          .forEach(disposeObject);
        backgroundStars.geometry.dispose();
        backgroundStars.material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        labelRenderer.domElement.remove();
      };
    }, [systems, markerMode, stellarColors, origin, showProperMotion, onDiagnostics]);

    useEffect(() => {
      const runtime = runtimeRef.current;
      if (!runtime) return;
      updateReferenceLayers(runtime.referenceObjects, layers, layerOpacity);
      runtime.render();
    }, [layerOpacity, layers]);

    useEffect(() => {
      const runtime = runtimeRef.current;
      if (!runtime) return;

      runtime.starEntries.forEach((entry, systemId) => {
        const isSelected = systemId === selectedSystemId;
        const isExpanded = systemId === expandedLabelId;
        entry.mesh.scale.setScalar(entry.baseRadius * (isSelected ? 1.55 : 1));
        entry.label.classList.toggle('is-selected', isSelected);
        entry.label.classList.toggle('is-expanded', isExpanded);
        entry.label.setAttribute('aria-pressed', String(isSelected));
        entry.label.setAttribute('aria-expanded', String(isExpanded));
        entry.label.hidden =
          labelMode === 'none' ||
          (labelMode === 'selected' && !isSelected) ||
          (labelMode === 'prominent' && !entry.prominent && !isSelected);
      });

      const selectedEntry = selectedSystemId
        ? runtime.starEntries.get(selectedSystemId)
        : undefined;
      runtime.selectionRing.visible = selectedEntry !== undefined;
      if (selectedEntry) runtime.selectionRing.position.copy(selectedEntry.mesh.position);
      runtime.render();
    }, [expandedLabelId, labelMode, selectedSystemId, systems]);

    useEffect(() => {
      setExpandedLabelId((current) => (current && current !== selectedSystemId ? null : current));
    }, [selectedSystemId]);

    useEffect(() => {
      const collapseLabel = (event: PointerEvent) => {
        if (event.target instanceof Element && event.target.closest('.star-label')) return;
        setExpandedLabelId(null);
      };
      document.addEventListener('pointerdown', collapseLabel);
      return () => document.removeEventListener('pointerdown', collapseLabel);
    }, []);

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const runtime = runtimeRef.current;
      if (!runtime) return;
      const orbitStep = Math.PI / 24;

      switch (event.key) {
        case '0':
          runtime.resetView();
          break;
        case 'f':
        case 'F':
          void (document.fullscreenElement
            ? document.exitFullscreen()
            : containerRef.current?.parentElement?.requestFullscreen());
          break;
        case '+':
        case '=':
          runtime.zoomKeyboard(0.85);
          break;
        case '-':
        case '_':
          runtime.zoomKeyboard(1.15);
          break;
        case 'ArrowLeft':
          runtime.orbitKeyboard(orbitStep, 0);
          break;
        case 'ArrowRight':
          runtime.orbitKeyboard(-orbitStep, 0);
          break;
        case 'ArrowUp':
          runtime.orbitKeyboard(0, -orbitStep);
          break;
        case 'ArrowDown':
          runtime.orbitKeyboard(0, orbitStep);
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    return (
      <section className="scene-panel" aria-labelledby="scene-title">
        <div className="scene-heading">
          <div>
            <p className="eyebrow">3D viewport · 1 unit = 1 parsec</p>
            <h2 id="scene-title">{origin === 'sun' ? 'Sun' : 'Earth'}-centered scene</h2>
          </div>
          <span className={`render-status render-status--${status}`}>
            {status === 'ready'
              ? `${systems.length} systems visible`
              : status === 'loading'
                ? 'Starting…'
                : 'Unavailable'}
          </span>
        </div>

        <div
          ref={containerRef}
          className="scene-canvas"
          role="application"
          tabIndex={0}
          onKeyDown={onKeyDown}
          aria-label={`Interactive ${origin}-centered three-dimensional scene showing ${systems.length} stellar systems. Drag to orbit, scroll to zoom, use arrow keys to orbit, plus or minus to zoom, zero to reset, and F for fullscreen.`}
        >
          <div className="axis-key" aria-hidden="true">
            <span>XY · celestial equator</span>
            <span>Z · north celestial pole</span>
          </div>
          {showProperMotion && (
            <div className="motion-key">
              Arrows: proper-motion direction · relative angular rate
            </div>
          )}
          {status === 'unavailable' && (
            <div className="scene-error" role="alert">
              <strong>3D rendering is unavailable.</strong>
              <span>Use the catalog list or try a browser with WebGL support.</span>
            </div>
          )}
        </div>
      </section>
    );
  },
);
