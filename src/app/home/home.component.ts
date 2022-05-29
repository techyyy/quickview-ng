import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import * as uuid from 'uuid';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  public createARoom() {
    const url = '/chat/'  + uuid.v4();;
    this.router.navigate([url]);
  }

}
