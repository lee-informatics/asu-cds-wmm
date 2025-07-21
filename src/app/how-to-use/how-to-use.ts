import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';

@Component({
  selector: 'app-how-to-use',
  imports: [],
  templateUrl: './how-to-use.html',
  styleUrl: './how-to-use.scss'
})
export class HowToUseComponent implements OnInit {
  private http = inject(HttpClient);
  htmlContent = '';

  async ngOnInit() {
    this.http.get('docker-setup.md', { responseType: 'text' }) // Note: no 'public/' prefix
      .subscribe(async markdown => {
        this.htmlContent = await marked(markdown);
      });
  }
}
