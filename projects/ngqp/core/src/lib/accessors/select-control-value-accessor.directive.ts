import {
    Directive,
    ElementRef,
    forwardRef,
    Host,
    HostListener,
    Input,
    OnDestroy,
    Optional,
    Renderer2,
    StaticProvider
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export const NGQP_SELECT_VALUE_ACCESSOR: StaticProvider = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NgqpSelectControlValueAccessorDirective),
    multi: true
};

@Directive({
    selector: 'select:not([multiple])[queryParamName]',
    providers: [NGQP_SELECT_VALUE_ACCESSOR],
})
export class NgqpSelectControlValueAccessorDirective<T> implements ControlValueAccessor {

    public value: T | null = null;
    private selectedId: string | null = null;
    private optionMap = new Map<string, T>();

    private idCounter = 0;
    private fnChange = (_: T) => {};
    private fnTouched = () => {};

    @HostListener('change', ['$event'])
    public onChange(event: UIEvent) {
        this.selectedId = (event.target as HTMLOptionElement).value;
        this.value = this.optionMap.get(this.selectedId);
        this.fnChange(this.value);
    }

    @HostListener('blur')
    public onTouched() {
        this.fnTouched();
    }

    constructor(private renderer: Renderer2, private elementRef: ElementRef) {
    }

    public writeValue(value: T) {
        this.value = value;

        this.selectedId = this.getOptionId(value);
        if (this.selectedId === null) {
            this.renderer.setProperty(this.elementRef.nativeElement, 'selectedIndex', -1);
        }

        this.renderer.setProperty(this.elementRef.nativeElement, 'value', this.selectedId);
    }

    public registerOnChange(fn: any) {
        this.fnChange = fn;
    }

    public registerOnTouched(fn: any) {
        this.fnTouched = fn;
    }

    public setDisabledState(isDisabled: boolean) {
        this.renderer.setProperty(this.elementRef.nativeElement, 'disabled', isDisabled);
    }

    public registerOption(): string {
        return (this.idCounter++).toString();
    }

    public deregisterOption(id: string): void {
        this.optionMap.delete(id);
    }

    public updateOptionValue(id: string, value: T): void {
        this.optionMap.set(id, value);

        if (this.selectedId === id) {
            this.fnChange(value);
        } else if (this.value === value) {
            this.writeValue(value);
        }
    }

    private getOptionId(value: T): string | null {
        for (const id of Array.from(this.optionMap.keys())) {
            if (this.optionMap.get(id) === value) {
                return id;
            }
        }

        return null;
    }

}

@Directive({
    selector: 'option',
})
export class NgqpSelectOptionDirective<T> implements OnDestroy {

    private readonly id: string | null = null;

    constructor(
        @Optional() @Host() private parent: NgqpSelectControlValueAccessorDirective<T>,
        private renderer: Renderer2,
        private elementRef: ElementRef,
    ) {
        if (this.parent) {
            this.id = this.parent.registerOption();
        }
    }

    public ngOnDestroy() {
        this.parent.deregisterOption(this.id);
        this.parent.writeValue(this.parent.value);
    }

    @Input('value')
    public set value(value: T) {
        this.renderer.setProperty(this.elementRef.nativeElement, 'value', this.id);
        this.parent.updateOptionValue(this.id, value);
    }

}