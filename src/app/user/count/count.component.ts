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

  draftCountId = 0
  draftPeriod = ''

  allCounts: Array<Object> = []

  ngOnInit(): void {
    this.globalService.menu = 'count';
    this.canStartCount()
    this.getIsCounts()
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
          counter_id: this.authService.currentUser()['id'],
          period: `week${Math.ceil(moment().date() / 7)}` // Need to modify for monthly count 
        })).pipe(first()).subscribe(data => {
          console.log(data)
          this.router.navigate(['count/draft', data['data']]);
          this.loader.complete()
        }, error => {
          console.log(error)
          this.loader.complete()
        })
      } 
    })
  }
  continueCount(){
    Swal.fire({
      title: `Do you want to continue ${this.draftPeriod} count?`,
      showCancelButton: true,
      confirmButtonText: `Continue`,
      icon: 'question'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['count/draft', this.draftCountId]);
      } 
    })
  }
  canStartCount(){
    this.loader.start()
    this.api.canStartCount(this.parseService.encode({
      counter_id: this.authService.currentUser()['id']
    })).pipe(first()).subscribe(data => {
      let res = data['data']
      if(res.exist_draft){
        this.draftCountId = res.draft_id
        this.draftPeriod = res.draft_period
      }else{
        this.isCountable = true
      }
      this.loader.complete()
    }, error => {
      console.log(error)
      this.loader.complete()
    })
  }
  getIsCounts(){
    this.loader.start()
    this.api.getIsCounts(this.parseService.encode({
      branch_id: this.authService.currentUser()['branch_id']
    })).pipe(first()).subscribe(data => {
      let res = data['data']
      this.allCounts = [...res]
      this.loader.complete()
    }, error => {
      console.log(error)
      this.loader.complete()
    })
  }
  format_date_time = (date: any) => {
    return moment(date, 'YYYY-MM-DD HH:mm:ss').format('hh:mm A MMM DD ddd, YYYY')
  }
  remove_count(id, period){
    Swal.fire({
      title: `Are you sure to remove ${period} count?`,
      showCancelButton: true,
      confirmButtonText: `Remove`,
      icon: 'error'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.start()
        this.api.removeIsCount(this.parseService.encode({
          is_count_id: id
        })).pipe(first()).subscribe(data => {
          this.toast.error(`${period} count has been removed successfully`, 'Error');
          this.getIsCounts()
          this.loader.complete()
        }, error => {
          console.log(error)
          this.loader.complete()
        })
      } 
    })
  }
  view_count(id, status){
    if(status == 'draft'){
      this.continueCount()
    }else{
      this.router.navigate(['count/draft', id]);
    }
  }
}
