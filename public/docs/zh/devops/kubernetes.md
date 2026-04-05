# Kubernetes 實戰筆記

## 核心概念對照

| K8s 概念 | 對應到 |
|----------|--------|
| Pod | 一個或多個容器的執行單位 |
| Deployment | 管理 Pod 副本數、滾動更新 |
| Service | 固定的網路入口（Pod IP 會變） |
| ConfigMap | 非機密設定 |
| Secret | 機密資料（base64 編碼，非加密） |
| Ingress | HTTP/HTTPS 路由規則 |

## 基本 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry/api:1.2.3   # 正式環境不要用 latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: db-password
```

## Secret 管理

```bash
# 建立 Secret
kubectl create secret generic api-secrets \
  --from-literal=db-password=mysecret \
  --namespace=production

# 查看（base64 解碼）
kubectl get secret api-secrets -o jsonpath='{.data.db-password}' | base64 -d
```

> 正式環境建議搭配 Sealed Secrets 或 External Secrets Operator，不要把明文 Secret yaml 存進 git。

## 滾動更新與回滾

```bash
# 更新 image
kubectl set image deployment/api api=myregistry/api:1.2.4 -n production

# 查看更新狀態
kubectl rollout status deployment/api -n production

# 有問題立即回滾
kubectl rollout undo deployment/api -n production

# 回滾到指定版本
kubectl rollout undo deployment/api --to-revision=2 -n production
```

## 常用 Debug 指令

```bash
# 查看 Pod 狀態
kubectl get pods -n production -w

# 查看 Pod log
kubectl logs -f deployment/api -n production

# 進入 Pod
kubectl exec -it deployment/api -n production -- sh

# 查看 Pod 詳細資訊（Events 最有用）
kubectl describe pod <pod-name> -n production

# 查看資源使用
kubectl top pods -n production
```

## Resource Request/Limit 設太小的症狀

| 症狀 | 原因 |
|------|------|
| Pod 一直 OOMKilled | memory limit 太小 |
| 回應很慢但沒掛 | cpu limit throttling |
| Pod Pending 很久 | request 太高，節點排不下 |

```bash
# 查看 throttling
kubectl top pod <pod-name> --containers -n production
```
