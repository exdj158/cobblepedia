import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js"
import {
  Box3,
  BoxGeometry,
  type BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  NearestMipmapNearestFilter,
  type Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three"

type ModelPreviewManifest = {
  geoUrl: string
  textureUrl: string
}

type BedrockCube = {
  origin: [number, number, number]
  size: [number, number, number]
  inflate?: number
  uv?: [number, number] | Record<string, unknown>
  pivot?: [number, number, number]
  rotation?: [number, number, number]
  mirror?: boolean
}

type CubeFaceName = "east" | "west" | "up" | "down" | "south" | "north"

type FaceRect = [number, number, number, number]

type MeshVolumeMeta = {
  mesh: Mesh
  volume: number
}

type BuiltModel = {
  group: Group
  meshMeta: MeshVolumeMeta[]
  visibleBoundsOffset?: Vector3
  visibleBoundsHeight?: number
}

type BedrockBone = {
  name: string
  parent?: string
  pivot?: [number, number, number]
  rotation?: [number, number, number]
  cubes?: BedrockCube[]
  mirror?: boolean
}

type BedrockGeometry = {
  description: {
    texture_width?: number
    texture_height?: number
    visible_bounds_offset?: [number, number, number]
    visible_bounds_width?: number
    visible_bounds_height?: number
  }
  bones?: BedrockBone[]
}

type BedrockGeoFile = {
  "minecraft:geometry"?: BedrockGeometry[]
}

type PreviewState = "idle" | "loading" | "ready" | "error"

type SceneRuntime = {
  scene: Scene
  renderer: WebGLRenderer
  camera: PerspectiveCamera
  modelRoot: Group
  resizeObserver: ResizeObserver
  frame: number
}

export function PokemonModelPreview(props: { slug: string; dexNumber: number; name: string }) {
  let containerRef: HTMLDivElement | undefined
  let runtime: SceneRuntime | null = null
  let loadVersion = 0

  const [previewState, setPreviewState] = createSignal<PreviewState>("idle")
  const [runtimeReady, setRuntimeReady] = createSignal(false)

  onMount(() => {
    if (!containerRef) {
      return
    }

    const scene = new Scene()
    scene.background = new Color("#e7e5e4")

    const camera = new PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(3.1, 2.3, 3.1)
    camera.lookAt(0, 0.95, 0)

    const keyLight = new HemisphereLight("#f9fafb", "#d4d4d8", 1.6)
    scene.add(keyLight)

    const rimLight = new DirectionalLight("#ffffff", 0.55)
    rimLight.position.set(4, 6, 3)
    scene.add(rimLight)

    const modelRoot = new Group()
    scene.add(modelRoot)

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    renderer.outputColorSpace = SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    containerRef.append(renderer.domElement)

    const resize = () => {
      if (!containerRef) {
        return
      }

      const width = Math.max(containerRef.clientWidth, 1)
      const height = Math.max(containerRef.clientHeight, 1)
      renderer.setSize(width, height, true)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    resize()

    const resizeObserver = new ResizeObserver(() => {
      resize()
    })
    resizeObserver.observe(containerRef)

    const runtimeState: SceneRuntime = {
      scene,
      renderer,
      camera,
      modelRoot,
      resizeObserver,
      frame: 0,
    }

    const animate = () => {
      runtimeState.frame = window.requestAnimationFrame(animate)

      modelRoot.rotation.y += 0.0032
      renderer.render(scene, camera)
    }
    animate()

    runtime = runtimeState
    setRuntimeReady(true)
  })

  createEffect(() => {
    if (!runtimeReady() || !runtime) {
      return
    }

    const slug = props.slug.trim().toLowerCase()
    const dexNumber = props.dexNumber

    if (!slug || !Number.isFinite(dexNumber) || dexNumber <= 0) {
      setPreviewState("error")
      clearGroup(runtime.modelRoot)
      return
    }

    const currentVersion = ++loadVersion
    setPreviewState("loading")

    void loadModel(runtime, slug, dexNumber, () => currentVersion === loadVersion)
      .then((loaded) => {
        if (currentVersion !== loadVersion) {
          return
        }
        setPreviewState(loaded ? "ready" : "error")
      })
      .catch(() => {
        if (currentVersion !== loadVersion) {
          return
        }
        setPreviewState("error")
      })
  })

  onCleanup(() => {
    loadVersion += 1

    if (!runtime) {
      return
    }

    window.cancelAnimationFrame(runtime.frame)
    runtime.resizeObserver.disconnect()
    clearGroup(runtime.modelRoot)
    runtime.renderer.dispose()
    runtime.renderer.domElement.remove()
    runtime = null
    setRuntimeReady(false)
  })

  return (
    <div class="relative h-full w-full">
      <div ref={(element) => (containerRef = element)} class="h-full w-full" />

      <Show when={previewState() !== "ready"}>
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-secondary/70">
          <Show
            when={previewState() === "loading"}
            fallback={
              <span class="font-mono text-4xl text-muted-foreground">
                {props.name.slice(0, 1).toUpperCase()}
              </span>
            }
          >
            <div class="h-7 w-7 animate-spin border-2 border-border border-t-foreground" />
          </Show>
        </div>
      </Show>
    </div>
  )
}

async function loadModel(
  runtime: SceneRuntime,
  slug: string,
  dexNumber: number,
  isCurrentVersion: () => boolean
): Promise<boolean> {
  clearGroup(runtime.modelRoot)

  const manifestResponse = await fetch(
    `/api/media/model-preview/${encodeURIComponent(slug)}?dex=${dexNumber}`
  )
  if (!manifestResponse.ok) {
    return false
  }

  const manifest = (await manifestResponse.json()) as ModelPreviewManifest

  if (!isCurrentVersion()) {
    return false
  }

  const [geoResponse, texture] = await Promise.all([
    fetch(manifest.geoUrl),
    loadTexture(manifest.textureUrl),
  ])

  if (!geoResponse.ok) {
    texture.dispose()
    return false
  }

  const geoFile = (await geoResponse.json()) as BedrockGeoFile
  const model = buildModelFromBedrock(geoFile, texture)
  if (!model) {
    texture.dispose()
    return false
  }

  if (!isCurrentVersion()) {
    disposeObjectTree(model.group)
    return false
  }

  runtime.modelRoot.rotation.set(0, 0, 0)
  runtime.modelRoot.add(model.group)
  fitModelInPreview(model, runtime.camera)

  return true
}

async function loadTexture(url: string): Promise<Texture> {
  const textureLoader = new TextureLoader()
  const texture = await textureLoader.loadAsync(url)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = true
  texture.magFilter = NearestFilter
  texture.minFilter = NearestMipmapNearestFilter
  texture.needsUpdate = true
  return texture
}

function buildModelFromBedrock(geoFile: BedrockGeoFile, texture: Texture): BuiltModel | null {
  const geometryRoot = geoFile["minecraft:geometry"]?.[0]
  const bones = geometryRoot?.bones

  if (!geometryRoot || !bones || bones.length === 0) {
    return null
  }

  const textureWidth = geometryRoot.description.texture_width || 64
  const textureHeight = geometryRoot.description.texture_height || 64

  const material = new MeshStandardMaterial({
    color: "#ffffff",
    map: texture,
    transparent: false,
    alphaTest: 0.5,
    roughness: 0.9,
    metalness: 0,
  })

  const skeletonRoot = new Group()
  const root = new Group()
  root.add(skeletonRoot)
  const meshMeta: MeshVolumeMeta[] = []
  const boneObjects = new Map<string, Group>()
  const bonePivots = new Map<string, Vector3>()

  for (const bone of bones) {
    const boneGroup = new Group()
    boneGroup.name = bone.name
    boneObjects.set(bone.name, boneGroup)
    bonePivots.set(bone.name, toBedrockPivotVector(bone.pivot))
  }

  for (const bone of bones) {
    const boneObject = boneObjects.get(bone.name)
    if (!boneObject) {
      continue
    }

    const bonePivot = bonePivots.get(bone.name) ?? new Vector3()
    const parentPivot = bone.parent ? (bonePivots.get(bone.parent) ?? new Vector3()) : new Vector3()
    const parentObject = bone.parent ? (boneObjects.get(bone.parent) ?? skeletonRoot) : skeletonRoot

    boneObject.position.copy(bonePivot.clone().sub(parentPivot))
    applyBedrockEulerDegrees(boneObject, bone.rotation)
    parentObject.add(boneObject)

    for (const cube of bone.cubes ?? []) {
      const mirror = cube.mirror ?? bone.mirror ?? false
      const cubeObject = createCubeObject(
        cube,
        bonePivot,
        material,
        textureWidth,
        textureHeight,
        meshMeta,
        mirror
      )
      boneObject.add(cubeObject)
    }
  }

  const visibleBoundsOffset = geometryRoot.description.visible_bounds_offset
    ? toBedrockPivotVector(geometryRoot.description.visible_bounds_offset)
    : undefined

  return {
    group: root,
    meshMeta,
    visibleBoundsOffset,
    visibleBoundsHeight: geometryRoot.description.visible_bounds_height,
  }
}

function createCubeObject(
  cube: BedrockCube,
  bonePivot: Vector3,
  material: MeshStandardMaterial,
  textureWidth: number,
  textureHeight: number,
  meshMeta: MeshVolumeMeta[],
  mirror: boolean
): Group | Mesh {
  const signedSize = cube.size.map((value) => Number(value)) as [number, number, number]
  const boxUvSize = signedSize.map((value) => Math.floor(Math.abs(value) + 0.0000001)) as [
    number,
    number,
    number,
  ]

  const inflate = cube.inflate ?? 0
  const inflatedSize = signedSize.map((value) => {
    const inflatedValue = Math.abs(value) + inflate * 2
    return Math.max(inflatedValue, 0.001)
  }) as [number, number, number]

  const geometry = new BoxGeometry(inflatedSize[0], inflatedSize[1], inflatedSize[2])

  if (Array.isArray(cube.uv)) {
    applyBoxUvMap(
      geometry,
      cube.uv as [number, number],
      boxUvSize,
      textureWidth,
      textureHeight,
      mirror
    )
  }

  if (isFaceUvMap(cube.uv)) {
    applyFaceUvMap(geometry, cube.uv, boxUvSize, textureWidth, textureHeight)
  }

  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false

  const volume = Math.max(Math.abs(signedSize[0] * signedSize[1] * signedSize[2]), 0.001)
  meshMeta.push({
    mesh,
    volume,
  })

  const from = toBedrockCubeFrom(cube.origin, signedSize)
  const to = from.clone().add(new Vector3(signedSize[0], signedSize[1], signedSize[2]))
  const center = from.clone().add(to).multiplyScalar(0.5)

  if (!cube.pivot && !cube.rotation) {
    mesh.position.copy(center.sub(bonePivot))
    return mesh
  }

  const pivot = toBedrockPivotVector(cube.pivot)
  const wrapper = new Group()
  wrapper.position.copy(pivot.sub(bonePivot))
  applyBedrockEulerDegrees(wrapper, cube.rotation)
  mesh.position.copy(center.sub(toBedrockPivotVector(cube.pivot)))
  wrapper.add(mesh)
  return wrapper
}

function applyBoxUvMap(
  geometry: BufferGeometry,
  uvOffset: [number, number],
  size: [number, number, number],
  textureWidth: number,
  textureHeight: number,
  mirror: boolean
) {
  const [width, height, depth] = size

  const faceLayout: Record<CubeFaceName, { from: [number, number]; size: [number, number] }> = {
    east: {
      from: [0, depth],
      size: [depth, height],
    },
    west: {
      from: [depth + width, depth],
      size: [depth, height],
    },
    up: {
      from: [depth + width, depth],
      size: [-width, -depth],
    },
    down: {
      from: [depth + width * 2, 0],
      size: [-width, depth],
    },
    south: {
      from: [depth * 2 + width, depth],
      size: [width, height],
    },
    north: {
      from: [depth, depth],
      size: [width, height],
    },
  }

  if (mirror) {
    for (const faceName of CUBE_FACE_ORDER) {
      const layout = faceLayout[faceName]
      layout.from[0] += layout.size[0]
      layout.size[0] *= -1
    }

    const eastLayout = faceLayout.east
    faceLayout.east = faceLayout.west
    faceLayout.west = eastLayout
  }

  const faceRects: Partial<Record<CubeFaceName, FaceRect>> = {}

  for (const faceName of CUBE_FACE_ORDER) {
    const layout = faceLayout[faceName]
    const fromU = uvOffset[0] + layout.from[0]
    const fromV = uvOffset[1] + layout.from[1]
    faceRects[faceName] = [fromU, fromV, fromU + layout.size[0], fromV + layout.size[1]]
  }

  applyFaceRectMap(geometry, faceRects, textureWidth, textureHeight)
}

function applyFaceUvMap(
  geometry: BufferGeometry,
  faceUvMap: Record<string, unknown>,
  size: [number, number, number],
  textureWidth: number,
  textureHeight: number
) {
  const faceSizeByName: Record<CubeFaceName, [number, number]> = {
    east: [size[2], size[1]],
    west: [size[2], size[1]],
    north: [size[0], size[1]],
    south: [size[0], size[1]],
    up: [size[0], size[2]],
    down: [size[0], size[2]],
  }

  const faceRects: Partial<Record<CubeFaceName, FaceRect>> = {}

  for (const faceName of CUBE_FACE_ORDER) {
    const rawFace = faceUvMap[faceName]
    if (!rawFace || typeof rawFace !== "object") {
      continue
    }

    const face = rawFace as {
      uv?: unknown
      uv_size?: unknown
    }

    let faceRect: FaceRect | null = null

    if (Array.isArray(face.uv) && face.uv.length === 4) {
      faceRect = [Number(face.uv[0]), Number(face.uv[1]), Number(face.uv[2]), Number(face.uv[3])]
    } else if (
      Array.isArray(face.uv) &&
      face.uv.length >= 2 &&
      Number.isFinite(Number(face.uv[0])) &&
      Number.isFinite(Number(face.uv[1]))
    ) {
      const originU = Number(face.uv[0])
      const originV = Number(face.uv[1])

      const [defaultWidth, defaultHeight] = faceSizeByName[faceName]
      const width =
        Array.isArray(face.uv_size) && face.uv_size.length >= 2
          ? Number(face.uv_size[0])
          : defaultWidth
      const height =
        Array.isArray(face.uv_size) && face.uv_size.length >= 2
          ? Number(face.uv_size[1])
          : defaultHeight

      if (faceName === "up") {
        faceRect = [originU + width, originV + height, originU, originV]
      } else if (faceName === "down") {
        faceRect = [originU + width, originV, originU, originV + height]
      } else {
        faceRect = [originU, originV, originU + width, originV + height]
      }
    } else {
      continue
    }

    if (!faceRect || !Number.isFinite(faceRect[0] + faceRect[1] + faceRect[2] + faceRect[3])) {
      continue
    }

    faceRects[faceName] = faceRect
  }

  applyFaceRectMap(geometry, faceRects, textureWidth, textureHeight)
}

function applyFaceRectMap(
  geometry: BufferGeometry,
  faceRects: Partial<Record<CubeFaceName, FaceRect>>,
  textureWidth: number,
  textureHeight: number
) {
  const uvAttribute = geometry.getAttribute("uv")

  for (const faceName of CUBE_FACE_ORDER) {
    const rect = faceRects[faceName]
    if (!rect) {
      continue
    }

    const [left, top, right, bottom] = rect
    const offset = CUBE_FACE_INDEX[faceName] * 4

    uvAttribute.setXY(offset, left / textureWidth, 1 - top / textureHeight)
    uvAttribute.setXY(offset + 1, right / textureWidth, 1 - top / textureHeight)
    uvAttribute.setXY(offset + 2, left / textureWidth, 1 - bottom / textureHeight)
    uvAttribute.setXY(offset + 3, right / textureWidth, 1 - bottom / textureHeight)
  }

  uvAttribute.needsUpdate = true
}

function isFaceUvMap(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function fitModelInPreview(model: BuiltModel, camera: PerspectiveCamera) {
  const group = model.group
  group.position.set(0, 0, 0)
  group.scale.setScalar(1)

  group.updateMatrixWorld(true)

  const rawBox = new Box3().setFromObject(group)
  if (rawBox.isEmpty()) {
    return
  }

  const rawSize = new Vector3()
  rawBox.getSize(rawSize)

  const dominantDimension = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.0001)
  group.scale.setScalar(1.58 / dominantDimension)

  group.updateMatrixWorld(true)

  const scaledBox = new Box3().setFromObject(group)
  if (scaledBox.isEmpty()) {
    return
  }

  const scaledCenter = new Vector3()
  scaledBox.getCenter(scaledCenter)

  group.position.x = -scaledCenter.x
  group.position.y = -scaledBox.min.y
  group.position.z = -scaledCenter.z

  group.updateMatrixWorld(true)

  const finalBox = new Box3().setFromObject(group)
  if (finalBox.isEmpty()) {
    return
  }

  const finalSize = new Vector3()
  finalBox.getSize(finalSize)

  const finalCenter = new Vector3()
  finalBox.getCenter(finalCenter)

  const lookTarget = finalCenter.clone()

  if (model.visibleBoundsOffset) {
    const visibleBoundsHeight = model.visibleBoundsHeight
    if (typeof visibleBoundsHeight === "number" && visibleBoundsHeight > 0) {
      const fractionFromBottom = MathUtils.clamp(
        model.visibleBoundsOffset.y / visibleBoundsHeight,
        0.15,
        0.85
      )
      lookTarget.y = finalBox.min.y + finalSize.y * fractionFromBottom
    }
  } else {
    lookTarget.y = Math.max(finalBox.min.y + finalSize.y * 0.5, 0.2)
  }

  const halfHeight = finalSize.y * 0.5
  const halfWidth = Math.max(finalSize.x, finalSize.z) * 0.5

  const verticalFov = MathUtils.degToRad(camera.fov)
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * Math.max(camera.aspect, 0.0001))
  const distanceForHeight = halfHeight / Math.tan(verticalFov * 0.5)
  const distanceForWidth = halfWidth / Math.tan(horizontalFov * 0.5)
  const distance = Math.max(distanceForHeight, distanceForWidth, 1.35) * 1.2

  const newX = lookTarget.x + distance * 0.82
  const newY = lookTarget.y + finalSize.y * 0.12
  const newZ = lookTarget.z + distance * 0.82
  camera.position.set(newX, newY, newZ)
  camera.lookAt(lookTarget)
  camera.updateProjectionMatrix()
}

const CUBE_FACE_ORDER: CubeFaceName[] = ["east", "west", "up", "down", "south", "north"]

const CUBE_FACE_INDEX: Record<CubeFaceName, number> = {
  east: 0,
  west: 1,
  up: 2,
  down: 3,
  south: 4,
  north: 5,
}

function applyBedrockEulerDegrees(target: Group, degrees?: [number, number, number]) {
  target.rotation.order = "ZYX"

  if (!degrees) {
    target.rotation.set(0, 0, 0)
    return
  }

  target.rotation.set(
    MathUtils.degToRad(-degrees[0]),
    MathUtils.degToRad(-degrees[1]),
    MathUtils.degToRad(degrees[2])
  )
}

function toBedrockPivotVector(value?: [number, number, number]): Vector3 {
  if (!value) {
    return new Vector3()
  }

  return new Vector3(-value[0], value[1], value[2])
}

function toBedrockCubeFrom(
  origin: [number, number, number],
  size: [number, number, number]
): Vector3 {
  return new Vector3(-(origin[0] + size[0]), origin[1], origin[2])
}

function clearGroup(group: Group) {
  for (const child of [...group.children]) {
    disposeObjectTree(child)
    group.remove(child)
  }
}

function disposeObjectTree(object: Object3D) {
  if (object instanceof Mesh) {
    object.geometry.dispose()
    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        material.dispose()
      }
    } else {
      const material = object.material as MeshStandardMaterial
      material.map?.dispose()
      material.dispose()
    }
  }

  for (const child of [...object.children]) {
    disposeObjectTree(child)
  }
}
