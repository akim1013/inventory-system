import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../services/global.service';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService
  ) { }

  loading = false;
  orders = [];
  order_detail = [];
  selected_order: Object;
  price_tbded = false;
  cbm_tbded = false;
  qty = 0;
  filter = 'all';

  ngOnInit(): void {
    this.globalService.menu = 'history';
    this.get_item();
    this.get_orders();
  }
  change_filter = (filter) => {
    this.filter = filter;
  }
  get_filtered_order_length = () => {
    if(this.filter == 'all'){
      return this.orders.length;
    }else{
      return this.orders.filter(item => item['status'] == this.filter).length;
    }
  }
  get_orders = () => {
    this.loading = true;
    this.api.getOrders(this.parseService.encode({
      customer_id: this.authService.currentUser()['id'],
      limit: 10
    })).pipe(first()).subscribe(
      data => {
        if(data['status'] == 'success'){
          this.orders = [...data['data']];
        }else{
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
  get_item = () => {
    this.loading = true;
    this.api.getItem(this.parseService.encode({
      company: this.authService.currentUser()['company']
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let items = data['data'];
          this.globalService.items = [...items]
        } else {
          this.toast.error('There is an issue with server. Please try again.', 'Error');
        }
        this.loading = false;
      },
      error => {
        console.log(error)
        this.loading = false;
      }
    );
  }
  delete_order = (order_id) => {
    let order = this.orders.filter(item => item['order_id'] == order_id)[0];
    if(order['status'] != 'draft'){
      this.toast.error('You can\'t remove placed order.', 'Error');
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this order? ' + order_id,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.api.deleteOrder(this.parseService.encode({
          order_id: order_id
        })).pipe(first()).subscribe(data => {
          if(data['data'] == true){
            this.toast.success('Order deleted successfully', 'Success');
            this.get_orders();
          }else{
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loading = false;
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loading = false;
        })
      }
    })
  }
  get_order_details = (order_id) => {
    this.selected_order = this.orders.filter(item => item['order_id'] == order_id)[0]
    this.price_tbded = false;
    this.cbm_tbded = false;
    this.loading = true;
    this.api.getOrderDetails(this.parseService.encode({
      order_id: order_id
    })).pipe(first()).subscribe(
      data => {
        if(data['status'] == 'success'){
          this.order_detail = [...data['data']];
        }else{
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
  format_date_time = (date) => {
    return moment(date, 'YYYY-MM-DD HH:mm:ss').format('hh:mm A MMM DD ddd, YYYY')
  }
  edit_item = (item) => {
    if(this.selected_order['status'] != 'draft'){
      return;
    }
    let g_item = this.globalService.items.filter(_item => _item['id'] == item['item_id'])[0];
    Swal.fire({
      title: 'Edit item',
      html: `
        <div class="p-5">
          <div class="flex items-center">
            <p class="text-left">${g_item['vendor_description']}(${g_item['description']})</p>
            <p class="ml-auto text-red-400">${g_item['inventory_id']}</p>
          </div>
          <div class="flex items-center mt-3">
            <div>Qty: </div>
            <div class="ml-auto inline-flex w-1/2">
              <button class="button border text-gray-800 font-bold py-2 px-4 rounded-l-full hover:bg-gray-300 outline-none"
                onclick="(() => {
                  if(document.querySelector('#itemQty').value > 0){
                    document.querySelector('#itemQty').value--
                  }
                })()"
              >-</button>
              <input id="itemQty" type="number" min="0" max="${g_item['moq']}" class="border-t border-b text-center outline-none w-3/5" value="${item.qty}"/>
              <button class="button border text-gray-800 font-bold py-2 px-4 rounded-r-full hover:bg-gray-300 outline-none"
                onclick="(() => {
                  if(document.querySelector('#itemQty').value < parseInt(document.querySelector('#itemQty').getAttribute('max'))){
                    document.querySelector('#itemQty').value++
                  }
                })()"
              >+</button>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Save`,
      preConfirm: () => {
        item['qty'] = document.querySelector('#itemQty')['value'];
        g_item['price'] = document.querySelector('#itemPrice')['value'];
        this.loading = true;
        this.api.updateOrder(this.parseService.encode({
          item: JSON.stringify(item),
          g_item: JSON.stringify(g_item)
        })).pipe(first()).subscribe(data => {
          if(data['data'] == true){
            this.toast.success('Order updated successfully', 'Success');
            this.get_orders();
          }else{
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loading = false;
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loading = false;
        })
      }
    })
  }
  remove_item = (item) => {
    if(this.selected_order['status'] != 'draft'){
      return;
    }
    if(this.order_detail.length == 1){
      this.toast.warning('You can\'t remove all items from order.', 'Warning');
      return;
    }
    let g_item = this.globalService.items.filter(_item => _item['id'] == item['item_id'])[0];
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove ${g_item['vendor_description']}(${g_item['description']}) item from order?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.api.deleteOrderedItem(this.parseService.encode({
          item: JSON.stringify(item)
        })).pipe(first()).subscribe(data => {
          if(data['data'] == true){
            this.toast.success(`Item has been deleted from order ${this.selected_order['order_id']} successfully`, 'Success');
            this.get_order_details(this.selected_order['order_id']);
          }else{
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loading = false;
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loading = false;
        })
      }
    })
  }
  add_more_items = () => {
    if(this.selected_order['status'] != 'draft'){
      return;
    }
    Swal.fire({
      title: 'Add more items',
      html: `
        <div class="mt-3 p-5 overflow-auto h-64">
          ${(() => {
            let tag = ``;
            let remaining_items = [];
            // Exclude exsiting items in current order
            this.globalService.items.forEach(g_item => {
              let found = false;
              this.order_detail.forEach(item => {
                if(item['item_id'] == g_item['id']) found = true;
              })
              if(!found) remaining_items.push(g_item);
            })
            remaining_items.forEach(item => {
              tag += `
                <div class="flex items-center justify-start mt-2">
                  <input name="items" type="checkbox" class="input border mr-4" id="vertical-checkbox-chris-evans-${item['description']}" data-item-id="${item['id']}">
                  <label class="cursor-pointer select-none" for="vertical-checkbox-chris-evans-${item['description']}">${item['vendor_description']}(${item['description']})</label>
                </div>`;
            })
            return tag;
          })()}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Add`,
      preConfirm: () => {
        let items = [];
        document.querySelectorAll('input[name=items]:checked').forEach(item => {
          items.push({
            item_id: item.getAttribute('data-item-id'),
            qty: 1
          })
        })
        this.loading = true;
        this.api.addAdditionalItemsToOrder(this.parseService.encode({
          order_id: this.selected_order['order_id'],
          items: JSON.stringify(items)
        })).pipe(first()).subscribe(data => {
          if(data['data'] == true){
            this.toast.success(`${items.length} items have been added to order ${this.selected_order['order_id']} successfully`, 'Success');
            this.get_order_details(this.selected_order['order_id']);
          }else{
            this.toast.error('There had been a database error. Please try again later.', 'Error');
          }
          this.loading = false;
        }, error => {
          this.toast.error('There had been a database error. Please try again later.', 'Error');
          this.loading = false;
        })
      }
    })
  }
}
