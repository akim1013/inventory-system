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
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.css']
})
export class ManageOrderComponent implements OnInit {

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
  users = [];
  order_detail = [];
  selected_order: Object;
  selected_item: Object;
  price_tbded = false;
  cbm_tbded = false;
  qty = 0;
  filter = 'all';

  dry_cbf_pallet = 83.50;
  frozen_cbf_pallet = 76.00;

  ngOnInit(): void {
    this.globalService.menu = 'manage-order';
    this.get_item();
    this.get_orders();
    this.get_users();
  }

  change_filter = (filter) => {
    this.filter = filter;
  }
  get_filtered_order_length = () => {
    if (this.filter == 'all') {
      return this.orders.length;
    } else {
      return this.orders.filter(item => item['status'] == this.filter).length;
    }
  }
  get_orders = () => {
    this.loading = true;
    this.api.getAllOrders(this.parseService.encode({
      company: this.authService.currentUser()['company']
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.orders = [...data['data'].filter(item => item['status'] != 'draft')];
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
  get_users = () => {
    this.loading = true;
    this.api.getPsUsers().pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.users = [...data['data']];
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
    this.selected_order = this.orders.filter(item => item['order_id'] == order_id)[0]
    this.price_tbded = false;
    this.cbm_tbded = false;
    this.loading = true;
    this.api.getOrderDetails(this.parseService.encode({
      order_id: order_id
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.order_detail = [...data['data']];
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
  get_user_name = (id) => {
    if (this.users.length != 0) {
      let ret = this.users.filter(item => item['id'] == id)[0];
      return ret['name'];
    }
  }
  get_user_email = (id) => {
    if (this.users.length != 0) {
      let ret = this.users.filter(item => item['id'] == id)[0];
      return ret['email'];
    }
  }

  format_date_time = (date) => {
    return moment(date, 'YYYY-MM-DD HH:mm:ss').format('hh:mm A MMM DD ddd, YYYY')
  }
  delete_order = (order_id) => {
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
          if (data['data'] == true) {
            this.toast.success('Order deleted successfully', 'Success');
            this.get_orders();
          } else {
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

  edit_item = (item) => {
    if (this.selected_order['status'] != 'pending') {
      this.toast.error('You can\'t edit items to approved or shipped order.', 'Error');
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
            <div>Item price($): </div>
            <div class="w-1/2 ml-auto">
              <input id="itemPrice" type="number" min="0" max="999" step="0.01" class="w-full outline-none border rounded-l-full rounded-r-full py-2 px-4 text-right w-1/2" value="${g_item['price']}"/>
            </div>
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
          if (data['data'] == true) {
            this.toast.success('Order updated successfully', 'Success');
            this.get_orders();
          } else {
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
    if (this.selected_order['status'] != 'pending') {
      this.toast.error('You can\'t add remove item to approved or shipped order.', 'Error');
      return;
    }
    if (this.order_detail.length == 1) {
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
          if (data['data'] == true) {
            this.toast.success(`Item has been deleted from order ${this.selected_order['order_id']} successfully`, 'Success');
            this.get_order_details(this.selected_order['order_id']);
          } else {
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
    if (this.selected_order['status'] != 'pending') {
      this.toast.error('You can\'t add more items to approved or shipped order.', 'Error');
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
              if (item['item_id'] == g_item['id']) found = true;
            })
            if (!found) remaining_items.push(g_item);
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
          if (data['data'] == true) {
            this.toast.success(`${items.length} items have been added to order ${this.selected_order['order_id']} successfully`, 'Success');
            this.get_order_details(this.selected_order['order_id']);
          } else {
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
  order_status_change = (status) => {
    let shipment_date = '';
    let shipment_ref_number = '';
    let ship_cancelled = false;
    if (status == 'shipped') {
      // Register shipment date and ref number
      Swal.fire({
        title: 'Shipment date and reference number',
        html: `
          <div class="flex items-center mt-3">
            <div>Shipment date: </div>
            <div class="w-3/5 ml-auto">
              <input id="shipment_date" type="date" class="w-full outline-none border rounded-l-full rounded-r-full py-2 px-4 text-right w-1/2" value="${moment().format('yyyy-MM-DD')}"/>
            </div>
          </div>
          <div class="flex items-center mt-3">
            <div>Reference number: </div>
            <div class="w-3/5 ml-auto">
              <input id="shipment_ref_number" type="text" class="w-full outline-none border rounded-l-full rounded-r-full py-2 px-4 text-right w-1/2" />
            </div>
          </div>
        `,
        focusConfirm: false,
        allowOutsideClick: false,
        showCancelButton: true,
        preConfirm: () => {
          if (document.querySelector('#shipment_ref_number')['value'] == '') {
            this.toast.error('You need to assign reference number.', 'Error');
            return false;
          }
        }
      }).then((result) => {
        if (result.isDismissed) {
          shipment_date = '';
          shipment_ref_number = '';
          this.selected_order['status'] = 'approved';
          ship_cancelled = true;
          document.querySelector('#vertical-radio-approve')['checked'] = true;
        } else {
          shipment_date = document.querySelector('#shipment_date')['value'];
          shipment_ref_number = document.querySelector('#shipment_ref_number')['value'];
          this.selected_order['shipment_date'] = shipment_date;
          this.selected_order['shipment_ref_number'] = shipment_ref_number;
          this.selected_order['status'] = status;
          this.updateOrderStatus();
        }
      })
    } else {
      shipment_date = '';
      shipment_ref_number = '';
      this.selected_order['shipment_date'] = shipment_date;
      this.selected_order['shipment_ref_number'] = shipment_ref_number;
      this.selected_order['status'] = status;
      this.updateOrderStatus();
    }
  }
  updateOrderStatus = () => {
    this.loading = true;
    this.api.updateOrderStatus(this.parseService.encode({
      order_id: this.selected_order['order_id'],
      status: this.selected_order['status'],
      shipment_date: this.selected_order['shipment_date'],
      shipment_ref_number: this.selected_order['shipment_ref_number']
    })).pipe(first()).subscribe(data => {
      if (data['data'] == true) {
        this.toast.success(`Order ${this.selected_order['order_id']} status changed successfully`, 'Success');
        this.get_orders();
        this.send_mail_order_status_update(this.selected_order);
      } else {
        this.toast.error('There had been a database error. Please try again later.', 'Error');
      }
      this.loading = false;
    }, error => {
      this.toast.error('There had been a database error. Please try again later.', 'Error');
      this.loading = false;
    })
  }
  send_mail_order_status_update = (order) => {
    let user = this.users.filter(user => user['id'] == order['customer_id'])[0];
    this.api.sendStatusUpdateMail(this.parseService.encode({
      user: JSON.stringify(user),
      order: JSON.stringify(order),
      subject: `Your order has been updated!`,
      message: `
        <span style="font-size: 15px;">Hi <em>${user['name']}</em></span>,
        <br/>
        Your order <span style="color: red; font-weight: 700;">${order['order_id']}</span> has been updated and <span style="color: red;">${order['status']}</span>. <br/> ${order['status'] == 'shipped' ?
            'Shipment date is <span style="color: blue;">' + order['shipment_date'] + '</span> and reference ID is <span style="color: blue;">' + order['shipment_ref_number'] + '</span>.' :
            'You will be get notified if your order is shipped.'} Thank you for your business. <br/><br/> <span style="font-size: 15px; color: red;">${user['company']}</span>
        `
    })).pipe(first()).subscribe(data => {
      if (data['status'] == 'success') {
        this.toast.success('Notification email sent to user.', 'Success');
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again later.', 'Error');
    });
  }
  export_excel = (po_number) => {
    if(po_number){
      /* table id is passed over here */
      let element = document.getElementById('export-table');
      const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
      let wscols = [
        {wch:10},
        {wch:10},
        {wch:15},
        {wch:20},
        {wch:30},
        {wch:30}
      ];
      ws['!cols'] = wscols;
      /* generate workbook and add the worksheet */
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      /* save to file */
      XLSX.writeFile(wb, `${po_number}.xlsx`);
    }else{
      this.toast.error('Please select order to export.', 'Error');
    }
  }
}
