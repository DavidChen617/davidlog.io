# 什麼是 static

## 基本特性

- `static` 類別無法實例化
- `static` 不能被繼承，本質上是 `abstract sealed`
- `static constructor` 不能使用 access modifier，以及不包含參數
- 類別或結構只能有一個靜態建構函式。
- 靜態建構函式無法繼承或多載。
- 無法直接呼叫靜態建構函式，而是由通用語言執行平台 (CLR) 呼叫的。
- `static` 成員屬於類型本身，不屬於任何實例

---

<h2>靜態初始化時機：<a href="https://csharpindepth.com/Articles/BeforeFieldInit" target="_blank"
  rel="noopener noreferrer">beforefieldinit</a></h2>

CLR 在 IL 層級會根據類別是否有靜態建構子，產生不同的初始化策略。

### 沒有靜態建構子

```il
.class public auto ansi beforefieldinit
  Lab1.InstanceClass2
```

有 `beforefieldinit` flag，CLR 可以在**第一次存取靜態成員之前的任意時間點**提早初始化，JIT 最佳化空間較大。

### 有靜態建構子

```il
.class public auto ansi
  Lab1.InstanceClass1
```

沒有 `beforefieldinit` flag，CLR 必須**嚴格在第一次存取靜態成員前的瞬間**才初始化。

| 情況 | `beforefieldinit` | 初始化時機 | JIT 最佳化 |
|---|---|---|---|
| 無靜態建構子 | 有 | 寬鬆，CLR 自由決定 | 較好 |
| 有靜態建構子 | 無 | 嚴格，第一次存取前瞬間 | 受限 |


---

## 靜態欄位初始化器 vs 靜態建構子的執行順序例外

通常的規則是：靜態建構子在任何實例建立之前執行。

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

執行順序：

```
InstanceClass: static constructor
InstanceClass: instance constructor
```

**但有一個例外：如果靜態欄位初始化器本身建立了該類型的實例，實例建構子會先執行，靜態建構子反而後執行。**

```csharp
public class Singleton
{
    // 靜態欄位初始化器呼叫了實例建構子
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

執行順序：

```
Singleton: Execute instance constructor
Singleton: Execute static constructor
```

---

## 靜態建構子的注意事項

### 例外無法恢復

如果靜態建構子（或靜態欄位初始化器）拋出例外，該類型會被標記為初始化失敗。後續任何存取都會拋出 `TypeInitializationException`，且**無法恢復**。

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

執行結果：

```
BrokenClass: static constructor running...   # 只跑一次
[Attempt 1] TypeInitializationException: Static constructor failed!
[Attempt 2] TypeInitializationException: Static constructor failed!   # .cctor 沒有再跑
[Attempt 3] TypeInitializationException: Static constructor failed!   # 但還是繼續炸
```

用 `dotnet-dump` 可以在 heap 上驗證：

```
> name2ee Lab1.dll Lab1.BrokenClass
MethodTable: 0000000108c6f7c0

> dumpheap -type System.TypeInitializationException
         Address               MT           Size
    0003000146f0     000108c6d630            128

Statistics:
          MT Count TotalSize Class Name
000108c6d630     1       128 System.TypeInitializationException
Total 1 objects, 128 bytes   ← 只有 1 個，CLR 緩存了這個例外物件

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
    Lab1.dll!Lab1.BrokenClass..cctor()   ← .cctor 是靜態建構子的 IL 名稱
```

CLR 把原始例外緩存在 heap 上，後續存取直接拿緩存物件重新包成 `TypeInitializationException` 拋出，靜態建構子不會再跑。這個狀態在 AppDomain 的生命週期內無法重置。

### 執行緒安全

CLR 保證靜態初始化只執行一次，即使多執行緒同時存取也不會重複初始化。

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

執行結果：

```
Singleton: Execute Instance constructor
Singleton: Execute Static constructor
[Thread 5] HashCode: 4032828
[Thread 4] HashCode: 4032828
```

兩條執行緒的 HashCode 相同，代表拿到的是同一個實例，且初始化訊息只出現一次。

## 參考資料

- [Static Classes and Static Class Members - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members)
- [Static Constructors - Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors)