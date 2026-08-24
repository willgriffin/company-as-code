"""Generic safety contracts for the reusable Kubernetes template.

The tests intentionally use only Python's standard library.  YAML semantics
are validated by the repository's command-line checks; these contracts focus
on invariants that are useful even when a Python YAML package is unavailable.
"""

from __future__ import annotations

import hashlib
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = ROOT / "manifests"
CI_SCRIPTS = ROOT / "scripts" / "ci"
SOURCE_IDENTITIES = re.compile(r"(?i)(?<![a-z0-9_-])(happyvertical|willgriffin)(?![a-z0-9_-])")
RESOURCE_LINE = re.compile(r"^\s+-\s+([^\s#]+)\s*(?:#.*)?$")


def _is_allowed_dependency_identity(path: Path, line: str) -> bool:
    """Allow source identities only in generated upstream dependency bundles."""

    relative = path.relative_to(ROOT).as_posix()
    generated_dependency = path.parent.name == "flux-system" and path.name in {
        "gotk-components.yaml",
        "image-components.yaml",
    }
    if generated_dependency and re.search(r"(?:github\.com|ghcr\.io)/happyvertical/", line):
        return True

    if relative == "manifests/system/org-as-code-operator/chart-source.yaml":
        return bool(
            re.search(
                r"(?:ghcr\.io/willgriffin/charts/org-as-code|github\.com/willgriffin/org-as-code/\.github/workflows/release\.yaml)",
                line,
            )
        )

    expected_hermes_api = {
        "manifests/shared/templates/hermes-agent/placeholder.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/agent.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/organization.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/workload.yaml",
    }
    return relative in expected_hermes_api and bool(re.search(r"willgriffin\.dev/", line))


class TemplateContractTests(unittest.TestCase):
    def test_required_validation_scripts_are_executable(self) -> None:
        for name in (
            "check-plaintext-secrets.sh",
            "check-template-literals.sh",
            "render-kustomizations.sh",
            "run-contract-tests.sh",
        ):
            with self.subTest(script=name):
                script = CI_SCRIPTS / name
                self.assertTrue(script.is_file(), f"missing validation script: {script}")
                self.assertTrue(script.stat().st_mode & 0o111, f"not executable: {script}")

    def test_every_manifest_kustomization_resource_exists(self) -> None:
        kustomizations = sorted(MANIFESTS.rglob("kustomization.yaml"))
        self.assertTrue(kustomizations, "manifest tree has no Kustomizations")

        for kustomization in kustomizations:
            for match in RESOURCE_LINE.finditer(kustomization.read_text(encoding="utf-8")):
                resource = match.group(1)
                if resource.startswith(("http://", "https://", "oci://")):
                    continue
                target = (kustomization.parent / resource).resolve()
                with self.subTest(kustomization=kustomization, resource=resource):
                    self.assertTrue(
                        target.exists(),
                        f"Kustomization resource does not exist: {kustomization}: {resource}",
                    )

    def test_kustomizations_do_not_fetch_remote_cluster_manifests(self) -> None:
        for kustomization in MANIFESTS.rglob("kustomization.yaml"):
            content = kustomization.read_text(encoding="utf-8")
            with self.subTest(kustomization=kustomization):
                self.assertNotRegex(content, r"(?m)^\s*-\s+https?://")

    def test_vendored_operator_artifacts_match_reviewed_digests(self) -> None:
        artifacts = {
            MANIFESTS / "system/gateway-api/standard-install-v1.3.0.yaml": (
                "78796d5c51450fc55d8dc8092ba8137f8c807982d7508d7875d5c537a24082b9"
            ),
            MANIFESTS / "system/rabbitmq-operator/cluster-operator-v2.22.5.yaml": (
                "f7d3a549a2514ea3de3a91b231a969dbfee0520f467d2fbe91821b9388f48dbe"
            ),
        }
        for artifact, expected in artifacts.items():
            with self.subTest(artifact=artifact):
                self.assertEqual(expected, hashlib.sha256(artifact.read_bytes()).hexdigest())

    def test_node_exporter_is_not_bound_to_node_network_ports(self) -> None:
        daemonset = (MANIFESTS / "system/node-exporter/daemonset.yaml").read_text(
            encoding="utf-8"
        )
        self.assertNotIn("hostNetwork:", daemonset)
        self.assertNotIn("hostPID:", daemonset)
        self.assertNotIn("hostPort:", daemonset)

    def test_secret_templates_are_not_deployable_kustomization_resources(self) -> None:
        for kustomization in MANIFESTS.rglob("kustomization.yaml"):
            for line in kustomization.read_text(encoding="utf-8").splitlines():
                if ".secret.template.yaml" in line:
                    self.fail(f"secret template is directly deployable: {kustomization}: {line}")

    def test_template_manifests_do_not_contain_source_organization_literals(self) -> None:
        violations: list[str] = []
        for path in MANIFESTS.rglob("*.yaml"):
            for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if SOURCE_IDENTITIES.search(line) and not _is_allowed_dependency_identity(path, line):
                    violations.append(f"{path}:{line_number}: {line}")
        self.assertEqual([], violations, "source organization literals found:\n" + "\n".join(violations))

    def test_secret_templates_use_placeholders_instead_of_ciphertext(self) -> None:
        templates = sorted(MANIFESTS.rglob("*.secret.template.yaml"))
        self.assertTrue(templates, "manifest tree has no secret templates")
        for template in templates:
            content = template.read_text(encoding="utf-8")
            with self.subTest(template=template):
                self.assertNotIn("ENC[AES256_GCM", content)
                self.assertRegex(content, r"(?i)change_me|template[_-]?(?:domain|github)|template_[a-z]")


if __name__ == "__main__":
    unittest.main()
