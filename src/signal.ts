export enum SignalType {
  break = "break",
  continue = "continue",
  return = "return",
}

export default class Signal {
  public type: SignalType;
  public val: any;

  constructor(kind: SignalType, val?: any) {
    this.type = kind;
    this.val = val;
  }

  public static is(v: any, type: SignalType): v is Signal {
    return v instanceof Signal && v.type === type;
  }
  public static isContinue(v: any): v is Signal {
    return Signal.is(v, SignalType.continue);
  }
  public static isBreak(v: any): v is Signal {
    return Signal.is(v, SignalType.break);
  }
  public static isReturn(v: any): v is Signal {
    return Signal.is(v, SignalType.return);
  }
  public static isSignal(v: any): v is Signal {
    return v instanceof Signal;
  }
}
