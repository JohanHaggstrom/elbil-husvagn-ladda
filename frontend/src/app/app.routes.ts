import { Routes } from '@angular/router';
import { AdminFeedbackComponent } from './admin-feedback/admin-feedback.component';
import { AdminSuggestionsComponent } from './admin-suggestions/admin-suggestions.component';
import { LoginComponent } from './auth/login/login.component';
import { FeedbackFormComponent } from './feedback-form/feedback-form.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'feedback',
        component: FeedbackFormComponent
    },
    {
        path: 'admin/feedback',
        component: AdminFeedbackComponent
    },
    {
        path: 'admin/suggestions',
        component: AdminSuggestionsComponent
    }
];
