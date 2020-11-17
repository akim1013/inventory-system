import { Injectable } from '@angular/core';
import { CookieService } from '../services/cookie.service';
import { ApiService } from '../services/api.service';
import { ParseService } from '../services/parse.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: Object;
  constructor(private cookieService: CookieService, private apiService: ApiService, private parseService: ParseService) { }
  public currentUser() {
    if (!this.user) {
        this.user = JSON.parse(this.cookieService.getCookie('currentUser'));
    }
    return this.user;
  }
  login(username: string, password: string) {
    return this.apiService.login(this.parseService.encode({
        name: username,
        password: password
    }));
  }
  isLoggedIn(){
    if(this.currentUser()){
      return true;
    }else{
      return false;
    }
  }
  public get currentUserRole(){
    return this.user['role']
  }
  logout() {
    // remove user from local storage to log user out
    this.cookieService.deleteCookie('currentUser');
    this.user = null;
  }
}
