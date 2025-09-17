import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutComponent implements OnInit {
  private http = inject(HttpClient);
  htmlContent = '';

  async ngOnInit() {
    this.http.get('docker-setup.md', { responseType: 'text' }) // Note: no 'public/' prefix
      .subscribe(async markdown => {
        this.htmlContent = await marked(markdown);
      });
  }
}
