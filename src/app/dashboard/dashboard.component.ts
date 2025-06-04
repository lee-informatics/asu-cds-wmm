// Author: Preston Lee

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Bundle, Patient } from 'fhir/r5';
import { ToastrService } from 'ngx-toastr';
import { PatientService } from '../patient.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  patientSearchText = '';
  patientList: Bundle<Patient> | null = null;
  patientSearching: boolean = false;
  patientSelected: Patient | null = null;

  constructor(
    public route: ActivatedRoute,
    protected patientService: PatientService,
    protected toastrService: ToastrService) {
  }

  patientSearch(text: string) {
    if (text.length > 0) {
      console.log('Searching for patients with text: ' + text);
      this.patientSearching = true;
      // this.patientList = null;
      this.patientService.search(this.patientSearchText).subscribe({
        next: b => {
          this.patientSearching = false;
          this.patientList = b;
          console.log('Search next');

        }, error: error => {
          this.patientSearching = false;
          this.toastrService.error('Error searching for patients: ' + error.message, 'Search Error');
          this.patientList = null;
        }
      });
    } else {
      console.log('No search text provided, resetting search');
      this.resetSearch();
    }
  }

  selectPatientSubject(p: Patient) {
    this.patientSelected = p;
  }

  removeSubject() {
    this.resetSearch();
  }

  resetSearch() {
    this.patientSearchText = '';
    this.patientList = null;
    this.patientSelected = null;
    this.patientSearching = false;
  }

}
