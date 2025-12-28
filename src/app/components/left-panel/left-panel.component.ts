import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.scss'
})
export class LeftPanelComponent {
  readonly panelName = signal('3D View Area (Three.js)');
  readonly placeholderText = signal('Three.js canvas will be rendered here');
}
