import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  @Input() isOpen = false;
  @Input() title = 'Modal Title';
  @Input() showFooter = true;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirmed = new EventEmitter<void>();

  closeModal(): void {
    this.isOpen = false;
    this.onClose.emit();
  }

  onConfirm(): void {
    this.onConfirmed.emit();
    this.closeModal();
  }

  openModal(): void {
    this.isOpen = true;
  }
}

