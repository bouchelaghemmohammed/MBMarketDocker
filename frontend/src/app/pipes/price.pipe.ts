import { Pipe, PipeTransform } from '@angular/core';

/** Formats a number as Quebec-style price: 10 000.00 $ */
@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '0.00 $';
    const [intPart, decPart] = value.toFixed(2).split('.');
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); // non-breaking space
    return `${formatted}.${decPart}\u00a0$`;
  }
}
