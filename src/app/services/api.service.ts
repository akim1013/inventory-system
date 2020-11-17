import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

import { CookieService } from '../services/cookie.service';

const api_url = 'http://198.11.172.117/sbm-dashboard';

const controller = 'ps';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient, private cookieService: CookieService) { }
  // Admin APIs
  login(data: FormData) {
    return this.http.post(`${api_url}/auth/is_login`, data)
      .pipe(map(res => {
        //login successful if the status is success
        if (res['status'] == 'success') {
          this.cookieService.setCookie('currentUser', JSON.stringify(res['res']), 1);
        }
        return res;
      }));
  }
  getItem(data: FormData) {
    return this.http.post(`${api_url}/${controller}/get_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  getItemById(data: FormData) {
    return this.http.post(`${api_url}/${controller}/get_item_by_id`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  addItem(data: FormData) {
    return this.http.post(`${api_url}/${controller}/add_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  updateItem(data: FormData) {
    return this.http.post(`${api_url}/${controller}/update_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  updateItemStatus(data: FormData) {
    return this.http.post(`${api_url}/${controller}/update_item_status`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  removeItem(data: FormData) {
    return this.http.post(`${api_url}/${controller}/remove_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  addBatchItem(data: FormData) {
    return this.http.post(`${api_url}/${controller}/add_batch_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  addOrder(data: FormData){
    return this.http.post(`${api_url}/${controller}/add_order`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  getOrders(data: FormData){
    return this.http.post(`${api_url}/${controller}/get_orders`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  getAllOrders(data: FormData){
    return this.http.post(`${api_url}/${controller}/get_all_orders`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  getOrderDetails(data: FormData){
    return this.http.post(`${api_url}/${controller}/get_order_details`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  getPsUsers(){
    return this.http.post(`${api_url}/${controller}/get_ps_users`, '')
      .pipe(map(res => {
        return res;
      }))
  }
  getPsAdmin(data: FormData){
    return this.http.post(`${api_url}/${controller}/get_ps_admin`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  updateOrderStatus(data: FormData){
    return this.http.post(`${api_url}/${controller}/update_order_status`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  deleteOrder(data: FormData){
    return this.http.post(`${api_url}/${controller}/delete_order`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  deleteOrderedItem(data: FormData){
    return this.http.post(`${api_url}/${controller}/delete_ordered_item`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  updateOrder(data: FormData){
    return this.http.post(`${api_url}/${controller}/update_order`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  addAdditionalItemsToOrder(data: FormData){
    return this.http.post(`${api_url}/${controller}/add_additional_items_to_order`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  sendMail(data: FormData){
    return this.http.post(`${api_url}/${controller}/send_mail_to_user`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  sendMailToAdmin(data: FormData){
    return this.http.post(`${api_url}/${controller}/send_mail_to_admin`, data)
      .pipe(map(res => {
        return res;
      }))
  }
  sendStatusUpdateMail(data: FormData){
    return this.http.post(`${api_url}/${controller}/send_status_update_mail`, data)
      .pipe(map(res => {
        return res;
      }))
  }
}
