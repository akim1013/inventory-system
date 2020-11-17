import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) { }

  day: String;
  time: String;
  user: Object;
  ngOnInit(): void {
    setInterval(() => {
      this.day = moment().format('MMM DD ddd, YYYY');
      this.time = moment().format('hh:mm:ss');
    }, 1000)
    this.user = this.authService.currentUser();
  }
  logout = () => {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
