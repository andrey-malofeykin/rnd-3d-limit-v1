import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';
import * as THREE from 'three';

export interface CameraConfig {
  distance: number;
  phi: number;   // vertical angle (0 to PI)
  theta: number; // horizontal angle (0 to 2PI)
  fov: number;
  near: number;
  far: number;
}

@Injectable({
  providedIn: 'root'
})
export class ThreeSceneService implements OnDestroy {
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private mainCamera!: THREE.PerspectiveCamera;
  private camera2!: THREE.PerspectiveCamera;
  private cameraHelper!: THREE.CameraHelper;
  private axesHelper!: THREE.AxesHelper;
  private parallelepiped!: THREE.Mesh;

  // 2D renderer for camera1 view
  private renderer2D!: THREE.WebGLRenderer;

  private animationId: number | null = null;
  private canvasElementRef: ElementRef<HTMLCanvasElement> | null = null;
  private canvas2DElementRef: ElementRef<HTMLCanvasElement> | null = null;

  // Camera 1 configuration
  camera1Config: CameraConfig = {
    distance: 15,
    phi: Math.PI / 4,
    theta: Math.PI / 4,
    fov: 50,
    near: 0.1,
    far: 1000
  };

  // Camera 2 configuration
  camera2Config: CameraConfig = {
    distance: 20,
    phi: Math.PI / 3,
    theta: Math.PI,
    fov: 45,
    near: 0.1,
    far: 1000
  };

  private updateCallback: (() => void) | null = null;

  constructor(private ngZone: NgZone) {}

  initialize(canvasRef: ElementRef<HTMLCanvasElement>, updateCallback?: () => void): void {
    this.canvasElementRef = canvasRef;
    this.updateCallback = updateCallback ?? null;

    const canvas = canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    // Create main camera (Camera 1)
    this.mainCamera = new THREE.PerspectiveCamera(
      this.camera1Config.fov,
      width / height,
      this.camera1Config.near,
      this.camera1Config.far
    );
    this.updateCameraPosition(this.mainCamera, this.camera1Config);
    // Important: update projection matrix before creating CameraHelper
    this.mainCamera.updateProjectionMatrix();

    // Create Camera 2
    this.camera2 = new THREE.PerspectiveCamera(
      this.camera2Config.fov,
      width / height,
      this.camera2Config.near,
      this.camera2Config.far
    );
    this.updateCameraPosition(this.camera2, this.camera2Config);
    this.camera2.updateProjectionMatrix();

    // Create camera helper for Camera 1
    this.cameraHelper = new THREE.CameraHelper(this.mainCamera);
    this.scene.add(this.cameraHelper);

    // Create axes helper (Z up)
    this.axesHelper = new THREE.AxesHelper(10);
    this.scene.add(this.axesHelper);

    // Create parallelepiped (box) above Z > 0
    this.createParallelepiped();

    // Add lights
    this.addLights();

    // Start animation loop
    this.startAnimation();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize);
  }

  private createParallelepiped(): void {
    // Parallelepiped positioned above Z > 0
    const width = 3;
    const height = 2;
    const depth = 1.5;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4285f4,
      shininess: 100
    });

    this.parallelepiped = new THREE.Mesh(geometry, material);
    // Position centered in X, Y, with bottom at Z = 1 (above 0)
    this.parallelepiped.position.set(0, 0, 1 + depth / 2);
    this.parallelepiped.castShadow = true;
    this.parallelepiped.receiveShadow = true;

    this.scene.add(this.parallelepiped);
  }

  private addLights(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 20);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  private updateCameraPosition(camera: THREE.PerspectiveCamera, config: CameraConfig): void {
    // Spherical coordinates to Cartesian (Z up)
    // x = r * sin(phi) * cos(theta)
    // y = r * sin(phi) * sin(theta)
    // z = r * cos(phi)
    camera.position.x = config.distance * Math.sin(config.phi) * Math.cos(config.theta);
    camera.position.y = config.distance * Math.sin(config.phi) * Math.sin(config.theta);
    camera.position.z = config.distance * Math.cos(config.phi);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }

  updateCamera1(config: Partial<CameraConfig>): void {
    this.camera1Config = { ...this.camera1Config, ...config };
    this.updateCameraPosition(this.mainCamera, this.camera1Config);
    this.mainCamera.fov = this.camera1Config.fov;
    this.mainCamera.updateProjectionMatrix();
    this.cameraHelper.update();
  }

  updateCamera2(config: Partial<CameraConfig>): void {
    this.camera2Config = { ...this.camera2Config, ...config };
    this.updateCameraPosition(this.camera2, this.camera2Config);
    this.camera2.fov = this.camera2Config.fov;
    this.camera2.updateProjectionMatrix();
  }

  private startAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animationId = requestAnimationFrame(animate);
        this.render();
      };
      animate();
    });
  }

  private render(): void {
    if (this.renderer && this.scene && this.camera2) {
      this.cameraHelper.update();
      this.renderer.render(this.scene, this.camera2);
    }

    // Render 2D view from camera1
    if (this.renderer2D && this.scene && this.mainCamera) {
      this.renderer2D.render(this.scene, this.mainCamera);
    }
  }

  private onWindowResize = (): void => {
    this.resizeCanvases();
  };

  /**
   * Public method to resize canvases based on their container dimensions
   * Called automatically on window resize and can be called manually when panel sizes change
   */
  resizeCanvases(): void {
    if (!this.canvasElementRef || !this.renderer) return;

    // Get 3D canvas container dimensions (left panel)
    const canvas = this.canvasElementRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;

    const width3D = container.clientWidth;
    const height3D = container.clientHeight;

    // Update camera2 aspect ratio for 3D view (left panel)
    this.camera2.aspect = width3D / height3D;
    this.camera2.updateProjectionMatrix();

    this.renderer.setSize(width3D, height3D);

    // Resize 2D renderer and update mainCamera aspect ratio (right panel)
    if (this.canvas2DElementRef && this.renderer2D) {
      const canvas2D = this.canvas2DElementRef.nativeElement;
      const container2D = canvas2D.parentElement;
      if (container2D) {
        const width2D = container2D.clientWidth;
        const height2D = container2D.clientHeight;

        // Update mainCamera aspect ratio for 2D view (right panel)
        this.mainCamera.aspect = width2D / height2D;
        this.mainCamera.updateProjectionMatrix();

        this.renderer2D.setSize(width2D, height2D);
      }
    }

    // Immediately render to prevent canvas from being empty during resize
    this.render();
  }

  getCamera1Config(): CameraConfig {
    return { ...this.camera1Config };
  }

  getCamera2Config(): CameraConfig {
    return { ...this.camera2Config };
  }

  /**
   * Initialize 2D renderer for camera1 view projection
   * Should be called after main initialize() method
   */
  initialize2D(canvasRef: ElementRef<HTMLCanvasElement>): void {
    if (!this.scene || !this.mainCamera) {
      throw new Error('Main scene must be initialized first. Call initialize() before initialize2D().');
    }

    this.canvas2DElementRef = canvasRef;
    const canvas = canvasRef.nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Update mainCamera aspect ratio for 2D view
    this.mainCamera.aspect = width / height;
    this.mainCamera.updateProjectionMatrix();

    // Create second renderer for 2D view from camera1
    this.renderer2D = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer2D.setSize(width, height);
    this.renderer2D.setPixelRatio(window.devicePixelRatio);
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.renderer2D) {
      this.renderer2D.dispose();
    }
  }
}
