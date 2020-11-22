import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import * as moment from 'moment';
import { GlobalService } from '../../services/global.service'
import { LoadingBarService } from '@ngx-loading-bar/core';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-count',
  templateUrl: './count.component.html',
  styleUrls: ['./count.component.css']
})
export class CountComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService,
    private loadingBar: LoadingBarService,
    private router: Router
  ) { }
  
  loader = this.loadingBar.useRef();

  availablePeriod = ['week1', 'week2', 'week3', 'week4', 'week5', 'month']

  date = 'Week ' + Math.ceil(moment().date() / 7) + ', ' + moment().format('MMM YYYY')
  
  isCountable = false

  ngOnInit(): void {
    this.globalService.menu = 'count';
    this.canStartCount()
  }
  startCount(){
    Swal.fire({
      title: `Do you want to start week ${Math.ceil(moment().date() / 7)} count?`,
      showCancelButton: true,
      confirmButtonText: `Start`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.start()
        this.api.addIsCount(this.parseService.encode({
          counter_id: this.authService.currentUser()['id']
        })).pipe(first()).subscribe(data => {
          console.log(data)
          this.router.navigate(['count/draft']);
          this.loader.complete()
        }, error => {
          console.log(error)
          this.loader.complete()
        })
      } 
    })
  }
  canStartCount(){
    this.loader.start()
    this.api.canStartCount(this.parseService.encode({
      counter_id: this.authService.currentUser()['id']
    })).pipe(first()).subscribe(data => {
      if(data['data'] == 1){
        this.isCountable = true
        this.loader.complete()
      }
    }, error => {
      console.log(error)
      this.loader.complete()
    })
  }
  getIsCounts(){

  }
  addIsCount(){

  }
  removeIsCount(){

  }
  draftIsCount(){
    
  }
}
