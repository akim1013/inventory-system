import { Injectable } from '@angular/core';
import { Item } from '../admin/item/item';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  menu: String = ''
  items: Item[] = [];
  orders: Object[] = [];

  dry_cbf_pallet = 83.50;
  frozen_cbf_pallet = 76.00;
  price_tbded = false;

  constructor(private authService: AuthService) { }

  sum_total_cbm_dry = (ordered_item) => {
    let sum = 0;
    if (ordered_item.length != 0) {
      ordered_item.forEach(item => {
        this.items.forEach(_item => {
          if (item['item_id'] == _item['id']) {
            if ((_item['cbm'] != '') && (_item['category'] == 'dry')) {
              sum += this.parse_float(_item['cbm']) * item['qty'];
            }
          }
        })
      })
    }
    return {
      total_cbf: Math.floor(sum * 100) / 100,
      total_pallet: sum == 0 ? 0 : Math.floor(sum / this.dry_cbf_pallet) + 1,
      reminder_cbf: Math.round((sum % this.dry_cbf_pallet) * 100) / 100,
      reminder_percent: Math.round((sum % this.dry_cbf_pallet) / this.dry_cbf_pallet * 100),
      fill_cbf: Math.round((this.dry_cbf_pallet - Math.round((sum % this.dry_cbf_pallet) * 100) / 100) * 100) / 100,
      one_pallet_cbf: this.dry_cbf_pallet
    }
  }
  sum_total_cbm_frozen = (ordered_item) => {
    let sum = 0;
    if (ordered_item.length != 0) {
      ordered_item.forEach(item => {
        this.items.forEach(_item => {
          if (item['item_id'] == _item['id']) {
            if ((_item['cbm'] != '') && (_item['category'] == 'frozen')) {
              sum += this.parse_float(_item['cbm']) * item['qty'];
            }
          }
        })
      })
    }
    return {
      total_cbf: Math.floor(sum * 100) / 100,
      total_pallet: sum == 0 ? 0 : Math.floor(sum / this.frozen_cbf_pallet) + 1,
      reminder_cbf: Math.round((sum % this.frozen_cbf_pallet) * 100) / 100,
      reminder_percent: Math.round((sum % this.frozen_cbf_pallet) / this.frozen_cbf_pallet * 100),
      fill_cbf: Math.round((this.frozen_cbf_pallet - Math.round((sum % this.frozen_cbf_pallet) * 100) / 100) * 100) / 100,
      one_pallet_cbf: this.frozen_cbf_pallet
    }
  }
  sum_total_price = (ordered_item) => {
    let sum = 0;
    this.price_tbded = false;
    if (ordered_item.length != 0) {
      ordered_item.forEach(item => {
        this.items.forEach(_item => {
          if (item['item_id'] == _item['id']) {
            if ((_item['price'] != '') && (_item['price'] != 'Market Price')) {
              sum += this.parse_float(_item['price']) * item['qty'];
            } else {
              this.price_tbded = true;
            }
          }
        })
      })
    }
    return this.parse_float(sum);
  }
  parse_float = (val) => {
    return Math.floor(parseFloat(val) * 100) / 100;
  }
  parse_int = (val) => {
    return parseInt(val);
  }
  // For emails
  get_item_details = (items) => {
    let order_details = [];
    items.forEach(item => {
      this.items.forEach(gitem => {
        if(gitem['id'] == item['item_id']){
          order_details.push({
            "branch_id": this.authService.currentUser['name'],
            "g_weight": gitem['gross_weight'],
            "i_id": gitem['inventory_id'],
            "v_desc": gitem['vendor_description'],
            "desc": gitem['description'],
            "p_info": gitem['packing_info'],
            "cost": gitem['price'],
            "qty": item['qty'],
            "uom": gitem['uom'],
            "subtotal": gitem['price'] != '' && gitem['price'] != 'Market Price' ? this.parse_float(parseFloat(gitem['price']) * item['qty']).toFixed(2) : 'TBD',
            "gw": gitem['gross_weight'],
            "t_gw": gitem['gross_weight'] ? this.parse_float(parseFloat(gitem['gross_weight']) * item['qty']).toFixed(2) : '',
            "subcharge": gitem['price'] != '' && gitem['price'] != 'Market Price' ? this.parse_float(parseFloat(gitem['price']) * item['qty'] * 0.2).toFixed(2) : 'TBD',
            "moq": gitem['moq'],
            "cbm": gitem['cbm']
          });
        }
      })
    })
    return order_details;
  }

  get_primary_uom = (packing_info: string) => {
    let s = packing_info.split('/')[1]
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  get_secondary_uom = (packing_info: string) => {
    let s = packing_info.split('/')[0].replace(/[0-9]/g, '')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  get_sp_qty = (packing_info: string) => {
    return packing_info.split('/')[0].match(/\d+/)[0]
  }
}
