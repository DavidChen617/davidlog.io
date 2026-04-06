# What is IEnumerable

`IEnumerable` is an interface that provides the ability to iterate over a sequence of data.
Data structures like `List`, `Array`, and `HashSet` all implement this interface,
which is why you can use `foreach` to access their elements one by one.
`foreach` is actually syntactic sugar — the compiler translates it into calls to `MoveNext()` and `Current` on an enumerator (`IEnumerator`).

## Implementing IEnumerable

`GetEnumerator` returns an `IEnumerator<int>` that contains the actual iteration logic.
`yield return i` doesn't build all the data up front — it produces one value at a time, each time the enumerator advances.

```csharp
public class MyCollection : IEnumerable<int>  
{  
    public IEnumerator<int> GetEnumerator()  
    {        
	    for (int i = 0; i < 10; i++)  
        {            
	        yield return i;  
        }    
    }
    
    IEnumerator IEnumerable.GetEnumerator()  
    {
        return GetEnumerator();  
    }
}
```

Here's the core of what the compiler generates under the hood.
For each `yield return`, the compiler creates a nested class `<GetEnumerator>d__0` that implements `IEnumerator<int>` — this is the object that actually does the iterating.
`<>1__state` tracks which iteration state the enumerator is currently in.
`<>2__current` holds the value to be returned at the current step.
`<i>5__1` is the local variable `i` from the original `for` loop. When `i >= 10`, `MoveNext()` returns `false` and iteration ends.

```csharp
public class MyCollection : IEnumerable<int>, IEnumerable
{
  [NullableContext(1)]
  [IteratorStateMachine(typeof (MyCollection.<GetEnumerator>d__0))]
  public IEnumerator<int> GetEnumerator()
  {
    MyCollection.<GetEnumerator>d__0 enumerator = new MyCollection.<GetEnumerator>d__0(0);
    enumerator.<>4__this = this;
    return (IEnumerator<int>) enumerator;
  }
  
  ......
  
  [CompilerGenerated]
  private sealed class <GetEnumerator>d__0 : IEnumerator<int>, IEnumerator, IDisposable
  {
    private int <>1__state;
    private int <>2__current;
    public MyCollection <>4__this;
    private int <i>5__1;
    
    .....
    
    bool IEnumerator.MoveNext()
    {
      int num = this.<>1__state;
      if (num != 0)
      {
        if (num != 1)
          return false;
        this.<>1__state = -1;
        ++this.<i>5__1;
      }
      else
      {
        this.<>1__state = -1;
        this.<i>5__1 = 0;
      }
      if (this.<i>5__1 >= 10)
        return false;
      this.<>2__current = this.<i>5__1;
      this.<>1__state = 1;
      return true;
    }
    
    ......
  }
}
```

In typical usage it looks like this:

```csharp
MyCollection myCollection = new MyCollection();

foreach (int i in myCollection)
{
    Console.WriteLine(i);
}
```

Which is really just a `while` loop calling `enumerator.MoveNext()` behind the scenes:

```csharp
IEnumerator<int> enumerator = new MyCollection().GetEnumerator();
try
{
  while (enumerator.MoveNext())
    Console.WriteLine(enumerator.Current);
}
finally
{
  if (enumerator != null)
    enumerator.Dispose();
}
```

## How LINQ Extension Methods Work


```csharp
MyCollection myCollection = new MyCollection();

foreach (int i in myCollection.Where(x => x % 2 == 0))
{
    Console.WriteLine(i);
}
```

Looking at the decompiled output below, the compiler generates a `<>c` class to hold the method corresponding to the lambda.
`<<Main>$>b__0_0(int x)` is the compiled form of `x => x % 2 == 0`.
`<>9__0_0` is a cached `Func<int, bool>` delegate that gets passed to the `Where` method.
When `Where` receives this delegate, it wraps the original data source with a filtering layer and returns a new `IEnumerable`.
The actual filtering doesn't happen when `Where` is called — it happens lazily as the sequence is enumerated.
In other words, LINQ extension methods don't change how `foreach` fundamentally works. They simply layer query logic on top of the existing `IEnumerable` / `IEnumerator` mechanism.

```csharp
[CompilerGenerated]
internal class Program
{
  private static void <Main>$(string[] args)
  {
    IEnumerator<int> enumerator = new MyCollection().Where<int>(Program.<>c.<>9__0_0 ?? (Program.<>c.<>9__0_0 = new Func<int, bool>((object) Program.<>c.<>9, __methodptr(<<Main>$>b__0_0)))).GetEnumerator();
    try
    {
      while (enumerator.MoveNext())
        Console.WriteLine(enumerator.Current);
    }
    finally
    {
      if (enumerator != null)
        enumerator.Dispose();
    }
  }

  [CompilerGenerated]
  [Serializable]
  private sealed class <>c
  {
    public static readonly Program.<>c <>9;
    public static Func<int, bool> <>9__0_0;

    static <>c()
    {
      Program.<>c.<>9 = new Program.<>c();
    }

    public <>c()
    {
      base..ctor();
    }

    internal bool <<Main>$>b__0_0(int x)
    {
      return x % 2 == 0;
    }
  }
}
```

## References
<a href="https://learn.microsoft.com/en-us/dotnet/csharp/iterators#enumeration-sources-with-iterator-methods" target="_blank" rel="noopener noreferrer">Iterators</a>
