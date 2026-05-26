# Backup and DR

Data flow:

```text
CNPG WAL/base backups -> Garage -> external versioned S3
Velero cluster/PVC backups -> Garage
Velero weekly/monthly archive -> external versioned S3
MinIO app data -> Garage -> external versioned S3
Git/SOPS -> desired state + encrypted secrets
```

Garage replication gives fast multi-site copies. External S3 provides immutable/versioned long-term recovery.
