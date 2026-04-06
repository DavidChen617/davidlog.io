# 什麼是 IEnumerable

`IEnumerable` 是提供「可逐一列舉資料」能力的介面。
像 `List`、`Array`、`HashSet` 這樣的資料結構都實作了這個介面，
因此可以透過 `foreach` 逐一訪問其中的元素。
`foreach` 其實是一種語法糖，編譯器會將它編譯成透過列舉器 (`IEnumerator`) 呼叫 `MoveNext()` 與 `Current` 來逐步走訪元素。

## 實作 IEnumerable

`GetEnumerator` 會回傳一個 `IEnumerator<int>`，提供實際的迭代邏輯。
`yield return i` 不會一次把所有資料建立出來，而是每次列舉到這裡時才回傳一個值。

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

以下是編譯器編譯出來的核心程式片段，
編譯器會幫 `yield return` 產生一個 `nested` 類別 `<GetEnumerator>d__0`，並實作了 `IEnumerator<int>`，也是真正負責迭代的物件。
`<>1__state` 用來記錄目前迭代到哪個狀態，
`<>2__current` 用來保存目前要回傳的元素，
`<i>5__1` 是原本 `for` 迴圈中的區域變數 `i`，當 `i >= 10` 時會回傳 `false` 結束迭代。

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

平時呼叫時像這樣

```csharp
MyCollection myCollection = new MyCollection();

foreach (int i in myCollection)
{
    Console.WriteLine(i);
}
```

可以看出背後其實就是呼叫 `while` 搭配 `enumerator.MoveNext()` 進行迭代

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

## LINQ 擴充方法的運作原理


```csharp
MyCollection myCollection = new MyCollection();

foreach (int i in myCollection.Where(x => x % 2 == 0))
{
    Console.WriteLine(i);
}
```

以下面的反編譯程式來看，編譯器生成了一個 <>c 類別來承載 Lambda 對應的方法。
`<<Main>$>b__0_0(int x)` 就是 `x => x % 2 == 0` 編譯後對應的方法。
`<>9__0_0` 是快取下來的 `Func<int, bool>` 委派，並會被傳給 `Where` 方法。
`Where` 方法接收到這個委派後，會在原本的資料來源外再包裝一層篩選邏輯，回傳新的 IEnumerable。
真正的篩選並不是在呼叫 `Where` 的當下就完成，而是在後續列舉時才逐步執行。
也就是說，LINQ 的擴充方法並沒有改變 `foreach` 的基本運作方式，而是在原本的 IEnumerable / IEnumerator 機制上再包一層查詢邏輯。

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

## 參考資料
<a href="https://learn.microsoft.com/en-us/dotnet/csharp/iterators#enumeration-sources-with-iterator-methods" target="_blank" rel="noopener noreferrer">Iterators</a>
