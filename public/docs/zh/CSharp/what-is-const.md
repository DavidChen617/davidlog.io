# 什麼是 const

## 基本特性

- `const` 是編譯時就知道的不可變值。
- `const` 宣告時必須給初始值。
- 只有 <a href="https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/built-in-types" target="_blank" rel="noopener noreferrer">內建型別</a>（包含 `enum` ）可宣告為 `const`，使用者自訂 `class`、`struct`、`array` 等都不能是 `const`。
- 參考型別中只有 `string` 是例外，其他 reference type 只能是 `null`。
- `const` 修飾詞只能用於欄位與區域變數，不能用於方法、屬性、事件。
- `const` 無法透過參考傳遞。
- `const` 欄位在定義端會被編譯成 `static literal`，並記錄在 metadata 的 `Constant` table；而在使用處，編譯器通常會直接把常值 inline 到 IL 中。

## const 成員宣告

```csharp
public class Foo
{
    public const int ConstInt = 10;
    public const long ConstLong = 1_000;
}
```

可以看到實際被編譯成 `static literal`：

```il
.field public static literal int32 ConstInt = int32(10) // 0x0000000a
.field public static literal int64 ConstLong = int64(1000) // 0x00000000000003e8
```

可以看到在使用 `const` 時，編譯器會直接將常數值展開為整數 `10`，並以 IL 指令推入 evaluation stack，而不是額外讀取類別成員。

```csharp
Console.WriteLine(Foo.ConstInt);
```

```il
IL_0000: ldc.i4.s     10 // 0x0a
IL_0002: call         void [System.Console]System.Console::WriteLine(int32)
IL_0007: nop
```

## Constant Table

編譯器在編譯 `const` 欄位時，會將常數值寫入輸出 Assembly 的 metadata `Constant` table 中，可透過 <a href="https://linux.die.net/man/1/monodis" target="_blank" rel="noopener noreferrer">monodis</a> 命令查看。

```bash
monodis --constant /Users/chendavid/workspace/sandbox/const-readonly-deep-dive/Lab2/bin/Debug/net10.0/Lab2.dll
Constant Table (1..2)
1: Parent= Field: 1 int32(0x0000000a)
2: Parent= Field: 2 int64(0x00000000000003e8)
```

## Reference Type 限制

Reference type 中，只有 `string` 可以是非 `null` 的 `const`。

```csharp
public class ReferenceTypeConstant
{
    public const string S = nameof(S);
    public const object? Obj = null;
    public const dynamic? Dynamic = Obj;
    public const FooDelegate? Delegate = null;
}

public delegate void FooDelegate(string s);
```

```terminal
monodis --constant /Users/chendavid/workspace/sandbox/const-readonly-deep-dive/Lab2/bin/Debug/net10.0/Lab2.dll
Constant Table (1..6)
1: Parent= Field: 1 int32(0x0000000a)
2: Parent= Field: 2 int64(0x00000000000003e8)
3: Parent= Field: 3 "S"
4: Parent= Field: 4 nullref
5: Parent= Field: 5 nullref
6: Parent= Field: 6 nullref
```

## 使用 const 時的 IL

在這個例子中，以下呼叫會產生相同的常值載入 IL。

```csharp
Console.WriteLine(Foo.ConstInt);
Console.WriteLine(10);
Console.WriteLine(ReferenceTypeConstant.S);
Console.WriteLine("S");
```

以下為對應的 IL：

```il
// [4 1 - 4 33]
IL_0000: ldc.i4.s     10 // 0x0a
IL_0002: call         void [System.Console]System.Console::WriteLine(int32)
IL_0007: nop

// [5 1 - 5 23]
IL_0008: ldc.i4.s     10 // 0x0a
IL_000a: call         void [System.Console]System.Console::WriteLine(int32)
IL_000f: nop

// [6 1 - 6 44]
IL_0010: ldstr        "S"
IL_0015: call         void [System.Console]System.Console::WriteLine(string)
IL_001a: nop

// [7 1 - 7 24]
IL_001b: ldstr        "S"
IL_0020: call         void [System.Console]System.Console::WriteLine(string)
IL_0025: nop
```

## 無法透過參考傳遞

```csharp
public class Foo  
{  
    public const int ConstInt = 10;  
    public static void F(ref int a) => a *= a;
}
```

```csharp
Foo.F(ref Foo.ConstInt); // Constant 'ConstInt' is immutable. 'ref' argument must be an assignable variable, field, or an array element
```

## 參考資料

- <a href="https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constants" target="_blank" rel="noopener noreferrer">Constants (C# Programming Guide)</a>
- <a href="https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/const" target="_blank" rel="noopener noreferrer">The const keyword</a>
