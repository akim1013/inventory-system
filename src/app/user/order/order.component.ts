import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import { Item } from '../../admin/item/item';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

import { GlobalService } from '../../services/global.service'

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {

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
  item_display_style = 'list';
  category: string = 'all';
  ticket_created: boolean = false;

  ordered_item: Array<Object> = [];

  selected_item: Object;
  selected_ordered_item: Object;

  selected_order: Object;

  qty: number = 1;

  ordered_item_details: Array<Object> = [];

  po_number: String = '';
  order_selected: boolean = false;

  cbm_tbded: boolean = false;

  user: Object;
  admin: Object;

  search_key = '';

  ngOnInit(): void {
    this.globalService.menu = 'order';
    this.user = this.authService.currentUser();
    this.getItem();
    this.getOrders(this.user['id']);
    this.get_admin(this.user['company']);
  }
  get_admin = (company) => {
    this.loading = true;
    this.api.getPsAdmin(this.parseService.encode({
      company: company
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.admin = [...data['data']][0];
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
  category_change = (event) => {
    this.category = event.target.value;
  }
  sortby_change = (event) => {
    this.sort_global_item(event.target.value);
  }
  item_display_style_change = (style) => {
    this.item_display_style = style;
  }
  getItem = () => {
    this.loading = true;
    this.api.getItem(
      this.parseService.encode({
        company: this.authService.currentUser()['company']
      })
    ).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let items = data['data'];
          this.globalService.items = [...items];
          this.sort_global_item('moq')
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
  getOrders = (user_id) => {
    this.loading = true;
    this.api.getOrders(this.parseService.encode({
      customer_id: user_id,
      limit: 8
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let orders = data['data'];
          this.globalService.orders = [...orders];
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
  generate_po_number = () => {
    this.po_number = this.user['name'] + moment().format('hhmmssMMDDYYYY');
  }
  create_ticket = () => {
    this.ticket_created = true;
  }
  select_item = (item) => {
    this.selected_item = item;
  }
  increase_item = () => {
    if (this.qty < this.selected_item['moq']) {
      this.qty++;
    }
  }
  decrease_item = () => {
    if (this.qty > 1) {
      this.qty--;
    }
  }
  manual_input_item = (event) => {
    let val = parseInt(event.target.value);
    if (event.target.value == '') val = 0;
    if (val < parseInt(this.selected_item['moq'])) {
      this.qty = val;
    } else {
      event.target.value = parseInt(this.selected_item['moq']);
      this.qty = parseInt(this.selected_item['moq']);
    }
  }
  add_item = () => {
    if (this.ticket_created) {
      let flag = false;
      this.ordered_item.forEach(item => {
        if (item['item_id'] == this.selected_item['id']) {
          flag = true;
        }
      })
      if (flag) {
        this.ordered_item.forEach(item => {
          if (item['item_id'] == this.selected_item['id']) {
            item['qty'] += this.qty;
          }
        })
      } else {
        this.ordered_item.push({
          item_id: this.selected_item['id'],
          qty: this.qty
        })
      }
    } else {
      this.toast.error('You need to create a new order before adding items.', 'Error');
    }
    this.reset();
  }
  edit_item = (id) => {
    this.reset();
    this.selected_item = this.globalService.items.filter(item => item['id'] == id)[0];
    this.qty = this.ordered_item.filter(item => item['item_id'] == id)[0]['qty'];
  }
  edit_item_confirm = () => {
    this.ordered_item.map(item => {
      if (item['item_id'] == this.selected_item['id']) {
        item['qty'] = this.qty;
      }
    })
    this.reset();
  }
  remove_item = () => {
    this.ordered_item = [...this.ordered_item.filter(item => item['item_id'] != this.selected_item['id'])];
    this.reset();
  }
  clear_items = () => {
    this.ordered_item = [];
    this.reset();
  }
  cancel_order = () => {
    this.ticket_created = false;
    this.ordered_item = [];
    this.reset();
  }
  confirm_order = () => {
    if (this.ordered_item.length == 0) {
      this.toast.error('No items added. Please add items.', 'Error');
    } else {
      this.place_order(this.ordered_item);
    }
  }
  edit_order = () => {
    this.ticket_created = true;
    this.po_number = this.selected_order['order_id'];
    this.ordered_item = [];
    this.ordered_item_details.forEach(item => {
      this.ordered_item.push({
        item_id: item['item_id'],
        qty: item['qty']
      })
    })
  }

  reset = () => {
    this.selected_item = null;
    this.qty = 1;
  }
  place_order = (items) => {
    this.loading = true;
    this.api.addOrder(this.parseService.encode({
      customer_id: this.user['id'],
      order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
      order_id: this.po_number,
      status: 'pending',
      items: JSON.stringify(items)
    })).pipe(first()).subscribe(data => {
      if (data['data'] == true) {
        this.toast.success('Your order has been placed successfully.', 'Success');
        this.getOrders(this.user['id']);
        this.send_mail_to_user(items);
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again later.', 'Error');
    });
    this.ordered_item = [];
    this.ticket_created = false;
    this.reset();
  }
  save_order = (items) => {
    if (items.length > 0) {
      this.loading = true;
      this.api.addOrder(this.parseService.encode({
        customer_id: this.user['id'],
        order_time: moment().format('YYYY-MM-DD HH:mm:ss'),
        order_id: this.po_number,
        status: 'draft',
        items: JSON.stringify(items)
      })).pipe(first()).subscribe(data => {
        if (data['data'] == true) {
          this.toast.success('Your order has been saved. You can edit it next time.', 'Success');
          this.getOrders(this.user['id']);
        }
        this.loading = false;
      }, error => {
        this.loading = false;
        this.toast.error('There is an issue with server. Please try again later.', 'Error');
      });
      this.ordered_item = [];
      this.ticket_created = false;
      this.reset();
    } else {
      this.toast.error('No items were added.', 'Error');
    }
  }
  send_mail_to_user = (items) => {
    this.api.sendMail(this.parseService.encode({
      item_details: JSON.stringify(this.globalService.get_item_details(items)),
      total_price: this.globalService.sum_total_price(items),
      info_dry: JSON.stringify(this.globalService.sum_total_cbm_dry(items)),
      info_frozen: JSON.stringify(this.globalService.sum_total_cbm_frozen(items)),
      order_id: this.po_number,
      user_name: this.user['name'],
      company: this.user['company'],
      to: this.user['email'],
      subject: "Your order has been placed successfully",
      message: "Your order has been placed successfully and notified to purchasing system department admin. You will be get notified when the order is approved and shipped.",
    })).pipe(first()).subscribe(data => {
      if (data['status'] == 'success') {
        this.send_mail_to_admin(items);
        this.toast.success('Purchasing order mail sent successfully to your email.', 'Success');
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again later.', 'Error');
    });
  }
  send_mail_to_admin = (items) => {
    this.api.sendMailToAdmin(this.parseService.encode({
      item_details: JSON.stringify(this.globalService.get_item_details(items)),
      total_price: this.globalService.sum_total_price(items),
      info_dry: JSON.stringify(this.globalService.sum_total_cbm_dry(items)),
      info_frozen: JSON.stringify(this.globalService.sum_total_cbm_frozen(items)),
      order_id: this.po_number,
      admin_name: this.admin['name'],
      user_name: this.user['name'],
      company: this.user['company'],
      to: this.admin['email'],
      subject: "There is an incoming order",
      message: `${this.user['name']} has placed an order. Please review it and take a further action.`,
    })).pipe(first()).subscribe(data => {
      if (data['status'] == 'success') {
        //this.toast.success('Purchasing order mail sent successfully to your email.', 'Success');
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again later.', 'Error');
    });
  }
  select_order = (order_id) => {
    this.selected_order = this.globalService.orders.filter(item => item['order_id'] == order_id)[0];
    this.ordered_item_details = [];
    this.loading = true;
    this.api.getOrderDetails(this.parseService.encode({
      order_id: order_id
    })).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          this.ordered_item_details = [...data['data']];
          // sort frozen & dry
          this.ordered_item_details.sort((a, b) => {
            let c1 = '', c2 = '';
            this.globalService.items.forEach(item => {
              if(a['item_id'] == item['id']) c1 = item['category'];
              if(b['item_id'] == item['id']) c2 = item['category'];
            })
            if(c1 == c2){
              return 0
            }else if(c1 == 'frozen'){
              return -1
            }else{
              return 1;
            }
          })
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
  search_item = (event) => {
    this.search_key = event.target.value;
  }
  filter_item = (item) => {
    if (this.search_key == '') {
      return true;
    } else {
      if ((item['description'].toLowerCase().indexOf(this.search_key.toLowerCase()) != -1) || (item['vendor_description'].toLowerCase().indexOf(this.search_key.toLowerCase()) != -1)) {
        return true;
      }
      return false;
    }
  }
  sort_global_item = (key) => {
    if(key == 'category'){
      this.globalService.items.sort((a, b) => {
        if(a['category'] == b['category']){
          return 0;
        }else if(a['category'] == 'frozen'){
          return -1;
        }else{
          return 1;
        }
      })
    }
    if(key == 'moq'){
      this.globalService.items.sort((a, b) => {
        if(parseInt(a['moq']) == parseInt(b['moq'])){
          return 0;
        }else if(parseInt(a['moq']) < parseInt(b['moq'])){
          return -1;
        }else{
          return 1;
        }
      })
    }
    if(key == 'price'){
      this.globalService.items.sort((a, b) => {
        if(parseFloat(a['price']) == parseFloat(b['price'])){
          return 0;
        }else if(parseFloat(a['price']) < parseFloat(b['price'])){
          return -1;
        }else{
          return 1;
        }
      })
    }
    if(key == 'description'){
      this.globalService.items.sort((a, b) => {
        if(a['description'] == b['description']){
          return 0;
        }else if(a['description']  < b['description']){
          return -1;
        }else{
          return 1;
        }
      })
    }
  }
  export_excel = () => {
    /* table id is passed over here */
    let element = document.getElementById('export-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */
    XLSX.writeFile(wb, `${this.po_number}.xlsx`);
  }
}
