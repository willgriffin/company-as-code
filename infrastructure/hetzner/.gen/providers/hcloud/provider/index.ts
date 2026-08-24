// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface HcloudProviderConfig {
  /**
   * The Hetzner Cloud API endpoint, can be used to override the default API Endpoint https://api.hetzner.cloud/v1.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#endpoint HcloudProvider#endpoint}
   */
  readonly endpoint?: string;
  /**
   * The type of function to be used during the polling.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#poll_function HcloudProvider#poll_function}
   */
  readonly pollFunction?: string;
  /**
   * The interval at which actions are polled by the client. Default `500ms`. Increase this interval if you run into rate limiting errors.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#poll_interval HcloudProvider#poll_interval}
   */
  readonly pollInterval?: string;
  /**
   * The Hetzner Cloud API token, can also be specified with the HCLOUD_TOKEN environment variable.
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#token HcloudProvider#token}
   */
  readonly token?: string;
  /**
   * Alias name
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#alias HcloudProvider#alias}
   */
  readonly alias?: string;
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs hcloud}
 */
export class HcloudProvider extends cdktf.TerraformProvider {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a HcloudProvider resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the HcloudProvider to import
   * @param importFromId The id of the existing HcloudProvider that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the HcloudProvider to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs hcloud} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options HcloudProviderConfig = {}
   */
  public constructor(scope: Construct, id: string, config: HcloudProviderConfig = {}) {
    super(scope, id, {
      terraformResourceType: 'hcloud',
      terraformGeneratorMetadata: {
        providerName: 'hcloud',
        providerVersion: '1.54.0',
        providerVersionConstraint: '= 1.54.0',
      },
      terraformProviderSource: 'hetznercloud/hcloud',
    });
    this._endpoint = config.endpoint;
    this._pollFunction = config.pollFunction;
    this._pollInterval = config.pollInterval;
    this._token = config.token;
    this._alias = config.alias;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // endpoint - computed: false, optional: true, required: false
  private _endpoint?: string;
  public get endpoint() {
    return this._endpoint;
  }
  public set endpoint(value: string | undefined) {
    this._endpoint = value;
  }
  public resetEndpoint() {
    this._endpoint = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get endpointInput() {
    return this._endpoint;
  }

  // poll_function - computed: false, optional: true, required: false
  private _pollFunction?: string;
  public get pollFunction() {
    return this._pollFunction;
  }
  public set pollFunction(value: string | undefined) {
    this._pollFunction = value;
  }
  public resetPollFunction() {
    this._pollFunction = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get pollFunctionInput() {
    return this._pollFunction;
  }

  // poll_interval - computed: false, optional: true, required: false
  private _pollInterval?: string;
  public get pollInterval() {
    return this._pollInterval;
  }
  public set pollInterval(value: string | undefined) {
    this._pollInterval = value;
  }
  public resetPollInterval() {
    this._pollInterval = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get pollIntervalInput() {
    return this._pollInterval;
  }

  // token - computed: false, optional: true, required: false
  private _token?: string;
  public get token() {
    return this._token;
  }
  public set token(value: string | undefined) {
    this._token = value;
  }
  public resetToken() {
    this._token = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get tokenInput() {
    return this._token;
  }

  // alias - computed: false, optional: true, required: false
  private _alias?: string;
  public get alias() {
    return this._alias;
  }
  public set alias(value: string | undefined) {
    this._alias = value;
  }
  public resetAlias() {
    this._alias = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get aliasInput() {
    return this._alias;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      endpoint: cdktf.stringToTerraform(this._endpoint),
      poll_function: cdktf.stringToTerraform(this._pollFunction),
      poll_interval: cdktf.stringToTerraform(this._pollInterval),
      token: cdktf.stringToTerraform(this._token),
      alias: cdktf.stringToTerraform(this._alias),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      endpoint: {
        value: cdktf.stringToHclTerraform(this._endpoint),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      poll_function: {
        value: cdktf.stringToHclTerraform(this._pollFunction),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      poll_interval: {
        value: cdktf.stringToHclTerraform(this._pollInterval),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      token: {
        value: cdktf.stringToHclTerraform(this._token),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      alias: {
        value: cdktf.stringToHclTerraform(this._alias),
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
