# Angular Signals in Practice

## Why Signals

The problem with Zone.js: any async operation (setTimeout, HTTP, events) triggers global change detection — wasted work everywhere.

Signals switch to **fine-grained tracking**: only when a signal that was actually read changes does the corresponding DOM update.

```typescript
// Before: any value change in the component could trigger re-render
export class OldComponent {
  count = 0;
  increment() { this.count++; } // Zone.js intercepts this
}

// Now: explicitly declare reactive state
export class NewComponent {
  count = signal(0);
  increment() { this.count.update(v => v + 1); } // precise update
}
```

## The three core APIs

```typescript
import { signal, computed, effect } from '@angular/core';

// signal: writable reactive state
const count = signal(0);
count.set(5);               // set directly
count.update(v => v + 1);   // update based on current value

// computed: derived state, auto-tracks dependencies
const doubled = computed(() => count() * 2);
// recomputes only when count() changes, memoized

// effect: side effects (use sparingly)
effect(() => {
  console.log(`Count changed to: ${count()}`);
  // auto-tracks every signal read inside
});
```

## Real-world example

```typescript
@Component({
  selector: 'app-cart',
  template: `
    <div>Items: {{ itemCount() }}</div>
    <div>Subtotal: {{ subtotal() | currency }}</div>

    @if (isLoading()) {
      <app-spinner />
    } @else {
      @for (item of items(); track item.id) {
        <app-cart-item [item]="item" (remove)="removeItem(item.id)" />
      }
    }
  `
})
export class CartComponent {
  private readonly cartService = inject(CartService);

  protected readonly items     = this.cartService.items;      // signal<CartItem[]>
  protected readonly isLoading = this.cartService.isLoading;  // signal<boolean>

  protected readonly itemCount = computed(() => this.items().length);
  protected readonly subtotal  = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  protected removeItem(id: number) {
    this.cartService.remove(id);
  }
}
```

## Signal-based Input / Output

```typescript
@Component({ selector: 'app-user-card' })
export class UserCardComponent {
  // Before: @Input() user!: User;
  user = input.required<User>();

  // Before: @Input() size: 'sm' | 'md' = 'md';
  size = input<'sm' | 'md'>('md');

  // Before: @Output() selected = new EventEmitter<User>();
  selected = output<User>();

  protected select() {
    this.selected.emit(this.user());
  }
}
```

## toSignal: Observable → Signal

```typescript
export class ProductListComponent {
  private readonly http  = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  // Automatically subscribes and unsubscribes
  protected readonly categoryId = toSignal(
    this.route.params.pipe(map(p => Number(p['id'])))
  );

  protected readonly products = toSignal(
    toObservable(this.categoryId).pipe(
      switchMap(id => this.http.get<Product[]>(`/api/products?category=${id}`))
    ),
    { initialValue: [] }
  );
}
```

## Common effect mistakes

```typescript
// ❌ Don't use effect to sync two signals — use computed
effect(() => {
  this.localCount.set(this.count());
});

// ❌ Don't conditionally read signals inside effect (tracking is unstable)
effect(() => {
  if (this.isAdmin()) {
    console.log(this.adminData()); // adminData not tracked when isAdmin is false
  }
});

// ✅ Good use cases for effect: DOM manipulation, localStorage, third-party libs
effect(() => {
  localStorage.setItem('theme', this.theme());
});
```
