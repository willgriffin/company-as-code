# Resource Sizing

| Profile | CPU | RAM | Notes |
| --- | ---: | ---: | --- |
| Minimum | ~11 vCPU | ~24Gi | No runners, no projects, tight lab install |
| Recommended | 36-48 vCPU | 96Gi | Small company baseline with headroom |
| Recommended + 2 runners | +4 vCPU | +8-16Gi | Per two active medium CI jobs |

Storage defaults: PVC/app baseline ~750Gi, Garage starts at 3x500Gi, MinIO starts at 4x250Gi, external S3 is lifecycle-managed and versioned.
