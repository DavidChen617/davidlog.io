# Kubernetes Field Notes

## Core concepts at a glance

| Concept | What it is |
|---------|------------|
| Pod | The smallest deployable unit — one or more containers |
| Deployment | Manages replica count and rolling updates |
| Service | Stable network endpoint (Pod IPs change) |
| ConfigMap | Non-sensitive configuration |
| Secret | Sensitive data (base64-encoded, not encrypted) |
| Ingress | HTTP/HTTPS routing rules |

## Basic Deployment

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
          image: myregistry/api:1.2.3   # never use latest in production
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

## Secret management

```bash
# Create a Secret
kubectl create secret generic api-secrets \
  --from-literal=db-password=mysecret \
  --namespace=production

# View (base64 decoded)
kubectl get secret api-secrets -o jsonpath='{.data.db-password}' | base64 -d
```

> In production, use Sealed Secrets or External Secrets Operator. Never commit plaintext Secret YAML to git.

## Rolling updates and rollbacks

```bash
# Update the image
kubectl set image deployment/api api=myregistry/api:1.2.4 -n production

# Watch rollout progress
kubectl rollout status deployment/api -n production

# Immediate rollback if something goes wrong
kubectl rollout undo deployment/api -n production

# Roll back to a specific revision
kubectl rollout undo deployment/api --to-revision=2 -n production
```

## Common debug commands

```bash
# Watch Pod status
kubectl get pods -n production -w

# Tail Pod logs
kubectl logs -f deployment/api -n production

# Shell into a Pod
kubectl exec -it deployment/api -n production -- sh

# Describe Pod (Events section is the most useful)
kubectl describe pod <pod-name> -n production

# Check resource usage
kubectl top pods -n production
```

## Symptoms of misconfigured resource limits

| Symptom | Cause |
|---------|-------|
| Pod keeps getting OOMKilled | memory limit too low |
| Slow responses but no crashes | CPU throttling |
| Pod stuck in Pending | resource requests too high, no node can fit it |

```bash
# Check for CPU throttling
kubectl top pod <pod-name> --containers -n production
```
