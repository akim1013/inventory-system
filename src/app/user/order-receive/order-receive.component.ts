import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import * as moment from 'moment';
import { GlobalService } from '../../services/global.service'

@Component({
  selector: 'app-order-receive',
  templateUrl: './order-receive.component.html',
  styleUrls: ['./order-receive.component.css']
})
export class OrderReceiveComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private api: ApiService,
    private parseService: ParseService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
    private authService: AuthService
  ) { }

  loading = false
  orders = []
  filter = 'all'

  ngOnInit(): void {
    this.globalService.menu = 'order-receive';
    this.get_orders()
  }
  get_orders = () => {
    this.loading = true;
    this.api.purchasingSystemGetOrderHistory(this.parseService.encode({
      company: this.authService.currentUser()['company'],
      shop: this.authService.currentUser()['shop_name'],
      branch: this.authService.currentUser()['branch_id']
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          console.log(data)
          this.orders = data['data'].filter((item: { [x: string]: string; }) => item['status'] != 'draft');
        } else {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
        }
        this.loading = false;
      },
      error => {
        this.toast.error('There had been a database error. Please try again later.', 'Error');
        this.loading = true;
      }
    );
  }

  get_order_details = (order_id) => {
    this.router.navigate(['/order-receive/details/', order_id])
  }

  change_filter = (filter: string) => {
    this.filter = filter;
  }
  get_filtered_order_length = () => {
    if (this.filter == 'all') {
      return this.orders.length;
    } else {
      return this.orders.filter(item => item['status'] == this.filter).length;
    }
  }
  format_date_time = (date) => {
    return moment(date, 'YYYY-MM-DD HH:mm:ss').format('hh:mm A MMM DD ddd, YYYY')
  }

}
