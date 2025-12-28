import { Component, inject, DestroyRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';
import { SplitResizerComponent } from './components/split-resizer/split-resizer.component';
import { ThreeSceneService } from './services/three-scene.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    LeftPanelComponent,
    RightPanelComponent,
    SplitResizerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  readonly title = 'RND 3D Limit';

  private threeSceneService = inject(ThreeSceneService);
  private destroyRef = inject(DestroyRef);

  private resizeObserverLeft: ResizeObserver | null = null;
  private resizeObserverRight: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.setupResizeObservers();
  }

  private setupResizeObservers(): void {
    // Observe left panel canvas container for size changes
    const leftCanvas = document.querySelector('.left-panel .canvas-container') as HTMLElement;
    const rightCanvas = document.querySelector('.right-panel .panel-content') as HTMLElement;

    if (leftCanvas) {
      this.resizeObserverLeft = new ResizeObserver(() => {
        this.threeSceneService.resizeCanvases();
      });
      this.resizeObserverLeft.observe(leftCanvas);
    }

    if (rightCanvas) {
      this.resizeObserverRight = new ResizeObserver(() => {
        this.threeSceneService.resizeCanvases();
      });
      this.resizeObserverRight.observe(rightCanvas);
    }

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.resizeObserverLeft?.disconnect();
      this.resizeObserverRight?.disconnect();
    });
  }

  onResizeEnd(): void {
    // Called when resizer drag ends - ensure canvases are updated
    this.threeSceneService.resizeCanvases();
  }

  onResizing(): void {
    // Called during resizer drag - resize canvases in real-time
    this.threeSceneService.resizeCanvases();
  }
}
