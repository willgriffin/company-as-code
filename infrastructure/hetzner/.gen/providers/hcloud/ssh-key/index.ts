// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface SshKeyConfig extends cdktf.TerraformMetaArguments {
  /**
   * User-defined [labels](https://docs.hetzner.cloud/reference/cloud#labels) (key-value pairs) for the resource.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key#labels SshKey#labels}
   */
  readonly labels?: { [key: string]: string };
  /**
   * Name of the SSH Key.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key#name SshKey#name}
   */
  readonly name: string;
  /**
   * Public key of the SSH Key pair. If this is a file, it can be read using the `file` interpolation function.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key#public_key SshKey#public_key}
   */
  readonly publicKey: string;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key hcloud_ssh_key}
 */
export class SshKey extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_ssh_key';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a SshKey resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the SshKey to import
   * @param importFromId The id of the existing SshKey that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the SshKey to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_ssh_key',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/ssh_key hcloud_ssh_key} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options SshKeyConfig
   */
  public constructor(scope: Construct, id: string, config: SshKeyConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_ssh_key',
      terraformGeneratorMetadata: {
        providerName: 'hcloud',
        providerVersion: '1.54.0',
        providerVersionConstraint: '~> 1.54.0',
      },
      provider: config.provider,
      dependsOn: config.dependsOn,
      count: config.count,
      lifecycle: config.lifecycle,
      provisioners: config.provisioners,
      connection: config.connection,
      forEach: config.forEach,
    });
    this._labels = config.labels;
    this._name = config.name;
    this._publicKey = config.publicKey;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // fingerprint - computed: true, optional: false, required: false
  public get fingerprint() {
    return this.getStringAttribute('fingerprint');
  }

  // id - computed: true, optional: false, required: false
  public get id() {
    return this.getStringAttribute('id');
  }

  // labels - computed: true, optional: true, required: false
  private _labels?: { [key: string]: string };
  public get labels() {
    return this.getStringMapAttribute('labels');
  }
  public set labels(value: { [key: string]: string }) {
    this._labels = value;
  }
  public resetLabels() {
    this._labels = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get labelsInput() {
    return this._labels;
  }

  // name - computed: false, optional: false, required: true
  private _name?: string;
  public get name() {
    return this.getStringAttribute('name');
  }
  public set name(value: string) {
    this._name = value;
  }
  // Temporarily expose input value. Use with caution.
  public get nameInput() {
    return this._name;
  }

  // public_key - computed: false, optional: false, required: true
  private _publicKey?: string;
  public get publicKey() {
    return this.getStringAttribute('public_key');
  }
  public set publicKey(value: string) {
    this._publicKey = value;
  }
  // Temporarily expose input value. Use with caution.
  public get publicKeyInput() {
    return this._publicKey;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      labels: cdktf.hashMapper(cdktf.stringToTerraform)(this._labels),
      name: cdktf.stringToTerraform(this._name),
      public_key: cdktf.stringToTerraform(this._publicKey),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      labels: {
        value: cdktf.hashMapperHcl(cdktf.stringToHclTerraform)(this._labels),
        isBlock: false,
        type: 'map',
        storageClassType: 'stringMap',
      },
      name: {
        value: cdktf.stringToHclTerraform(this._name),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      public_key: {
        value: cdktf.stringToHclTerraform(this._publicKey),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
