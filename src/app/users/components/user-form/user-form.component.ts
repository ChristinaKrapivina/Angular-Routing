import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { Location } from '@angular/common';

// rxjs
import { Observable, Subscription } from 'rxjs';
import { pluck } from 'rxjs/operators';

import { AutoUnsubscribe, DialogService, CanComponentDeactivate } from './../../../core';
import { UserModel } from './../../models/user.model';
import { UserObservableService } from './../../services';

@Component({
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})

@AutoUnsubscribe()
export class UserFormComponent implements OnInit, CanComponentDeactivate {
  user: UserModel;
  originalUser: UserModel;

  private sub: Subscription;

  constructor(
    private userObservableService: UserObservableService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    // data is an observable object
    // which contains custom and resolve data
    this.route.data.pipe(pluck('user')).subscribe((user: UserModel) => {
      this.user = { ...user };
      this.originalUser = { ...user };
    });
  }

  onSaveUser() {
    const user = { ...this.user };

    // if (user.id) {
    //   this.userArrayService.updateUser(user);
    //   // optional parameter: http://localhost:4200/users;id=2
    //   this.router.navigate(['/users', { editedUserID: user.id }]);
    // } else {
    //   this.userArrayService.createUser(user);
    //   this.onGoBack();
    // }
    // this.originalUser = { ...this.user };

    const method = user.id ? 'updateUser' : 'createUser';
    const observer = {
          next: (savedUser: UserModel) => {
            this.originalUser = { ...savedUser };
            user.id
              ? // optional parameter: http://localhost:4200/users;editedUserID=2
                this.router.navigate(['users', { editedUserID: user.id }])
              : this.onGoBack();
          },
          error: (err: any) => console.log(err)
    };
    this.sub = this.userObservableService[method](user).subscribe(observer);

  }

  onGoBack() {
    // this.router.navigate(['./../../'], { relativeTo: this.route });
    this.location.back();
  }

  canDeactivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const flags = Object.keys(this.originalUser).map(key => {
      if (this.originalUser[key] === this.user[key]) {
        return true;
      }
      return false;
    });

    if (flags.every(el => el)) {
      return true;
    }

    // Otherwise ask the user with the dialog service and return its
    // promise which resolves to true or false when the user decides
    return this.dialogService.confirm('Discard changes?');
  }
}
