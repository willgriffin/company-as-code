// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface ServerConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#allow_deprecated_images Server#allow_deprecated_images}
   */
  readonly allowDeprecatedImages?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#backups Server#backups}
   */
  readonly backups?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#datacenter Server#datacenter}
   */
  readonly datacenter?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#delete_protection Server#delete_protection}
   */
  readonly deleteProtection?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#firewall_ids Server#firewall_ids}
   */
  readonly firewallIds?: number[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#id Server#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ignore_remote_firewall_ids Server#ignore_remote_firewall_ids}
   */
  readonly ignoreRemoteFirewallIds?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#image Server#image}
   */
  readonly image?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#iso Server#iso}
   */
  readonly iso?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#keep_disk Server#keep_disk}
   */
  readonly keepDisk?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#labels Server#labels}
   */
  readonly labels?: { [key: string]: string };
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#location Server#location}
   */
  readonly location?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#name Server#name}
   */
  readonly name: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#placement_group_id Server#placement_group_id}
   */
  readonly placementGroupId?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#rebuild_protection Server#rebuild_protection}
   */
  readonly rebuildProtection?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#rescue Server#rescue}
   */
  readonly rescue?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#server_type Server#server_type}
   */
  readonly serverType: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#shutdown_before_deletion Server#shutdown_before_deletion}
   */
  readonly shutdownBeforeDeletion?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ssh_keys Server#ssh_keys}
   */
  readonly sshKeys?: string[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#user_data Server#user_data}
   */
  readonly userData?: string;
  /**
   * network block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#network Server#network}
   */
  readonly network?: ServerNetwork[] | cdktf.IResolvable;
  /**
   * public_net block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#public_net Server#public_net}
   */
  readonly publicNet?: ServerPublicNet[] | cdktf.IResolvable;
  /**
   * timeouts block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#timeouts Server#timeouts}
   */
  readonly timeouts?: ServerTimeouts;
}
export interface ServerNetwork {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#alias_ips Server#alias_ips}
   */
  readonly aliasIps?: string[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ip Server#ip}
   */
  readonly ip?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#network_id Server#network_id}
   */
  readonly networkId: number;
}

export function serverNetworkToTerraform(struct?: ServerNetwork | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    alias_ips: cdktf.listMapper(cdktf.stringToTerraform, false)(struct!.aliasIps),
    ip: cdktf.stringToTerraform(struct!.ip),
    network_id: cdktf.numberToTerraform(struct!.networkId),
  };
}

export function serverNetworkToHclTerraform(struct?: ServerNetwork | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    alias_ips: {
      value: cdktf.listMapperHcl(cdktf.stringToHclTerraform, false)(struct!.aliasIps),
      isBlock: false,
      type: 'set',
      storageClassType: 'stringList',
    },
    ip: {
      value: cdktf.stringToHclTerraform(struct!.ip),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    network_id: {
      value: cdktf.numberToHclTerraform(struct!.networkId),
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

export class ServerNetworkOutputReference extends cdktf.ComplexObject {
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

  public get internalValue(): ServerNetwork | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._aliasIps !== undefined) {
      hasAnyValues = true;
      internalValueResult.aliasIps = this._aliasIps;
    }
    if (this._ip !== undefined) {
      hasAnyValues = true;
      internalValueResult.ip = this._ip;
    }
    if (this._networkId !== undefined) {
      hasAnyValues = true;
      internalValueResult.networkId = this._networkId;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: ServerNetwork | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._aliasIps = undefined;
      this._ip = undefined;
      this._networkId = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._aliasIps = value.aliasIps;
      this._ip = value.ip;
      this._networkId = value.networkId;
    }
  }

  // alias_ips - computed: true, optional: true, required: false
  private _aliasIps?: string[];
  public get aliasIps() {
    return cdktf.Fn.tolist(this.getListAttribute('alias_ips'));
  }
  public set aliasIps(value: string[]) {
    this._aliasIps = value;
  }
  public resetAliasIps() {
    this._aliasIps = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get aliasIpsInput() {
    return this._aliasIps;
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

  // mac_address - computed: true, optional: false, required: false
  public get macAddress() {
    return this.getStringAttribute('mac_address');
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
}

export class ServerNetworkList extends cdktf.ComplexList {
  public internalValue?: ServerNetwork[] | cdktf.IResolvable;

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
  public get(index: number): ServerNetworkOutputReference {
    return new ServerNetworkOutputReference(
      this.terraformResource,
      this.terraformAttribute,
      index,
      this.wrapsSet
    );
  }
}
export interface ServerPublicNet {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ipv4 Server#ipv4}
   */
  readonly ipv4?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ipv4_enabled Server#ipv4_enabled}
   */
  readonly ipv4Enabled?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ipv6 Server#ipv6}
   */
  readonly ipv6?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#ipv6_enabled Server#ipv6_enabled}
   */
  readonly ipv6Enabled?: boolean | cdktf.IResolvable;
}

export function serverPublicNetToTerraform(struct?: ServerPublicNet | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    ipv4: cdktf.numberToTerraform(struct!.ipv4),
    ipv4_enabled: cdktf.booleanToTerraform(struct!.ipv4Enabled),
    ipv6: cdktf.numberToTerraform(struct!.ipv6),
    ipv6_enabled: cdktf.booleanToTerraform(struct!.ipv6Enabled),
  };
}

export function serverPublicNetToHclTerraform(struct?: ServerPublicNet | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    ipv4: {
      value: cdktf.numberToHclTerraform(struct!.ipv4),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    ipv4_enabled: {
      value: cdktf.booleanToHclTerraform(struct!.ipv4Enabled),
      isBlock: false,
      type: 'simple',
      storageClassType: 'boolean',
    },
    ipv6: {
      value: cdktf.numberToHclTerraform(struct!.ipv6),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    ipv6_enabled: {
      value: cdktf.booleanToHclTerraform(struct!.ipv6Enabled),
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

export class ServerPublicNetOutputReference extends cdktf.ComplexObject {
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

  public get internalValue(): ServerPublicNet | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._ipv4 !== undefined) {
      hasAnyValues = true;
      internalValueResult.ipv4 = this._ipv4;
    }
    if (this._ipv4Enabled !== undefined) {
      hasAnyValues = true;
      internalValueResult.ipv4Enabled = this._ipv4Enabled;
    }
    if (this._ipv6 !== undefined) {
      hasAnyValues = true;
      internalValueResult.ipv6 = this._ipv6;
    }
    if (this._ipv6Enabled !== undefined) {
      hasAnyValues = true;
      internalValueResult.ipv6Enabled = this._ipv6Enabled;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: ServerPublicNet | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._ipv4 = undefined;
      this._ipv4Enabled = undefined;
      this._ipv6 = undefined;
      this._ipv6Enabled = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._ipv4 = value.ipv4;
      this._ipv4Enabled = value.ipv4Enabled;
      this._ipv6 = value.ipv6;
      this._ipv6Enabled = value.ipv6Enabled;
    }
  }

  // ipv4 - computed: true, optional: true, required: false
  private _ipv4?: number;
  public get ipv4() {
    return this.getNumberAttribute('ipv4');
  }
  public set ipv4(value: number) {
    this._ipv4 = value;
  }
  public resetIpv4() {
    this._ipv4 = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ipv4Input() {
    return this._ipv4;
  }

  // ipv4_enabled - computed: false, optional: true, required: false
  private _ipv4Enabled?: boolean | cdktf.IResolvable;
  public get ipv4Enabled() {
    return this.getBooleanAttribute('ipv4_enabled');
  }
  public set ipv4Enabled(value: boolean | cdktf.IResolvable) {
    this._ipv4Enabled = value;
  }
  public resetIpv4Enabled() {
    this._ipv4Enabled = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ipv4EnabledInput() {
    return this._ipv4Enabled;
  }

  // ipv6 - computed: true, optional: true, required: false
  private _ipv6?: number;
  public get ipv6() {
    return this.getNumberAttribute('ipv6');
  }
  public set ipv6(value: number) {
    this._ipv6 = value;
  }
  public resetIpv6() {
    this._ipv6 = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ipv6Input() {
    return this._ipv6;
  }

  // ipv6_enabled - computed: false, optional: true, required: false
  private _ipv6Enabled?: boolean | cdktf.IResolvable;
  public get ipv6Enabled() {
    return this.getBooleanAttribute('ipv6_enabled');
  }
  public set ipv6Enabled(value: boolean | cdktf.IResolvable) {
    this._ipv6Enabled = value;
  }
  public resetIpv6Enabled() {
    this._ipv6Enabled = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ipv6EnabledInput() {
    return this._ipv6Enabled;
  }
}

export class ServerPublicNetList extends cdktf.ComplexList {
  public internalValue?: ServerPublicNet[] | cdktf.IResolvable;

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
  public get(index: number): ServerPublicNetOutputReference {
    return new ServerPublicNetOutputReference(
      this.terraformResource,
      this.terraformAttribute,
      index,
      this.wrapsSet
    );
  }
}
export interface ServerTimeouts {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#create Server#create}
   */
  readonly create?: string;
}

export function serverTimeoutsToTerraform(struct?: ServerTimeouts | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    create: cdktf.stringToTerraform(struct!.create),
  };
}

export function serverTimeoutsToHclTerraform(struct?: ServerTimeouts | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    create: {
      value: cdktf.stringToHclTerraform(struct!.create),
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

export class ServerTimeoutsOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;
  private resolvableValue?: cdktf.IResolvable;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   */
  public constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string) {
    super(terraformResource, terraformAttribute, false);
  }

  public get internalValue(): ServerTimeouts | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._create !== undefined) {
      hasAnyValues = true;
      internalValueResult.create = this._create;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: ServerTimeouts | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._create = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._create = value.create;
    }
  }

  // create - computed: false, optional: true, required: false
  private _create?: string;
  public get create() {
    return this.getStringAttribute('create');
  }
  public set create(value: string) {
    this._create = value;
  }
  public resetCreate() {
    this._create = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get createInput() {
    return this._create;
  }
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server hcloud_server}
 */
export class Server extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_server';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a Server resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the Server to import
   * @param importFromId The id of the existing Server that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the Server to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_server',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/server hcloud_server} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options ServerConfig
   */
  public constructor(scope: Construct, id: string, config: ServerConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_server',
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
    this._allowDeprecatedImages = config.allowDeprecatedImages;
    this._backups = config.backups;
    this._datacenter = config.datacenter;
    this._deleteProtection = config.deleteProtection;
    this._firewallIds = config.firewallIds;
    this._id = config.id;
    this._ignoreRemoteFirewallIds = config.ignoreRemoteFirewallIds;
    this._image = config.image;
    this._iso = config.iso;
    this._keepDisk = config.keepDisk;
    this._labels = config.labels;
    this._location = config.location;
    this._name = config.name;
    this._placementGroupId = config.placementGroupId;
    this._rebuildProtection = config.rebuildProtection;
    this._rescue = config.rescue;
    this._serverType = config.serverType;
    this._shutdownBeforeDeletion = config.shutdownBeforeDeletion;
    this._sshKeys = config.sshKeys;
    this._userData = config.userData;
    this._network.internalValue = config.network;
    this._publicNet.internalValue = config.publicNet;
    this._timeouts.internalValue = config.timeouts;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // allow_deprecated_images - computed: false, optional: true, required: false
  private _allowDeprecatedImages?: boolean | cdktf.IResolvable;
  public get allowDeprecatedImages() {
    return this.getBooleanAttribute('allow_deprecated_images');
  }
  public set allowDeprecatedImages(value: boolean | cdktf.IResolvable) {
    this._allowDeprecatedImages = value;
  }
  public resetAllowDeprecatedImages() {
    this._allowDeprecatedImages = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get allowDeprecatedImagesInput() {
    return this._allowDeprecatedImages;
  }

  // backup_window - computed: true, optional: false, required: false
  public get backupWindow() {
    return this.getStringAttribute('backup_window');
  }

  // backups - computed: false, optional: true, required: false
  private _backups?: boolean | cdktf.IResolvable;
  public get backups() {
    return this.getBooleanAttribute('backups');
  }
  public set backups(value: boolean | cdktf.IResolvable) {
    this._backups = value;
  }
  public resetBackups() {
    this._backups = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get backupsInput() {
    return this._backups;
  }

  // datacenter - computed: true, optional: true, required: false
  private _datacenter?: string;
  public get datacenter() {
    return this.getStringAttribute('datacenter');
  }
  public set datacenter(value: string) {
    this._datacenter = value;
  }
  public resetDatacenter() {
    this._datacenter = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get datacenterInput() {
    return this._datacenter;
  }

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

  // firewall_ids - computed: true, optional: true, required: false
  private _firewallIds?: number[];
  public get firewallIds() {
    return cdktf.Token.asNumberList(cdktf.Fn.tolist(this.getNumberListAttribute('firewall_ids')));
  }
  public set firewallIds(value: number[]) {
    this._firewallIds = value;
  }
  public resetFirewallIds() {
    this._firewallIds = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get firewallIdsInput() {
    return this._firewallIds;
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

  // ignore_remote_firewall_ids - computed: false, optional: true, required: false
  private _ignoreRemoteFirewallIds?: boolean | cdktf.IResolvable;
  public get ignoreRemoteFirewallIds() {
    return this.getBooleanAttribute('ignore_remote_firewall_ids');
  }
  public set ignoreRemoteFirewallIds(value: boolean | cdktf.IResolvable) {
    this._ignoreRemoteFirewallIds = value;
  }
  public resetIgnoreRemoteFirewallIds() {
    this._ignoreRemoteFirewallIds = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ignoreRemoteFirewallIdsInput() {
    return this._ignoreRemoteFirewallIds;
  }

  // image - computed: false, optional: true, required: false
  private _image?: string;
  public get image() {
    return this.getStringAttribute('image');
  }
  public set image(value: string) {
    this._image = value;
  }
  public resetImage() {
    this._image = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get imageInput() {
    return this._image;
  }

  // ipv4_address - computed: true, optional: false, required: false
  public get ipv4Address() {
    return this.getStringAttribute('ipv4_address');
  }

  // ipv6_address - computed: true, optional: false, required: false
  public get ipv6Address() {
    return this.getStringAttribute('ipv6_address');
  }

  // ipv6_network - computed: true, optional: false, required: false
  public get ipv6Network() {
    return this.getStringAttribute('ipv6_network');
  }

  // iso - computed: false, optional: true, required: false
  private _iso?: string;
  public get iso() {
    return this.getStringAttribute('iso');
  }
  public set iso(value: string) {
    this._iso = value;
  }
  public resetIso() {
    this._iso = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get isoInput() {
    return this._iso;
  }

  // keep_disk - computed: false, optional: true, required: false
  private _keepDisk?: boolean | cdktf.IResolvable;
  public get keepDisk() {
    return this.getBooleanAttribute('keep_disk');
  }
  public set keepDisk(value: boolean | cdktf.IResolvable) {
    this._keepDisk = value;
  }
  public resetKeepDisk() {
    this._keepDisk = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get keepDiskInput() {
    return this._keepDisk;
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

  // placement_group_id - computed: false, optional: true, required: false
  private _placementGroupId?: number;
  public get placementGroupId() {
    return this.getNumberAttribute('placement_group_id');
  }
  public set placementGroupId(value: number) {
    this._placementGroupId = value;
  }
  public resetPlacementGroupId() {
    this._placementGroupId = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get placementGroupIdInput() {
    return this._placementGroupId;
  }

  // primary_disk_size - computed: true, optional: false, required: false
  public get primaryDiskSize() {
    return this.getNumberAttribute('primary_disk_size');
  }

  // rebuild_protection - computed: false, optional: true, required: false
  private _rebuildProtection?: boolean | cdktf.IResolvable;
  public get rebuildProtection() {
    return this.getBooleanAttribute('rebuild_protection');
  }
  public set rebuildProtection(value: boolean | cdktf.IResolvable) {
    this._rebuildProtection = value;
  }
  public resetRebuildProtection() {
    this._rebuildProtection = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get rebuildProtectionInput() {
    return this._rebuildProtection;
  }

  // rescue - computed: false, optional: true, required: false
  private _rescue?: string;
  public get rescue() {
    return this.getStringAttribute('rescue');
  }
  public set rescue(value: string) {
    this._rescue = value;
  }
  public resetRescue() {
    this._rescue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get rescueInput() {
    return this._rescue;
  }

  // server_type - computed: false, optional: false, required: true
  private _serverType?: string;
  public get serverType() {
    return this.getStringAttribute('server_type');
  }
  public set serverType(value: string) {
    this._serverType = value;
  }
  // Temporarily expose input value. Use with caution.
  public get serverTypeInput() {
    return this._serverType;
  }

  // shutdown_before_deletion - computed: false, optional: true, required: false
  private _shutdownBeforeDeletion?: boolean | cdktf.IResolvable;
  public get shutdownBeforeDeletion() {
    return this.getBooleanAttribute('shutdown_before_deletion');
  }
  public set shutdownBeforeDeletion(value: boolean | cdktf.IResolvable) {
    this._shutdownBeforeDeletion = value;
  }
  public resetShutdownBeforeDeletion() {
    this._shutdownBeforeDeletion = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get shutdownBeforeDeletionInput() {
    return this._shutdownBeforeDeletion;
  }

  // ssh_keys - computed: false, optional: true, required: false
  private _sshKeys?: string[];
  public get sshKeys() {
    return this.getListAttribute('ssh_keys');
  }
  public set sshKeys(value: string[]) {
    this._sshKeys = value;
  }
  public resetSshKeys() {
    this._sshKeys = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sshKeysInput() {
    return this._sshKeys;
  }

  // status - computed: true, optional: false, required: false
  public get status() {
    return this.getStringAttribute('status');
  }

  // user_data - computed: false, optional: true, required: false
  private _userData?: string;
  public get userData() {
    return this.getStringAttribute('user_data');
  }
  public set userData(value: string) {
    this._userData = value;
  }
  public resetUserData() {
    this._userData = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get userDataInput() {
    return this._userData;
  }

  // network - computed: false, optional: true, required: false
  private _network = new ServerNetworkList(this, 'network', true);
  public get network() {
    return this._network;
  }
  public putNetwork(value: ServerNetwork[] | cdktf.IResolvable) {
    this._network.internalValue = value;
  }
  public resetNetwork() {
    this._network.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get networkInput() {
    return this._network.internalValue;
  }

  // public_net - computed: false, optional: true, required: false
  private _publicNet = new ServerPublicNetList(this, 'public_net', true);
  public get publicNet() {
    return this._publicNet;
  }
  public putPublicNet(value: ServerPublicNet[] | cdktf.IResolvable) {
    this._publicNet.internalValue = value;
  }
  public resetPublicNet() {
    this._publicNet.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get publicNetInput() {
    return this._publicNet.internalValue;
  }

  // timeouts - computed: false, optional: true, required: false
  private _timeouts = new ServerTimeoutsOutputReference(this, 'timeouts');
  public get timeouts() {
    return this._timeouts;
  }
  public putTimeouts(value: ServerTimeouts) {
    this._timeouts.internalValue = value;
  }
  public resetTimeouts() {
    this._timeouts.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get timeoutsInput() {
    return this._timeouts.internalValue;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      allow_deprecated_images: cdktf.booleanToTerraform(this._allowDeprecatedImages),
      backups: cdktf.booleanToTerraform(this._backups),
      datacenter: cdktf.stringToTerraform(this._datacenter),
      delete_protection: cdktf.booleanToTerraform(this._deleteProtection),
      firewall_ids: cdktf.listMapper(cdktf.numberToTerraform, false)(this._firewallIds),
      id: cdktf.stringToTerraform(this._id),
      ignore_remote_firewall_ids: cdktf.booleanToTerraform(this._ignoreRemoteFirewallIds),
      image: cdktf.stringToTerraform(this._image),
      iso: cdktf.stringToTerraform(this._iso),
      keep_disk: cdktf.booleanToTerraform(this._keepDisk),
      labels: cdktf.hashMapper(cdktf.stringToTerraform)(this._labels),
      location: cdktf.stringToTerraform(this._location),
      name: cdktf.stringToTerraform(this._name),
      placement_group_id: cdktf.numberToTerraform(this._placementGroupId),
      rebuild_protection: cdktf.booleanToTerraform(this._rebuildProtection),
      rescue: cdktf.stringToTerraform(this._rescue),
      server_type: cdktf.stringToTerraform(this._serverType),
      shutdown_before_deletion: cdktf.booleanToTerraform(this._shutdownBeforeDeletion),
      ssh_keys: cdktf.listMapper(cdktf.stringToTerraform, false)(this._sshKeys),
      user_data: cdktf.stringToTerraform(this._userData),
      network: cdktf.listMapper(serverNetworkToTerraform, true)(this._network.internalValue),
      public_net: cdktf.listMapper(serverPublicNetToTerraform, true)(this._publicNet.internalValue),
      timeouts: serverTimeoutsToTerraform(this._timeouts.internalValue),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      allow_deprecated_images: {
        value: cdktf.booleanToHclTerraform(this._allowDeprecatedImages),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      backups: {
        value: cdktf.booleanToHclTerraform(this._backups),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      datacenter: {
        value: cdktf.stringToHclTerraform(this._datacenter),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      delete_protection: {
        value: cdktf.booleanToHclTerraform(this._deleteProtection),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      firewall_ids: {
        value: cdktf.listMapperHcl(cdktf.numberToHclTerraform, false)(this._firewallIds),
        isBlock: false,
        type: 'set',
        storageClassType: 'numberList',
      },
      id: {
        value: cdktf.stringToHclTerraform(this._id),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      ignore_remote_firewall_ids: {
        value: cdktf.booleanToHclTerraform(this._ignoreRemoteFirewallIds),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      image: {
        value: cdktf.stringToHclTerraform(this._image),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      iso: {
        value: cdktf.stringToHclTerraform(this._iso),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      keep_disk: {
        value: cdktf.booleanToHclTerraform(this._keepDisk),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      labels: {
        value: cdktf.hashMapperHcl(cdktf.stringToHclTerraform)(this._labels),
        isBlock: false,
        type: 'map',
        storageClassType: 'stringMap',
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
      placement_group_id: {
        value: cdktf.numberToHclTerraform(this._placementGroupId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      rebuild_protection: {
        value: cdktf.booleanToHclTerraform(this._rebuildProtection),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      rescue: {
        value: cdktf.stringToHclTerraform(this._rescue),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      server_type: {
        value: cdktf.stringToHclTerraform(this._serverType),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      shutdown_before_deletion: {
        value: cdktf.booleanToHclTerraform(this._shutdownBeforeDeletion),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      ssh_keys: {
        value: cdktf.listMapperHcl(cdktf.stringToHclTerraform, false)(this._sshKeys),
        isBlock: false,
        type: 'list',
        storageClassType: 'stringList',
      },
      user_data: {
        value: cdktf.stringToHclTerraform(this._userData),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      network: {
        value: cdktf.listMapperHcl(serverNetworkToHclTerraform, true)(this._network.internalValue),
        isBlock: true,
        type: 'set',
        storageClassType: 'ServerNetworkList',
      },
      public_net: {
        value: cdktf.listMapperHcl(
          serverPublicNetToHclTerraform,
          true
        )(this._publicNet.internalValue),
        isBlock: true,
        type: 'set',
        storageClassType: 'ServerPublicNetList',
      },
      timeouts: {
        value: serverTimeoutsToHclTerraform(this._timeouts.internalValue),
        isBlock: true,
        type: 'struct',
        storageClassType: 'ServerTimeouts',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
