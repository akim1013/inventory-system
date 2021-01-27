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

import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('1234567890abcdef0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 17)
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

  categories = ['All categories']
  selected_category = 'All categories'

  is_draft = false;

  qty_draft = []

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
        company: this.authService.currentUser()['company'],
        shop: this.authService.currentUser()['shop_name']
      })
    ).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.is_items = [...data['data']]
          console.log(this.is_items)
          this.categories = ['All categories']
          this.is_items.forEach(item => {
            if(!this.categories.includes(item['category'])){
              this.categories.push(item['category'])
            }
          })
          this.selected_category = this.categories[0]
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
  input_primary_qty(item, e){
    let temp_qty_draft = [...this.qty_draft.filter(_item => _item.is_item_id == item['is_item_id'])]
    this.qty_draft = [...this.qty_draft.filter(_item => _item.is_item_id != item['is_item_id'])]
    let qty_primary = parseFloat(e.target.value)
    let qty_secondary = temp_qty_draft.length != 0 ? parseFloat(temp_qty_draft[0]['qty_secondary']) : 0
    let value = parseFloat(item.price) * (qty_primary + qty_secondary / parseFloat(this.globalService.get_sp_qty(item.packing_info)))
    if(e.target.value == '' || e.target.value == 0){
      if((temp_qty_draft.length != 0) && (temp_qty_draft[0]['qty_secondary'])){
        this.qty_draft.push({
          is_item_id: item['is_item_id'],
          is_count_id: this.draft_id,
          qty_primary: 0,
          qty_secondary: temp_qty_draft[0]['qty_secondary'],
          value: value
        })
      }
    }else{
      this.qty_draft.push({
        is_item_id: item['is_item_id'],
        is_count_id: this.draft_id,
        qty_primary: e.target.value,
        qty_secondary: temp_qty_draft.length != 0 ? temp_qty_draft[0]['qty_secondary'] : 0,
        value: value
      })
    }
  }
  input_secondary_qty(item, e){
    let temp_qty_draft = [...this.qty_draft.filter(_item => _item.is_item_id == item['is_item_id'])]
    this.qty_draft = [...this.qty_draft.filter(_item => _item.is_item_id != item['is_item_id'])]
    let qty_primary = temp_qty_draft.length != 0 ? parseFloat(temp_qty_draft[0]['qty_primary']) : 0
    let qty_secondary = parseFloat(e.target.value)
    let value = parseFloat(item.price) * (qty_primary + qty_secondary / parseFloat(this.globalService.get_sp_qty(item.packing_info)))
    if(e.target.value == '' || e.target.value == 0){
      if((temp_qty_draft.length != 0) && (temp_qty_draft[0]['qty_primary'] != 0)){
        this.qty_draft.push({
          is_item_id: item['is_item_id'],
          is_count_id: this.draft_id,
          qty_secondary: 0,
          qty_primary: temp_qty_draft[0]['qty_primary'],
          value: value
        })
      }
    }else{
      this.qty_draft.push({
        is_item_id: item['is_item_id'],
        is_count_id: this.draft_id,
        qty_secondary: e.target.value,
        qty_primary: temp_qty_draft.length != 0 ? temp_qty_draft[0]['qty_primary'] : 0,
        value: value
      })
    }
  }
  add_qty_draft_to_count(){
    if(this.qty_draft.length == 0){
      this.toast.error('No items were counted.', 'Error');
      return
    }
    this.loader.start()
    this.api.addCountDetailBatch(this.parseService.encode({
      items: JSON.stringify(this.qty_draft),
    })).pipe(first()).subscribe(data => {
      if (data['data'] == true) {
        this.toast.success('Item counted successfully.', 'Success');
        this.qty_draft = []
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
            <div class="w-full flex justify-start items-center">Category:
              <span class="ml-1 text-theme-3" style="font-size: 15px; font-weight: bold;">
                <span class="px-2 ml-2 rounded-full border border-theme-3 text-theme-3">${item['category']}</span>
              </span>
            </div>
          </div>
          <div class="flex items-center mt-3 w-full">
            <div class="flex items-center w-full">
              <div class="mr-2">${this.globalService.get_primary_uom(item.packing_info) ?
                this.globalService.get_primary_uom(item.packing_info) : 'Primary '
              } qty: </div>
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
              <div class="mr-2">${this.globalService.get_secondary_uom(item.packing_info) ?
                this.globalService.get_secondary_uom(item.packing_info) : 'Secondary '
              } qty: </div>
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

          let tail:any = '001'
          let year = moment().format('YYYY')
          let po_number = ''
          this.api.purchasingSystemGetLastPoNumber(this.parseService.encode({
            'company': this.authService.currentUser()['company'],
            'shop': this.authService.currentUser()['shop_name'],
            'branch': this.authService.currentUser()['branch_id']
          })).pipe(first()).subscribe(data => {
            if(data['status'] == 'success'){
              if(year == data['data'][0].order_ref.slice(-7, -3)){
                tail = parseInt((data['data'][0].order_ref.slice(-3)).replace( /^\D+/g, ''))

                if(!tail || tail == '999'){
                  tail = '001'
                }else{
                  let len = Math.floor(Math.log(tail + 1)/Math.log(10)) + 1
                  let temp = ''
                  for(let i = 0; i < 3 - len; i++){
                    temp += '0'
                  }
                  tail = temp + (tail + 1).toString()
                }
              }else{
                tail = '001'
              }
            }
            po_number = this.authService.currentUser()['branch_id'] + moment().format('MMDDYYYY') + tail

            this.api.addOrder(this.parseService.encode({
              company: this.authService.currentUser()['company'],
              shop: this.authService.currentUser()['shop_name'],
              branch: this.authService.currentUser()['branch_id'],
              customer_id: this.authService.currentUser()['id'],
              order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
              order_ref: po_number,
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
          }, error => {
            this.toast.error('There is an issue with server while placing automatic order. Please try again later.', 'Error');
          });

          // this.api.addOrder(this.parseService.encode({
          //   company: this.authService.currentUser()['company'],
          //   shop: this.authService.currentUser()['shop_name'],
          //   branch: this.authService.currentUser()['branch_id'],
          //   customer_id: this.authService.currentUser()['id'],
          //   order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          //   order_ref: nanoid(),
          //   status: 'pending',
          //   ref_is_id: this.draft_id,
          //   type: 'auto_order',
          //   items: JSON.stringify(order_items)
          // })).pipe(first()).subscribe(data => {
          //   if (data['data'] == true) {
          //     this.toast.success('Order has been placed successfully. Please check out your email to see the order details or visit purchasing system to adjust order.', 'Success');
          //     //this.send_mail_to_user(items);
          //   }
          // }, error => {
          //   this.toast.error('There is an issue with server while placing automatic order. Please try again later.', 'Error');
          // });

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
    }else{
      this.api.orderStatusUpdate(this.parseService.encode({
        id: this.draft_id, // Iscount id
        order_status: 'order_no_need_to_send'
      })).pipe(first()).subscribe(data => {

      }, error => {
        // this.toast.error('There had been a database error. Please try again later.', 'Error');
        // this.loader.complete()
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
          shop: this.authService.currentUser()['shop_name'],
          branch_id: this.authService.currentUser()['branch_id'],
          counter_id: this.authService.currentUser()['id'],
          is_count_id: this.draft_id,
          items: JSON.stringify(data),
          timestamp: moment().format('YYYY-MM-DD hh:mm:ss')
        })).pipe(first()).subscribe(res => {
          console.log(res)
          if (res['data'] == true) {
            this.toast.success('Count detail data has been send to dashboard successfully.', 'Success');
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

  getSecondaryUnit(packing_info){
    if(packing_info.includes('/')){
      return packing_info.split('/')[0].replace(/[0-9]/g, '')
    }else{
      return 'Small unit'
    }
  }
}
