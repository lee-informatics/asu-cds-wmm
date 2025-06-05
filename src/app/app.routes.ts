// Author: Preston Lee

import { Routes } from '@angular/router';
import { GuidelinesComponent } from './guidelines/guidelines-component';
import { LogicComponent } from './logic/logic-component';


export const routes: Routes = [
    { path: '', redirectTo: '/guidelines', pathMatch: 'full' },
    {
        path: 'guidelines',
        component: GuidelinesComponent
    },
    {
        path: 'logic',
        component: LogicComponent
    }
];
