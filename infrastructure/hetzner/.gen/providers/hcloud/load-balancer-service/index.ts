// https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service
// generated from terraform resource schema

import { Construct } from 'constructs';
import * as cdktf from 'cdktf';

// Configuration

export interface LoadBalancerServiceConfig extends cdktf.TerraformMetaArguments {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#destination_port LoadBalancerService#destination_port}
   */
  readonly destinationPort?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#id LoadBalancerService#id}
   *
   * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
   * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
   */
  readonly id?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#listen_port LoadBalancerService#listen_port}
   */
  readonly listenPort?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#load_balancer_id LoadBalancerService#load_balancer_id}
   */
  readonly loadBalancerId: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#protocol LoadBalancerService#protocol}
   */
  readonly protocol: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#proxyprotocol LoadBalancerService#proxyprotocol}
   */
  readonly proxyprotocol?: boolean | cdktf.IResolvable;
  /**
   * health_check block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#health_check LoadBalancerService#health_check}
   */
  readonly healthCheck?: LoadBalancerServiceHealthCheck;
  /**
   * http block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#http LoadBalancerService#http}
   */
  readonly http?: LoadBalancerServiceHttp;
}
export interface LoadBalancerServiceHealthCheckHttp {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#domain LoadBalancerService#domain}
   */
  readonly domain?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#path LoadBalancerService#path}
   */
  readonly path?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#response LoadBalancerService#response}
   */
  readonly response?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#status_codes LoadBalancerService#status_codes}
   */
  readonly statusCodes?: string[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#tls LoadBalancerService#tls}
   */
  readonly tls?: boolean | cdktf.IResolvable;
}

export function loadBalancerServiceHealthCheckHttpToTerraform(
  struct?: LoadBalancerServiceHealthCheckHttpOutputReference | LoadBalancerServiceHealthCheckHttp
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
    domain: cdktf.stringToTerraform(struct!.domain),
    path: cdktf.stringToTerraform(struct!.path),
    response: cdktf.stringToTerraform(struct!.response),
    status_codes: cdktf.listMapper(cdktf.stringToTerraform, false)(struct!.statusCodes),
    tls: cdktf.booleanToTerraform(struct!.tls),
  };
}

export function loadBalancerServiceHealthCheckHttpToHclTerraform(
  struct?: LoadBalancerServiceHealthCheckHttpOutputReference | LoadBalancerServiceHealthCheckHttp
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
    domain: {
      value: cdktf.stringToHclTerraform(struct!.domain),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    path: {
      value: cdktf.stringToHclTerraform(struct!.path),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    response: {
      value: cdktf.stringToHclTerraform(struct!.response),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    status_codes: {
      value: cdktf.listMapperHcl(cdktf.stringToHclTerraform, false)(struct!.statusCodes),
      isBlock: false,
      type: 'list',
      storageClassType: 'stringList',
    },
    tls: {
      value: cdktf.booleanToHclTerraform(struct!.tls),
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

export class LoadBalancerServiceHealthCheckHttpOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   */
  public constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string) {
    super(terraformResource, terraformAttribute, false, 0);
  }

  public get internalValue(): LoadBalancerServiceHealthCheckHttp | undefined {
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._domain !== undefined) {
      hasAnyValues = true;
      internalValueResult.domain = this._domain;
    }
    if (this._path !== undefined) {
      hasAnyValues = true;
      internalValueResult.path = this._path;
    }
    if (this._response !== undefined) {
      hasAnyValues = true;
      internalValueResult.response = this._response;
    }
    if (this._statusCodes !== undefined) {
      hasAnyValues = true;
      internalValueResult.statusCodes = this._statusCodes;
    }
    if (this._tls !== undefined) {
      hasAnyValues = true;
      internalValueResult.tls = this._tls;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: LoadBalancerServiceHealthCheckHttp | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this._domain = undefined;
      this._path = undefined;
      this._response = undefined;
      this._statusCodes = undefined;
      this._tls = undefined;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this._domain = value.domain;
      this._path = value.path;
      this._response = value.response;
      this._statusCodes = value.statusCodes;
      this._tls = value.tls;
    }
  }

  // domain - computed: false, optional: true, required: false
  private _domain?: string;
  public get domain() {
    return this.getStringAttribute('domain');
  }
  public set domain(value: string) {
    this._domain = value;
  }
  public resetDomain() {
    this._domain = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get domainInput() {
    return this._domain;
  }

  // path - computed: false, optional: true, required: false
  private _path?: string;
  public get path() {
    return this.getStringAttribute('path');
  }
  public set path(value: string) {
    this._path = value;
  }
  public resetPath() {
    this._path = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get pathInput() {
    return this._path;
  }

  // response - computed: false, optional: true, required: false
  private _response?: string;
  public get response() {
    return this.getStringAttribute('response');
  }
  public set response(value: string) {
    this._response = value;
  }
  public resetResponse() {
    this._response = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get responseInput() {
    return this._response;
  }

  // status_codes - computed: false, optional: true, required: false
  private _statusCodes?: string[];
  public get statusCodes() {
    return this.getListAttribute('status_codes');
  }
  public set statusCodes(value: string[]) {
    this._statusCodes = value;
  }
  public resetStatusCodes() {
    this._statusCodes = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get statusCodesInput() {
    return this._statusCodes;
  }

  // tls - computed: false, optional: true, required: false
  private _tls?: boolean | cdktf.IResolvable;
  public get tls() {
    return this.getBooleanAttribute('tls');
  }
  public set tls(value: boolean | cdktf.IResolvable) {
    this._tls = value;
  }
  public resetTls() {
    this._tls = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get tlsInput() {
    return this._tls;
  }
}
export interface LoadBalancerServiceHealthCheck {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#interval LoadBalancerService#interval}
   */
  readonly interval: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#port LoadBalancerService#port}
   */
  readonly port: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#protocol LoadBalancerService#protocol}
   */
  readonly protocol: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#retries LoadBalancerService#retries}
   */
  readonly retries?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#timeout LoadBalancerService#timeout}
   */
  readonly timeout: number;
  /**
   * http block
   *
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#http LoadBalancerService#http}
   */
  readonly http?: LoadBalancerServiceHealthCheckHttp;
}

export function loadBalancerServiceHealthCheckToTerraform(
  struct?: LoadBalancerServiceHealthCheckOutputReference | LoadBalancerServiceHealthCheck
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
    interval: cdktf.numberToTerraform(struct!.interval),
    port: cdktf.numberToTerraform(struct!.port),
    protocol: cdktf.stringToTerraform(struct!.protocol),
    retries: cdktf.numberToTerraform(struct!.retries),
    timeout: cdktf.numberToTerraform(struct!.timeout),
    http: loadBalancerServiceHealthCheckHttpToTerraform(struct!.http),
  };
}

export function loadBalancerServiceHealthCheckToHclTerraform(
  struct?: LoadBalancerServiceHealthCheckOutputReference | LoadBalancerServiceHealthCheck
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
    interval: {
      value: cdktf.numberToHclTerraform(struct!.interval),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    port: {
      value: cdktf.numberToHclTerraform(struct!.port),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    protocol: {
      value: cdktf.stringToHclTerraform(struct!.protocol),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    retries: {
      value: cdktf.numberToHclTerraform(struct!.retries),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    timeout: {
      value: cdktf.numberToHclTerraform(struct!.timeout),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    http: {
      value: loadBalancerServiceHealthCheckHttpToHclTerraform(struct!.http),
      isBlock: true,
      type: 'list',
      storageClassType: 'LoadBalancerServiceHealthCheckHttpList',
    },
  };

  // remove undefined attributes
  return Object.fromEntries(
    Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
  );
}

export class LoadBalancerServiceHealthCheckOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   */
  public constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string) {
    super(terraformResource, terraformAttribute, false, 0);
  }

  public get internalValue(): LoadBalancerServiceHealthCheck | undefined {
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._interval !== undefined) {
      hasAnyValues = true;
      internalValueResult.interval = this._interval;
    }
    if (this._port !== undefined) {
      hasAnyValues = true;
      internalValueResult.port = this._port;
    }
    if (this._protocol !== undefined) {
      hasAnyValues = true;
      internalValueResult.protocol = this._protocol;
    }
    if (this._retries !== undefined) {
      hasAnyValues = true;
      internalValueResult.retries = this._retries;
    }
    if (this._timeout !== undefined) {
      hasAnyValues = true;
      internalValueResult.timeout = this._timeout;
    }
    if (this._http?.internalValue !== undefined) {
      hasAnyValues = true;
      internalValueResult.http = this._http?.internalValue;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: LoadBalancerServiceHealthCheck | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this._interval = undefined;
      this._port = undefined;
      this._protocol = undefined;
      this._retries = undefined;
      this._timeout = undefined;
      this._http.internalValue = undefined;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this._interval = value.interval;
      this._port = value.port;
      this._protocol = value.protocol;
      this._retries = value.retries;
      this._timeout = value.timeout;
      this._http.internalValue = value.http;
    }
  }

  // interval - computed: false, optional: false, required: true
  private _interval?: number;
  public get interval() {
    return this.getNumberAttribute('interval');
  }
  public set interval(value: number) {
    this._interval = value;
  }
  // Temporarily expose input value. Use with caution.
  public get intervalInput() {
    return this._interval;
  }

  // port - computed: false, optional: false, required: true
  private _port?: number;
  public get port() {
    return this.getNumberAttribute('port');
  }
  public set port(value: number) {
    this._port = value;
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

  // retries - computed: true, optional: true, required: false
  private _retries?: number;
  public get retries() {
    return this.getNumberAttribute('retries');
  }
  public set retries(value: number) {
    this._retries = value;
  }
  public resetRetries() {
    this._retries = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get retriesInput() {
    return this._retries;
  }

  // timeout - computed: false, optional: false, required: true
  private _timeout?: number;
  public get timeout() {
    return this.getNumberAttribute('timeout');
  }
  public set timeout(value: number) {
    this._timeout = value;
  }
  // Temporarily expose input value. Use with caution.
  public get timeoutInput() {
    return this._timeout;
  }

  // http - computed: false, optional: true, required: false
  private _http = new LoadBalancerServiceHealthCheckHttpOutputReference(this, 'http');
  public get http() {
    return this._http;
  }
  public putHttp(value: LoadBalancerServiceHealthCheckHttp) {
    this._http.internalValue = value;
  }
  public resetHttp() {
    this._http.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get httpInput() {
    return this._http.internalValue;
  }
}
export interface LoadBalancerServiceHttp {
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#certificates LoadBalancerService#certificates}
   */
  readonly certificates?: number[];
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#cookie_lifetime LoadBalancerService#cookie_lifetime}
   */
  readonly cookieLifetime?: number;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#cookie_name LoadBalancerService#cookie_name}
   */
  readonly cookieName?: string;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#redirect_http LoadBalancerService#redirect_http}
   */
  readonly redirectHttp?: boolean | cdktf.IResolvable;
  /**
   * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#sticky_sessions LoadBalancerService#sticky_sessions}
   */
  readonly stickySessions?: boolean | cdktf.IResolvable;
}

export function loadBalancerServiceHttpToTerraform(
  struct?: LoadBalancerServiceHttpOutputReference | LoadBalancerServiceHttp
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
    certificates: cdktf.listMapper(cdktf.numberToTerraform, false)(struct!.certificates),
    cookie_lifetime: cdktf.numberToTerraform(struct!.cookieLifetime),
    cookie_name: cdktf.stringToTerraform(struct!.cookieName),
    redirect_http: cdktf.booleanToTerraform(struct!.redirectHttp),
    sticky_sessions: cdktf.booleanToTerraform(struct!.stickySessions),
  };
}

export function loadBalancerServiceHttpToHclTerraform(
  struct?: LoadBalancerServiceHttpOutputReference | LoadBalancerServiceHttp
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
    certificates: {
      value: cdktf.listMapperHcl(cdktf.numberToHclTerraform, false)(struct!.certificates),
      isBlock: false,
      type: 'set',
      storageClassType: 'numberList',
    },
    cookie_lifetime: {
      value: cdktf.numberToHclTerraform(struct!.cookieLifetime),
      isBlock: false,
      type: 'simple',
      storageClassType: 'number',
    },
    cookie_name: {
      value: cdktf.stringToHclTerraform(struct!.cookieName),
      isBlock: false,
      type: 'simple',
      storageClassType: 'string',
    },
    redirect_http: {
      value: cdktf.booleanToHclTerraform(struct!.redirectHttp),
      isBlock: false,
      type: 'simple',
      storageClassType: 'boolean',
    },
    sticky_sessions: {
      value: cdktf.booleanToHclTerraform(struct!.stickySessions),
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

export class LoadBalancerServiceHttpOutputReference extends cdktf.ComplexObject {
  private isEmptyObject = false;

  /**
   * @param terraformResource The parent resource
   * @param terraformAttribute The attribute on the parent resource this class is referencing
   */
  public constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string) {
    super(terraformResource, terraformAttribute, false, 0);
  }

  public get internalValue(): LoadBalancerServiceHttp | undefined {
    let hasAnyValues = this.isEmptyObject;
    const internalValueResult: any = {};
    if (this._certificates !== undefined) {
      hasAnyValues = true;
      internalValueResult.certificates = this._certificates;
    }
    if (this._cookieLifetime !== undefined) {
      hasAnyValues = true;
      internalValueResult.cookieLifetime = this._cookieLifetime;
    }
    if (this._cookieName !== undefined) {
      hasAnyValues = true;
      internalValueResult.cookieName = this._cookieName;
    }
    if (this._redirectHttp !== undefined) {
      hasAnyValues = true;
      internalValueResult.redirectHttp = this._redirectHttp;
    }
    if (this._stickySessions !== undefined) {
      hasAnyValues = true;
      internalValueResult.stickySessions = this._stickySessions;
    }
    return hasAnyValues ? internalValueResult : undefined;
  }

  public set internalValue(value: LoadBalancerServiceHttp | undefined) {
    if (value === undefined) {
      this.isEmptyObject = false;
      this._certificates = undefined;
      this._cookieLifetime = undefined;
      this._cookieName = undefined;
      this._redirectHttp = undefined;
      this._stickySessions = undefined;
    } else {
      this.isEmptyObject = Object.keys(value).length === 0;
      this._certificates = value.certificates;
      this._cookieLifetime = value.cookieLifetime;
      this._cookieName = value.cookieName;
      this._redirectHttp = value.redirectHttp;
      this._stickySessions = value.stickySessions;
    }
  }

  // certificates - computed: true, optional: true, required: false
  private _certificates?: number[];
  public get certificates() {
    return cdktf.Token.asNumberList(cdktf.Fn.tolist(this.getNumberListAttribute('certificates')));
  }
  public set certificates(value: number[]) {
    this._certificates = value;
  }
  public resetCertificates() {
    this._certificates = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get certificatesInput() {
    return this._certificates;
  }

  // cookie_lifetime - computed: true, optional: true, required: false
  private _cookieLifetime?: number;
  public get cookieLifetime() {
    return this.getNumberAttribute('cookie_lifetime');
  }
  public set cookieLifetime(value: number) {
    this._cookieLifetime = value;
  }
  public resetCookieLifetime() {
    this._cookieLifetime = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get cookieLifetimeInput() {
    return this._cookieLifetime;
  }

  // cookie_name - computed: true, optional: true, required: false
  private _cookieName?: string;
  public get cookieName() {
    return this.getStringAttribute('cookie_name');
  }
  public set cookieName(value: string) {
    this._cookieName = value;
  }
  public resetCookieName() {
    this._cookieName = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get cookieNameInput() {
    return this._cookieName;
  }

  // redirect_http - computed: true, optional: true, required: false
  private _redirectHttp?: boolean | cdktf.IResolvable;
  public get redirectHttp() {
    return this.getBooleanAttribute('redirect_http');
  }
  public set redirectHttp(value: boolean | cdktf.IResolvable) {
    this._redirectHttp = value;
  }
  public resetRedirectHttp() {
    this._redirectHttp = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get redirectHttpInput() {
    return this._redirectHttp;
  }

  // sticky_sessions - computed: true, optional: true, required: false
  private _stickySessions?: boolean | cdktf.IResolvable;
  public get stickySessions() {
    return this.getBooleanAttribute('sticky_sessions');
  }
  public set stickySessions(value: boolean | cdktf.IResolvable) {
    this._stickySessions = value;
  }
  public resetStickySessions() {
    this._stickySessions = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get stickySessionsInput() {
    return this._stickySessions;
  }
}

/**
 * Represents a {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service hcloud_load_balancer_service}
 */
export class LoadBalancerService extends cdktf.TerraformResource {
  // =================
  // STATIC PROPERTIES
  // =================
  public static readonly tfResourceType = 'hcloud_load_balancer_service';

  // ==============
  // STATIC Methods
  // ==============
  /**
   * Generates CDKTF code for importing a LoadBalancerService resource upon running "cdktf plan <stack-name>"
   * @param scope The scope in which to define this construct
   * @param importToId The construct id used in the generated config for the LoadBalancerService to import
   * @param importFromId The id of the existing LoadBalancerService that should be imported. Refer to the {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service#import import section} in the documentation of this resource for the id to use
   * @param provider? Optional instance of the provider where the LoadBalancerService to import is found
   */
  public static generateConfigForImport(
    scope: Construct,
    importToId: string,
    importFromId: string,
    provider?: cdktf.TerraformProvider
  ) {
    return new cdktf.ImportableResource(scope, importToId, {
      terraformResourceType: 'hcloud_load_balancer_service',
      importId: importFromId,
      provider,
    });
  }

  // ===========
  // INITIALIZER
  // ===========

  /**
   * Create a new {@link https://registry.terraform.io/providers/hetznercloud/hcloud/1.54.0/docs/resources/load_balancer_service hcloud_load_balancer_service} Resource
   *
   * @param scope The scope in which to define this construct
   * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
   * @param options LoadBalancerServiceConfig
   */
  public constructor(scope: Construct, id: string, config: LoadBalancerServiceConfig) {
    super(scope, id, {
      terraformResourceType: 'hcloud_load_balancer_service',
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
    this._destinationPort = config.destinationPort;
    this._id = config.id;
    this._listenPort = config.listenPort;
    this._loadBalancerId = config.loadBalancerId;
    this._protocol = config.protocol;
    this._proxyprotocol = config.proxyprotocol;
    this._healthCheck.internalValue = config.healthCheck;
    this._http.internalValue = config.http;
  }

  // ==========
  // ATTRIBUTES
  // ==========

  // destination_port - computed: true, optional: true, required: false
  private _destinationPort?: number;
  public get destinationPort() {
    return this.getNumberAttribute('destination_port');
  }
  public set destinationPort(value: number) {
    this._destinationPort = value;
  }
  public resetDestinationPort() {
    this._destinationPort = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get destinationPortInput() {
    return this._destinationPort;
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

  // listen_port - computed: true, optional: true, required: false
  private _listenPort?: number;
  public get listenPort() {
    return this.getNumberAttribute('listen_port');
  }
  public set listenPort(value: number) {
    this._listenPort = value;
  }
  public resetListenPort() {
    this._listenPort = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get listenPortInput() {
    return this._listenPort;
  }

  // load_balancer_id - computed: false, optional: false, required: true
  private _loadBalancerId?: string;
  public get loadBalancerId() {
    return this.getStringAttribute('load_balancer_id');
  }
  public set loadBalancerId(value: string) {
    this._loadBalancerId = value;
  }
  // Temporarily expose input value. Use with caution.
  public get loadBalancerIdInput() {
    return this._loadBalancerId;
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

  // proxyprotocol - computed: true, optional: true, required: false
  private _proxyprotocol?: boolean | cdktf.IResolvable;
  public get proxyprotocol() {
    return this.getBooleanAttribute('proxyprotocol');
  }
  public set proxyprotocol(value: boolean | cdktf.IResolvable) {
    this._proxyprotocol = value;
  }
  public resetProxyprotocol() {
    this._proxyprotocol = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get proxyprotocolInput() {
    return this._proxyprotocol;
  }

  // health_check - computed: false, optional: true, required: false
  private _healthCheck = new LoadBalancerServiceHealthCheckOutputReference(this, 'health_check');
  public get healthCheck() {
    return this._healthCheck;
  }
  public putHealthCheck(value: LoadBalancerServiceHealthCheck) {
    this._healthCheck.internalValue = value;
  }
  public resetHealthCheck() {
    this._healthCheck.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get healthCheckInput() {
    return this._healthCheck.internalValue;
  }

  // http - computed: false, optional: true, required: false
  private _http = new LoadBalancerServiceHttpOutputReference(this, 'http');
  public get http() {
    return this._http;
  }
  public putHttp(value: LoadBalancerServiceHttp) {
    this._http.internalValue = value;
  }
  public resetHttp() {
    this._http.internalValue = undefined;
  }
  // Temporarily expose input value. Use with caution.
  public get httpInput() {
    return this._http.internalValue;
  }

  // =========
  // SYNTHESIS
  // =========

  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      destination_port: cdktf.numberToTerraform(this._destinationPort),
      id: cdktf.stringToTerraform(this._id),
      listen_port: cdktf.numberToTerraform(this._listenPort),
      load_balancer_id: cdktf.stringToTerraform(this._loadBalancerId),
      protocol: cdktf.stringToTerraform(this._protocol),
      proxyprotocol: cdktf.booleanToTerraform(this._proxyprotocol),
      health_check: loadBalancerServiceHealthCheckToTerraform(this._healthCheck.internalValue),
      http: loadBalancerServiceHttpToTerraform(this._http.internalValue),
    };
  }

  protected synthesizeHclAttributes(): { [name: string]: any } {
    const attrs = {
      destination_port: {
        value: cdktf.numberToHclTerraform(this._destinationPort),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      id: {
        value: cdktf.stringToHclTerraform(this._id),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      listen_port: {
        value: cdktf.numberToHclTerraform(this._listenPort),
        isBlock: false,
        type: 'simple',
        storageClassType: 'number',
      },
      load_balancer_id: {
        value: cdktf.stringToHclTerraform(this._loadBalancerId),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      protocol: {
        value: cdktf.stringToHclTerraform(this._protocol),
        isBlock: false,
        type: 'simple',
        storageClassType: 'string',
      },
      proxyprotocol: {
        value: cdktf.booleanToHclTerraform(this._proxyprotocol),
        isBlock: false,
        type: 'simple',
        storageClassType: 'boolean',
      },
      health_check: {
        value: loadBalancerServiceHealthCheckToHclTerraform(this._healthCheck.internalValue),
        isBlock: true,
        type: 'list',
        storageClassType: 'LoadBalancerServiceHealthCheckList',
      },
      http: {
        value: loadBalancerServiceHttpToHclTerraform(this._http.internalValue),
        isBlock: true,
        type: 'list',
        storageClassType: 'LoadBalancerServiceHttpList',
      },
    };

    // remove undefined attributes
    return Object.fromEntries(
      Object.entries(attrs).filter(([_, value]) => value !== undefined && value.value !== undefined)
    );
  }
}
