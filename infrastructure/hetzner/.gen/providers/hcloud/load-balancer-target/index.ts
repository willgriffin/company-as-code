// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface LoadBalancerTargetAConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#id LoadBalancerTargetA#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#ip LoadBalancerTargetA#ip}
   */
  readonly ip?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#label_selector LoadBalancerTargetA#label_selector}
   */
  readonly labelSelector?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#load_balancer_id LoadBalancerTargetA#load_balancer_id}
   */
  readonly loadBalancerId: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#server_id LoadBalancerTargetA#server_id}
   */
  readonly serverId?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#type LoadBalancerTargetA#type}
   */
  readonly type: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#use_private_ip LoadBalancerTargetA#use_private_ip}
   */
  readonly usePrivateIp?: boolean | cdktf.IResolvable;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target hcloud_load_balancer_target}
 */
export class LoadBalancerTargetA extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_load_balancer_target';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a LoadBalancerTargetA resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the LoadBalancerTargetA to import
   * @param importFromId The id of the existing LoadBalancerTargetA that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the LoadBalancerTargetA to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_load_balancer_target',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_target hcloud_load_balancer_target} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options LoadBalancerTargetAConfig
   */
  public constructor(scope: Construct, id: string, config: LoadBalancerTargetAConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_load_balancer_target',
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
    this._ip = config.ip;
    this._labelSelector = config.labelSelector;
    this._loadBalancerId = config.loadBalancerId;
    this._serverId = config.serverId;
    this._type = config.type;
    this._usePrivateIp = config.usePrivateIp;
  }

  // ==========
  // ATTRIBUTES
  // ==========

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

  // ip - computed: false, optional: true, required: false
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

  // label_selector - computed: false, optional: true, required: false
  private _labelSelector?: string;
  public get labelSelector() {
    return this.getStringAttribute('label_selector');
  }
  public set labelSelector(value: string) {
    this._labelSelector = value;
  }
  public resetLabelSelector() {
    this._labelSelector = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get labelSelectorInput() {
    return this._labelSelector;
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

  // server_id - computed: false, optional: true, required: false
  private _serverId?: number;
  public get serverId() {
    return this.getNumberAttribute('server_id');
  }
  public set serverId(value: number) {
    this._serverId = value;
  }
  public resetServerId() {
    this._serverId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get serverIdInput() {
    return this._serverId;
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

  // use_private_ip - computed: true, optional: true, required: false
  private _usePrivateIp?: boolean | cdktf.IResolvable;
  public get usePrivateIp() {
    return this.getBooleanAttribute('use_private_ip');
  }
  public set usePrivateIp(value: boolean | cdktf.IResolvable) {
    this._usePrivateIp = value;
  }
  public resetUsePrivateIp() {
    this._usePrivateIp = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get usePrivateIpInput() {
    return this._usePrivateIp;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      id: cdktf.stringToTerraform(this._id),
      ip: cdktf.stringToTerraform(this._ip),
      label_selector: cdktf.stringToTerraform(this._labelSelector),
      load_balancer_id: cdktf.numberToTerraform(this._loadBalancerId),
      server_id: cdktf.numberToTerraform(this._serverId),
      type: cdktf.stringToTerraform(this._type),
      use_private_ip: cdktf.booleanToTerraform(this._usePrivateIp),
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
      ip: {
        value: cdktf.stringToHclTerraform(this._ip),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      label_selector: {
        value: cdktf.stringToHclTerraform(this._labelSelector),
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
      server_id: {
        value: cdktf.numberToHclTerraform(this._serverId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      type: {
        value: cdktf.stringToHclTerraform(this._type),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      use_private_ip: {
        value: cdktf.booleanToHclTerraform(this._usePrivateIp),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
