"""Stdlib-only contracts for the generic org-as-code Hermes consumer package."""

from __future__ import annotations

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OPERATOR = ROOT / "manifests/system/org-as-code-operator"
HERMES = ROOT / "manifests/tenants/my-tenant/company-services/hermes"
TEMPLATE = ROOT / "manifests/shared/templates/hermes-agent"
APPLICATIONS = ROOT / "manifests/clusters/my-cluster/applications.yaml"
TENANT = ROOT / "manifests/tenants/my-tenant/kustomization.yaml"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class HermesOperatorContractTests(unittest.TestCase):
    def test_chart_is_the_signed_digest_pinned_v012_release(self) -> None:
        source = read(OPERATOR / "chart-source.yaml")
        self.assertIn("url: oci://ghcr.io/willgriffin/charts/org-as-code", source)
        self.assertIn(
            "digest: sha256:03932fdb6468f8f26ef58867ec3a7b5887dcfe4e6da22c7e950630accf8d6813",
            source,
        )
        self.assertIn("# Signed v0.1.2 OCI chart", source)
        self.assertIn("provider: cosign", source)
        self.assertIn("secretRef:\n    name: org-as-code-registry", source)
        self.assertIn("issuer: https://token.actions.githubusercontent.com", source)
        self.assertRegex(
            source,
            r"subject: '\^https://github\.com/willgriffin/org-as-code/.github/workflows/release\.yaml@refs/",
        )

    def test_operator_has_generic_safe_gates(self) -> None:
        release = read(OPERATOR / "helm-release.yaml")
        self.assertIn("managedNamespaces:\n      - org-example", release)
        self.assertIn("activeNamespaces: []", release)
        self.assertIn("directoryApply: false", release)
        self.assertIn("workloadApply: false", release)
        self.assertIn("imagePullSecrets:\n      - name: org-as-code-registry", release)
        self.assertIn("name: org-as-code-system", release)
        self.assertIn("create: false", release)
        for unsupported in (
            "emitNamespaceGates",
            "emitTenantRole",
            "emitClusterRoleBinding",
            "emitProviderEnv",
        ):
            self.assertNotIn(unsupported, release)

    def test_private_oci_source_uses_docker_registry_credentials(self) -> None:
        source_secret = read(OPERATOR / "source-registry.secret.template.yaml")
        self.assertIn("type: kubernetes.io/dockerconfigjson", source_secret)
        self.assertIn(".dockerconfigjson: TEMPLATE_GHCR_DOCKER_CONFIG_JSON", source_secret)
        self.assertNotIn("username:", source_secret)
        self.assertNotIn("password:", source_secret)

    def test_operator_and_example_are_independently_suspended(self) -> None:
        applications = read(APPLICATIONS)
        self.assertIn("name: org-as-code-operator", applications)
        self.assertIn("name: hermes-example", applications)
        self.assertEqual(2, applications.count("suspend: true"))
        self.assertEqual(2, applications.count("provider: sops"))
        self.assertEqual(2, applications.count("name: sops-age"))
        self.assertIn("- name: org-as-code-operator", applications)
        self.assertNotIn("company-services/hermes", read(TENANT))

    def test_consumer_manifests_have_no_production_identities_or_legacy_runtime(self) -> None:
        contents = "\n".join(
            read(path)
            for directory in (HERMES, TEMPLATE)
            for path in directory.rglob("*.yaml")
        )
        for literal in (
            "happyvertical",
            "org-willgriffin",
            "org-happyvertical",
            "org-anytown",
            "TEMPLATE_DOMAIN",
            "my-tenant-hermes",
            "hermes-gateway:0.1.0",
            "hermes-workspace:0.1.0",
        ):
            with self.subTest(literal=literal):
                self.assertNotIn(literal, contents)
        for legacy_kind in ("kind: Deployment", "kind: PersistentVolumeClaim", "kind: Service", "kind: Ingress"):
            with self.subTest(legacy_kind=legacy_kind):
                self.assertNotIn(legacy_kind, contents)

    def test_consumer_uses_released_crd_kinds_and_fields(self) -> None:
        organization = read(HERMES / "organization.yaml")
        self.assertIn("apiVersion: org.willgriffin.dev/v1alpha1", organization)
        self.assertIn("kind: Organization", organization)
        self.assertIn("namespace: org-example", organization)
        self.assertRegex(organization, r"(?m)^  domains:\n\s+- example\.invalid$")

        agent = read(HERMES / "agent.yaml")
        self.assertIn("kind: Agent", agent)
        self.assertIn("activate: false", agent)
        for field in ("identity:", "contractRef:", "memory:", "envPolicy:"):
            with self.subTest(field=field):
                self.assertIn(field, agent)

        workload = read(HERMES / "workload.yaml")
        self.assertIn("apiVersion: hermes.willgriffin.dev/v1alpha1", workload)
        self.assertIn("kind: HermesWorkload", workload)
        self.assertIn("namespace: org-example", workload)
        self.assertIn("replicas: 0", workload)
        self.assertIn("suspend: true", workload)
        self.assertIn("persistence: durable", workload)
        self.assertIn("secrets:", workload)
        self.assertIn("name: hermes-runtime-secrets", workload)
        self.assertIn("optional: true", workload)
        self.assertIn("@sha256:TEMPLATE_HERMES_RUNTIME_DIGEST", workload)
        for field in ("image:", "resources:", "scheduling:", "egress:"):
            with self.subTest(field=field):
                self.assertIn(field, workload)

    def test_template_records_safe_workload_contract(self) -> None:
        template = read(TEMPLATE / "placeholder.yaml")
        self.assertIn("kind: HermesWorkload", template)
        self.assertIn('safeReplicas: "0"', template)
        self.assertIn('safeSuspend: "true"', template)
        self.assertIn('safeActivate: "false"', template)
        self.assertRegex(template, r"supportedFields: .*image.*secrets.*resources.*scheduling.*egress")


if __name__ == "__main__":
    unittest.main()
