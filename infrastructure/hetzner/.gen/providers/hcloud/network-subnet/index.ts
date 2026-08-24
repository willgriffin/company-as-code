// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface NetworkSubnetConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#id NetworkSubnet#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#ip_range NetworkSubnet#ip_range}
   */
  readonly ipRange: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#network_id NetworkSubnet#network_id}
   */
  readonly networkId: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#network_zone NetworkSubnet#network_zone}
   */
  readonly networkZone: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#type NetworkSubnet#type}
   */
  readonly type: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#vswitch_id NetworkSubnet#vswitch_id}
   */
  readonly vswitchId?: number;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet hcloud_network_subnet}
 */
export class NetworkSubnet extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_network_subnet';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a NetworkSubnet resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the NetworkSubnet to import
   * @param importFromId The id of the existing NetworkSubnet that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the NetworkSubnet to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_network_subnet',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/network_subnet hcloud_network_subnet} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options NetworkSubnetConfig
   */
  public constructor(scope: Construct, id: string, config: NetworkSubnetConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_network_subnet',
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
    this._id = config.id;
    this._ipRange = config.ipRange;
    this._networkId = config.networkId;
    this._networkZone = config.networkZone;
    this._type = config.type;
    this._vswitchId = config.vswitchId;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // gateway - computed: true, optional: false, required: false
  public get gateway() {
    return this.getStringAttribute('gateway');
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

  // network_id - computed: false, optional: false, required: true
  private _networkId?: number;
  public get networkId() {
    return this.getNumberAttribute('network_id');
  }
  public set networkId(value: number) {
    this._networkId = value;
  }
  // Temporarily expose input value. Use with caution.
  public get networkIdInput() {
    return this._networkId;
  }

  // network_zone - computed: false, optional: false, required: true
  private _networkZone?: string;
  public get networkZone() {
    return this.getStringAttribute('network_zone');
  }
  public set networkZone(value: string) {
    this._networkZone = value;
  }
  // Temporarily expose input value. Use with caution.
  public get networkZoneInput() {
    return this._networkZone;
  }

  // type - computed: false, optional: false, required: true
  private _type?: string;
  public get type() {
    return this.getStringAttribute('type');
  }
  public set type(value: string) {
    this._type = value;
  }
  // Temporarily expose input value. Use with caution.
  public get typeInput() {
    return this._type;
  }

  // vswitch_id - computed: false, optional: true, required: false
  private _vswitchId?: number;
  public get vswitchId() {
    return this.getNumberAttribute('vswitch_id');
  }
  public set vswitchId(value: number) {
    this._vswitchId = value;
  }
  public resetVswitchId() {
    this._vswitchId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get vswitchIdInput() {
    return this._vswitchId;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      id: cdktf.stringToTerraform(this._id),
      ip_range: cdktf.stringToTerraform(this._ipRange),
      network_id: cdktf.numberToTerraform(this._networkId),
      network_zone: cdktf.stringToTerraform(this._networkZone),
      type: cdktf.stringToTerraform(this._type),
      vswitch_id: cdktf.numberToTerraform(this._vswitchId),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
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
      network_id: {
        value: cdktf.numberToHclTerraform(this._networkId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      network_zone: {
        value: cdktf.stringToHclTerraform(this._networkZone),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      type: {
        value: cdktf.stringToHclTerraform(this._type),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      vswitch_id: {
        value: cdktf.numberToHclTerraform(this._vswitchId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
