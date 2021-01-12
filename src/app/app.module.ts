import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { appRoutingModule } from './app.routing';
import { HeaderComponent } from './layouts/header/header.component';
import { MenuComponent } from './layouts/menu/menu.component';
import { FeatherIconDirective } from './directives/feather-icon.directive';
import { OrderComponent } from './user/order/order.component';
import { HistoryComponent } from './user/history/history.component';
import { ItemComponent } from './admin/item/item.component';
import { AddComponent } from './admin/item/add/add.component';
import { EditComponent } from './admin/item/edit/edit.component';
import { HttpClientModule } from '@angular/common/http';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { LoginComponent } from './auth/login/login.component';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';
import { PageNotFoundComponent } from './auth/page-not-found/page-not-found.component';
import { FormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { LOADING_BAR_CONFIG } from '@ngx-loading-bar/core';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LoaderComponent } from './fragments/loader/loader.component';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { ManageOrderComponent } from './admin/manage-order/manage-order.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { SettingComponent } from './user/setting/setting.component';
import { CountComponent } from './user/count/count.component';
import { OrderReceiveComponent } from './user/order-receive/order-receive.component';
import { DraftComponent } from './user/count/draft/draft.component';
import { DetailsComponent } from './user/order-receive/details/details.component';

import { NgSelect2Module } from 'ng-select2';
@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    FeatherIconDirective,
    OrderComponent,
    HistoryComponent,
    ItemComponent,
    AddComponent,
    EditComponent,
    LoginComponent,
    UnauthorizedComponent,
    PageNotFoundComponent,
    LoaderComponent,
    ManageOrderComponent,
    SettingComponent,
    CountComponent,
    OrderReceiveComponent,
    DraftComponent,
    DetailsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    appRoutingModule,
    NgxDropzoneModule,
    HttpClientModule,
    NgSelect2Module,
    LoadingBarModule,
    FormsModule,
    ToastrModule.forRoot(),
    SweetAlert2Module.forRoot(),
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 60,
      outerStrokeWidth: 6,
      innerStrokeWidth: 3,
      innerStrokeColor: "#eaeaea",
      animationDuration: 300,
      space: -3,
      titleFontSize: '16px',
      subtitleFontSize: '12px'
    })
  ],
  providers: [
    { provide: LOADING_BAR_CONFIG, useValue: { latencyThreshold: 100 } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
