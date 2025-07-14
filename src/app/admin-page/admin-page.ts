import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { StateService } from '../state';
import { JobPosition } from '../models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css']
})
export class AdminPage {
  positionForm: FormGroup;
  positions: any;
  editingIndex: number | null = null;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private stateService: StateService
  ) {
    this.positions = this.stateService.positions;
    this.positionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      hint: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onSubmit(): void {
    if (this.positionForm.valid) {
      const formValue = this.positionForm.value;

      if (this.isEditing && this.editingIndex !== null) {
        const existingPosition = this.positions()[this.editingIndex];
        const position: JobPosition = {
          ...formValue,
          id: existingPosition.id
        };
        this.stateService.positions.update(positions => {
          const updated = [...positions];
          updated[this.editingIndex!] = position;
          return updated;
        });
        this.cancelEdit();
      } else {
        const position: JobPosition = {
          ...formValue,
          id: this.generateId()
        };
        this.stateService.addPosition(position);
        this.positionForm.reset();
      }
    }
  }

  editPosition(index: number): void {
    const position = this.positions()[index];
    this.editingIndex = index;
    this.isEditing = true;

    this.positionForm.patchValue({
      title: position.title,
      description: position.description,
      hint: position.hint
    });
  }

  cancelEdit(): void {
    this.editingIndex = null;
    this.isEditing = false;
    this.positionForm.reset();
  }

  deletePosition(index: number): void {
    if (confirm('Sei sicuro di voler eliminare questa posizione?')) {
      this.stateService.positions.update(positions =>
        positions.filter((_, i) => i !== index)
      );

      if (this.editingIndex === index) {
        this.cancelEdit();
      }
    }
  }

  getSubmitButtonText(): string {
    return this.isEditing ? 'Aggiorna Posizione' : 'Aggiungi Posizione';
  }

  getFormTitle(): string {
    return this.isEditing ? 'Modifica Posizione' : 'Aggiungi Nuova Posizione';
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
