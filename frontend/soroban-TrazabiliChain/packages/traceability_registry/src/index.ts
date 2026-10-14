import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"Unauthorized"},
  2: {message:"TooManyEvents"}
}


export interface Client {
  /**
   * Construct and simulate a event_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  event_hash: ({lot_id, event_index}: {lot_id: string, event_index: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a event_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  event_count: ({lot_id}: {lot_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a record_event transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_event: ({actor, lot_id, event_hash}: {actor: string, lot_id: string, event_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a revoke_actor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke_actor: ({admin, actor}: {admin: string, actor: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a authorize_actor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  authorize_actor: ({admin, actor}: {admin: string, actor: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAgAAAAAAAAAMVW5hdXRob3JpemVkAAAAAQAAAAAAAAANVG9vTWFueUV2ZW50cwAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAEExvdEV2ZW50UmVjb3JkZWQAAAABAAAAEmxvdF9ldmVudF9yZWNvcmRlZAAAAAAAAwAAAAAAAAAGbG90X2lkAAAAAAAQAAAAAQAAAAAAAAALZXZlbnRfaW5kZXgAAAAABAAAAAEAAAAAAAAACmV2ZW50X2hhc2gAAAAAA+4AAAAgAAAAAAAAAAI=",
        "AAAAAAAAAAAAAAAKZXZlbnRfaGFzaAAAAAAAAgAAAAAAAAAGbG90X2lkAAAAAAAQAAAAAAAAAAtldmVudF9pbmRleAAAAAAEAAAAAQAAA+gAAAPuAAAAIA==",
        "AAAAAAAAAAAAAAALZXZlbnRfY291bnQAAAAAAQAAAAAAAAAGbG90X2lkAAAAAAAQAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAMcmVjb3JkX2V2ZW50AAAAAwAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAAAAAAZsb3RfaWQAAAAAABAAAAAAAAAACmV2ZW50X2hhc2gAAAAAA+4AAAAgAAAAAQAAA+kAAAAEAAAAAw==",
        "AAAAAAAAAAAAAAAMcmV2b2tlX2FjdG9yAAAAAgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAVhY3RvcgAAAAAAABMAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAPYXV0aG9yaXplX2FjdG9yAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAFYWN0b3IAAAAAAAATAAAAAQAAA+kAAAACAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    event_hash: this.txFromJSON<Option<Buffer>>,
        event_count: this.txFromJSON<u32>,
        record_event: this.txFromJSON<Result<u32>>,
        revoke_actor: this.txFromJSON<Result<void>>,
        authorize_actor: this.txFromJSON<Result<void>>
  }
}