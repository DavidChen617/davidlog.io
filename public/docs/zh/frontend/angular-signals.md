# Angular Signals 實戰

## 為什麼要用 Signals

Zone.js 的問題：任何非同步操作（setTimeout、HTTP、事件）都會觸發全域 change detection，效能浪費。

Signals 改成**精準追蹤**：只有真正被讀取的 signal 改變，才更新對應的 DOM。

```typescript
// 以前：component 裡任何值改變都可能觸發重新渲染
export class OldComponent {
  count = 0;
  increment() { this.count++; } // Zone.js 會抓到這個變更
}

// 現在：明確宣告響應式狀態
export class NewComponent {
  count = signal(0);
  increment() { this.count.update(v => v + 1); } // 精準更新
}
```

## 三個核心 API

```typescript
import { signal, computed, effect } from '@angular/core';

// signal：可寫的響應式狀態
const count = signal(0);
count.set(5);           // 直接設值
count.update(v => v + 1); // 基於現有值更新

// computed：衍生狀態，自動追蹤依賴
const doubled = computed(() => count() * 2);
// count() 改變時 doubled 自動重算，且有 memoization

// effect：有副作用的響應（謹慎使用）
effect(() => {
  console.log(`Count changed to: ${count()}`);
  // 自動追蹤這裡讀到的所有 signal
});
```

## 實際使用範例

```typescript
@Component({
  selector: 'app-cart',
  template: `
    <div>商品數量：{{ itemCount() }}</div>
    <div>小計：{{ subtotal() | currency:'TWD' }}</div>

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

  protected readonly items = this.cartService.items;         // signal<CartItem[]>
  protected readonly isLoading = this.cartService.isLoading; // signal<boolean>

  protected readonly itemCount = computed(() => this.items().length);
  protected readonly subtotal = computed(() =>
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
  // 以前：@Input() user!: User;
  user = input.required<User>();

  // 以前：@Input() size: 'sm' | 'md' = 'md';
  size = input<'sm' | 'md'>('md');

  // 以前：@Output() selected = new EventEmitter<User>();
  selected = output<User>();

  protected select() {
    this.selected.emit(this.user());
  }
}
```

## toSignal：把 Observable 轉成 Signal

```typescript
export class ProductListComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  // Observable → Signal，自動訂閱/取消訂閱
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

## effect 的常見誤用

```typescript
// ❌ 不要用 effect 來同步兩個 signal 的值
effect(() => {
  this.localCount.set(this.count()); // 應該用 computed 或直接讀原本的
});

// ❌ 不要在 effect 裡做有條件的讀取（追蹤可能不穩定）
effect(() => {
  if (this.isAdmin()) {
    console.log(this.adminData()); // isAdmin 為 false 時 adminData 沒被追蹤
  }
});

// ✅ effect 適合的場景：DOM 操作、localStorage、第三方 library 整合
effect(() => {
  localStorage.setItem('theme', this.theme());
});
```
