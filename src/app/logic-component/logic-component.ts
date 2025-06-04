// Author: Preston Lee

import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { Library } from 'fhir/r5';
import { LibraryService } from '../library.service';
import { Toast, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'logic-component',
  imports: [],
  templateUrl: './logic-component.html',
  styleUrl: './logic-component.scss'
})
export class LogicComponent implements OnChanges {

  public libraryId: string;
  public library: Library | null = null;

  constructor(
    protected libraryService: LibraryService,
    protected toastrService: ToastrService) {
    this.libraryId = (window as any)["WMM_LIBRARY_ID"] || 'UnknownLibraryId';
    console.log('LogicComponent initialized with libraryId:', this.libraryId);
    this.reloadLibrary();
  }

  reloadLibrary() {
    this.libraryService.get(this.libraryId).subscribe({
      next: (library: Library) => {
        this.library = library;
        console.log('Library loaded:', library);
      }, error: (error: any) => {
        console.error('Error loading library:', error);
        this.toastrService.error(`The server didn't respond with library for "${this.libraryId}". It likely doesn't exist, in which case you should upload one. :)`, 'Logic Library Not Loaded');
        this.library = null;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('Changes detected:', changes);
  }

}
