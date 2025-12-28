import { Component, ElementRef, HostListener, Renderer2, inject, signal, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-split-resizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-resizer.component.html',
  styleUrl: './split-resizer.component.scss'
})
export class SplitResizerComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  isDragging = signal(false);
  @Output() resizeStart = new EventEmitter<void>();
  @Output() resizing = new EventEmitter<void>();
  @Output() resizeEnd = new EventEmitter<void>();

  private startX = 0;
  private startLeftWidth = 0;
  private leftPanel: HTMLElement | null = null;
  private rightPanel: HTMLElement | null = null;
  private rafId: number | null = null;

  ngAfterViewInit(): void {
    // Find sibling panels
    const parent = this.elementRef.nativeElement.parentElement;
    if (parent) {
      this.leftPanel = parent.children[0] as HTMLElement;
      this.rightPanel = parent.children[2] as HTMLElement;
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
    this.startX = event.clientX;

    // Get current left panel width
    if (this.leftPanel) {
      this.startLeftWidth = this.leftPanel.offsetWidth;
    }

    this.resizeStart.emit();

    // Add global event listeners
    this.renderer.listen('document', 'mousemove', this.onMouseMove);
    this.renderer.listen('document', 'mouseup', this.onMouseUp);

    // Disable text selection during drag
    this.renderer.setStyle(document.body, 'userSelect', 'none');
    this.renderer.setStyle(document.body, 'cursor', 'col-resize');
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.startX;
    const newLeftWidth = this.startLeftWidth + deltaX;

    // Constrain width (min 200px, max 80% of window)
    const minWidth = 200;
    const maxWidth = window.innerWidth * 0.8;
    const constrainedWidth = Math.max(minWidth, Math.min(newLeftWidth, maxWidth));

    if (this.leftPanel) {
      this.renderer.setStyle(this.leftPanel, 'width', `${constrainedWidth}px`);
      this.renderer.setStyle(this.leftPanel, 'flex', 'none');
    }

    if (this.rightPanel) {
      // Right panel takes remaining space
      this.renderer.setStyle(this.rightPanel, 'flex', '1');
    }

    // Throttle resize event using requestAnimationFrame
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.resizing.emit();
        this.rafId = null;
      });
    }
  };

  private onMouseUp = (): void => {
    if (!this.isDragging()) return;

    this.isDragging.set(false);
    this.resizeEnd.emit();

    // Restore body styles
    this.renderer.removeStyle(document.body, 'userSelect');
    this.renderer.removeStyle(document.body, 'cursor');
  };
}
