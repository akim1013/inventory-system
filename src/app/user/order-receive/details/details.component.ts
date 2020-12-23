import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { first } from 'rxjs/operators';
import { ParseService } from '../../../services/parse.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private parseService: ParseService,
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastrService
  ) { }

  order_id: string = ''
  loading = false;

  order_detail = {}
  order_items = []
  order_shipments = []
  partial_shipments = []
  order_approvements = []

  dry_cbf_pallet = 83.50;
  frozen_cbf_pallet = 76.00;

  selected_item = {}
  ngOnInit(): void {
    this.globalService.menu = 'order-receive';
    this.order_id = this.route.snapshot.paramMap.get('id')
    this.get_info()
  }

  get_info(){
    this.apiService.purchasingSystemGetOrderDetails(this.parseService.encode({order_id: this.order_id}))
    .pipe(first())
    .subscribe(data =>{
      if(data['status'] == 'success'){
        this.order_detail = {...data['order_detail']}
        this.order_items = [...data['order_items']]
        this.order_shipments = [...data['order_shipments']]
        this.order_approvements = [...data['order_approvements']]
        this.get_partial_shipments()
        console.log(this.order_shipments)
      }
    }, error =>{});
  }
  get_total_shipment_price(shipment_id){
    let price = 0
    this.order_shipments.forEach(item => {
      if(item.shipment_id == shipment_id){
        price += (item.approved_qty * item.approved_price)
      }
    })
    return price
  }
  get_total_shipment_cbf(shipment_id){
    let ret = {
      dry: 0, 
      frozen: 0
    }
    this.order_shipments.forEach(item => {
      if(item.shipment_id == shipment_id){
        if(item.category == 'frozen'){
          ret.frozen += (parseFloat(item.cbf) * item.approved_qty)
        }else{
          ret.dry += (parseFloat(item.cbf) * item.approved_qty)
        }
      }
    })
    return {...ret}
  }
  get_pallet(cbf){
    return Math.ceil(cbf)
  }
  get_partial_shipments(){
    let partial_shipments = []
    let uniq_ids = []
    this.order_shipments.forEach(item => {
      if(!uniq_ids.includes(item.shipment_id)){
        uniq_ids.push(item.shipment_id)
        partial_shipments.push({
          shipment_id: item.shipment_id,
          shipment_date: item.shipment_date,
          shipment_ref_number: item.shipment_ref_number
        })
      }
    })
    this.partial_shipments = [...partial_shipments]
  }

  back(){
    this.router.navigate(['/order-receive']);
  }

  get_total_approvement_cbf(){
    console.log('ss')
    let ret = {
      dry: 0, 
      frozen: 0
    }
    this.order_approvements.forEach(item => {
      if(item.category == 'frozen'){
        ret.frozen += (parseFloat(item.cbf) * item.approved_qty)
      }else{
        ret.dry += (parseFloat(item.cbf) * item.approved_qty)
      }
    })
    return {...ret}
  }

  get_approved_qty(item_id){
    let qty = 0
    this.order_approvements.forEach(item => {
      if(item.id == item_id){
        qty += parseFloat(item.approved_qty)
      }
    })
    this.order_shipments.forEach(item => {
      if(item.id == item_id){
        qty += parseFloat(item.approved_qty)
      }
    })
    return qty
  }
  get_total_approvement_price(){
    let price = 0
    this.order_approvements.forEach(item => {
      price += (item.approved_qty * item.approved_price)
    })
    return price
  }

  accept_item(item){
    this.apiService.purchasingSystemAcceptItem(this.parseService.encode({
      item: JSON.stringify(item),
      company: this.authService.currentUser()['company'],
      shop: this.authService.currentUser()['shop_name'],
      branch_id: this.authService.currentUser()['branch_id'],
      customer_id: this.authService.currentUser()['id']
    }))
    .pipe(first())
    .subscribe(data =>{
      if(data['status'] == 'success'){
        this.toast.success('Item accepted. It will be charged to inventory.')
        this.get_info()
      }
    }, error =>{});
  }
}
