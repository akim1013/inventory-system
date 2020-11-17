import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../services/global.service';
import { MENU } from './menu';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  menuItems: Object;

  constructor(public globalService: GlobalService, public authService: AuthService) { }

  ngOnInit(): void {
    if(this.authService.currentUserRole == 'admin'){
      this.menuItems = MENU.filter(item => item['role'] == 'admin')
    }else{
      this.menuItems = MENU.filter(item => item['role'] != 'admin')
    }
  }

}
