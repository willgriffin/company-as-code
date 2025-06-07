# Dependency Model Test Scenarios

## Before (Staged Dependencies)
```
Stage 1: Core      → Stage 2: Controllers → Stage 3: Services → Stage 4: Applications
(traefik,          → (cloudnativepg,     → (keycloak)        → (mattermost,
 cert-manager,     →  redis-operator,    →                   →  nextcloud,
 external-dns)     →  keycloak-operator) →                   →  mailu)
```

**Problems:**
- If Keycloak fails → ALL applications fail
- If Redis operator fails → ALL applications fail (even Mailu that doesn't use Redis)
- Must wait for ALL controllers before ANY application starts

## After (Granular Dependencies)
```
traefik ────────────────────────→ mattermost
  │                                     ↑
  └─→ cert-manager-post-deploy ─────────┤
          ↑                             │
          └─ cert-manager-deploy        │
                                        │
cloudnativepg ──────────────────────────┤
  │                                     │
  └─→ keycloak ←─ keycloak-operator ────┘
      
redis-operator ─────────────────→ nextcloud
  │                                   ↑
  └─→ (shares traefik, cert-manager, keycloak)

(mailu only needs traefik + cert-manager + keycloak)
```

**Benefits:**
- Redis failure only affects Nextcloud
- Keycloak failure only affects apps that use it
- Mailu can deploy without waiting for database operators
- Partial deployments possible

## Test Cases

### Scenario 1: Redis Operator Fails
**Before:** ALL applications blocked
**After:** Only Nextcloud blocked, Mattermost + Mailu deploy normally

### Scenario 2: Fast Deployment Test
**Before:** Must wait for all 4 stages sequentially
**After:** Mailu deploys as soon as traefik + cert-manager ready (much faster)

### Scenario 3: Selective Deployment
**Before:** Can't deploy just email without databases
**After:** Can deploy just Mailu by commenting out other apps

### Scenario 4: OAuth Disabled
**Before:** Still waits for Keycloak in services stage
**After:** Can remove Keycloak dependency entirely from app configs