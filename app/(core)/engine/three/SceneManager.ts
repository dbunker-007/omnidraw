import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Transform3D } from '../layers/types'

export class SceneManager {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private loader: GLTFLoader
  private currentModel: THREE.Object3D | null = null
  private animationId: number | null = null
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    // Scene
    this.scene = new THREE.Scene()

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    this.camera.position.set(0, 1.5, 4)

    // Controls
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.07
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 50

    // Lights
    this.setupLights()

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x333344, 0x222233)
    this.scene.add(grid)

    // Loader
    this.loader = new GLTFLoader()

    this.startLoop()
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambient)

    const key = new THREE.DirectionalLight(0xfff0e0, 1.8)
    key.position.set(5, 8, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    this.scene.add(key)

    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.5)
    fill.position.set(-5, 3, -3)
    this.scene.add(fill)

    const rim = new THREE.DirectionalLight(0xffd0a0, 0.4)
    rim.position.set(0, -2, -6)
    this.scene.add(rim)
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  async loadModel(url: string): Promise<void> {
    if (this.currentModel) {
      this.scene.remove(this.currentModel)
      this.currentModel = null
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene

          // Auto-center + scale
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim

          model.position.sub(center.multiplyScalar(scale))
          model.scale.setScalar(scale)

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          this.currentModel = model
          this.scene.add(model)
          resolve()
        },
        undefined,
        reject
      )
    })
  }

  applyTransform(t: Transform3D) {
    if (!this.currentModel) return
    this.currentModel.position.set(t.position.x, t.position.y, t.position.z)
    this.currentModel.rotation.set(
      THREE.MathUtils.degToRad(t.rotation.x),
      THREE.MathUtils.degToRad(t.rotation.y),
      THREE.MathUtils.degToRad(t.rotation.z)
    )
    this.currentModel.scale.set(t.scale.x, t.scale.y, t.scale.z)
  }

  applyCamera(cam: { position: { x: number; y: number; z: number }; fov: number }) {
    this.camera.position.set(cam.position.x, cam.position.y, cam.position.z)
    this.camera.fov = cam.fov
    this.camera.updateProjectionMatrix()
  }

  snapshot(): string {
    this.renderer.render(this.scene, this.camera)
    return this.canvas.toDataURL('image/png')
  }

  private startLoop() {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop)
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  getCamera() {
    return this.camera
  }

  dispose() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)
    this.controls.dispose()
    this.renderer.dispose()
  }
}
