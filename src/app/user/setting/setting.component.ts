import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ParseService } from '../../services/parse.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import { GlobalService } from '../../services/global.service'
import Swal from 'sweetalert2';
import { LoadingBarService } from '@ngx-loading-bar/core';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {

  constructor(
    public globalService: GlobalService,
    private api: ApiService,
    private parseService: ParseService,
    private toast: ToastrService,
    private authService: AuthService,
    private loadingBar: LoadingBarService
  ) { }
  loader = this.loadingBar.useRef();

  loading = false
  user: Object
  ps_items: Array<Object>
  is_items: Array<Object>

  ps_search_key: string = ''
  is_search_key: string = ''

  ngOnInit(): void {
    this.globalService.menu = 'setting'
    this.user = this.authService.currentUser()
    this.getItems()
  }

  public search_ps_item = (e: any) => {
    this.ps_search_key = e.target.value;
  }
  public search_is_item = (e: any) => {
    this.is_search_key = e.target.value;
  }

  private getItems = () => {
    this.loader.start()
    this.api.getPsItem(
      this.parseService.encode({
        company: this.authService.currentUser()['company']
      })
    ).pipe(first()).subscribe(
      data => {
        if (data['status'] == 'success') {
          let items = data['data']
          this.ps_items = []
          items.forEach((item: { [x: string]: string; }) => {
            if((item['user_access'] == 'all' || item['user_access'] == this.user['role']) && (item['status'] == 'true')){
              this.ps_items.push(item)
            }
          })
          this.api.getIsItem(
            this.parseService.encode({
              branch_id: this.authService.currentUser()['branch_id']
            })
          ).pipe(first()).subscribe(
            data => {
              if (data['status'] == 'success') {
                let items = data['data']
                this.is_items = [...items]
                this.adjust_items()
              } else {
                this.toast.error('IS Item fetching error. There is an issue with server. Please try again.', 'Error');
                this.loader.complete()
              }
            },
            error => {
              this.loader.complete()
            }
          );
        } else {
          this.toast.error('PS Item fetching error. There is an issue with server. Please try again.', 'Error');
          this.loader.complete()
        }
      },
      error => {
        console.log(error)
        this.loader.complete()
      }
    );
  }
  private adjust_items = () => {
    // Identify added items 
    let is_item_ids = []
    this.is_items.map(item => {
      is_item_ids.push(item['inventory_id'])
      this.ps_items.forEach(p_item => {
        if(p_item['inventory_id'] == item['inventory_id']){
          item['image'] = p_item['image']
          item['category'] = p_item['category']
          item['description'] = p_item['description']
          item['vendor_description'] = p_item['vendor_description']
        }
      })
    })
    this.ps_items.map(item => {
      if(is_item_ids.indexOf(item['inventory_id']) == -1){
        item['added'] = false
      }else{
        item['added'] = true
      }
    })
    this.loader.complete()
  }
  public add_or_update_to_is = (inventory_id: string, type: string) => {
    let item = this.ps_items.filter(item => item['inventory_id'] == inventory_id)[0]
    let is_item = this.is_items.filter(item => item['inventory_id'] == inventory_id)[0]
    Swal.fire({
      title: type == 'add' ? 'Add item to count list' : 'Update item',
      html: `
        <div class="p-5">
          <div class="flex items-center">
            <p class="text-left truncate">${item['description']}</p>
            <p class="ml-auto text-red-400 truncate">${item['vendor_description']}</p>
          </div>
          <div class="flex items-center mt-3">
            <div>Safety QTY: </div>
            <div class="ml-1 sm:ml-5 flex items-center">
              <input 
                placeholder="8" 
                style="width: 40px" 
                id="safety_qty" 
                type="number" 
                min="0" 
                max="999" 
                step="0.01" 
                class="text-sm w-full outline-none border rounded py-2 px-1 text-right"
                value="${is_item ? is_item['safety_qty'] : 0}"
                />
              <span title="The safety qty will be automatically adjusted by algorithm" class="ml-2 text-sm button button--sm bg-theme-1 text-white">Auto set</span>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: type == 'add' ? `Add` : 'Update',
      allowOutsideClick: false,
      preConfirm: () => {
        let safety_qty = document.querySelector('#safety_qty')['value']
        // let sp_qty = document.querySelector('#sp_qty')['value']
        // let primary_unit = document.querySelector('#primary_unit')['value']
        // let secondary_unit = document.querySelector('#secondary_unit')['value']
        if(safety_qty == ''){
          this.toast.error('You need to input all required data.', 'Error')
          return false
        }
        // if(safety_qty == '' || sp_qty == '' || primary_unit == '' || secondary_unit == ''){
        //   this.toast.error('You need to input all required data.', 'Error')
        //   return false
        // }
        this.loader.start()
        this.api.addIsItem(this.parseService.encode({
          safety_qty: safety_qty,
          sp_qty: 0,
          inventory_id: inventory_id,
          primary_unit: '',
          secondary_unit: '',
          branch_id: this.user['branch_id']
        })).pipe(first()).subscribe(data => {
          if (data['data'] == true) {
            this.toast.success('Item added successfully.', 'Success');
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
  public remove_item = (id: any) => {
    this.loader.start()
    this.api.removeIsItem(this.parseService.encode({
      id: id
    })).pipe(first()).subscribe(data => {
      if (data['data'] == true) {
        this.toast.success('Item removed from count list successfully.', 'Success');
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
}
