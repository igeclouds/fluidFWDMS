## API Report File for "@fluid-internal/quorum"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { IChannelAttributes } from '@fluidframework/datastore-definitions';
import { IChannelFactory } from '@fluidframework/datastore-definitions';
import { IChannelStorageService } from '@fluidframework/datastore-definitions';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidSerializer } from '@fluidframework/shared-object-base';
import { ISequencedDocumentMessage } from '@fluidframework/protocol-definitions';
import { ISharedObject } from '@fluidframework/shared-object-base';
import { ISharedObjectEvents } from '@fluidframework/shared-object-base';
import { ISummaryTreeWithStats } from '@fluidframework/runtime-definitions';
import { SharedObject } from '@fluidframework/shared-object-base';

// @public
export interface IQuorum extends ISharedObject<IQuorumEvents> {
    delete(key: string): void;
    get(key: string): any;
    getPending(key: string): any;
    has(key: string): boolean;
    set(key: string, value: any): void;
}

// @public
export interface IQuorumEvents extends ISharedObjectEvents {
    (event: "pending" | "accepted", listener: (key: string) => void): any;
}

// @public
export class Quorum extends SharedObject<IQuorumEvents> implements IQuorum {
    constructor(id: string, runtime: IFluidDataStoreRuntime, attributes: IChannelAttributes);
    // (undocumented)
    applyStashedOp(): void;
    static create(runtime: IFluidDataStoreRuntime, id?: string): Quorum;
    delete(key: string): void;
    get(key: string): any;
    static getFactory(): IChannelFactory;
    getPending(key: string): any;
    has(key: string): boolean;
    // @internal (undocumented)
    protected initializeLocalCore(): void;
    // @internal (undocumented)
    protected loadCore(storage: IChannelStorageService): Promise<void>;
    // @internal (undocumented)
    protected onDisconnect(): void;
    // @internal
    protected processCore(message: ISequencedDocumentMessage, local: boolean, localOpMetadata: unknown): void;
    set(key: string, value: any): void;
    // @internal
    protected summarizeCore(serializer: IFluidSerializer): ISummaryTreeWithStats;
    }


// (No @packageDocumentation comment for this package)

```