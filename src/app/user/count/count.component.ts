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
  lastPeriod = ''
  lastTimestamp = ''

  allCounts: Array<Object> = []

  ngOnInit(): void {
    this.globalService.menu = 'count';
    this.canStartCount()
    this.getIsCounts()
  }
  startCount(){
    if(Math.ceil(moment().date() / 7) > 3){
      Swal.fire({
        title: `Start count?`,
        showDenyButton: true,
        icon: 'question',
        allowOutsideClick: false,
        text: `It\'s almost end of the month and you can start monthly count. Or you can start week${Math.ceil(moment().date() / 7)} count. What are you going to do?`,
        confirmButtonText: `Weekly count`,
        denyButtonText: `Montly count`,
      }).then((result) => {
        if (result.isConfirmed) {
          this.startWeeklyCount()
        } else {
          this.startMonthlyCount()
        }
      })
    }else{
      this.startWeeklyCount()
    }
  }

  startWeeklyCount(){
    if(
        ((this.lastPeriod === `week${Math.ceil(moment().date() / 7)}`) && (moment().diff(moment(this.lastTimestamp), 'days') < 7)) ||
        ((this.lastPeriod === 'month') && (moment().diff(moment(this.lastTimestamp), 'days') < 28))
      ){
      Swal.fire({
        title: `You can\'t start count.`,
        icon: 'error',
        text: `Reason: ${ this.lastPeriod === 'month' ? 'You have finished monthly count for this month.' : `You have already finished week${Math.ceil(moment().date() / 7)} count.` }`
      })
    }else{
      Swal.fire({
        title: `Do you want to start week ${Math.ceil(moment().date() / 7)} count?`,
        showCancelButton: true,
        confirmButtonText: `Start`,
      }).then((result) => {
        if (result.isConfirmed) {
          this.loader.start()
          this.api.addIsCount(this.parseService.encode({
            counter_id: this.authService.currentUser()['id'],
            branch_id: this.authService.currentUser()['branch_id'],
            period: `week${Math.ceil(moment().date() / 7)}`,
            timestamp: moment().format('YYYY-MM-DD hh:mm:ss')
          })).pipe(first()).subscribe(data => {
            this.router.navigate(['count/draft', data['data']]);
            this.loader.complete()
          }, error => {
            console.log(error)
            this.loader.complete()
          })
        }
      })
    }
  }
  startMonthlyCount(){
    if((this.lastPeriod === 'month') && (moment(this.lastTimestamp).diff(moment(), 'days') < 28)){
      Swal.fire({
        title: `You can\'t start count.`,
        icon: 'error',
        text: `Reason: You already finished monthly count for this month.`
      })
    }else{
      this.loader.start()
      this.api.addIsCount(this.parseService.encode({
        counter_id: this.authService.currentUser()['id'],
        branch_id: this.authService.currentUser()['branch_id'],
        period: `month`,
        timestamp: moment().format('YYYY-MM-DD hh:mm:ss')
      })).pipe(first()).subscribe(data => {
        this.router.navigate(['count/draft', data['data']]);
        this.loader.complete()
      }, error => {
        console.log(error)
        this.loader.complete()
      })
    }
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
    this.isCountable = false
    this.lastPeriod = ''
    this.lastTimestamp = ''
    this.loader.start()
    this.api.canStartCount(this.parseService.encode({
      counter_id: this.authService.currentUser()['id']
    })).pipe(first()).subscribe(data => {
      let res = data['data']
      if(res.length === 0){
        this.isCountable = true
      }else{
        if(res[0].status !== 'draft'){
          this.isCountable = true
          this.lastPeriod = res[0].period
          this.lastTimestamp = res[0].timestamp
        }else if((res[0].period == 'month') && (moment().diff(moment(res[0].timestamp), 'days') > 30)){
          this.isCountable = true
          this.lastPeriod = res[0].period
          this.lastTimestamp = res[0].timestamp
        }else if((res[0].period == 'week') && (moment().diff(moment(res[0].timestamp), 'days') > 7)){
          this.isCountable = true
          this.lastPeriod = res[0].period
          this.lastTimestamp = res[0].timestamp
        }else{
          this.draftCountId = res[0].count_id
          this.draftPeriod = res[0].period
        }
      }
      this.loader.complete()
    }, error => {
      console.log(error)
      this.loader.complete()
    })
  }
  possibleCount(){
    console.log(this.draftPeriod)
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
      text: 'The related order will be removed at the same time. Are you sure?',
      showCancelButton: true,
      confirmButtonText: `Remove`,
      icon: 'error'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.start()
        this.api.removeIsCount(this.parseService.encode({
          is_count_id: id
        })).pipe(first()).subscribe(data => {
          this.toast.success(`${period} count has been removed successfully`, 'Error');
          this.canStartCount()
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
