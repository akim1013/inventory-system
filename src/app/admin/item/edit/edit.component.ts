import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../../../services/global.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { first } from 'rxjs/operators';
import { Item } from '../item';
import { ParseService } from '../../../services/parse.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {
  item_id: String = ''
  item: Item = new Item();
  original_item: Item = new Item();
  file: File;
  loading: Boolean = false;
  constructor(
    public globalService: GlobalService,
    private route: ActivatedRoute,
    private router: Router,
    private parseService: ParseService,
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastrService
  ) { }

  ngOnInit(): void {
    this.item_id = this.route.snapshot.paramMap.get('id')
    this.item = this.globalService.items.filter(item => item.inventory_id == this.item_id)[0]

    if(!this.item){
      this.apiService.getItemById(this.parseService.encode({inventory_id: this.item_id}))
        .pipe(first())
        .subscribe(data =>{
          this.item = data['data']
          this.original_item = data['data']
        }, error =>{});
    }

  }

  onSelect(event) {
    const reader = new FileReader();
    this.file = event.addedFiles[0];
    reader.readAsDataURL(this.file);
    reader.onload = () => {
      this.item.image = reader.result;
    };
  }
  remove_item_image = () => {
    this.item.image = '';
  }
  onSubmit = () => {
    this.loading = true;
    this.apiService.updateItem(this.parseService.encode(this.item))
      .pipe(first())
      .subscribe(
        data => {
          if(data['status'] == 'success'){
            if(data['data'] == 1){
              this.toast.success('Item updated successfully!', 'Success');
              this.router.navigate(['/item']);
            }else if(data['data'] == 0){
              this.toast.error('Duplicating inventory ID.', 'Error');
            }else if(data['data'] == -1){
              this.toast.error('Database error. Please try again.', 'Error');
            }else{
              this.toast.warning('Image not uploaded. Please try with different image.', 'Warning');
            }
            this.loading = false;
          }
        },
        error => {
          this.toast.error('Server error. Please try again later.', 'Error');
          this.loading = false;
        }
      )
  }
}
