import { Routes } from '@angular/router';
import { AdminFeedbackComponent } from './admin-feedback/admin-feedback.component';
import { AdminSuggestionsComponent } from './admin-suggestions/admin-suggestions.component';
import { UserEditorComponent } from './admin/users/user-editor/user-editor.component';
import { adminGuard } from './auth/admin.guard';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { superAdminGuard } from './auth/super-admin.guard';
import { ChargePointAddComponent } from './charge-points/charge-point-add/charge-point-add.component';
import { ChargePointDetailsComponent } from './charge-points/charge-point-details/charge-point-details.component';
import { ChargePointEditComponent } from './charge-points/charge-point-edit/charge-point-edit.component';
import { ChargePointSuggestComponent } from './charge-points/charge-point-suggest/charge-point-suggest.component';
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
        path: 'user',
        canActivate: [authGuard],
        children: [
            { path: 'profile', component: UserProfileComponent },
            { path: 'change-password', component: ChangePasswordComponent },
        ]
    },
    {
        path: 'charge-points',
        children: [
            { path: '', redirectTo: '/', pathMatch: 'full' },
            { path: 'new', component: ChargePointAddComponent, canActivate: [adminGuard] }, // Only admins can directly 'add'
            { path: 'suggest', component: ChargePointSuggestComponent }, // Anyone (or maybe auth users?) can suggest. Logic says guest too.
            { path: ':id', component: ChargePointDetailsComponent },
            { path: ':id/edit', component: ChargePointEditComponent, canActivate: [authGuard] }
        ]
    },
    {
        path: 'admin',
        children: [
            { path: 'feedback', component: AdminFeedbackComponent, canActivate: [adminGuard] },
            { path: 'suggestions', component: AdminSuggestionsComponent, canActivate: [adminGuard] },
            {
                path: 'users',
                canActivate: [superAdminGuard],
                children: [
                    { path: '', component: UserListComponent },
                    { path: 'new', component: UserEditorComponent },
                ]
            },
        ]
    },
    // Redirect old routes to avoid breaking bookmarks if any, or just remove.
    // I'll leave them out for now to ensure we stick to the new structure.
];
