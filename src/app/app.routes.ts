// Author: Preston Lee

import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard-component';
import { LogicComponent } from './logic-component/logic-component';


export const routes: Routes = [
    {
        path: '',
        component: DashboardComponent
    },
    {
        path: 'logic',
        component: LogicComponent
    }
];
