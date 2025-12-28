import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThreeSceneService } from '../../services/three-scene.service';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.scss'
})
export class RightPanelComponent implements AfterViewInit, OnDestroy {
  readonly panelName = signal('2D Projection View (Camera 1)');

  @ViewChild('canvas2D', { static: true }) canvas2D!: ElementRef<HTMLCanvasElement>;

  constructor(private threeSceneService: ThreeSceneService) {}

  ngAfterViewInit(): void {
    // Initialize 2D renderer with camera1 view
    this.threeSceneService.initialize2D(this.canvas2D);
  }

  ngOnDestroy(): void {
    // Cleanup is handled by the service
  }
}
