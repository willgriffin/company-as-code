// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface FirewallConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#id Firewall#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#labels Firewall#labels}
   */
  readonly labels?: { [key: string]: string };
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#name Firewall#name}
   */
  readonly name: string;
  /**
   * apply_to block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#apply_to Firewall#apply_to}
   */
  readonly applyTo?: FirewallApplyTo[] | cdktf.IResolvable;
  /**
   * rule block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#rule Firewall#rule}
   */
  readonly rule?: FirewallRule[] | cdktf.IResolvable;
}
export interface FirewallApplyTo {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#label_selector Firewall#label_selector}
   */
  readonly labelSelector?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#server Firewall#server}
   */
  readonly server?: number;
}

export function firewallApplyToToTerraform(struct?: FirewallApplyTo | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    label_selector: cdktf.stringToTerraform(struct!.labelSelector),
    server: cdktf.numberToTerraform(struct!.server),
  };
}

export function firewallApplyToToHclTerraform(struct?: FirewallApplyTo | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    label_selector: {
      value: cdktf.stringToHclTerraform(struct!.labelSelector),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    server: {
      value: cdktf.numberToHclTerraform(struct!.server),
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

export class FirewallApplyToOutputReference extends cdktf.ComplexObject {
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

  public get internalValue(): FirewallApplyTo | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._labelSelector !== undefined) {
      hasAnyValues = true;
      internalValueResult.labelSelector = this._labelSelector;
    }
    if (this._server !== undefined) {
      hasAnyValues = true;
      internalValueResult.server = this._server;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: FirewallApplyTo | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._labelSelector = undefined;
      this._server = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._labelSelector = value.labelSelector;
      this._server = value.server;
    }
  }

  // label_selector - computed: true, optional: true, required: false
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

  // server - computed: true, optional: true, required: false
  private _server?: number;
  public get server() {
    return this.getNumberAttribute('server');
  }
  public set server(value: number) {
    this._server = value;
  }
  public resetServer() {
    this._server = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get serverInput() {
    return this._server;
  }
}

export class FirewallApplyToList extends cdktf.ComplexList {
  public internalValue?: FirewallApplyTo[] | cdktf.IResolvable;

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
  public get(index: number): FirewallApplyToOutputReference {
    return new FirewallApplyToOutputReference(
      this.terraformResource,
      this.terraformAttribute,
      index,
      this.wrapsSet
    );
  }
}
export interface FirewallRule {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#description Firewall#description}
   */
  readonly description?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#destination_ips Firewall#destination_ips}
   */
  readonly destinationIps?: string[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#direction Firewall#direction}
   */
  readonly direction: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#port Firewall#port}
   */
  readonly port?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#protocol Firewall#protocol}
   */
  readonly protocol: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#source_ips Firewall#source_ips}
   */
  readonly sourceIps?: string[];
}

export function firewallRuleToTerraform(struct?: FirewallRule | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  return {
    description: cdktf.stringToTerraform(struct!.description),
    destination_ips: cdktf.listMapper(cdktf.stringToTerraform, false)(struct!.destinationIps),
    direction: cdktf.stringToTerraform(struct!.direction),
    port: cdktf.stringToTerraform(struct!.port),
    protocol: cdktf.stringToTerraform(struct!.protocol),
    source_ips: cdktf.listMapper(cdktf.stringToTerraform, false)(struct!.sourceIps),
  };
}

export function firewallRuleToHclTerraform(struct?: FirewallRule | cdktf.IResolvable): any {
  if (!cdktf.canInspect(struct) || cdktf.Tokenization.isResolvable(struct)) {
    return struct;
  }
  if (cdktf.isComplexElement(struct)) {
    throw new Error(
      'A complex element was used as configuration, this is not supported: https://cdk.tf/complex-object-as-configuration'
    );
  }
  const attrs = {
    description: {
      value: cdktf.stringToHclTerraform(struct!.description),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    destination_ips: {
      value: cdktf.listMapperHcl(cdktf.stringToHclTerraform, false)(struct!.destinationIps),
      isBlock: false,
      type: 'set',
      storageClassType: 'stringList',
    },
    direction: {
      value: cdktf.stringToHclTerraform(struct!.direction),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    port: {
      value: cdktf.stringToHclTerraform(struct!.port),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    protocol: {
      value: cdktf.stringToHclTerraform(struct!.protocol),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    source_ips: {
      value: cdktf.listMapperHcl(cdktf.stringToHclTerraform, false)(struct!.sourceIps),
      isBlock: false,
      type: 'set',
      storageClassType: 'stringList',
    },
  };

  // remove undefined attributes
  return Object.fromEntries(
    Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
  );
}

export class FirewallRuleOutputReference extends cdktf.ComplexObject {
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

  public get internalValue(): FirewallRule | cdktf.IResolvable | undefined {
    if (this.resolvableValue) {
      return this.resolvableValue;
    }
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._description !== undefined) {
      hasAnyValues = true;
      internalValueResult.description = this._description;
    }
    if (this._destinationIps !== undefined) {
      hasAnyValues = true;
      internalValueResult.destinationIps = this._destinationIps;
    }
    if (this._direction !== undefined) {
      hasAnyValues = true;
      internalValueResult.direction = this._direction;
    }
    if (this._port !== undefined) {
      hasAnyValues = true;
      internalValueResult.port = this._port;
    }
    if (this._protocol !== undefined) {
      hasAnyValues = true;
      internalValueResult.protocol = this._protocol;
    }
    if (this._sourceIps !== undefined) {
      hasAnyValues = true;
      internalValueResult.sourceIps = this._sourceIps;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: FirewallRule | cdktf.IResolvable | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this.resolvableValue = undefined;
      this._description = undefined;
      this._destinationIps = undefined;
      this._direction = undefined;
      this._port = undefined;
      this._protocol = undefined;
      this._sourceIps = undefined;
    } else if (cdktf.Tokenization.isResolvable(value)) {
      this.isEmptyObject = false;
      this.resolvableValue = value;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this.resolvableValue = undefined;
      this._description = value.description;
      this._destinationIps = value.destinationIps;
      this._direction = value.direction;
      this._port = value.port;
      this._protocol = value.protocol;
      this._sourceIps = value.sourceIps;
    }
  }

  // description - computed: false, optional: true, required: false
  private _description?: string;
  public get description() {
    return this.getStringAttribute('description');
  }
  public set description(value: string) {
    this._description = value;
  }
  public resetDescription() {
    this._description = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get descriptionInput() {
    return this._description;
  }

  // destination_ips - computed: false, optional: true, required: false
  private _destinationIps?: string[];
  public get destinationIps() {
    return cdktf.Fn.tolist(this.getListAttribute('destination_ips'));
  }
  public set destinationIps(value: string[]) {
    this._destinationIps = value;
  }
  public resetDestinationIps() {
    this._destinationIps = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get destinationIpsInput() {
    return this._destinationIps;
  }

  // direction - computed: false, optional: false, required: true
  private _direction?: string;
  public get direction() {
    return this.getStringAttribute('direction');
  }
  public set direction(value: string) {
    this._direction = value;
  }
  // Temporarily expose input value. Use with caution.
  public get directionInput() {
    return this._direction;
  }

  // port - computed: false, optional: true, required: false
  private _port?: string;
  public get port() {
    return this.getStringAttribute('port');
  }
  public set port(value: string) {
    this._port = value;
  }
  public resetPort() {
    this._port = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get portInput() {
    return this._port;
  }

  // protocol - computed: false, optional: false, required: true
  private _protocol?: string;
  public get protocol() {
    return this.getStringAttribute('protocol');
  }
  public set protocol(value: string) {
    this._protocol = value;
  }
  // Temporarily expose input value. Use with caution.
  public get protocolInput() {
    return this._protocol;
  }

  // source_ips - computed: false, optional: true, required: false
  private _sourceIps?: string[];
  public get sourceIps() {
    return cdktf.Fn.tolist(this.getListAttribute('source_ips'));
  }
  public set sourceIps(value: string[]) {
    this._sourceIps = value;
  }
  public resetSourceIps() {
    this._sourceIps = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get sourceIpsInput() {
    return this._sourceIps;
  }
}

export class FirewallRuleList extends cdktf.ComplexList {
  public internalValue?: FirewallRule[] | cdktf.IResolvable;

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
  public get(index: number): FirewallRuleOutputReference {
    return new FirewallRuleOutputReference(
      this.terraformResource,
      this.terraformAttribute,
      index,
      this.wrapsSet
    );
  }
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall hcloud_firewall}
 */
export class Firewall extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_firewall';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a Firewall resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the Firewall to import
   * @param importFromId The id of the existing Firewall that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the Firewall to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_firewall',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/firewall hcloud_firewall} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options FirewallConfig
   */
  public constructor(scope: Construct, id: string, config: FirewallConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_firewall',
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
    this._labels = config.labels;
    this._name = config.name;
    this._applyTo.internalValue = config.applyTo;
    this._rule.internalValue = config.rule;
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

  // apply_to - computed: false, optional: true, required: false
  private _applyTo = new FirewallApplyToList(this, 'apply_to', true);
  public get applyTo() {
    return this._applyTo;
  }
  public putApplyTo(value: FirewallApplyTo[] | cdktf.IResolvable) {
    this._applyTo.internalValue = value;
  }
  public resetApplyTo() {
    this._applyTo.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get applyToInput() {
    return this._applyTo.internalValue;
  }

  // rule - computed: false, optional: true, required: false
  private _rule = new FirewallRuleList(this, 'rule', true);
  public get rule() {
    return this._rule;
  }
  public putRule(value: FirewallRule[] | cdktf.IResolvable) {
    this._rule.internalValue = value;
  }
  public resetRule() {
    this._rule.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get ruleInput() {
    return this._rule.internalValue;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      id: cdktf.stringToTerraform(this._id),
      labels: cdktf.hashMapper(cdktf.stringToTerraform)(this._labels),
      name: cdktf.stringToTerraform(this._name),
      apply_to: cdktf.listMapper(firewallApplyToToTerraform, true)(this._applyTo.internalValue),
      rule: cdktf.listMapper(firewallRuleToTerraform, true)(this._rule.internalValue),
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
      apply_to: {
        value: cdktf.listMapperHcl(
          firewallApplyToToHclTerraform,
          true
        )(this._applyTo.internalValue),
        isBlock: true,
        type: 'set',
        storageClassType: 'FirewallApplyToList',
      },
      rule: {
        value: cdktf.listMapperHcl(firewallRuleToHclTerraform, true)(this._rule.internalValue),
        isBlock: true,
        type: 'set',
        storageClassType: 'FirewallRuleList',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
