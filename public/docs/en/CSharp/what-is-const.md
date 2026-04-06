# What is const

## Basic Characteristics

- `const` represents an immutable value known at compile time.
- `const` must be assigned an initial value at declaration.
- Only <a href="https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/built-in-types" target="_blank" rel="noopener noreferrer">built-in types</a> (including `enum`) can be declared as `const`. User-defined `class`, `struct`, `array`, and similar types cannot.
- Among reference types, only `string` is an exception — all other reference types can only be `null`.
- The `const` modifier applies only to fields and local variables, not to methods, properties, or events.
- `const` values cannot be passed by reference.
- A `const` field is compiled as a `static literal` on the definition side and recorded in the metadata `Constant` table. At usage sites, the compiler typically inlines the literal value directly into the IL.

## Declaring const Members

```csharp
public class Foo
{
    public const int ConstInt = 10;
    public const long ConstLong = 1_000;
}
```

As we can see, these are compiled into `static literal` fields:

```il
.field public static literal int32 ConstInt = int32(10) // 0x0000000a
.field public static literal int64 ConstLong = int64(1000) // 0x00000000000003e8
```

When a `const` is used, the compiler expands the constant value directly — pushing the integer `10` onto the evaluation stack via an IL instruction — rather than reading from the class member.

```csharp
Console.WriteLine(Foo.ConstInt);
```

```il
IL_0000: ldc.i4.s     10 // 0x0a
IL_0002: call         void [System.Console]System.Console::WriteLine(int32)
IL_0007: nop
```

## Constant Table

When compiling `const` fields, the compiler writes their values into the `Constant` table of the output assembly's metadata. You can inspect this using the <a href="https://linux.die.net/man/1/monodis" target="_blank" rel="noopener noreferrer">monodis</a> command.

```bash
monodis --constant /Users/chendavid/workspace/sandbox/const-readonly-deep-dive/Lab2/bin/Debug/net10.0/Lab2.dll
Constant Table (1..2)
1: Parent= Field: 1 int32(0x0000000a)
2: Parent= Field: 2 int64(0x00000000000003e8)
```

## Reference Type Restrictions

Among reference types, only `string` can be a non-`null` `const`.

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

## IL When Using const

In this example, the following calls all produce identical literal-loading IL.

```csharp
Console.WriteLine(Foo.ConstInt);
Console.WriteLine(10);
Console.WriteLine(ReferenceTypeConstant.S);
Console.WriteLine("S");
```

The corresponding IL:

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

## Cannot Be Passed by Reference

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

## References

- <a href="https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constants" target="_blank" rel="noopener noreferrer">Constants (C# Programming Guide)</a>
- <a href="https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/const" target="_blank" rel="noopener noreferrer">The const keyword</a>
