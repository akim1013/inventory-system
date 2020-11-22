import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { ParseService } from '../../../services/parse.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';
import * as moment from 'moment';
import { GlobalService } from '../../../services/global.service'
import { LoadingBarService } from '@ngx-loading-bar/core';
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
    private loadingBar: LoadingBarService
  ) { }
  loader = this.loadingBar.useRef()

  is_items: Array<Object>
  ps_items: Array<Object>
  c_items: Array<Object>
  is_search_key: string = ''


  ngOnInit(): void {
    this.globalService.menu = 'count'
    this.getItems()
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
          console.log(data)
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
  search_is_item(e){
    this.is_search_key = e.target.value
  }
  add_to_count(){

  }
}
