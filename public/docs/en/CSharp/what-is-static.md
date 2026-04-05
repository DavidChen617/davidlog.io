# What is static

## Basic Characteristics

- A `static` class cannot be instantiated .
- A `static` class cannot be inherited — it is essentially `abstract sealed` .
- A `static constructor` cannot have an access modifier and takes no parameters .
- A class or struct can only have one static constructor .
- Static constructors cannot be inherited or overloaded .
- Static constructors cannot be called directly — they are invoked by the Common Language Runtime (CLR) .
- `static` members belong to the type itself, not to any instance .

---

<h2>Static Initialization Timing: <a href="https://csharpindepth.com/Articles/BeforeFieldInit" target="_blank"
  rel="noopener noreferrer">beforefieldinit</a></h2>

At the IL level, the CLR applies different initialization strategies depending on whether a class has a static constructor.

### Without a Static Constructor

```il
.class public auto ansi beforefieldinit
  Lab1.InstanceClass2
```

With the `beforefieldinit` flag, the CLR is free to initialize the type **at any point before the first access to a static member**, giving the JIT more room for optimization.

### With a Static Constructor

```il
.class public auto ansi
  Lab1.InstanceClass1
```

Without the `beforefieldinit` flag, the CLR must initialize the type **strictly at the moment just before the first access to a static member**.

| Case | `beforefieldinit` | Initialization Timing | JIT Optimization |
|---|---|---|---|
| No static constructor | Yes | Relaxed — CLR decides freely | Better |
| Has static constructor | No | Strict — just before first access | Limited |


---

## Execution Order Exception: Static Field Initializers vs. Static Constructors

The general rule is: a static constructor runs before any instance is created.

```CSharp
public class InstanceClass  
{  
    public InstanceClass()  
    {        
	    Console.WriteLine("InstanceClass: instance constructor");  
    }    
    static InstanceClass()  
    {        
	    Console.WriteLine("InstanceClass: static constructor");    
    }  
}
```

Execution order:

```
InstanceClass: static constructor
InstanceClass: instance constructor
```

**However, there is one exception: if a static field initializer creates an instance of that same type, the instance constructor runs first, and the static constructor runs afterward.**

```csharp
public class Singleton
{
    // Static field initializer calls the instance constructor
    private static Singleton _instance = new Singleton();

    private Singleton()
    {
        Console.WriteLine("Singleton: Executes static constructor.");
    }

    static Singleton()
    {
        Console.WriteLine("Singleton: Executes instance constructor.");
    }

    public static Singleton Instance => _instance;
}
```

Execution order:

```
Singleton: Execute instance constructor
Singleton: Execute static constructor
```

---

## Caveats for Static Constructors

### Exceptions Are Unrecoverable

If a static constructor (or static field initializer) throws an exception, the type is marked as failed to initialize. Every subsequent access will throw a `TypeInitializationException`, and this state **cannot be recovered**.

```csharp
public class BrokenClass
{
    static BrokenClass()
    {
        Console.WriteLine("BrokenClass: static constructor running...");
        throw new Exception("Static constructor failed!");
    }

    public static void DoSomething() { }
}

for (int i = 1; i <= 3; i++)
{
    try
    {
        BrokenClass.DoSomething();
    }
    catch (TypeInitializationException ex)
    {
        Console.WriteLine($"[Attempt {i}] {ex.GetType().Name}: {ex.InnerException?.Message}");
    }
}
```

Output:

```
BrokenClass: static constructor running...   # runs only once
[Attempt 1] TypeInitializationException: Static constructor failed!
[Attempt 2] TypeInitializationException: Static constructor failed!   # .cctor does not run again
[Attempt 3] TypeInitializationException: Static constructor failed!   # but it keeps throwing
```

You can verify this on the heap with `dotnet-dump`:

```
> name2ee Lab1.dll Lab1.BrokenClass
MethodTable: 0000000108c6f7c0

> dumpheap -type System.TypeInitializationException
         Address               MT           Size
    0003000146f0     000108c6d630            128

Statistics:
          MT Count TotalSize Class Name
000108c6d630     1       128 System.TypeInitializationException
Total 1 objects, 128 bytes   ← only 1 object — CLR cached this exception

> printexception 00000003000146f0
Exception object: 00000003000146f0
Exception type:   System.TypeInitializationException
Message:          The type initializer for 'Lab1.BrokenClass' threw an exception.
InnerException:   System.Exception, Use printexception 0000000300014630 to see more.
StackTrace (generated):
    SP               IP               Function
    000000016AE590C0 0000000107D9FD5C System.Private.CoreLib.dll!System.Runtime.CompilerServices.InitHelpers.InitClassSlow(System.Runtime.CompilerServices.MethodTable*)+0x3c
    000000016AE59190 0000000108BE428C Lab1.dll!Lab1.BrokenClass.DoSomething()+0x3c
    000000016AE591A0 0000000108BE1CDC Lab1.dll!Program.<Main>$(System.String[])+0x8c

> printexception 0000000300014630
Exception object: 0000000300014630
Exception type:   System.Exception
Message:          Static constructor failed!
StackTrace (generated):
    Lab1.dll!Lab1.BrokenClass..cctor()   ← .cctor is the IL name for a static constructor
```

The CLR caches the original exception on the heap. On subsequent accesses, it reuses the cached object and wraps it in a new `TypeInitializationException` — the static constructor never runs again. This state cannot be reset within the AppDomain's lifetime.

### Thread Safety

The CLR guarantees that static initialization runs exactly once, even when multiple threads access the type simultaneously.

```csharp
new Thread(delegate()
{
    var t1Instance = Singleton.Instance;
    Console.WriteLine($"[Thread {Environment.CurrentManagedThreadId}] HashCode: {t1Instance.GetHashCode()}");
}).Start();

new Thread(delegate()
{
    var t2Instance = Singleton.Instance;
    Console.WriteLine($"[Thread {Environment.CurrentManagedThreadId}] HashCode: {t2Instance.GetHashCode()}");
}).Start();
```

Output:

```
Singleton: Execute Instance constructor
Singleton: Execute Static constructor
[Thread 5] HashCode: 4032828
[Thread 4] HashCode: 4032828
```

Both threads share the same `HashCode`, confirming they received the same instance, and the initialization messages appear only once.

## References

- [Static Classes and Static Class Members - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members)
- [Static Constructors - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors)
