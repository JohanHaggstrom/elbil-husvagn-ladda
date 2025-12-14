import { Routes } from '@angular/router';
import { AdminFeedbackComponent } from './admin-feedback/admin-feedback.component';
import { AdminSuggestionsComponent } from './admin-suggestions/admin-suggestions.component';
import { adminGuard } from './auth/admin.guard';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { superAdminGuard } from './auth/super-admin.guard';
import { FeedbackFormComponent } from './feedback-form/feedback-form.component';
import { HomeComponent } from './home/home.component';
import { ChangePasswordComponent } from './users/change-password/change-password.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserProfileComponent } from './users/user-profile/user-profile.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'feedback',
        component: FeedbackFormComponent,
    },
    {
        path: 'admin/feedback',
        component: AdminFeedbackComponent,
        canActivate: [adminGuard],
    },
    {
        path: 'admin/suggestions',
        component: AdminSuggestionsComponent,
        canActivate: [adminGuard],
    },
    {
        path: 'admin/users',
        component: UserListComponent,
        canActivate: [superAdminGuard],
    },
    {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [authGuard],
    },
    {
        path: 'change-password',
        component: ChangePasswordComponent,
        canActivate: [authGuard],
    },
];
