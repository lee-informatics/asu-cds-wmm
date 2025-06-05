// Author: Preston Lee

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Bundle, Patient, Parameters, Library } from 'fhir/r4';
import { ToastrService } from 'ngx-toastr';
import { PatientService } from '../patient.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../library.service';

@Component({
  selector: 'dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent {

  patientSearchText = '';
  patientList: Bundle<Patient> | null = null;
  patientSearching: boolean = false;
  patientSelected: Patient | null = null;

  constructor(
    public route: ActivatedRoute,
    protected patientService: PatientService,
    protected libraryService: LibraryService,
    protected toastrService: ToastrService) {
  }

  patientSearch(text: string) {
    if (text.length > 0) {
      // console.log('Searching for patients with text: ' + text);
      this.patientSearching = true;
      // this.patientList = null;
      this.patientService.search(this.patientSearchText).subscribe({
        next: b => {
          this.patientSearching = false;
          this.patientList = b;
          // console.log('Search next');
        }, error: error => {
          this.patientSearching = false;
          this.toastrService.error('Error searching for patients: ' + error.message, 'Search Error');
          this.patientList = null;
        }
      });
    } else {
      // console.log('No search text provided, resetting search');
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

  rerunCql() {
    if (this.libraryService.libraryId && this.patientSelected?.id) {
      let params = this.createEvaluateParameters(this.patientSelected.id);
      this.libraryService.evaluate(this.libraryService.libraryId, params).subscribe({
        next: (bundle: Library) => {
          console.log('CQL evaluation result:', bundle);
          this.toastrService.success(`CQL evaluation for "${this.libraryService.libraryId}" completed successfully!`, 'CQL Evaluation Success');
        }
        , error: (error: any) => {
          console.error('Error evaluating CQL:', error);
          this.toastrService.error(`Failed to evaluate CQL for "${this.libraryService.libraryId}". Please check the server logs for more details.`, 'CQL Evaluation Failed');
        }
      });
    } else {
      this.toastrService.error('Library ID is not set. Please provide a valid library ID before running CQL.', 'CQL Evaluation Error');
    }
  }

  createEvaluateParameters(patientId: string): Parameters {
    const parameters: Parameters = {
      resourceType: 'Parameters',
      parameter: [
        // { name: 'url', valueUri: `http://localhost:8080/fhir/Library/${libraryId}` },
        // { name: 'library', valueString: libraryId },
        // {
        //   name: "useServerData",
        //   valueBoolean: true
        // },
        {
          name: "subject",
          valueString: `Patient/${this.patientSelected?.id}`
        }]
    };
    return parameters;
  }
}
