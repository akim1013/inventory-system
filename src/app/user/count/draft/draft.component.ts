import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { ParseService } from '../../../services/parse.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import * as moment from 'moment';
import { GlobalService } from '../../../services/global.service'
import { LoadingBarService } from '@ngx-loading-bar/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-draft',
  templateUrl: './draft.component.html',
  styleUrls: ['./draft.component.css']
})
export class DraftComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService,
    private loadingBar: LoadingBarService,
    private route: ActivatedRoute,
    private router: Router
  ) { }
  loader = this.loadingBar.useRef()

  is_items: Array<Object> = []
  ps_items: Array<Object> = []
  c_items: Array<Object> = []
  is_search_key: string = ''

  draft_id = -1
  draft_items: Array<Object> = []
  period = ''

  is_draft = false;

  ngOnInit(): void {
    this.globalService.menu = 'count'
    this.draft_id = parseInt(this.route.snapshot.paramMap.get('id'))
    this.isDraft(this.draft_id)
    this.getItems()
  }
  isDraft(id){
    this.loader.start()
    this.api.isDraft(
      this.parseService.encode({
        id: id 
      })
    ).pipe(first()).subscribe(data => {
      if(data['status'] === 'success'){
        if(data['data'][0].status == 'completed'){
          this.is_draft = false
        }else{
          this.is_draft = true
        }
        this.period = data['data'][0].period
      }else{
        this.toast.error('There had been an error. Please try again later.', 'Error');
      }
      this.loader.complete()
    }, error => {
      console.log(error)
      this.loader.complete()
    })
  }
  getItems(){
    this.loader.start()
    this.api.getCItems(
      this.parseService.encode({
        branch_id: this.authService.currentUser()['branch_id']
      })
    ).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.is_items = [...data['data']]
          this.api.getDraftItems(
            this.parseService.encode({
              draft_id: this.draft_id
            })
          ).pipe(first()).subscribe(
            data => {
              this.draft_items = [...data['data']]
              this.adjust_items()
            }, error => {
              console.log(error)
              this.loader.complete()
            }
          )
        } else {
          this.toast.error('Item fetching error. There is an issue with server. Please try again.', 'Error');
          this.loader.complete()
        }
      },
      error => {
        console.log(error)
        this.loader.complete()
      }
    );
  }
  adjust_items(){
    let draft_item_ids = []
    this.draft_items.map(item => {
      draft_item_ids.push(item['inventory_id'])
    })
    this.is_items.map(item => {
      if(draft_item_ids.indexOf(item['inventory_id']) == -1){
        item['added'] = false
      }else{
        item['added'] = true
      }
    })
    this.loader.complete()
  }
  search_is_item(e){
    this.is_search_key = e.target.value
  }
  add_to_count(item: { [x: string]: string; is_item_id: any; }){
    Swal.fire({
      title: 'Add this item to count list?',
      html: `
        <div class="p-5">
          <div class="flex items-center mt-2">
            <div class="w-full flex justify-start items-center">Description: <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;"> ${item['description']}</span></div>
          </div>
          <div class="flex items-center mt-2">
            <div class="w-full flex justify-start items-center">Vendor description: <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;"> ${item['vendor_description']}</span></div>
          </div>
          <div class="flex items-center mt-2">
            <div class="w-full flex justify-start items-center">Packing info: <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;"> ${item['packing_info']}</span></div>
          </div>
          <div class="flex items-center mt-2">
            <div class="w-full flex justify-start items-center">Price: <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;"> $${item['price']}</span></div>
          </div>
          <div class="flex items-center mt-2">
            <div class="w-full flex justify-start items-center">Category: <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;"> ${item['category'] == 'frozen' ?
            '<span class="px-2 ml-2 rounded-full border border-theme-3 text-theme-3">frozen</span>' :
            '<span class="px-2 ml-2 rounded-full border border-theme-12 text-theme-12">dry</span>'
           }</span></div>
          </div>
          <div class="flex items-center mt-3 w-full">
            <div class="flex items-center w-full">
              <div class="mr-2">${this.globalService.get_primary_uom(item.packing_info)} qty: </div>
              <input 
                placeholder="0" 
                style="width: 40px" 
                id="primary_qty" 
                type="number" 
                min="0" 
                max="999" 
                step="0.01" 
                class="text-sm w-full outline-none border rounded py-2 px-1 text-right"
              />
            </div>
            ${ this.period === 'month' ? `
            <div class="ml-1 sm:ml-5 flex items-center w-full">
              <div class="mr-2">${this.globalService.get_secondary_uom(item.packing_info)} qty: </div>
              <input 
                placeholder="0" 
                style="width: 40px" 
                id="secondary_qty" 
                type="number" 
                min="0" 
                max="999" 
                step="0.01" 
                class="text-sm w-full outline-none border rounded py-2 px-1 text-right"
              />
            </div>
            ` : '' }
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add',
      allowOutsideClick: false,
      preConfirm: () => {
        let primary_qty = document.querySelector('#primary_qty')['value']
        let secondary_qty = document.querySelector('#secondary_qty') ? document.querySelector('#secondary_qty')['value'] : 0
        if(secondary_qty == ''){
          secondary_qty = 0
        }
        if(primary_qty == ''){
          this.toast.error('You need to input primary qty.', 'Error')
          return false
        }
        this.loader.start()
        this.api.addCountDetail(this.parseService.encode({
          is_count_id: this.draft_id,
          is_item_id: item.is_item_id,
          qty_primary: primary_qty,
          qty_secondary: secondary_qty,
          value: parseFloat(item.price) * (parseFloat(primary_qty) + parseFloat(secondary_qty) / parseFloat(this.globalService.get_sp_qty(item.packing_info))) 
        })).pipe(first()).subscribe(data => {
          if (data['data'] == true) {
            this.toast.success('Item counted successfully.', 'Success');
            this.getItems()
          } else {
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loader.complete()
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loader.complete()
        })
      }
    })
  }
  complete_count(){
    Swal.fire({
      title: `Are you sure to complete this count?`,
      showCancelButton: true,
      confirmButtonText: `Complete`,
      icon: 'question'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.start()
        this.api.completeCount(this.parseService.encode({
          draft_id: this.draft_id
        })).pipe(first()).subscribe(data => {
          if (data['data'] == true) {
            this.toast.success('Count finished successfully. Orders will be placed automatically.', 'Success');
            if(this.period == 'month'){
              // Dashboard data send
              this.send_data_to_dashboard()
            }else{
              this.place_order()
            }
            this.back()
          } else {
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loader.complete()
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loader.complete()
        })
      } 
    })
  }
  place_order(){
    let order_items = []
    this.draft_items.forEach(item => {
      if((parseFloat(item['safety_qty']) - parseFloat(item['qty_primary'])) > 0){
        order_items.push({
          item_id: item['item_id'],
          qty: parseFloat(item['safety_qty']) - parseFloat(item['qty_primary']),
        })
      }
    })
    if(order_items.length > 0){
      Swal.fire({
        title: `Do you want to send order to purchasing system?`,
        text: `${order_items.length} item(s) are below safety qty. The lack amout of qty will be ordered on purchasing system.`,
        showCancelButton: true,
        confirmButtonText: `Send order`,
        icon: 'question'
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.addOrder(this.parseService.encode({
            customer_id: this.authService.currentUser()['id'],
            order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            order_id: this.authService.currentUser()['name'] + moment().format('hhmmssMMDDYYYY'),
            status: 'pending',
            ref_is_id: this.draft_id,
            type: 'auto_order',
            items: JSON.stringify(order_items)
          })).pipe(first()).subscribe(data => {
            if (data['data'] == true) {
              this.toast.success('Order has been placed successfully. Please check out your email to see the order details or visit purchasing system to adjust order.', 'Success');
              //this.send_mail_to_user(items);
            }
          }, error => {
            this.toast.error('There is an issue with server while placing automatic order. Please try again later.', 'Error');
          });

          this.api.orderStatusUpdate(this.parseService.encode({
            id: this.draft_id, // Iscount id 
            order_status: 'order_pending'
          })).pipe(first()).subscribe(data => {
            
          }, error => {
            // this.toast.error('There had been a database error. Please try again later.', 'Error');
            // this.loader.complete()
          })
        } 
      })
    }
  }
  send_data_to_dashboard(){
    let data = [...this.draft_items]
    Swal.fire({
      title: `Do you want to send monthly count data to dashboard?`,
      text: `${data.length} item(s) are counted. These data will send to the dashboard to overview the monthly inventory stock.`,
      showCancelButton: true,
      confirmButtonText: `Send data`,
      icon: 'question'
    }).then((result) => {
      if (result.isConfirmed) {
        //console.log(data)
        this.api.sendDataToDashboard(this.parseService.encode({
          company: this.authService.currentUser()['company'],
          branch_id: this.authService.currentUser()['branch_id'],
          counter_id: this.authService.currentUser()['id'],
          is_count_id: this.draft_id,
          items: JSON.stringify(data)
        })).pipe(first()).subscribe(res => {
          console.log(res)
          if (res['data'] == true) {
            this.toast.success('Order has been send to dashboard successfully.', 'Success');
            //this.send_mail_to_user(items);
          }
        }, error => {
          this.toast.error('There is an issue with server while sending data to dashboard. Please try again later.', 'Error');
        });
      } 
    })
  }
  remove_from_count(item){
    Swal.fire({
      title: `Remove this item from the count list?`,
      showCancelButton: true,
      confirmButtonText: `Remove`,
      icon: 'error'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.start()
        this.api.removeDraftDetailItem(this.parseService.encode({
          id: item.draft_detail_id
        })).pipe(first()).subscribe(data => {
          if (data['data'] == true) {
            this.toast.success('Item removed from count list.', 'Success');
            this.getItems()
          } else {
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loader.complete()
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loader.complete()
        })
      } 
    })
  }
  back(){
    this.router.navigate(['count'])
  }
}
