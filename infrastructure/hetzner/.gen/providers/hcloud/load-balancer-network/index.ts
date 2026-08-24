// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface LoadBalancerNetworkConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#enable_public_interface LoadBalancerNetwork#enable_public_interface}
   */
  readonly enablePublicInterface?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#id LoadBalancerNetwork#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#ip LoadBalancerNetwork#ip}
   */
  readonly ip?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#load_balancer_id LoadBalancerNetwork#load_balancer_id}
   */
  readonly loadBalancerId: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#network_id LoadBalancerNetwork#network_id}
   */
  readonly networkId?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#subnet_id LoadBalancerNetwork#subnet_id}
   */
  readonly subnetId?: string;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network hcloud_load_balancer_network}
 */
export class LoadBalancerNetwork extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_load_balancer_network';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a LoadBalancerNetwork resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the LoadBalancerNetwork to import
   * @param importFromId The id of the existing LoadBalancerNetwork that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the LoadBalancerNetwork to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_load_balancer_network',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_network hcloud_load_balancer_network} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options LoadBalancerNetworkConfig
   */
  public constructor(scope: Construct, id: string, config: LoadBalancerNetworkConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_load_balancer_network',
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
    this._enablePublicInterface = config.enablePublicInterface;
    this._id = config.id;
    this._ip = config.ip;
    this._loadBalancerId = config.loadBalancerId;
    this._networkId = config.networkId;
    this._subnetId = config.subnetId;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // enable_public_interface - computed: false, optional: true, required: false
  private _enablePublicInterface?: boolean | cdktf.IResolvable;
  public get enablePublicInterface() {
    return this.getBooleanAttribute('enable_public_interface');
  }
  public set enablePublicInterface(value: boolean | cdktf.IResolvable) {
    this._enablePublicInterface = value;
  }
  public resetEnablePublicInterface() {
    this._enablePublicInterface = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get enablePublicInterfaceInput() {
    return this._enablePublicInterface;
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

  // ip - computed: true, optional: true, required: false
  private _ip?: string;
  public get ip() {
    return this.getStringAttribute('ip');
  }
  public set ip(value: string) {
    this._ip = value;
  }
  public resetIp() {
    this._ip = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ipInput() {
    return this._ip;
  }

  // load_balancer_id - computed: false, optional: false, required: true
  private _loadBalancerId?: number;
  public get loadBalancerId() {
    return this.getNumberAttribute('load_balancer_id');
  }
  public set loadBalancerId(value: number) {
    this._loadBalancerId = value;
  }
  // Temporarily expose input value. Use with caution.
  public get loadBalancerIdInput() {
    return this._loadBalancerId;
  }

  // network_id - computed: false, optional: true, required: false
  private _networkId?: number;
  public get networkId() {
    return this.getNumberAttribute('network_id');
  }
  public set networkId(value: number) {
    this._networkId = value;
  }
  public resetNetworkId() {
    this._networkId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get networkIdInput() {
    return this._networkId;
  }

  // subnet_id - computed: false, optional: true, required: false
  private _subnetId?: string;
  public get subnetId() {
    return this.getStringAttribute('subnet_id');
  }
  public set subnetId(value: string) {
    this._subnetId = value;
  }
  public resetSubnetId() {
    this._subnetId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get subnetIdInput() {
    return this._subnetId;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      enable_public_interface: cdktf.booleanToTerraform(this._enablePublicInterface),
      id: cdktf.stringToTerraform(this._id),
      ip: cdktf.stringToTerraform(this._ip),
      load_balancer_id: cdktf.numberToTerraform(this._loadBalancerId),
      network_id: cdktf.numberToTerraform(this._networkId),
      subnet_id: cdktf.stringToTerraform(this._subnetId),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      enable_public_interface: {
        value: cdktf.booleanToHclTerraform(this._enablePublicInterface),
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
      ip: {
        value: cdktf.stringToHclTerraform(this._ip),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      load_balancer_id: {
        value: cdktf.numberToHclTerraform(this._loadBalancerId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      network_id: {
        value: cdktf.numberToHclTerraform(this._networkId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      subnet_id: {
        value: cdktf.stringToHclTerraform(this._subnetId),
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
