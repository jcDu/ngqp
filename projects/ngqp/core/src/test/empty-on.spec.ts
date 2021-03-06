import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { waitForAsync, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { QueryParamBuilder, QueryParamGroup, QueryParamModule } from '../public_api';
import { setupNavigationWarnStub } from './util';
import { compareStringArraysUnordered } from '../lib/util';

@Component({
    template: `
        <div [queryParamGroup]="paramGroup">
            <input type="text" queryParamName="param1" />
            <input type="text" queryParamName="param2" />
            <select multiple queryParamName="param3">
                <option value="Test1"></option>
                <option value="Test2"></option>
                <option value="Test3"></option>
            </select>
        </div>
    `,
})
class BasicTestComponent {

    public paramGroup: QueryParamGroup;

    constructor(private qpb: QueryParamBuilder) {
        this.paramGroup = qpb.group({
            param1: qpb.stringParam('q1', {
                emptyOn: 'Test',
            }),
            param2: qpb.stringParam('q2', {
                emptyOn: 'Test',
                compareWith: (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase(),
            }),
            param3: qpb.stringParam('q3', {
                multi: true,
                emptyOn: ['Test1', 'Test2'],
                compareWith: compareStringArraysUnordered,
            }),
        });
    }

}

describe('emptyOn', () => {
    let fixture: ComponentFixture<BasicTestComponent>;
    let component: BasicTestComponent;
    let input1: HTMLInputElement;
    let input2: HTMLInputElement;
    let select3: HTMLSelectElement;
    let router: Router;

    beforeEach(() => setupNavigationWarnStub());

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule.withRoutes([]),
                QueryParamModule,
            ],
            declarations: [
                BasicTestComponent,
            ],
        });

        router = TestBed.inject(Router);
        TestBed.compileComponents();
        router.initialNavigation();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BasicTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        input1 = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[0] as HTMLInputElement;
        input2 = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[1] as HTMLInputElement;
        select3 = (fixture.nativeElement as HTMLElement).querySelectorAll('select')[0] as HTMLSelectElement;
        fixture.detectChanges();
    });

    it('removes the parameter if the default value is set to the form control', fakeAsync(() => {
        input1.value = 'Test';
        input1.dispatchEvent(new Event('input'));
        tick();

        expect(router.url).toBe('/');
    }));

    it('sets the form control value to the specified default if the query parameter is not set', fakeAsync(() => {
        // Set the parameter on the route so it can actually disappear, otherwise no event
        // is (and should be) sent
        router.navigateByUrl(`/?q1=x`);
        tick();

        input1.value = 'Other';
        fixture.detectChanges();

        // We need to pass some other argument since the router won't trigger a navigation for the URL
        // we are already on
        router.navigateByUrl('/?t=1');
        tick();

        fixture.detectChanges();
        expect(input1.value).toBe('Test');
    }));

    it('uses a custom comparator if provided', fakeAsync(() => {
        input2.value = 'Other';
        input2.dispatchEvent(new Event('input'));
        tick();
        expect(router.url).toBe('/?q2=Other');

        input2.value = 'TEST';
        input2.dispatchEvent(new Event('input'));
        tick();

        expect(router.url).toBe('/');
    }));

    it('works for multi: true', fakeAsync(() => {
        (select3.querySelectorAll('option')[0] as HTMLOptionElement).selected = true;
        (select3.querySelectorAll('option')[1] as HTMLOptionElement).selected = true;
        select3.dispatchEvent(new Event('change'));
        tick();

        expect(router.url).toBe('/');

        (select3.querySelectorAll('option')[2] as HTMLOptionElement).selected = true;
        select3.dispatchEvent(new Event('change'));
        tick();

        expect(router.url).toBe('/?q3=Test1&q3=Test2&q3=Test3');
    }));
});