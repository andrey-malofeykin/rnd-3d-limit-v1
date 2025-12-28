import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ThreeSceneService } from '../../services/three-scene.service';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSliderModule,
    MatDividerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss'
})
export class LeftPanelComponent implements AfterViewInit, OnDestroy {
  readonly panelName = signal('3D View Area (Three.js)');
  readonly isControlsVisible = signal(true);

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('threeCanvas', { static: true }) threeCanvas!: ElementRef<HTMLCanvasElement>;

  // Camera 1 controls
  cam1Distance = signal(15);
  cam1Phi = signal(45);
  cam1Theta = signal(45);
  cam1Fov = signal(50);

  // Camera 2 controls
  cam2Distance = signal(20);
  cam2Phi = signal(60);
  cam2Theta = signal(180);
  cam2Fov = signal(45);

  constructor(private threeSceneService: ThreeSceneService) {}

  ngAfterViewInit(): void {
    this.threeSceneService.initialize(this.threeCanvas);

    // Initialize control values from service
    const cam1Config = this.threeSceneService.getCamera1Config();
    this.cam1Distance.set(cam1Config.distance);
    this.cam1Phi.set((cam1Config.phi * 180) / Math.PI);
    this.cam1Theta.set((cam1Config.theta * 180) / Math.PI);
    this.cam1Fov.set(cam1Config.fov);

    const cam2Config = this.threeSceneService.getCamera2Config();
    this.cam2Distance.set(cam2Config.distance);
    this.cam2Phi.set((cam2Config.phi * 180) / Math.PI);
    this.cam2Theta.set((cam2Config.theta * 180) / Math.PI);
    this.cam2Fov.set(cam2Config.fov);
  }

  // Camera 1 control handlers
  onCam1DistanceChange(value: string | number): void {
    this.cam1Distance.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera1();
  }

  onCam1PhiChange(value: string | number): void {
    this.cam1Phi.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera1();
  }

  onCam1ThetaChange(value: string | number): void {
    this.cam1Theta.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera1();
  }

  onCam1FovChange(value: string | number): void {
    this.cam1Fov.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera1();
  }

  // Camera 2 control handlers
  onCam2DistanceChange(value: string | number): void {
    this.cam2Distance.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera2();
  }

  onCam2PhiChange(value: string | number): void {
    this.cam2Phi.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera2();
  }

  onCam2ThetaChange(value: string | number): void {
    this.cam2Theta.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera2();
  }

  onCam2FovChange(value: string | number): void {
    this.cam2Fov.set(typeof value === 'string' ? parseFloat(value) : value);
    this.updateCamera2();
  }

  private updateCamera1(): void {
    this.threeSceneService.updateCamera1({
      distance: this.cam1Distance(),
      phi: (this.cam1Phi() * Math.PI) / 180,
      theta: (this.cam1Theta() * Math.PI) / 180,
      fov: this.cam1Fov()
    });
  }

  private updateCamera2(): void {
    this.threeSceneService.updateCamera2({
      distance: this.cam2Distance(),
      phi: (this.cam2Phi() * Math.PI) / 180,
      theta: (this.cam2Theta() * Math.PI) / 180,
      fov: this.cam2Fov()
    });
  }

  toggleControls(): void {
    this.isControlsVisible.update(v => !v);
  }

  ngOnDestroy(): void {
    // Cleanup is handled by the service
  }
}
