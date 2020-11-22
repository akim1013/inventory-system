import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { CookieService } from '../../services/cookie.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  error_message: string = '';

  username: string = '';
  password: string = '';

  returnUrl: string;
  success_message: string = '';

  remember: Boolean = true;

  loading: Boolean = false;
  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService, private cookieService: CookieService,) {
    if (authService.isLoggedIn()) {
      if(authService.currentUserRole == 'admin'){
        router.navigate(['setting']);
      }else{
        router.navigate(['count']);
      }
    }
  }

  ngOnInit(): void {
    let remember_credentials = JSON.parse(this.cookieService.getCookie('PS_remember_credentials'));
    if(remember_credentials){
        this.username = remember_credentials.username;
        this.password = remember_credentials.password;
    }
  }
  username_change = event => {
    this.username = event.target.value;
  }
  password_change = event => {
    this.password = event.target.value;
  }
  login = () => {
    this.loading = false;
    this.success_message = '';
    this.error_message = '';
    if((this.username != '') && (this.password != '')){
      this.loading = true;
      this.authService.login(this.username, this.password).pipe(first()).subscribe(
        data => {
          if(data['status'] == 'success'){
            if(this.remember){
              this.cookieService.setCookie('PS_remember_credentials', JSON.stringify({
                username: this.username,
                password: this.password
              }), 10);
            }else{
              this.cookieService.deleteCookie('PS_remember_credentials');
            }
            this.success_message = data['msg'];
            if(data['res']['role'] == 'admin'){
              this.returnUrl = '/item';
            }else{
              this.returnUrl = '/count';
            }
            setTimeout(() => {
              this.router.navigate([this.returnUrl]);
            }, 1000)
          }else{
            this.error_message = data['msg'];
          }
          this.loading = false;
        },
        error => {
          console.log(error)
          this.loading = false;
        }
      );
    }else{
      this.error_message = 'User ID and password required.';
    }
  }

}
