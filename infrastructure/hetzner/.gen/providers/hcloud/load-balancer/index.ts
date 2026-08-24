// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface LoadBalancerConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#delete_protection LoadBalancer#delete_protection}
   */
  readonly deleteProtection?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#id LoadBalancer#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#labels LoadBalancer#labels}
   */
  readonly labels?: { [key: string]: string };
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#load_balancer_type LoadBalancer#load_balancer_type}
   */
  readonly loadBalancerType: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#location LoadBalancer#location}
   */
  readonly location?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#name LoadBalancer#name}
   */
  readonly name: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#network_zone LoadBalancer#network_zone}
   */
  readonly networkZone?: string;
  /**
   * algorithm block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#algorithm LoadBalancer#algorithm}
   */
  readonly algorithm?: LoadBalancerAlgorithm;
  /**
   * target block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#target LoadBalancer#target}
   */
  readonly target?: LoadBalancerTarget[] | cdktf.IResolvable;
}
export interface LoadBalancerAlgorithm {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#type LoadBalancer#type}
   */
  readonly type?: string;
}

export function loadBalancerAlgorithmToTerraform(
  struct?: LoadBalancerAlgorithmOutputReference | LoadBalancerAlgorithm
): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    type: cdktf.stringToTerraform(struct!.type),
  };
}

export function loadBalancerAlgorithmToHclTerraform(
  struct?: LoadBalancerAlgorithmOutputReference | LoadBalancerAlgorithm
): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    type: {
      value: cdktf.stringToHclTerraform(struct!.type),
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

export class LoadBalancerAlgorithmOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   */
  public constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string) {
    super(terraformResource, terraformAttribute, false, 0);
  }

  public get internalValue(): LoadBalancerAlgorithm | undefined {
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._type !== undefined) {
      hasAnyValues = true;
      internalValueResult.type = this._type;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: LoadBalancerAlgorithm | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this._type = undefined;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this._type = value.type;
    }
  }

  // type - computed: true, optional: true, required: false
  private _type?: string;
  public get type() {
    return this.getStringAttribute('type');
  }
  public set type(value: string) {
    this._type = value;
  }
  public resetType() {
    this._type = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get typeInput() {
    return this._type;
  }
}
export interface LoadBalancerTarget {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#server_id LoadBalancer#server_id}
   */
  readonly serverId?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#type LoadBalancer#type}
   */
  readonly type: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#use_private_ip LoadBalancer#use_private_ip}
   */
  readonly usePrivateIp?: boolean | cdktf.IResolvable;
}

export function loadBalancerTargetToTerraform(
  struct?: LoadBalancerTarget | cdktf.IResolvable
): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    server_id: cdktf.numberToTerraform(struct!.serverId),
    type: cdktf.stringToTerraform(struct!.type),
    use_private_ip: cdktf.booleanToTerraform(struct!.usePrivateIp),
  };
}

export function loadBalancerTargetToHclTerraform(
  struct?: LoadBalancerTarget | cdktf.IResolvable
): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    server_id: {
      value: cdktf.numberToHclTerraform(struct!.serverId),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    type: {
      value: cdktf.stringToHclTerraform(struct!.type),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    use_private_ip: {
      value: cdktf.booleanToHclTerraform(struct!.usePrivateIp),
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

export class LoadBalancerTargetOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;
  private resolvableValue?: cdktf.IResolvable;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   * @param complexObjectIndex the index of this item in the list
   * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index)
   */
  public constructor(
    terraformResource: cdktf.IInterpolatingParent,
    terraformAttribute: string,
    complexObjectIndex: number,
    complexObjectIsFromSet: boolean
  ) {
    super(terraformResource, terraformAttribute, complexObjectIsFromSet, complexObjectIndex);
  }

  public get internalValue(): LoadBalancerTarget | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._serverId !== undefined) {
      hasAnyValues = true;
      internalValueResult.serverId = this._serverId;
    }
    if (this._type !== undefined) {
      hasAnyValues = true;
      internalValueResult.type = this._type;
    }
    if (this._usePrivateIp !== undefined) {
      hasAnyValues = true;
      internalValueResult.usePrivateIp = this._usePrivateIp;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: LoadBalancerTarget | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._serverId = undefined;
      this._type = undefined;
      this._usePrivateIp = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._serverId = value.serverId;
      this._type = value.type;
      this._usePrivateIp = value.usePrivateIp;
    }
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

  // use_private_ip - computed: false, optional: true, required: false
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
}

export class LoadBalancerTargetList extends cdktf.ComplexList {
  public internalValue?: LoadBalancerTarget[] | cdktf.IResolvable;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   * @param wrapsSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index)
   */
  constructor(
    protected terraformResource: cdktf.IInterpolatingParent,
    protected terraformAttribute: string,
    protected wrapsSet: boolean
  ) {
    super(terraformResource, terraformAttribute, wrapsSet);
  }

  /**
   * @param index the index of the item to return
   */
  public get(index: number): LoadBalancerTargetOutputReference {
    return new LoadBalancerTargetOutputReference(
      this.terraformResource,
      this.terraformAttribute,
      index,
      this.wrapsSet
    );
  }
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer hcloud_load_balancer}
 */
export class LoadBalancer extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_load_balancer';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a LoadBalancer resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the LoadBalancer to import
   * @param importFromId The id of the existing LoadBalancer that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the LoadBalancer to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_load_balancer',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer hcloud_load_balancer} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options LoadBalancerConfig
   */
  public constructor(scope: Construct, id: string, config: LoadBalancerConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_load_balancer',
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
    this._id = config.id;
    this._labels = config.labels;
    this._loadBalancerType = config.loadBalancerType;
    this._location = config.location;
    this._name = config.name;
    this._networkZone = config.networkZone;
    this._algorithm.internalValue = config.algorithm;
    this._target.internalValue = config.target;
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

  // ipv4 - computed: true, optional: false, required: false
  public get ipv4() {
    return this.getStringAttribute('ipv4');
  }

  // ipv6 - computed: true, optional: false, required: false
  public get ipv6() {
    return this.getStringAttribute('ipv6');
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

  // load_balancer_type - computed: false, optional: false, required: true
  private _loadBalancerType?: string;
  public get loadBalancerType() {
    return this.getStringAttribute('load_balancer_type');
  }
  public set loadBalancerType(value: string) {
    this._loadBalancerType = value;
  }
  // Temporarily expose input value. Use with caution.
  public get loadBalancerTypeInput() {
    return this._loadBalancerType;
  }

  // location - computed: true, optional: true, required: false
  private _location?: string;
  public get location() {
    return this.getStringAttribute('location');
  }
  public set location(value: string) {
    this._location = value;
  }
  public resetLocation() {
    this._location = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get locationInput() {
    return this._location;
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

  // network_id - computed: true, optional: false, required: false
  public get networkId() {
    return this.getNumberAttribute('network_id');
  }

  // network_ip - computed: true, optional: false, required: false
  public get networkIp() {
    return this.getStringAttribute('network_ip');
  }

  // network_zone - computed: true, optional: true, required: false
  private _networkZone?: string;
  public get networkZone() {
    return this.getStringAttribute('network_zone');
  }
  public set networkZone(value: string) {
    this._networkZone = value;
  }
  public resetNetworkZone() {
    this._networkZone = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get networkZoneInput() {
    return this._networkZone;
  }

  // algorithm - computed: false, optional: true, required: false
  private _algorithm = new LoadBalancerAlgorithmOutputReference(this, 'algorithm');
  public get algorithm() {
    return this._algorithm;
  }
  public putAlgorithm(value: LoadBalancerAlgorithm) {
    this._algorithm.internalValue = value;
  }
  public resetAlgorithm() {
    this._algorithm.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get algorithmInput() {
    return this._algorithm.internalValue;
  }

  // target - computed: false, optional: true, required: false
  private _target = new LoadBalancerTargetList(this, 'target', true);
  public get target() {
    return this._target;
  }
  public putTarget(value: LoadBalancerTarget[] | cdktf.IResolvable) {
    this._target.internalValue = value;
  }
  public resetTarget() {
    this._target.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get targetInput() {
    return this._target.internalValue;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      delete_protection: cdktf.booleanToTerraform(this._deleteProtection),
      id: cdktf.stringToTerraform(this._id),
      labels: cdktf.hashMapper(cdktf.stringToTerraform)(this._labels),
      load_balancer_type: cdktf.stringToTerraform(this._loadBalancerType),
      location: cdktf.stringToTerraform(this._location),
      name: cdktf.stringToTerraform(this._name),
      network_zone: cdktf.stringToTerraform(this._networkZone),
      algorithm: loadBalancerAlgorithmToTerraform(this._algorithm.internalValue),
      target: cdktf.listMapper(loadBalancerTargetToTerraform, true)(this._target.internalValue),
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
      id: {
        value: cdktf.stringToHclTerraform(this._id),
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
      load_balancer_type: {
        value: cdktf.stringToHclTerraform(this._loadBalancerType),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      location: {
        value: cdktf.stringToHclTerraform(this._location),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      name: {
        value: cdktf.stringToHclTerraform(this._name),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      network_zone: {
        value: cdktf.stringToHclTerraform(this._networkZone),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      algorithm: {
        value: loadBalancerAlgorithmToHclTerraform(this._algorithm.internalValue),
        isBlock: true,
        type: 'list',
        storageClassType: 'LoadBalancerAlgorithmList',
      },
      target: {
        value: cdktf.listMapperHcl(
          loadBalancerTargetToHclTerraform,
          true
        )(this._target.internalValue),
        isBlock: true,
        type: 'set',
        storageClassType: 'LoadBalancerTargetList',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
