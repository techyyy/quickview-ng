import {MatButtonModule} from '@angular/material/button';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChatComponent } from './chat/chat.component';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';
import {MatCardModule} from "@angular/material/card";
import {ClipboardModule} from "@angular/cdk/clipboard";
import {FormsModule} from "@angular/forms";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'chat/:id', component: ChatComponent},
  { path: 'unexpected', component: ErrorComponent}
]

@NgModule({
  declarations: [
    AppComponent,
    ChatComponent,
    HomeComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatGridListModule,
    MatCardModule,
    ClipboardModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
