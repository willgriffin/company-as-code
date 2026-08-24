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


def _kustomization_resources(content: str) -> list[str]:
    """Return only top-level entries from a Kustomization resources block."""

    resources: list[str] = []
    in_resources = False
    for line in content.splitlines():
        if line == "resources:":
            in_resources = True
            continue
        if not in_resources:
            continue
        if line and not line.startswith((" ", "\t")):
            break
        match = re.match(r"^\s+-\s+([^\s#]+)\s*(?:#.*)?$", line)
        if match:
            resources.append(match.group(1))
    return resources


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
                r"(?:ghcr\.io/willgriffin/charts/org-as-code|github\\\.com/willgriffin/org-as-code/\\\.github/workflows/release\\\.yaml)",
                line,
            )
        )

    expected_hermes_api = {
        "manifests/shared/templates/hermes-agent/placeholder.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/agent.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/organization.yaml",
        "manifests/tenants/my-tenant/company-services/hermes/secrets.secret.template.yaml",
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

    def test_tool_cache_key_sanitizes_multi_tool_inputs(self) -> None:
        action = (ROOT / ".github/actions/setup-tools/action.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("tools_cache_key=${REQUESTED_TOOLS//,/-}", action)
        self.assertIn("tools_cache_key=${tools_cache_key}", action)
        self.assertIn("steps.versions.outputs.tools_cache_key", action)
        self.assertNotIn("hashFiles('tool-versions.txt') }}-${{ inputs.tools", action)

    def test_every_manifest_kustomization_resource_exists(self) -> None:
        kustomizations = sorted(MANIFESTS.rglob("kustomization.yaml"))
        self.assertTrue(kustomizations, "manifest tree has no Kustomizations")

        for kustomization in kustomizations:
            for resource in _kustomization_resources(
                kustomization.read_text(encoding="utf-8")
            ):
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
        for collector in ("arp", "ipvs", "netdev", "netstat", "sockstat", "softnet"):
            self.assertIn(f"--no-collector.{collector}", daemonset)

    def test_node_exporter_has_a_per_pod_openobserve_scrape_path(self) -> None:
        daemonset = (MANIFESTS / "system/node-exporter/daemonset.yaml").read_text(
            encoding="utf-8"
        )
        service = (MANIFESTS / "system/node-exporter/service.yaml").read_text(
            encoding="utf-8"
        )
        collector = (MANIFESTS / "system/openobserve-collector/helm-release.yaml").read_text(
            encoding="utf-8"
        )
        cluster = (MANIFESTS / "clusters/my-cluster/system.yaml").read_text(
            encoding="utf-8"
        )
        self.assertIn('prometheus.io/scrape: "true"', daemonset)
        self.assertIn('prometheus.io/port: "9100"', daemonset)
        self.assertIn("clusterIP: None", service)
        self.assertIn("gateway:\n      enabled: true", collector)
        self.assertRegex(
            cluster,
            r"(?s)name: openobserve-collector.*?dependsOn:.*?- name: node-exporter",
        )

    def test_host_firewalls_require_scoped_management_and_cluster_inputs(self) -> None:
        common_nix = (ROOT / "nixos-config/modules/common.nix").read_text(encoding="utf-8")
        k3s_nix = (ROOT / "nixos-config/modules/k3s.nix").read_text(encoding="utf-8")
        ansible_vars = (ROOT / "ansible/inventory/group_vars/all.yml").read_text(
            encoding="utf-8"
        )
        ansible_tasks = (ROOT / "ansible/roles/common/tasks/main.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("managementInterfaces", common_nix)
        self.assertIn("clusterInterfaces", k3s_nix)
        self.assertIn("cluster_allowed_cidrs | length > 0 or", ansible_tasks)
        self.assertIn("ufw --force reset", ansible_tasks)
        self.assertIn("ufw --dry-run allow", ansible_tasks)
        self.assertIn("always:", ansible_tasks)
        self.assertIn("Re-enable UFW even if live policy application fails", ansible_tasks)
        self.assertIn("python3-debian", ansible_vars)
        self.assertIn('port: "2379"', ansible_vars)
        self.assertIn('port: "2380"', ansible_vars)
        self.assertIn('port: "30080"', ansible_vars)
        self.assertIn('port: "30443"', ansible_vars)
        self.assertIn('k3s_cluster_cidr: "10.42.0.0/16"', ansible_vars)
        self.assertIn('k3s_service_cidr: "10.43.0.0/16"', ansible_vars)
        self.assertIn('k3s_node_ip: ""', ansible_vars)
        self.assertIn("cfg.flannelInterface != \"\" && lib.elem", k3s_nix)
        self.assertIn("lib.hasInfix reserved flag", k3s_nix)
        self.assertIn("ingressNodePorts", k3s_nix)
        self.assertIn("--node-ip=${cfg.nodeIp}", k3s_nix)
        self.assertIn('default = [ "cni0" "flannel.1" ]', k3s_nix)
        self.assertIn("networking.firewall.trustedInterfaces = cfg.podInterfaces", k3s_nix)
        self.assertIn("Preflight k3s pod and service network rules", ansible_tasks)
        self.assertIn("Allow k3s pod and service network traffic", ansible_tasks)

        k3s_tasks = (ROOT / "ansible/roles/k3s_server/tasks/main.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn("/usr/local/bin/k3s --version", k3s_tasks)
        self.assertIn(
            "k3s_version not in (k3s_installed_version.stdout | default('')).split()",
            k3s_tasks,
        )
        self.assertNotIn("creates: /usr/local/bin/k3s", k3s_tasks)
        k3s_config = (
            ROOT / "ansible/roles/k3s_server/templates/config.yaml.j2"
        ).read_text(encoding="utf-8")
        self.assertIn('node-ip: "{{ k3s_node_ip }}"', k3s_config)

        nebula_tasks = (ROOT / "ansible/roles/nebula/tasks/main.yml").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "nebula_version not in (nebula_installed.stdout | default('')).split()",
            nebula_tasks,
        )

    def test_hermes_runtime_image_inputs_have_one_digest_contract(self) -> None:
        environment = (ROOT / ".env.example").read_text(encoding="utf-8")
        self.assertIn(
            "TEMPLATE_HERMES_RUNTIME_IMAGE=ghcr.io/example/hermes-runtime\n",
            environment,
        )
        self.assertIn("TEMPLATE_HERMES_RUNTIME_DIGEST=CHANGE_ME_64_HEX_DIGEST", environment)
        self.assertNotIn("TEMPLATE_HERMES_RUNTIME_IMAGE=ghcr.io/example/hermes-runtime@", environment)

    def test_rabbitmq_operator_waits_for_cert_manager(self) -> None:
        cluster = (MANIFESTS / "clusters/my-cluster/system.yaml").read_text(
            encoding="utf-8"
        )
        self.assertRegex(
            cluster,
            r"(?s)name: rabbitmq-operator.*?dependsOn:.*?- name: cert-manager",
        )

    def test_rabbitmq_operator_image_is_digest_pinned_at_render_time(self) -> None:
        kustomization = (
            MANIFESTS / "system/rabbitmq-operator/kustomization.yaml"
        ).read_text(encoding="utf-8")
        self.assertIn(
            "digest: sha256:2727b84b835ada97247bbb65ebfa6998168b4e8ee11b0e6cece56ac2c9c4f0fb",
            kustomization,
        )

    def test_redis_operator_image_is_digest_pinned_after_helm_render(self) -> None:
        release = (MANIFESTS / "system/redis-operator/helm-release.yaml").read_text(
            encoding="utf-8"
        )
        self.assertIn("postRenderers:", release)
        self.assertIn(
            "digest: sha256:c3af8183cbe157053fa09642f375f90acdf4a355981d2d506ed3e1b94c047eb8",
            release,
        )
        self.assertIn("imageTag: v0.20.2", release)

    def test_new_optional_system_modules_are_suspended_by_default(self) -> None:
        cluster = (MANIFESTS / "clusters/my-cluster/system.yaml").read_text(
            encoding="utf-8"
        )
        for name in (
            "redis-operator",
            "rabbitmq-operator",
            "gateway-api",
            "node-exporter",
            "openobserve-collector",
        ):
            with self.subTest(name=name):
                self.assertRegex(
                    cluster,
                    rf"(?s)name: {re.escape(name)}.*?path: .*?\n  prune: true\n(?:  #.*\n)?  suspend: true",
                )

    def test_reset_script_preserves_tracked_file_modes(self) -> None:
        reset_script = (ROOT / "reset-to-template.sh").read_text(encoding="utf-8")
        self.assertIn('cp -p "$repo_root/$file" "$tmp"', reset_script)
        self.assertNotIn("|CHANGE_ME)$", reset_script)
        self.assertNotIn("'*.env.example'", reset_script)
        self.assertNotIn("'*.sh'", reset_script)
        self.assertIn("(?<![A-Z0-9_])", reset_script)
        self.assertIn("(?![A-Z0-9_])", reset_script)

    def test_hetzner_boolean_inputs_fail_closed(self) -> None:
        source = (ROOT / "infrastructure/hetzner/main.ts").read_text(encoding="utf-8")
        self.assertIn("if (['0', 'false', 'no', 'off'].includes(normalized))", source)
        self.assertIn("throw new Error(", source)

    def test_hetzner_numbers_ports_and_provider_fail_closed(self) -> None:
        adapter = ROOT / "infrastructure/hetzner"
        source = (adapter / "main.ts").read_text(encoding="utf-8")
        cdktf = (adapter / "cdktf.json").read_text(encoding="utf-8")
        provider = (adapter / ".gen/providers/hcloud/provider/index.ts").read_text(
            encoding="utf-8"
        )
        package = (adapter / "package.json").read_text(encoding="utf-8")
        lockfile = (adapter / ".terraform.lock.hcl").read_text(encoding="utf-8")

        self.assertIn("if (!/^\\d+$/.test(raw))", source)
        self.assertNotIn("Number.parseInt", source)
        self.assertIn("port < 1 || port > 65535", source)
        self.assertIn("LOAD_BALANCER_DESTINATION_PORTS", source)
        self.assertIn("loadBalancerPorts.length !== loadBalancerDestinationPorts.length", source)
        self.assertIn('"hetznercloud/hcloud@= 1.54.0"', cdktf)
        self.assertIn("providerVersionConstraint: '= 1.54.0'", provider)
        self.assertIn("-lockfile=readonly", package)
        self.assertIn('provider "registry.opentofu.org/hetznercloud/hcloud"', lockfile)
        self.assertIn('version     = "1.54.0"', lockfile)

    def test_hetzner_ingress_port_map_is_explicit_end_to_end(self) -> None:
        source = (ROOT / "infrastructure/hetzner/main.ts").read_text(encoding="utf-8")
        nginx = (MANIFESTS / "system/nginx-ingress/helm-release.yaml").read_text(
            encoding="utf-8"
        )
        provider_docs = (ROOT / "infrastructure/providers/hetzner/README.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("destinationPort,", source)
        self.assertIn("port: destinationPort", source)
        self.assertIn("http: 30080", nginx)
        self.assertIn("https: 30443", nginx)
        self.assertIn("LOAD_BALANCER_DESTINATION_PORTS", provider_docs)

    def test_existing_install_requires_live_destructive_upgrade_preflight(self) -> None:
        tenants = (MANIFESTS / "clusters/my-cluster/tenants.yaml").read_text(
            encoding="utf-8"
        )
        deployment = (ROOT / "docs/DEPLOYMENT.md").read_text(encoding="utf-8")
        self.assertIn("prune: false", tenants)
        self.assertIn("suspend: true", tenants)
        for retained_contract in (
            "my-tenant-hermes",
            "hermes-agent-data",
            "50 GiB",
            "hermes-workspace-files",
            "100 GiB",
            "garage-credentials",
            "*.secret.enc.yaml",
            "prune: true",
            "flux suspend kustomization flux-system",
            "flux resume kustomization flux-system",
            "true false",
            "does not rediscover objects orphaned",
            "my-tenant-matomo/matomo-data",
            "config/config.ini.php",
        ):
            with self.subTest(retained_contract=retained_contract):
                self.assertIn(retained_contract, deployment)

    def test_sops_check_inspects_every_secret_payload_value(self) -> None:
        script = (CI_SCRIPTS / "check-plaintext-secrets.sh").read_text(encoding="utf-8")
        self.assertIn('.kind == "Secret"', script)
        self.assertIn(".. |", script)
        self.assertIn('test("^ENC\\\\[AES256_GCM,")', script)
        self.assertIn("$payload | length", script)
        self.assertIn("documentIndex", script)
        self.assertIn("is_safe_template_document", script)
        self.assertIn("Secret template payloads must all use approved placeholders", script)

    def test_cluster_flux_children_receive_sops_decryption(self) -> None:
        cluster = (
            MANIFESTS / "clusters/my-cluster/kustomization.yaml"
        ).read_text(encoding="utf-8")
        for contract in (
            "group: kustomize.toolkit.fluxcd.io",
            "version: v1",
            "kind: Kustomization",
            "path: /spec/decryption",
            "provider: sops",
            "name: sops-age",
        ):
            with self.subTest(contract=contract):
                self.assertIn(contract, cluster)

    def test_matomo_domain_patch_preserves_ingress_routing_and_tls_secret(self) -> None:
        patch = (
            MANIFESTS / "tenants/my-tenant/company-services/matomo/domain.patch.yaml"
        ).read_text(encoding="utf-8")
        self.assertIn("secretName: matomo-tls", patch)
        self.assertIn("http:\n        paths:", patch)

    def test_matomo_archive_job_is_colocated_with_rwo_workload(self) -> None:
        archive = (
            MANIFESTS / "applications/matomo/base/archive-cronjob.yaml"
        ).read_text(encoding="utf-8")
        self.assertIn("requiredDuringSchedulingIgnoredDuringExecution", archive)
        self.assertIn("app.kubernetes.io/name: matomo", archive)
        self.assertIn("topologyKey: kubernetes.io/hostname", archive)

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
