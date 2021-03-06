import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { QueryParamBuilder, QueryParamGroup } from '@ngqp/core';

@Component({ selector: 'app-example' })
export class ExampleComponent implements OnDestroy {

    public paramGroup: QueryParamGroup;
    private componentDestroyed$ = new Subject<void>();

    constructor(private qpb: QueryParamBuilder) {
        this.paramGroup = qpb.group({
            searchText: qpb.stringParam('q'),
        });

        this.paramGroup.valueChanges.pipe(
            takeUntil(this.componentDestroyed$)
        ).subscribe(value => {
            console.log('Emitted: ', value);
        });
    }

    public ngOnDestroy(): void {
        this.componentDestroyed$.next();
        this.componentDestroyed$.complete();
    }

}