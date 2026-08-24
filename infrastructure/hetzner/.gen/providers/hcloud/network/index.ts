// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface NetworkConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#delete_protection Network#delete_protection}
   */
  readonly deleteProtection?: boolean | cdktf.IResolvable;
  /**
   * Enable or disable exposing the routes to the vSwitch connection. The exposing only takes effect if a vSwitch connection is active.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#expose_routes_to_vswitch Network#expose_routes_to_vswitch}
   */
  readonly exposeRoutesToVswitch?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#id Network#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#ip_range Network#ip_range}
   */
  readonly ipRange: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#labels Network#labels}
   */
  readonly labels?: { [key: string]: string };
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#name Network#name}
   */
  readonly name: string;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network hcloud_network}
 */
export class Network extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_network';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a Network resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the Network to import
   * @param importFromId The id of the existing Network that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the Network to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_network',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network hcloud_network} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options NetworkConfig
   */
  public constructor(scope: Construct, id: string, config: NetworkConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_network',
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
    this._deleteProtection = config.deleteProtection;
    this._exposeRoutesToVswitch = config.exposeRoutesToVswitch;
    this._id = config.id;
    this._ipRange = config.ipRange;
    this._labels = config.labels;
    this._name = config.name;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // delete_protection - computed: false, optional: true, required: false
  private _deleteProtection?: boolean | cdktf.IResolvable;
  public get deleteProtection() {
    return this.getBooleanAttribute('delete_protection');
  }
  public set deleteProtection(value: boolean | cdktf.IResolvable) {
    this._deleteProtection = value;
  }
  public resetDeleteProtection() {
    this._deleteProtection = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get deleteProtectionInput() {
    return this._deleteProtection;
  }

  // expose_routes_to_vswitch - computed: false, optional: true, required: false
  private _exposeRoutesToVswitch?: boolean | cdktf.IResolvable;
  public get exposeRoutesToVswitch() {
    return this.getBooleanAttribute('expose_routes_to_vswitch');
  }
  public set exposeRoutesToVswitch(value: boolean | cdktf.IResolvable) {
    this._exposeRoutesToVswitch = value;
  }
  public resetExposeRoutesToVswitch() {
    this._exposeRoutesToVswitch = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get exposeRoutesToVswitchInput() {
    return this._exposeRoutesToVswitch;
  }

  // id - computed: true, optional: true, required: false
  private _id?: string;
  public get id() {
    return this.getStringAttribute('id');
  }
  public set id(value: string) {
    this._id = value;
  }
  public resetId() {
    this._id = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get idInput() {
    return this._id;
  }

  // ip_range - computed: false, optional: false, required: true
  private _ipRange?: string;
  public get ipRange() {
    return this.getStringAttribute('ip_range');
  }
  public set ipRange(value: string) {
    this._ipRange = value;
  }
  // Temporarily expose input value. Use with caution.
  public get ipRangeInput() {
    return this._ipRange;
  }

  // labels - computed: false, optional: true, required: false
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

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      delete_protection: cdktf.booleanToTerraform(this._deleteProtection),
      expose_routes_to_vswitch: cdktf.booleanToTerraform(this._exposeRoutesToVswitch),
      id: cdktf.stringToTerraform(this._id),
      ip_range: cdktf.stringToTerraform(this._ipRange),
      labels: cdktf.hashMapper(cdktf.stringToTerraform)(this._labels),
      name: cdktf.stringToTerraform(this._name),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      delete_protection: {
        value: cdktf.booleanToHclTerraform(this._deleteProtection),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      expose_routes_to_vswitch: {
        value: cdktf.booleanToHclTerraform(this._exposeRoutesToVswitch),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      id: {
        value: cdktf.stringToHclTerraform(this._id),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      ip_range: {
        value: cdktf.stringToHclTerraform(this._ipRange),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
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
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
