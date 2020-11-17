import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../services/global.service';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Item } from './item';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {

  loading = false;
  constructor(
    public globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.globalService.menu = 'item';
    this.getItem();
  }
  parse_float = (val) => {
    return Math.floor(parseFloat(val) * 100) / 100;
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

  status_change = item => {
    if (item.status == 'true') {
      item.status = 'false'
    } else {
      item.status = 'true'
    }
    this.loading = true;
    this.api.updateItemStatus(this.parseService.encode({
      status: item.status,
      inventory_id: item.inventory_id
    })).pipe(first()).subscribe(data => {
      if (data['data'] == 1) {
        this.toast.success('Item status changed successfully!', 'Success');
      } else {
        this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
      }
      this.loading = false;
    }, error => {
      this.loading = false;
      this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
    });
  }

  deleteItem = item => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this item? ' + item.inventory_id,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.api.removeItem(this.parseService.encode({
          inventory_id: item.inventory_id
        })).pipe(first()).subscribe(data => {
          this.getItem();
          this.loading = false;
        }, error => {
          this.loading = false;
          this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
        });
      } else {

      }
    })
  }

  editItem = id => {
    this.router.navigate(['/item/edit', id])
  }

  fileUpload = (e) => {
    let workBook = null;
    let jsonData = null;
    const reader = new FileReader();
    const file = e.target.files[0];
    this.loading = true;
    reader.onload = (event) => {
      const data = reader.result;
      workBook = XLSX.read(data, { type: 'binary' });
      jsonData = workBook.SheetNames.reduce((initial, name) => {
        const sheet = workBook.Sheets[name];
        initial[name] = XLSX.utils.sheet_to_json(sheet);
        return initial;
      }, {});
      this.processDataFromXlxs(jsonData)
      this.loading = false;
    }
    reader.readAsBinaryString(file);
  }

  processDataFromXlxs = (data) => {
    const ret = [];
    for (let property in data) {
      let category = '';
      let items = [];
      switch (property) {
        case 'Dry Food':
          category = 'dry';
          break;
        case 'Frozen Food':
          category = 'frozen';
          break;
        default:
          category = 'order';
          break;
      }
      [...data[property].map(raw_item => {
        let _item = new Item();
        Object.entries(raw_item).map(([key, value]) => {
          switch (key) {
            case 'Price':
              _item.price = value.toString();
              break;
            case 'Unit':
              _item.uom = value.toString();
              break;
            case 'Name':
              _item.description = value.toString();
              break;
            case 'Image':
              _item.image = value.toString();
              break;
            case 'Category':
              _item.category = value.toString();
              break;
            case 'G.W.\r\n(lb)':
              _item.gross_weight = value.toString();
              break;
            case 'Item No.':
              _item.inventory_id = value.toString();
              break;
            case 'Model':
              _item.packing_info = value.toString();
              break;
            case 'Qty':
              _item.qty = value.toString();
              break;
            case 'Sales Price':
              _item.sales_price = value.toString();
              break;
            case 'Subtotal':
              break;
            case 'Cbf':
              _item.cbm = value.toString();
              break;
            case 'Total \nG.W.(lb)':
              break;
            case '品名':
              _item.vendor_description = value.toString();
              break;
            case 'max order q\'ty':
              _item.moq = value.toString();
              break;
            case 'SQ':
              break;
            default:
              break;
          }
        })
        if(!_item.category){
          _item.category = category;
        }
        _item.created_user_id = this.authService.currentUser()['id'];
        if (_item.inventory_id != "") {
          items.push(_item)
        }
      })]
      if (category != 'order') {
        ret.push({
          category: category,
          items: items
        })
      }
    }
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to save ${ret[0].items.length} items to database?`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.value) {
        this.uploadToDb(ret[0].items)
      } else {

      }
    })
  }

  uploadToDb = (items) => {
    this.loading = true;
    this.api.addBatchItem(this.parseService.encode({ items: JSON.stringify(items) })).pipe(first()).subscribe(
      data => {
        if (data['data'] == true) {
          this.toast.success('Items added successfully!', 'Success');
          if (data['invalid_ids'].length == 0) {
            this.toast.info(`${items.length} items were added to database.`, 'Success');
          } else {
            this.toast.info(`${items.length - data['invalid_ids'].length} items were added to database. ${data['invalid_ids'].length} items were updated.`, 'Success');
          }
          this.getItem();
        } else {
          this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
        }
        this.loading = false;
      },
      error => {
        this.toast.error('There is an issue with server. Please try again after refreshing browser.', 'Error');
        this.loading = false;
      }
    );
  }
  export_excel = () => {
    /* table id is passed over here */
    let element = document.getElementById('export-table');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All items');
    /* save to file */
    XLSX.writeFile(wb, `ITEMS_${this.authService.currentUser()['company']}_${moment().format('YYYY-MM-DD')}.xlsx`);
  }
}
