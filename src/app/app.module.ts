import {ErrorHandler, Injectable, NgModule, LOCALE_ID} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ToastrModule} from 'ngx-toastr';
import {NotfoundComponent} from './notfound/notfound.component';
import {HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http';
import {TokenInterceptor} from './services/token.interceptor';
import {APP_BASE_HREF} from '@angular/common';
import {registerLocaleData} from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi, 'vi');
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    if (chunkFailedMessage.test(error.message)) {
      window.location.reload();
    }
  }
}

@NgModule({
  declarations: [AppComponent, NotfoundComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'vi'},
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {provide: ErrorHandler, useClass: GlobalErrorHandler},
    {provide: APP_BASE_HREF, useValue: (window as any)['_app_base'] || '/'},
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
